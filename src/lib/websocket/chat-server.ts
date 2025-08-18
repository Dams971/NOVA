import { IncomingMessage } from 'http';
import { parse } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { db } from '@/lib/database/postgresql-connection';
import { createChatOrchestrator, ChatContext, ChatResponse } from '@/services/chat/orchestrator';

/**
 * NOVA WebSocket Chat Server
 * Real-time bidirectional communication for chatbot interactions
 */

// Message validation schemas
const ClientMessageSchema = z.object({
  type: z.enum(['chat', 'ping', 'disconnect', 'authenticate']),
  sessionId: z.string(),
  data: z.any().optional(),
  timestamp: z.number().default(() => Date.now())
});

const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    user: z.object({
      userId: z.string(),
      role: z.string(),
      email: z.string().email().optional()
    }),
    tenant: z.object({
      id: z.string(),
      name: z.string(),
      timezone: z.string().default('Europe/Paris'),
      businessHours: z.record(z.object({
        open: z.string(),
        close: z.string()
      })).default({})
    }),
    conversation: z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.date(),
        metadata: z.any().optional()
      })).default([]),
      state: z.enum(['active', 'waiting_for_input', 'completed', 'escalated']).default('active'),
      currentIntent: z.enum([
        'greeting',
        'check_availability',
        'book_appointment', 
        'reschedule_appointment',
        'cancel_appointment',
        'list_practitioners',
        'clinic_info',
        'emergency',
        'help',
        'goodbye',
        'fallback'
      ]).optional(),
      collectedSlots: z.record(z.any()).default({}),
      confirmationPending: z.boolean().optional()
    })
  })
});

export interface WebSocketMessage {
  type: 'chat_response' | 'error' | 'pong' | 'status' | 'typing' | 'escalation';
  sessionId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ConnectedClient {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  tenantId: string;
  lastActivity: number;
  authenticated: boolean;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ConnectedClient>();
  private orchestrator = createChatOrchestrator();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private port: number = 8080) {}

