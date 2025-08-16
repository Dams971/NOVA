/**
 * WebSocket message types for NOVA RDV platform
 */

export interface WebSocketBaseMessage {
  id: string;
  type: string;
  timestamp: string;
  sessionId?: string;
}

export interface WebSocketRequest<T = unknown> extends WebSocketBaseMessage {
  payload: T;
}

export interface WebSocketResponse<T = unknown> extends WebSocketBaseMessage {
  payload: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// Chat WebSocket messages
export interface ChatWebSocketMessage extends WebSocketBaseMessage {
  type: 'chat_message' | 'chat_typing' | 'chat_stop_typing' | 'chat_session_start' | 'chat_session_end';
  payload: {
    message?: string;
    userId?: string;
    userName?: string;
    isTyping?: boolean;
  };
}

// Appointment WebSocket messages
export interface AppointmentWebSocketMessage extends WebSocketBaseMessage {
  type: 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'appointment_reminder';
  payload: {
    appointmentId: string;
    patientId?: string;
    cabinetId: string;
    status?: string;
    dateTime?: string;
    message?: string;
  };
}

// Cabinet monitoring WebSocket messages
export interface CabinetHealthWebSocketMessage extends WebSocketBaseMessage {
  type: 'health_update' | 'alert_created' | 'alert_resolved' | 'metrics_update';
  payload: {
    cabinetId: string;
    status?: 'healthy' | 'warning' | 'critical';
    alert?: {
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: string;
    };
    metrics?: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
    };
  };
}

// System notification WebSocket messages
export interface NotificationWebSocketMessage extends WebSocketBaseMessage {
  type: 'notification' | 'broadcast' | 'user_notification';
  payload: {
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
    userId?: string;
    data?: Record<string, unknown>;
    actions?: Array<{
      label: string;
      action: string;
      style?: 'primary' | 'secondary' | 'danger';
    }>;
  };
}

// Connection status messages
export interface ConnectionWebSocketMessage extends WebSocketBaseMessage {
  type: 'connection_established' | 'connection_lost' | 'reconnected' | 'heartbeat';
  payload: {
    clientId: string;
    userId?: string;
    lastSeen?: string;
    reconnectAttempt?: number;
  };
}

// Union type for all WebSocket messages
export type WebSocketMessage = 
  | ChatWebSocketMessage
  | AppointmentWebSocketMessage
  | CabinetHealthWebSocketMessage
  | NotificationWebSocketMessage
  | ConnectionWebSocketMessage;

// WebSocket client configuration
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

// WebSocket client state
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempt: number;
  lastError?: Error;
  lastMessage?: WebSocketMessage;
  subscribedChannels: string[];
}

// WebSocket channel subscription
export interface WebSocketSubscription {
  channel: string;
  userId?: string;
  cabinetId?: string;
  filters?: Record<string, unknown>;
}

// WebSocket event handlers
export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

// Server-side WebSocket connection info
export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  userId?: string;
  sessionId?: string;
  subscribedChannels: Set<string>;
  lastActivity: Date;
  isAuthenticated: boolean;
}