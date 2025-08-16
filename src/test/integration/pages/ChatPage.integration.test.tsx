/**
 * Chat Page Integration Tests
 * 
 * Integration tests for the Chat functionality including:
 * - WebSocket connection management
 * - Real-time message exchange
 * - AI conversation flow
 * - Appointment booking through chat
 * - Error handling and reconnection
 * - French language interaction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, userEvent, waitFor, setupMockFetch } from '@/test/test-utils';
import { createTestUser, createTestAppointment } from '@/test/setup';

// Mock WebSocket with more advanced features
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
  
  send = vi.fn();
  close = vi.fn();
  
  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }
  
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

global.WebSocket = MockWebSocket as any;

// Mock Chat Page Component
const ChatPage = () => {
  return (
    <div data-testid="chat-page">
      <header data-testid="chat-header">
        <h1>Assistant NOVA</h1>
        <div data-testid="connection-status">
          <span data-testid="status-indicator" className="connected">Connecté</span>
        </div>
      </header>
      
      <main data-testid="chat-main">
        <div 
          data-testid="chat-messages" 
          role="log" 
          aria-live="polite"
          aria-label="Messages de conversation"
        >
          {/* Messages will be rendered here */}
        </div>
        
        <div data-testid="typing-indicator" style={{ display: 'none' }}>
          <span>L'assistant tape...</span>
        </div>
        
        <div data-testid="suggested-responses" style={{ display: 'none' }}>
          {/* Suggested response buttons */}
        </div>
        
        <form data-testid="chat-form">
          <div data-testid="input-container">
            <textarea
              data-testid="message-input"
              placeholder="Tapez votre message ici..."
              aria-label="Message à envoyer"
              rows={1}
            />
            <button 
              type="submit" 
              data-testid="send-button"
              aria-label="Envoyer le message"
            >
              Envoyer
            </button>
          </div>
        </form>
      </main>
      
      <div data-testid="appointment-summary" style={{ display: 'none' }}>
        <h2>Résumé du rendez-vous</h2>
        <div data-testid="appointment-details">
          {/* Appointment details */}
        </div>
        <button data-testid="confirm-appointment">Confirmer</button>
        <button data-testid="modify-appointment">Modifier</button>
      </div>
      
      <div data-testid="error-notification" style={{ display: 'none' }}>
        <div data-testid="error-message">
          {/* Error message */}
        </div>
        <button data-testid="retry-button">Réessayer</button>
      </div>
    </div>
  );
};

