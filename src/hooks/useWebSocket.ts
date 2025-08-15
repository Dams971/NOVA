'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWebSocketClient, ChatMessage, WebSocketClient } from '@/lib/websocket/client';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  isTyping: boolean;
  sessionId: string | null;
  clearMessages: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [client, setClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    setClient(wsClient);

    // Set up event listeners
    wsClient.on('connected', () => {
      setIsConnected(true);
    });

    wsClient.on('disconnected', () => {
      setIsConnected(false);
    });

    wsClient.on('welcome', (data) => {
      setSessionId(data.sessionId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        message: data.message || "Bonjour! Comment puis-je vous aider aujourd'hui?",
        timestamp: new Date(),
        isBot: true,
        suggestedReplies: data.suggestedReplies
      };
      setMessages(prev => [...prev, welcomeMessage]);
    });

    wsClient.on('message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
    });

    wsClient.on('typing', (data) => {
      setIsTyping(data.isTyping);
    });

    wsClient.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Auto-connect if requested
    if (options.autoConnect) {
      wsClient.connect(options.token).catch(console.error);
    }

    // Cleanup
    return () => {
      wsClient.removeAllListeners();
    };
  }, [options.autoConnect, options.token]);

  const connect = useCallback(async () => {
    if (client && !isConnected) {
      await client.connect(options.token);
    }
  }, [client, isConnected, options.token]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
    }
  }, [client]);

  const sendMessage = useCallback((message: string) => {
    if (client && isConnected) {
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        timestamp: new Date(),
        isBot: false
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to server
      client.sendMessage(message);
      
      // Show typing indicator
      setIsTyping(true);
    }
  }, [client, isConnected]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect,
    isTyping,
    sessionId,
    clearMessages
  };
}