  /**
   * Start the WebSocket server
   */
  start(): void {
    this.wss = new WebSocketServer({ 
      port: this.port,
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 6,
          chunkSize: 2 * 1024
        }
      }
    });

    console.warn(`🚀 NOVA Chat WebSocket server started on port ${this.port}`);

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleNewConnection(ws, request);
    });

    this.wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });

    // Start maintenance tasks
    this.startHeartbeat();
    this.startCleanupTask();
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.wss) {
      this.wss.close();
      console.warn('💤 NOVA Chat WebSocket server stopped');
    }
  }

  /**
   * Handle new WebSocket connections
   */
  private handleNewConnection(ws: WebSocket, request: IncomingMessage): void {
    const url = parse(request.url || '', true);
    const sessionId = url.query.sessionId as string || this.generateSessionId();
    
    console.warn(`🔗 New WebSocket connection - SessionID: ${sessionId}`);

    // Initialize client
    const client: ConnectedClient = {
      ws,
      sessionId,
      userId: '',
      tenantId: '',
      lastActivity: Date.now(),
      authenticated: false
    };

    this.clients.set(sessionId, client);

    // Setup WebSocket event handlers
    ws.on('message', async (data: Buffer) => {
      await this.handleMessage(sessionId, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      console.warn(`🔌 WebSocket disconnected - SessionID: ${sessionId}, Code: ${code}, Reason: ${reason.toString()}`);
      this.clients.delete(sessionId);
    });

    ws.on('error', (error: Error) => {
      console.error(`❌ WebSocket error - SessionID: ${sessionId}:`, error);
      this.clients.delete(sessionId);
    });

    ws.on('pong', () => {
      const client = this.clients.get(sessionId);
      if (client) {
        client.lastActivity = Date.now();
      }
    });

    // Send welcome message
    this.sendMessage(sessionId, {
      type: 'status',
      sessionId,
      data: { 
        status: 'connected',
        message: 'Connexion établie. Veuillez vous authentifier.'
      },
      timestamp: Date.now()
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(sessionId: string, data: Buffer): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) {
      console.warn(`⚠️ Message received from unknown session: ${sessionId}`);
      return;
    }

    client.lastActivity = Date.now();

    try {
      const rawMessage = JSON.parse(data.toString());
      const validatedMessage = ClientMessageSchema.parse(rawMessage);

      switch (validatedMessage.type) {
        case 'authenticate':
          await this.handleAuthentication(sessionId, validatedMessage.data);
          break;

        case 'chat':
          if (!client.authenticated) {
            this.sendError(sessionId, 'Authentication required');
            return;
          }
          await this.handleChatMessage(sessionId, validatedMessage.data);
          break;

        case 'ping':
          this.sendMessage(sessionId, {
            type: 'pong',
            sessionId,
            data: { timestamp: Date.now() },
            timestamp: Date.now()
          });
          break;

        case 'disconnect':
          client.ws.close(1000, 'Client requested disconnect');
          break;

        default:
          this.sendError(sessionId, `Unknown message type: ${validatedMessage.type}`);
      }

    } catch (_error) {
      console.error(`💥 Error handling message from ${sessionId}:`, _error);
      
      if (_error instanceof z.ZodError) {
        this.sendError(sessionId, 'Invalid message format');
      } else {
        this.sendError(sessionId, 'Internal server error');
      }
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuthentication(sessionId: string, authData: Record<string, unknown>): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) return;

    try {
      // TODO: Implement proper JWT token validation
      // For now, accept any auth data with required fields
      if (!authData.userId || !authData.tenantId) {
        this.sendError(sessionId, 'Missing required authentication fields');
        return;
      }

      client.userId = String(authData.userId);
      client.tenantId = String(authData.tenantId);
      client.authenticated = true;

      console.warn(`✅ Client authenticated - SessionID: ${sessionId}, UserID: ${authData.userId}, TenantID: ${authData.tenantId}`);

      this.sendMessage(sessionId, {
        type: 'status',
        sessionId,
        data: {
          status: 'authenticated',
          message: 'Authentification réussie. Vous pouvez maintenant utiliser le chat.'
        },
        timestamp: Date.now()
      });

    } catch (_error) {
      console.error('Authentication error:', _error);
      this.sendError(sessionId, 'Authentication failed');
    }
  }

  /**
   * Handle chat messages
   */
  private async handleChatMessage(sessionId: string, chatData: Record<string, unknown>): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client || !client.authenticated) return;

    try {
      const validatedChat = ChatMessageSchema.parse(chatData);

      // Show typing indicator
      this.sendMessage(sessionId, {
        type: 'typing',
        sessionId,
        data: { typing: true },
        timestamp: Date.now()
      });

      // Create chat context
      const chatContext: ChatContext = {
        sessionId,
        user: validatedChat.context.user,
        tenant: validatedChat.context.tenant,
        conversation: {
          ...validatedChat.context.conversation,
          messages: validatedChat.context.conversation.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          collectedSlots: {
            timezone: validatedChat.context.tenant.timezone || 'Europe/Paris',
            urgency: 'routine' as const,
            ...validatedChat.context.conversation.collectedSlots
          }
        }
      };

      // Process with orchestrator
      const response: ChatResponse = await this.orchestrator.handleMessage(
        validatedChat.message,
        chatContext
      );

      // Hide typing indicator
      this.sendMessage(sessionId, {
        type: 'typing',
        sessionId,
        data: { typing: false },
        timestamp: Date.now()
      });

      // Send chat response
      this.sendMessage(sessionId, {
        type: 'chat_response',
        sessionId,
        data: {
          message: response.message,
          suggestedReplies: response.suggestedReplies,
          requiresInput: response.requiresInput,
          inputType: response.inputType,
          options: response.options,
          completed: response.completed,
          escalate: response.escalate,
          data: response.data,
          context: {
            currentIntent: chatContext.conversation.currentIntent,
            collectedSlots: chatContext.conversation.collectedSlots,
            confirmationPending: chatContext.conversation.confirmationPending,
            state: response.escalate ? 'escalated' : response.completed ? 'completed' : 'active'
          }
        },
        timestamp: Date.now()
      });

      // Handle escalation
      if (response.escalate) {
        this.handleEscalation(sessionId, chatContext, response);
      }

      // Log interaction
      this.logInteraction(sessionId, validatedChat.message, response);

    } catch (_error) {
      console.error('Chat message error:', _error);
      
      // Hide typing indicator
      this.sendMessage(sessionId, {
        type: 'typing',
        sessionId,
        data: { typing: false },
        timestamp: Date.now()
      });
      
      this.sendError(sessionId, 'Failed to process chat message');
    }
  }

  /**
   * Handle escalation to human agents
   */
  private handleEscalation(sessionId: string, context: ChatContext, response: ChatResponse): void {
    console.warn(`🚨 Chat escalation - SessionID: ${sessionId}, UserID: ${context.user.userId}, TenantID: ${context.tenant.id}`);

    // TODO: Implement escalation logic:
    // 1. Notify available human agents
    // 2. Create support ticket
    // 3. Transfer conversation history
    // 4. Update conversation state

    this.sendMessage(sessionId, {
      type: 'escalation',
      sessionId,
      data: {
        message: 'Transfert vers un conseiller en cours...',
        estimatedWaitTime: '2-5 minutes',
        ticketId: this.generateTicketId()
      },
      timestamp: Date.now()
    });
  }

  /**
   * Send message to client
   */
  private sendMessage(sessionId: string, message: WebSocketMessage): void {
    const client = this.clients.get(sessionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (_error) {
      console.error(`Failed to send message to ${sessionId}:`, _error);
      this.clients.delete(sessionId);
    }
  }

  /**
   * Send error message to client
   */
  private sendError(sessionId: string, errorMessage: string): void {
    this.sendMessage(sessionId, {
      type: 'error',
      sessionId,
      data: { error: errorMessage },
      timestamp: Date.now()
    });
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, sessionId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.ping();
          } catch (_error) {
            console.warn(`Failed to ping client ${sessionId}:`, _error);
            this.clients.delete(sessionId);
          }
        } else {
          this.clients.delete(sessionId);
        }
      });
    }, 30000); // 30 seconds
  }

  /**
   * Start cleanup task for inactive connections
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 10 * 60 * 1000; // 10 minutes

      this.clients.forEach((client, sessionId) => {
        if (now - client.lastActivity > timeout) {
          console.warn(`🧹 Cleaning up inactive connection: ${sessionId}`);
          try {
            client.ws.close(1000, 'Connection timeout');
          } catch (_error) {
            console.warn(`Error closing connection ${sessionId}:`, _error);
          }
          this.clients.delete(sessionId);
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Log chat interactions
   */
  private logInteraction(sessionId: string, userMessage: string, response: ChatResponse): void {
    console.info('💬 Chat interaction:', {
      sessionId,
      messageLength: userMessage.length,
      responseLength: response.message.length,
      intent: response.data?.intent,
      escalated: response.escalate,
      completed: response.completed,
      timestamp: new Date().toISOString()
    });

    // TODO: Send to proper logging/analytics system
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate support ticket ID for escalations
   */
  private generateTicketId(): string {
    return 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connectedClients: number;
    authenticatedClients: number;
    serverUptime: number;
  } {
    const authenticated = Array.from(this.clients.values()).filter(c => c.authenticated).length;
    
    return {
      connectedClients: this.clients.size,
      authenticatedClients: authenticated,
      serverUptime: process.uptime()
    };
  }
}

// Global WebSocket server instance
let wsServer: ChatWebSocketServer | null = null;

/**
 * Initialize WebSocket server (called from server startup)
 */
export function initializeWebSocketServer(port: number = 8080): ChatWebSocketServer {
  if (!wsServer) {
    wsServer = new ChatWebSocketServer(port);
  }
  return wsServer;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): ChatWebSocketServer | null {
  return wsServer;
}

export default ChatWebSocketServer;