describe('Chat Page Integration Tests', () => {
  let mockWebSocket: MockWebSocket;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup API mocks
    setupMockFetch({
      '/api/chat': {
        success: true,
        data: {
          message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
          suggestedReplies: [
            'Je veux prendre un rendez-vous',
            'Quels sont vos horaires ?',
            'Où êtes-vous situés ?'
          ],
          requiresInput: true,
          inputType: 'text',
        },
      },
      '/api/appointments/create': {
        success: true,
        data: {
          appointmentId: 'apt-123',
          patientId: 'patient-456',
        },
      },
    });
    
    // Track WebSocket instance
    const OriginalWebSocket = global.WebSocket;
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocket = this;
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Page Setup', () => {
    it('should render chat interface correctly', () => {
      render(<ChatPage />);
      
      expect(screen.getByTestId('chat-page')).toBeInTheDocument();
      expect(screen.getByText('Assistant NOVA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tapez votre message ici...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument();
    });

    it('should have proper accessibility structure', () => {
      render(<ChatPage />);
      
      const messagesArea = screen.getByRole('log');
      expect(messagesArea).toHaveAttribute('aria-live', 'polite');
      expect(messagesArea).toHaveAttribute('aria-label', 'Messages de conversation');
      
      const messageInput = screen.getByRole('textbox');
      expect(messageInput).toHaveAttribute('aria-label', 'Message à envoyer');
      
      const sendButton = screen.getByRole('button', { name: 'Envoyer le message' });
      expect(sendButton).toBeInTheDocument();
    });

    it('should show connection status', () => {
      render(<ChatPage />);
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveTextContent('Connecté');
      expect(statusIndicator).toHaveClass('connected');
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      render(<ChatPage />);
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('ws://localhost:8080')
        );
      });
    });

    it('should authenticate after connection', async () => {
      render(<ChatPage />);
      
      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          expect.stringContaining('"type":"authenticate"')
        );
      });
    });

    it('should handle connection status changes', async () => {
      render(<ChatPage />);
      
      // Initially connecting
      expect(screen.getByTestId('status-indicator')).toHaveTextContent('Connecté');
      
      // Simulate disconnection
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toHaveTextContent('Déconnecté');
      });
    });

    it('should show initial greeting message', async () => {
      render(<ChatPage />);
      
      // Simulate initial greeting
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
          suggestedReplies: [
            'Je veux prendre un rendez-vous',
            'Quels sont vos horaires ?'
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Bonjour ! Comment puis-je vous aider aujourd\'hui ?')).toBeInTheDocument();
        expect(screen.getByText('Je veux prendre un rendez-vous')).toBeInTheDocument();
        expect(screen.getByText('Quels sont vos horaires ?')).toBeInTheDocument();
      });
    });
  });

  describe('Message Exchange', () => {
    beforeEach(async () => {
      render(<ChatPage />);
      
      // Wait for connection
      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          expect.stringContaining('"type":"authenticate"')
        );
      });
      
      vi.clearAllMocks();
    });

    it('should send user messages', async () => {
      const user = userEvent.setup();
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      await user.type(messageInput, 'Bonjour, je voudrais prendre rendez-vous');
      await user.click(sendButton);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('je voudrais prendre rendez-vous')
      );
    });

    it('should display user messages in chat', async () => {
      const user = userEvent.setup();
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(messageInput).toHaveValue('');
      });
    });

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup();
      
      const messageInput = screen.getByTestId('message-input');
      
      await user.type(messageInput, 'Test message');
      await user.keyboard('{Control>}{Enter}');
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });

    it('should prevent sending empty messages', async () => {
      const user = userEvent.setup();
      
      const sendButton = screen.getByTestId('send-button');
      
      await user.click(sendButton);
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should handle multiline messages', async () => {
      const user = userEvent.setup();
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      await user.type(messageInput, 'Première ligne{Shift>}{Enter}{/Shift}Deuxième ligne');
      await user.click(sendButton);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Première ligne\nDeuxième ligne')
      );
    });
  });

  describe('AI Response Handling', () => {
    beforeEach(async () => {
      render(<ChatPage />);
      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalled();
      });
      vi.clearAllMocks();
    });

    it('should display AI responses', async () => {
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Je peux vous aider à prendre rendez-vous. Quel type de consultation souhaitez-vous ?',
          requiresInput: true,
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Je peux vous aider à prendre rendez-vous. Quel type de consultation souhaitez-vous ?')).toBeInTheDocument();
      });
    });

    it('should show typing indicator', async () => {
      mockWebSocket.simulateMessage({
        type: 'typing',
        data: { typing: true },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('typing-indicator')).toBeVisible();
        expect(screen.getByText('L\'assistant tape...')).toBeInTheDocument();
      });
      
      mockWebSocket.simulateMessage({
        type: 'typing',
        data: { typing: false },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('typing-indicator')).toHaveStyle('display: none');
      });
    });

    it('should display suggested responses', async () => {
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Que puis-je faire pour vous ?',
          suggestedReplies: [
            'Prendre un rendez-vous',
            'Annuler un rendez-vous',
            'Modifier un rendez-vous',
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('suggested-responses')).toBeVisible();
        expect(screen.getByText('Prendre un rendez-vous')).toBeInTheDocument();
        expect(screen.getByText('Annuler un rendez-vous')).toBeInTheDocument();
        expect(screen.getByText('Modifier un rendez-vous')).toBeInTheDocument();
      });
    });

    it('should handle suggested response clicks', async () => {
      const user = userEvent.setup();
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Que souhaitez-vous faire ?',
          suggestedReplies: ['Prendre un rendez-vous'],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Prendre un rendez-vous')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Prendre un rendez-vous'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Prendre un rendez-vous')
      );
    });

    it('should handle selection options', async () => {
      const user = userEvent.setup();
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Choisissez un type de consultation :',
          requiresInput: true,
          inputType: 'select',
          options: [
            { value: 'consultation', label: 'Consultation générale' },
            { value: 'urgence', label: 'Urgence dentaire' },
            { value: 'nettoyage', label: 'Nettoyage' },
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Consultation générale')).toBeInTheDocument();
        expect(screen.getByText('Urgence dentaire')).toBeInTheDocument();
        expect(screen.getByText('Nettoyage')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Consultation générale'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('consultation')
      );
    });
  });

  describe('Appointment Booking Flow', () => {
    beforeEach(async () => {
      render(<ChatPage />);
      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalled();
      });
      vi.clearAllMocks();
    });

    it('should handle patient information collection', async () => {
      const user = userEvent.setup();
      
      // AI asks for name
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Pour prendre rendez-vous, j\'ai besoin de votre nom complet.',
          requiresInput: true,
          inputType: 'text',
          context: {
            currentIntent: 'collect_patient_info',
            collectedSlots: {},
          },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Pour prendre rendez-vous, j\'ai besoin de votre nom complet.')).toBeInTheDocument();
      });
      
      // User provides name
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Jean Dupont');
      await user.click(screen.getByTestId('send-button'));
      
      // AI asks for phone
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Merci Jean ! Quel est votre numéro de téléphone ?',
          requiresInput: true,
          inputType: 'tel',
          context: {
            currentIntent: 'collect_patient_info',
            collectedSlots: { name: 'Jean Dupont' },
          },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Merci Jean ! Quel est votre numéro de téléphone ?')).toBeInTheDocument();
      });
      
      // User provides phone
      await user.type(messageInput, '+213555123456');
      await user.click(screen.getByTestId('send-button'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('+213555123456')
      );
    });

    it('should handle date and time selection', async () => {
      const user = userEvent.setup();
      
      // AI offers date options
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Pour quelle date souhaitez-vous prendre rendez-vous ?',
          requiresInput: true,
          inputType: 'date',
          options: [
            { value: '2024-01-15', label: 'Lundi 15 janvier' },
            { value: '2024-01-16', label: 'Mardi 16 janvier' },
            { value: '2024-01-17', label: 'Mercredi 17 janvier' },
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Pour quelle date souhaitez-vous prendre rendez-vous ?')).toBeInTheDocument();
        expect(screen.getByText('Lundi 15 janvier')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Lundi 15 janvier'));
      
      // AI offers time slots
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Voici les créneaux disponibles le 15 janvier :',
          requiresInput: true,
          inputType: 'time',
          options: [
            { value: '14:30', label: '14h30 - 15h00' },
            { value: '15:00', label: '15h00 - 15h30' },
            { value: '16:00', label: '16h00 - 16h30' },
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Voici les créneaux disponibles le 15 janvier :')).toBeInTheDocument();
        expect(screen.getByText('14h30 - 15h00')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('14h30 - 15h00'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('14:30')
      );
    });

    it('should show appointment summary for confirmation', async () => {
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Voici le résumé de votre rendez-vous :',
          requiresInput: true,
          inputType: 'confirmation',
          data: {
            patient: {
              name: 'Jean Dupont',
              phone: '+213555123456',
            },
            appointment: {
              date: '2024-01-15',
              time: '14:30',
              type: 'Consultation générale',
            },
          },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-summary')).toBeVisible();
        expect(screen.getByText('Résumé du rendez-vous')).toBeInTheDocument();
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('+213555123456')).toBeInTheDocument();
        expect(screen.getByText('15 janvier 2024')).toBeInTheDocument();
        expect(screen.getByText('14h30')).toBeInTheDocument();
      });
    });

    it('should handle appointment confirmation', async () => {
      const user = userEvent.setup();
      
      // Show appointment summary
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Confirmez votre rendez-vous',
          inputType: 'confirmation',
          data: {
            patient: { name: 'Jean Dupont', phone: '+213555123456' },
            appointment: { date: '2024-01-15', time: '14:30' },
          },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-summary')).toBeVisible();
      });
      
      await user.click(screen.getByTestId('confirm-appointment'));
      
      // Simulate successful booking
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Parfait ! Votre rendez-vous a été confirmé. Vous recevrez un SMS de confirmation.',
          completed: true,
          data: {
            appointmentId: 'apt-123',
            confirmationSent: true,
          },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Parfait ! Votre rendez-vous a été confirmé.')).toBeInTheDocument();
      });
    });

    it('should handle appointment modification', async () => {
      const user = userEvent.setup();
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Confirmez votre rendez-vous',
          inputType: 'confirmation',
          data: { appointment: { date: '2024-01-15', time: '14:30' } },
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-summary')).toBeVisible();
      });
      
      await user.click(screen.getByTestId('modify-appointment'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('modify')
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      render(<ChatPage />);
      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalled();
      });
      vi.clearAllMocks();
    });

    it('should display error messages from AI', async () => {
      mockWebSocket.simulateMessage({
        type: 'error',
        data: {
          error: 'Service temporairement indisponible. Veuillez réessayer dans quelques minutes.',
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-notification')).toBeVisible();
        expect(screen.getByText('Service temporairement indisponible')).toBeInTheDocument();
      });
    });

    it('should handle connection errors', async () => {
      mockWebSocket.simulateError();
      
      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toHaveTextContent('Erreur');
        expect(screen.getByTestId('error-notification')).toBeVisible();
      });
    });

    it('should handle unexpected disconnections', async () => {
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toHaveTextContent('Déconnecté');
        expect(screen.getByText('Tentative de reconnexion...')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality', async () => {
      const user = userEvent.setup();
      
      mockWebSocket.simulateMessage({
        type: 'error',
        data: {
          error: 'Erreur de réseau',
        },
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-notification')).toBeVisible();
      });
      
      await user.click(screen.getByTestId('retry-button'));
      
      // Should attempt to reconnect or retry last action
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should handle API fallback when WebSocket fails', async () => {
      const user = userEvent.setup();
      
      // Simulate WebSocket failure
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toHaveTextContent('Déconnecté');
      });
      
      // Try to send a message - should fall back to HTTP
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Test message');
      await user.click(screen.getByTestId('send-button'));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('French Language Support', () => {
    it('should handle French text input correctly', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      
      await user.type(messageInput, 'Je voudrais prendre un rendez-vous pour une consultation générale');
      await user.click(screen.getByTestId('send-button'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('consultation générale')
      );
    });

    it('should handle French special characters', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      
      await user.type(messageInput, 'J\'aimerais une consultation à l\'hôpital près de chez moi');
      await user.click(screen.getByTestId('send-button'));
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('l\'hôpital')
      );
    });

    it('should display French AI responses correctly', async () => {
      render(<ChatPage />);
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?',
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?')).toBeInTheDocument();
      });
    });

    it('should use French date and time formats', async () => {
      render(<ChatPage />);
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Créneaux disponibles :',
          options: [
            { value: '2024-01-15T14:30', label: 'Lundi 15 janvier à 14h30' },
            { value: '2024-01-16T09:00', label: 'Mardi 16 janvier à 09h00' },
          ],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('Lundi 15 janvier à 14h30')).toBeInTheDocument();
        expect(screen.getByText('Mardi 16 janvier à 09h00')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should announce new messages to screen readers', async () => {
      render(<ChatPage />);
      
      const messagesArea = screen.getByRole('log');
      expect(messagesArea).toHaveAttribute('aria-live', 'polite');
      
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          message: 'Nouveau message test',
        },
      });
      
      await waitFor(() => {
        expect(messagesArea).toContainElement(
          screen.getByText('Nouveau message test')
        );
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Tab to input
      await user.tab();
      expect(messageInput).toHaveFocus();
      
      // Tab to send button
      await user.tab();
      expect(sendButton).toHaveFocus();
      
      // Enter should activate button
      await user.keyboard('{Enter}');
      // Button behavior would be tested in component unit tests
    });

    it('should provide proper button labels', () => {
      render(<ChatPage />);
      
      expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument();
      
      // Show suggested responses
      mockWebSocket.simulateMessage({
        type: 'chat_response',
        data: {
          suggestedReplies: ['Prendre rendez-vous'],
        },
      });
      
      // Suggested response buttons should have accessible names
      expect(screen.getByRole('button', { name: 'Prendre rendez-vous' })).toBeInTheDocument();
    });

    it('should handle focus management during conversation', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      
      await user.type(messageInput, 'Test message');
      await user.click(screen.getByTestId('send-button'));
      
      // Focus should return to input after sending
      await waitFor(() => {
        expect(messageInput).toHaveFocus();
      });
    });
  });

  describe('Performance and Real-time Features', () => {
    it('should handle rapid message exchange', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await user.type(messageInput, `Message ${i}`);
        await user.click(sendButton);
      }
      
      // All messages should be sent
      expect(mockWebSocket.send).toHaveBeenCalledTimes(5);
    });

    it('should handle message history and scrolling', async () => {
      render(<ChatPage />);
      
      // Simulate many messages
      for (let i = 0; i < 20; i++) {
        mockWebSocket.simulateMessage({
          type: 'chat_response',
          data: {
            message: `Message de test numéro ${i}`,
          },
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('Message de test numéro 19')).toBeInTheDocument();
      });
      
      // Chat should auto-scroll to bottom
      const messagesArea = screen.getByTestId('chat-messages');
      expect(messagesArea.scrollTop).toBeGreaterThan(0);
    });

    it('should debounce typing indicators', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const messageInput = screen.getByTestId('message-input');
      
      // Start typing
      await user.type(messageInput, 'Te');
      
      // Should show user typing to AI
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"typing"')
      );
      
      // Continue typing
      await user.type(messageInput, 'st');
      
      // Should not send multiple typing events immediately
      const typingCalls = mockWebSocket.send.mock.calls.filter(call =>
        call[0].includes('"type":"typing"')
      );
      expect(typingCalls.length).toBeLessThanOrEqual(2);
    });
  });
});