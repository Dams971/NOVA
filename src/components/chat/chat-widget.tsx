'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import '@/styles/chat-animations.css';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Phone,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';
import { AnimatedMessage, TypingIndicatorMessage, SuggestedRepliesAnimated } from './animated-message';
import { LoadingSpinner, ConnectionIndicator } from '@/components/ui/loading-spinner';

/**
 * NOVA AI Chatbot Widget
 * Embeddable chat component for appointment booking and customer service
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
  data?: any;
  context?: {
    currentIntent?: string;
    collectedSlots?: Record<string, any>;
    confirmationPending?: boolean;
    state?: 'active' | 'waiting_for_input' | 'completed' | 'escalated';
  };
}

export interface ChatWidgetProps {
  // Configuration
  tenantId: string;
  userId: string;
  userRole: string;
  userEmail?: string;
  cabinetName: string;
  businessHours?: Record<string, { open: string; close: string }>;
  
  // Styling
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  
  // Features
  enableSounds?: boolean;
  enableTypingIndicator?: boolean;
  enableAnimations?: boolean;
  maxMessages?: number;
  
  // Callbacks
  onEscalation?: (conversationId: string) => void;
  onAppointmentBooked?: (appointmentData: any) => void;
  onClose?: () => void;
  onSettingsChange?: (settings: any) => void;
}

export default function ChatWidget({
  tenantId,
  userId,
  userRole,
  userEmail,
  cabinetName,
  businessHours = {},
  primaryColor = '#3b82f6',
  position = 'bottom-right',
  minimized: initialMinimized = true,
  theme = 'light',
  enableSounds = true,
  enableTypingIndicator = true,
  enableAnimations = true,
  maxMessages = 100,
  onEscalation,
  onAppointmentBooked,
  onClose,
  onSettingsChange
}: ChatWidgetProps) {
  // State management
  const [minimized, setMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ChatResponse | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(enableSounds);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (enableAnimations) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [enableAnimations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Sound notifications
  const playNotificationSound = useCallback((type: 'message' | 'error' | 'success') => {
    if (!soundsEnabled) return;

    try {
      // Create audio context for web audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different notification types
      const frequencies = {
        message: [800, 600],
        error: [400, 300],
        success: [600, 800, 1000]
      };

      const freqs = frequencies[type];
      oscillator.frequency.setValueAtTime(freqs[0], audioContext.currentTime);
      
      freqs.forEach((freq, index) => {
        if (index > 0) {
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
        }
      });

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (_error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundsEnabled]);

  // Update unread count
  useEffect(() => {
    if (minimized) {
      const assistantMessages = messages.filter(m => m.role === 'assistant').length;
      setUnreadCount(assistantMessages);
    } else {
      setUnreadCount(0);
    }
  }, [messages, minimized]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!minimized) {
      connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = `ws://localhost:8080?sessionId=${sessionId}`;
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('🔗 WebSocket connected');
        setConnectionStatus('connected');
        
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
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      websocketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      websocketRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!minimized) {
            connectWebSocket();
          }
        }, 3000);
      };

    } catch (_error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId, tenantId, userRole, userEmail, minimized]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: unknown) => {
    switch (message.type) {
      case 'status':
        if (message.data.status === 'authenticated') {
          // Send initial greeting
          sendMessage("Bonjour");
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
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Handle chat response from server
  const handleChatResponse = useCallback((responseData: ChatResponse) => {
    // Add bot message
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

    // Play notification sound
    if (responseData.escalate) {
      playNotificationSound('error');
    } else if (responseData.completed) {
      playNotificationSound('success');
    } else {
      playNotificationSound('message');
    }

    // Handle special cases
    if (responseData.escalate && onEscalation) {
      onEscalation(sessionId);
    }

    if (responseData.data?.appointmentId && onAppointmentBooked) {
      onAppointmentBooked(responseData.data);
    }
  }, [sessionId, onEscalation, onAppointmentBooked, playNotificationSound]);

  // Handle escalation
  const handleEscalation = useCallback((escalationData: any) => {
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
    setInputMessage('');
    setIsLoading(true);

    // Prepare chat context
    const chatContext = {
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
        state: 'active' as const,
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
    } catch (_error) {
      console.error('Error sending message:', error);
      addSystemMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      setIsLoading(false);
    }
  }, [
    isLoading, messages, sessionId, userId, userRole, userEmail, 
    tenantId, cabinetName, businessHours, currentResponse
  ]);

  // Handle suggested reply click
  const handleSuggestedReply = useCallback((reply: string) => {
    sendMessage(reply);
  }, [sendMessage]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  }, [inputMessage, sendMessage]);

  // Render individual message using AnimatedMessage
  const renderMessage = useCallback((message: ChatMessage, index: number) => {
    const isNewMessage = index === messages.length - 1 && message.role === 'assistant';
    
    return (
      <AnimatedMessage
        key={message.id}
        id={message.id}
        role={message.role}
        content={message.content}
        timestamp={message.timestamp}
        isNew={enableAnimations && isNewMessage}
        metadata={message.metadata}
        primaryColor={primaryColor}
        onAnimationComplete={() => {
          // Animation completed for new assistant message
          if (message.role === 'assistant') {
            playNotificationSound('message');
          }
        }}
      />
    );
  }, [messages.length, enableAnimations, primaryColor, playNotificationSound]);

  // Toggle minimized state
  const toggleMinimized = useCallback(() => {
    setMinimized(prev => !prev);
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp: Date) => {
    return timestamp.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // Settings panel toggle
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  // Handle settings changes
  const handleSettingsChange = useCallback((key: string, value: any) => {
    if (key === 'sounds') {
      setSoundsEnabled(value);
    }
    
    onSettingsChange?.({ [key]: value });
  }, [onSettingsChange]);

  if (minimized) {
    return (
      <div
        className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} z-50`}
      >
        <button
          onClick={toggleMinimized}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-105 relative hover-lift ${
            enableAnimations ? 'animate-bounce-in' : ''
          } ${
            connectionStatus === 'connected' ? 'animate-glow' : ''
          }`}
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6" />
          
          {/* Unread messages badge */}
          {unreadCount > 0 && (
            <div className={`absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center px-1 ${
              enableAnimations ? 'animate-pulse' : ''
            }`}>
              <span className="text-xs text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}

          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            <ConnectionIndicator 
              status={connectionStatus} 
              className="scale-75"
            />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} w-96 h-[32rem] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${
        enableAnimations ? 'chat-widget-enter chat-widget-enter-active' : ''
      }`}
      style={{
        boxShadow: connectionStatus === 'connected' ? '0 10px 25px rgba(59, 130, 246, 0.15)' : '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-lg text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Nova Assistant</h3>
            <p className="text-xs opacity-90">{cabinetName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection status */}
          <ConnectionIndicator status={connectionStatus} />
          
          {/* Settings button */}
          <button 
            onClick={toggleSettings} 
            className={`hover:bg-black/20 p-1 rounded transition-colors ${showSettings ? 'bg-black/20' : ''}`}
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {/* Sound toggle */}
          <button 
            onClick={() => handleSettingsChange('sounds', !soundsEnabled)} 
            className="hover:bg-black/20 p-1 rounded transition-colors"
            title={soundsEnabled ? 'Désactiver les sons' : 'Activer les sons'}
          >
            {soundsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button onClick={toggleMinimized} className="hover:bg-black/20 p-1 rounded">
            <Minimize2 className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button onClick={onClose} className="hover:bg-black/20 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bonjour ! Je suis Nova, votre assistant pour les rendez-vous.</p>
            <p className="text-sm mt-1">Comment puis-je vous aider ?</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}

        {isTyping && enableTypingIndicator && (
          <TypingIndicatorMessage 
            primaryColor={primaryColor}
            userName="Nova"
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested replies */}
      {currentResponse?.suggestedReplies && currentResponse.suggestedReplies.length > 0 && (
        <SuggestedRepliesAnimated
          replies={currentResponse.suggestedReplies}
          onReplyClick={handleSuggestedReply}
          isVisible={enableAnimations}
          primaryColor={primaryColor}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3 text-sm">Paramètres</h4>
            
            {/* Sound Settings */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {soundsEnabled ? <Volume2 className="w-4 h-4 text-gray-600" /> : <VolumeX className="w-4 h-4 text-gray-600" />}
                <span className="text-sm text-gray-700">Notifications sonores</span>
              </div>
              <button
                onClick={() => handleSettingsChange('sounds', !soundsEnabled)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  soundsEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                  soundsEnabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Connection Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ConnectionIndicator status={connectionStatus} />
                <span className="text-sm text-gray-700">Connexion</span>
              </div>
              <span className="text-xs text-gray-500">
                Session: {sessionId.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={connectionStatus === 'connected' ? 'Tapez votre message...' : 'Connexion...'}
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
              connectionStatus === 'connected' ? 'focus:ring-blue-500' : 'focus:ring-yellow-400'
            } ${
              isLoading ? 'animate-pulse' : ''
            }`}
            disabled={isLoading || connectionStatus !== 'connected'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputMessage);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim() || connectionStatus !== 'connected'}
            className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-lift ${
              isLoading ? 'animate-pulse' : 'hover:shadow-lg'
            }`}
            style={{ 
              backgroundColor: isLoading ? 'neutral-400' : primaryColor,
              transform: isLoading ? 'scale(0.95)' : 'scale(1)'
            }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {connectionStatus !== 'connected' && (
          <p className="text-xs text-red-500 mt-1">
            {connectionStatus === 'connecting' ? 'Connexion en cours...' :
             connectionStatus === 'error' ? 'Erreur de connexion' :
             'Connexion perdue'}
          </p>
        )}
      </form>
    </div>
  );
}