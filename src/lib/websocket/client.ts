import { EventEmitter } from 'events';
import { WebSocketMessage } from '@/types/websocket';

export interface ChatMessage {
  id: string;
  userId?: string;
  message: string;
  timestamp: Date;
  isBot: boolean;
  suggestedReplies?: string[];
  metadata?: Record<string, unknown>;
}

export interface WebSocketConfig {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private isConnected = false;
  private sessionId: string | null = null;
  private messageQueue: WebSocketMessage[] = [];

  constructor(config: WebSocketConfig = {}) {
    super();
    this.config = {
      url: config.url || 'ws://localhost:8080',
      autoReconnect: config.autoReconnect !== false,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5
    };
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = token ? `${this.config.url}?token=${token}` : this.config.url;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Process queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.send(msg);
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (_error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.emit('disconnected');
          
          if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'welcome':
        this.sessionId = data.sessionId;
        this.emit('welcome', data);
        break;
        
      case 'message':
        const message: ChatMessage = {
          id: data.id,
          userId: data.userId,
          message: data.message,
          timestamp: new Date(data.timestamp),
          isBot: data.isBot,
          suggestedReplies: data.suggestedReplies,
          metadata: data.metadata
        };
        this.emit('message', message);
        break;
        
      case 'typing':
        this.emit('typing', data);
        break;
        
      case 'error':
        this.emit('error', new Error(data.message));
        break;
        
      case 'appointment_created':
        this.emit('appointment_created', data.appointment);
        break;
        
      case 'appointment_updated':
        this.emit('appointment_updated', data.appointment);
        break;
        
      default:
        this.emit('unknown', data);
    }
  }

  send(data: WebSocketMessage): void {
    if (!this.isConnected) {
      this.messageQueue.push(data);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  sendMessage(message: string): void {
    this.send({
      type: 'message',
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  sendTyping(isTyping: boolean): void {
    this.send({
      type: 'typing',
      isTyping,
      sessionId: this.sessionId
    });
  }

  disconnect(): void {
    this.config.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient(config);
  }
  return wsClient;
}

export default WebSocketClient;