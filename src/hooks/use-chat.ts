'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Appointment } from '@/lib/models/appointment';

/**
 * Custom hook for managing chat functionality
 * Provides WebSocket connection and message handling
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    escalated?: boolean;
    completed?: boolean;
  };
}

export interface ChatResponse {
  message: string;
  suggestedReplies?: string[];
  requiresInput?: boolean;
  inputType?: 'text' | 'date' | 'time' | 'select' | 'confirmation';
  options?: Array<{ value: string; label: string }>;
  completed?: boolean;
  escalate?: boolean;
  data?: Record<string, unknown>;
  context?: {
    currentIntent?: string;
    collectedSlots?: Record<string, unknown>;
    confirmationPending?: boolean;
    state?: 'active' | 'waiting_for_input' | 'completed' | 'escalated';
  };
}

export interface ChatContext {
  user: {
    userId: string;
    role: string;
    email?: string;
  };
  tenant: {
    id: string;
    name: string;
    timezone: string;
    businessHours: Record<string, { open: string; close: string }>;
  };
  conversation: {
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    }>;
    state: 'active' | 'waiting_for_input' | 'completed' | 'escalated';
    currentIntent?: string;
    collectedSlots: Record<string, unknown>;
    confirmationPending?: boolean;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseChatOptions {
  tenantId: string;
  userId: string;
  userRole: string;
  userEmail?: string;
  cabinetName: string;
  businessHours?: Record<string, { open: string; close: string }>;
  websocketUrl?: string;
  onEscalation?: (conversationId: string) => void;
  onAppointmentBooked?: (appointmentData: Appointment) => void;
  onError?: (error: Error) => void;
}

export function useChat({
  tenantId,
  userId,
  userRole,
  userEmail,
  cabinetName,
  businessHours = {},
  websocketUrl = 'ws://localhost:8080',
  onEscalation,
  onAppointmentBooked,
  onError
}: UseChatOptions) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ChatResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Refs
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const url = `${websocketUrl}?sessionId=${sessionId}`;
      websocketRef.current = new WebSocket(url);

      websocketRef.current.onopen = () => {
        console.warn('🔗 Chat WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Authenticate
        websocketRef.current?.send(JSON.stringify({
          type: 'authenticate',
          sessionId,
          data: {
            userId,
            tenantId,
            userRole,
            userEmail
          }
        }));
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('❌ Chat WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(new Error('WebSocket connection error'));
      };

      websocketRef.current.onclose = (event) => {
        console.warn('🔌 Chat WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }, [websocketUrl, sessionId, userId, tenantId, userRole, userEmail, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnected');
      websocketRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: { type: string; data?: any }) => {
    switch (message.type) {
      case 'status':
        if (message.data.status === 'authenticated') {
          console.warn('✅ Chat authenticated');
          // Send initial greeting if no messages exist
          if (messages.length === 0) {
            sendMessage('Bonjour');
          }
        }
        break;

      case 'chat_response':
        handleChatResponse(message.data);
        break;

      case 'typing':
        setIsTyping(message.data.typing);
        break;

      case 'escalation':
        handleEscalation(message.data);
        break;

      case 'error':
        console.error('Chat error:', message.data.error);
        addSystemMessage(`Erreur: ${message.data.error}`);
        setIsLoading(false);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  };

  // Handle chat response
  const handleChatResponse = useCallback((responseData: ChatResponse) => {
    const botMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: responseData.message,
      timestamp: new Date(),
      metadata: {
        intent: responseData.context?.currentIntent,
        escalated: responseData.escalate,
        completed: responseData.completed
      }
    };

    setMessages(prev => [...prev, botMessage]);
    setCurrentResponse(responseData);
    setIsLoading(false);
    setIsTyping(false);

    // Handle special cases
    if (responseData.escalate && onEscalation) {
      onEscalation(sessionId);
    }

    if (responseData.data?.appointmentId && onAppointmentBooked) {
      onAppointmentBooked(responseData.data as unknown as Appointment);
    }
  }, [sessionId, onEscalation, onAppointmentBooked]);

  // Handle escalation
  const handleEscalation = useCallback((escalationData: Record<string, unknown>) => {
    addSystemMessage(`🚨 Transfert vers un conseiller en cours... ID: ${escalationData.ticketId}`);
    if (onEscalation) {
      onEscalation(sessionId);
    }
  }, [sessionId, onEscalation]);

  // Add system message
  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: `sys_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare chat context
    const chatContext: ChatContext = {
      user: {
        userId,
        role: userRole,
        email: userEmail
      },
      tenant: {
        id: tenantId,
        name: cabinetName,
        timezone: 'Europe/Paris',
        businessHours
      },
      conversation: {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        state: 'active',
        currentIntent: currentResponse?.context?.currentIntent,
        collectedSlots: currentResponse?.context?.collectedSlots || {},
        confirmationPending: currentResponse?.context?.confirmationPending
      }
    };

    try {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        // Send via WebSocket
        websocketRef.current.send(JSON.stringify({
          type: 'chat',
          sessionId,
          data: {
            message,
            context: chatContext
          }
        }));
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionId,
            context: chatContext
          })
        });

        if (response.ok) {
          const result = await response.json();
          handleChatResponse(result.data);
        } else {
          throw new Error('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      setIsLoading(false);
      onError?.(error instanceof Error ? error : new Error('Send message failed'));
    }
  }, [
    isLoading,
    messages,
    sessionId,
    userId,
    userRole,
    userEmail,
    tenantId,
    cabinetName,
    businessHours,
    currentResponse,
    handleChatResponse,
    addSystemMessage,
    onError
  ]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse(null);
    setIsLoading(false);
    setIsTyping(false);
  }, []);

  // Send heartbeat ping
  const sendPing = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'ping',
        sessionId,
        timestamp: Date.now()
      }));
    }
  }, [sessionId]);

  // Setup heartbeat interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        sendPing();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [connectionStatus, sendPing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    messages,
    isLoading,
    isTyping,
    currentResponse,
    connectionStatus,
    sessionId,

    // Actions
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    addSystemMessage,

    // Computed
    isConnected: connectionStatus === 'connected',
    hasMessages: messages.length > 0,
    lastMessage: messages[messages.length - 1] || null,
    unreadCount: messages.filter(m => m.role === 'assistant').length
  };
}

export default useChat;