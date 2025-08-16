/**
 * useChat Hook Unit Tests
 * 
 * Comprehensive tests for the chat management hook including:
 * - WebSocket connection management
 * - Message sending and receiving
 * - Connection status handling
 * - Auto-reconnection logic
 * - French language support
 * - Error handling and escalation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { useChat, type ChatMessage, type ChatResponse, type UseChatOptions } from '@/hooks/use-chat';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send = vi.fn();
  close = vi.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => {
      this.onclose?.(new CloseEvent('close', { code, reason }));
    }, 10);
  });

  // Helper methods for testing
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { 
        data: typeof data === 'string' ? data : JSON.stringify(data) 
      }));
    }
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }
}

// Setup WebSocket mock
global.WebSocket = MockWebSocket as any;

// Mock fetch for HTTP fallback
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to reduce test output noise
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Default options for useChat
const defaultOptions: UseChatOptions = {
  tenantId: 'tenant-123',
  userId: 'user-456',
  userRole: 'patient',
  userEmail: 'test@example.com',
  cabinetName: 'Cabinet Dentaire NOVA',
  websocketUrl: 'ws://localhost:8080',
};

// Sample test data
const mockChatResponse: ChatResponse = {
  message: 'Bonjour ! Comment puis-je vous aider ?',
  requiresInput: true,
  inputType: 'text',
  completed: false,
  context: {
    currentIntent: 'greeting',
    collectedSlots: {},
    state: 'active',
  },
};

const mockChatMessage: ChatMessage = {
  id: 'msg-123',
  role: 'assistant',
  content: 'Bonjour ! Comment puis-je vous aider ?',
  timestamp: new Date(),
};

describe('useChat Hook', () => {
  let currentWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);

    // Track WebSocket instances
    const OriginalWebSocket = global.WebSocket;
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        currentWebSocket = this;
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isTyping).toBe(false);
      expect(result.current.currentResponse).toBeNull();
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.hasMessages).toBe(false);
      expect(result.current.lastMessage).toBeNull();
      expect(result.current.unreadCount).toBe(0);
    });

    it('should generate unique session IDs', () => {
      const { result: result1 } = renderHook(() => useChat(defaultOptions));
      const { result: result2 } = renderHook(() => useChat(defaultOptions));

      expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
    });
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      expect(result.current.connectionStatus).toBe('connecting');

      // Wait for connection to open
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should authenticate after connection', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Check authentication message was sent
      expect(currentWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'authenticate',
          sessionId: result.current.sessionId,
          data: {
            userId: 'user-456',
            tenantId: 'tenant-123',
            userRole: 'patient',
            userEmail: 'test@example.com',
          },
        })
      );
    });

    it('should handle connection errors', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useChat({ ...defaultOptions, onError }));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Simulate error
      act(() => {
        currentWebSocket.simulateError();
      });

      expect(result.current.connectionStatus).toBe('error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should disconnect properly', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(currentWebSocket.close).toHaveBeenCalledWith(1000, 'User disconnected');
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    it('should prevent multiple connections', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
        result.current.connect(); // Second call should be ignored
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Only one WebSocket should be created
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-Reconnection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnection on unexpected disconnection', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate unexpected disconnection
      act(() => {
        currentWebSocket.simulateClose(1006, 'Connection lost');
      });

      expect(result.current.connectionStatus).toBe('disconnected');

      // Advance timer for first reconnection attempt
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should attempt to reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for reconnection', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate multiple disconnections
      for (let i = 0; i < 3; i++) {
        act(() => {
          currentWebSocket.simulateClose(1006, 'Connection lost');
        });

        const expectedDelay = Math.min(1000 * Math.pow(2, i), 30000);
        
        await act(async () => {
          vi.advanceTimersByTime(expectedDelay);
        });
      }

      // Should have attempted multiple reconnections
      expect(global.WebSocket).toHaveBeenCalledTimes(4); // Initial + 3 reconnections
    });

    it('should stop reconnecting after max attempts', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate 6 disconnections (should stop after 5 attempts)
      for (let i = 0; i < 6; i++) {
        act(() => {
          currentWebSocket.simulateClose(1006, 'Connection lost');
        });

        await act(async () => {
          vi.advanceTimersByTime(30000);
        });
      }

      // Should stop at 5 reconnection attempts (6 total WebSocket instances)
      expect(global.WebSocket).toHaveBeenCalledTimes(6);
    });
  });

  describe('Message Handling', () => {
    it('should send messages via WebSocket', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.sendMessage('Bonjour');
      });

      // Should add user message to state
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        content: 'Bonjour',
      });

      // Should send via WebSocket
      expect(currentWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"chat"')
      );
    });

    it('should fall back to HTTP when WebSocket unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockChatResponse }),
      });

      const { result } = renderHook(() => useChat(defaultOptions));

      // Don't connect WebSocket
      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Should use HTTP fallback
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle chat responses', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate receiving chat response
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'chat_response',
          data: mockChatResponse,
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'assistant',
        content: mockChatResponse.message,
      });
      expect(result.current.currentResponse).toEqual(mockChatResponse);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle typing indicators', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate typing start
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'typing',
          data: { typing: true },
        });
      });

      expect(result.current.isTyping).toBe(true);

      // Simulate typing stop
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'typing',
          data: { typing: false },
        });
      });

      expect(result.current.isTyping).toBe(false);
    });

    it('should prevent sending empty messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage('');
        await result.current.sendMessage('   ');
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should prevent sending while loading', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      // Set loading state
      act(() => {
        result.current.sendMessage('First message');
      });

      expect(result.current.isLoading).toBe(true);

      // Try to send second message while loading
      await act(async () => {
        await result.current.sendMessage('Second message');
      });

      // Should only have one message
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('System Messages', () => {
    it('should add system messages', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.addSystemMessage('Connexion établie');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'system',
        content: 'Connexion établie',
      });
    });

    it('should handle error messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate error message
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'error',
          data: { error: 'Service indisponible' },
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'system',
        content: 'Erreur: Service indisponible',
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Escalation Handling', () => {
    it('should handle escalation requests', async () => {
      const onEscalation = vi.fn();
      const { result } = renderHook(() => useChat({ ...defaultOptions, onEscalation }));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate escalation response
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'chat_response',
          data: { ...mockChatResponse, escalate: true },
        });
      });

      expect(onEscalation).toHaveBeenCalledWith(result.current.sessionId);
    });

    it('should handle escalation messages', async () => {
      const onEscalation = vi.fn();
      const { result } = renderHook(() => useChat({ ...defaultOptions, onEscalation }));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate escalation message
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'escalation',
          data: { ticketId: 'ticket-123' },
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain('ticket-123');
      expect(onEscalation).toHaveBeenCalledWith(result.current.sessionId);
    });
  });

  describe('Appointment Booking', () => {
    it('should handle appointment booking completion', async () => {
      const onAppointmentBooked = vi.fn();
      const { result } = renderHook(() => useChat({ 
        ...defaultOptions, 
        onAppointmentBooked 
      }));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const appointmentData = { appointmentId: 'apt-123', patientId: 'patient-456' };

      // Simulate appointment booking response
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'chat_response',
          data: {
            ...mockChatResponse,
            completed: true,
            data: appointmentData,
          },
        });
      });

      expect(onAppointmentBooked).toHaveBeenCalledWith(appointmentData);
    });
  });

  describe('Heartbeat and Connection Monitoring', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should send periodic ping messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Clear initial calls
      vi.clearAllMocks();

      // Advance timer for heartbeat
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(currentWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"')
      );
    });

    it('should handle pong responses', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate pong response
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'pong',
          timestamp: Date.now(),
        });
      });

      // Should not cause any errors or state changes
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  describe('Message Clearing', () => {
    it('should clear all messages and reset state', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      // Add some messages
      act(() => {
        result.current.addSystemMessage('Test message');
      });

      await act(async () => {
        await result.current.sendMessage('User message');
      });

      expect(result.current.messages).toHaveLength(2);

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.currentResponse).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isTyping).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasMessages correctly', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.hasMessages).toBe(false);

      act(() => {
        result.current.addSystemMessage('Test');
      });

      expect(result.current.hasMessages).toBe(true);
    });

    it('should compute lastMessage correctly', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.lastMessage).toBeNull();

      act(() => {
        result.current.addSystemMessage('First message');
        result.current.addSystemMessage('Last message');
      });

      expect(result.current.lastMessage?.content).toBe('Last message');
    });

    it('should compute unreadCount correctly', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.unreadCount).toBe(0);

      // Add various message types
      act(() => {
        result.current.addSystemMessage('System message');
      });

      act(() => {
        currentWebSocket?.simulateMessage({
          type: 'chat_response',
          data: mockChatResponse,
        });
      });

      act(() => {
        currentWebSocket?.simulateMessage({
          type: 'chat_response',
          data: { ...mockChatResponse, message: 'Second response' },
        });
      });

      // Should count only assistant messages
      expect(result.current.unreadCount).toBe(2);
    });
  });

  describe('French Language Support', () => {
    it('should handle French messages correctly', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage('Je voudrais prendre un rendez-vous');
      });

      expect(result.current.messages[0].content).toBe('Je voudrais prendre un rendez-vous');
    });

    it('should handle French error messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate French error message
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'error',
          data: { error: 'Service temporairement indisponible' },
        });
      });

      expect(result.current.messages[0].content).toBe('Erreur: Service temporairement indisponible');
    });

    it('should handle special French characters', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage('J\'aimerais une consultation générale à l\'hôpital');
      });

      expect(result.current.messages[0].content).toBe('J\'aimerais une consultation générale à l\'hôpital');
    });
  });

  describe('Error Handling', () => {
    it('should handle send message errors gracefully', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useChat({ ...defaultOptions, onError }));

      // Mock fetch to fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(result.current.messages).toHaveLength(2); // User message + error message
      expect(result.current.messages[1].role).toBe('system');
      expect(result.current.messages[1].content).toContain('Erreur lors de l\'envoi');
      expect(result.current.isLoading).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle malformed WebSocket messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate malformed message
      act(() => {
        currentWebSocket.simulateMessage('invalid json');
      });

      // Should not crash or change state
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should handle unknown message types', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate unknown message type
      act(() => {
        currentWebSocket.simulateMessage({
          type: 'unknown_type',
          data: { something: 'unexpected' },
        });
      });

      // Should log but not crash
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Unknown WebSocket message type:',
        'unknown_type'
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      expect(currentWebSocket.close).toHaveBeenCalledWith(1000, 'User disconnected');
    });

    it('should clear reconnection timers on disconnect', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger disconnection and start reconnection timer
      act(() => {
        currentWebSocket.simulateClose(1006, 'Connection lost');
      });

      // Manually disconnect before timer fires
      act(() => {
        result.current.disconnect();
      });

      // Advance timer - should not trigger reconnection
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(global.WebSocket).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});