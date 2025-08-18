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
import { useChat, type ChatMessage, type ChatResponse, type UseChatOptions } from '@/hooks/use-chat';
import { renderHook, act, waitFor } from '@/test/test-utils';

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
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        // Store reference to current instance for testing
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(true);
      expect(result.current.messages).toEqual([]);
      expect(result.current.currentContext).toBeNull();
      expect(result.current.sessionId).toBeDefined();
    });

    it('should create WebSocket connection with correct URL', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(global.WebSocket).toHaveBeenCalledWith(
        'ws://localhost:8080'
      );
    });

    it('should establish connection and update state', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isConnecting).toBe(false);
      });
    });
  });

  describe('Message Sending', () => {
    it('should send messages when connected', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      // Wait for connection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.sendMessage('Bonjour, je veux prendre un rendez-vous');
      });

      expect(currentWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Bonjour, je veux prendre un rendez-vous')
      );
    });

    it('should queue messages when not connected', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      // Send message before connection is established
      act(() => {
        result.current.sendMessage('Message avant connexion');
      });

      // Message should be queued, not sent immediately
      expect(currentWebSocket.send).not.toHaveBeenCalled();
    });

    it('should add user message to messages array', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        content: 'Test message',
      });
    });
  });

  describe('Message Receiving', () => {
    it('should handle incoming assistant messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        currentWebSocket.simulateMessage(mockChatResponse);
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0]).toMatchObject({
          role: 'assistant',
          content: mockChatResponse.message,
        });
      });
    });

    it('should update context when receiving messages', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        currentWebSocket.simulateMessage(mockChatResponse);
      });

      await waitFor(() => {
        expect(result.current.currentContext).toEqual(mockChatResponse.context);
      });
    });

    it('should handle invalid JSON messages gracefully', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        currentWebSocket.simulateMessage('invalid json');
      });

      // Should not crash and should log error
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        currentWebSocket.simulateError();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle connection close', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        currentWebSocket.simulateClose();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should attempt reconnection after unexpected disconnect', async () => {
      const { result } = renderHook(() => useChat({
        ...defaultOptions,
        autoReconnect: true,
        reconnectInterval: 100,
      }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate unexpected disconnect
      act(() => {
        currentWebSocket.simulateClose(1006, 'Abnormal closure');
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.isConnecting).toBe(true);
      });
    });
  });

  describe('HTTP Fallback', () => {
    it('should fall back to HTTP when WebSocket fails', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChatResponse),
      });

      const { result } = renderHook(() => useChat({
        ...defaultOptions,
        fallbackToHttp: true,
      }));

      // Simulate WebSocket failure
      act(() => {
        currentWebSocket.simulateError();
      });

      act(() => {
        result.current.sendMessage('Test message via HTTP');
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/chat'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('Test message via HTTP'),
          })
        );
      });
    });

    it('should handle HTTP fallback errors', async () => {
      mockFetch.mockRejectedValue(new Error('HTTP Error'));

      const { result } = renderHook(() => useChat({
        ...defaultOptions,
        fallbackToHttp: true,
      }));

      // Simulate WebSocket failure
      act(() => {
        currentWebSocket.simulateError();
      });

      act(() => {
        result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(mockConsole.error).toHaveBeenCalled();
      });
    });
  });

  describe('French Language Support', () => {
    it('should handle French messages correctly', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const frenchMessage = 'Je voudrais prendre un rendez-vous pour demain matin';
      
      act(() => {
        result.current.sendMessage(frenchMessage);
      });

      expect(result.current.messages[0].content).toBe(frenchMessage);
      expect(currentWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining(frenchMessage)
      );
    });

    it('should handle French responses with accents', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const frenchResponse = {
        ...mockChatResponse,
        message: 'Très bien ! À quelle heure préférez-vous ?',
      };

      act(() => {
        currentWebSocket.simulateMessage(frenchResponse);
      });

      await waitFor(() => {
        expect(result.current.messages[0].content).toBe(frenchResponse.message);
      });
    });
  });

  describe('Cleanup', () => {
    it('should close WebSocket connection on unmount', async () => {
      const { result, unmount } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      expect(currentWebSocket.close).toHaveBeenCalled();
    });

    it('should clear reconnection timers on unmount', async () => {
      const { result, unmount } = renderHook(() => useChat({
        ...defaultOptions,
        autoReconnect: true,
      }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger reconnection
      act(() => {
        currentWebSocket.simulateClose(1006);
      });

      unmount();

      // Should not throw or continue reconnecting
      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should maintain session ID throughout connection', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      const initialSessionId = result.current.sessionId;

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.sessionId).toBe(initialSessionId);
    });

    it('should clear session on explicit disconnect', () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(currentWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should set error state on connection failure', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        currentWebSocket.simulateError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should clear error state on successful reconnection', async () => {
      const { result } = renderHook(() => useChat({
        ...defaultOptions,
        autoReconnect: true,
        reconnectInterval: 100,
      }));

      // Simulate error
      act(() => {
        currentWebSocket.simulateError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Simulate successful reconnection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Message History', () => {
    it('should maintain message order', async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Send multiple messages
      act(() => {
        result.current.sendMessage('Message 1');
      });

      act(() => {
        currentWebSocket.simulateMessage({
          ...mockChatResponse,
          message: 'Response 1',
        });
      });

      act(() => {
        result.current.sendMessage('Message 2');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3);
        expect(result.current.messages[0].content).toBe('Message 1');
        expect(result.current.messages[1].content).toBe('Response 1');
        expect(result.current.messages[2].content).toBe('Message 2');
      });
    });

    it('should limit message history when specified', async () => {
      const { result } = renderHook(() => useChat({
        ...defaultOptions,
        maxMessages: 2,
      }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Send more messages than limit
      for (let i = 1; i <= 5; i++) {
        act(() => {
          result.current.sendMessage(`Message ${i}`);
        });
      }

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[0].content).toBe('Message 4');
        expect(result.current.messages[1].content).toBe('Message 5');
      });
    });
  });
});