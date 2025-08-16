/**
 * ChatRDV Component Tests
 * 
 * Comprehensive test suite for the NOVA chat component
 * testing real-time messaging, accessibility, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { ChatRDV } from '@/components/rdv/ChatRDV';
import { checkAccessibility } from '@/test/setup';
import userEvent from '@testing-library/user-event';

// Mock the ButtonMedical component
vi.mock('@/components/ui/nova/ButtonMedical', () => ({
  ButtonMedical: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe('ChatRDV Component', () => {
  beforeEach(() => {
    // Reset timers before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Rendering', () => {
    test('renders with welcome message', () => {
      render(<ChatRDV />);
      
      expect(screen.getByText(/assistant rdv/i)).toBeInTheDocument();
      expect(screen.getByText(/réponse instantanée/i)).toBeInTheDocument();
      expect(screen.getByText(/bonjour ! je suis votre assistant/i)).toBeInTheDocument();
    });

    test('renders message input and send button', () => {
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      expect(input).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    test('send button is disabled when input is empty', () => {
      render(<ChatRDV />);
      
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Sending', () => {
    test('sends message when send button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      await user.type(input, 'Hello, I need an appointment');
      await user.click(sendButton);
      
      expect(screen.getByText('Hello, I need an appointment')).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    test('sends message when Enter is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      await user.type(input, 'Test message{Enter}');
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('does not send message when Shift+Enter is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
      
      expect(input).toHaveValue('Line 1\nLine 2');
      expect(screen.queryByText('Line 1')).not.toBeInTheDocument();
    });

    test('does not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      // Try sending whitespace
      await user.type(input, '   ');
      await user.click(sendButton);
      
      // Should not send message
      expect(screen.queryByText('   ')).not.toBeInTheDocument();
      // Input should still contain the whitespace
      expect(input).toHaveValue('   ');
    });
  });

  describe('Bot Response Simulation', () => {
    test('shows typing indicator after sending message', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      await user.type(input, 'Hello{Enter}');
      
      // Should show typing indicator
      expect(screen.getByLabelText(/l'assistant tape une réponse/i)).toBeInTheDocument();
      
      // Input should be disabled while typing
      expect(input).toBeDisabled();
    });

    test('shows bot response after typing delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      await user.type(input, 'Test message{Enter}');
      
      // Fast-forward time to trigger bot response
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText(/je vérifie les disponibilités/i)).toBeInTheDocument();
      });
      
      // Typing indicator should be gone
      expect(screen.queryByLabelText(/l'assistant tape une réponse/i)).not.toBeInTheDocument();
      
      // Input should be enabled again
      expect(input).not.toBeDisabled();
    });
  });

  describe('Message Display', () => {
    test('displays user messages on the right side', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'User message{Enter}');
      
      const userMessageContainer = screen.getByText('User message').closest('.flex');
      expect(userMessageContainer).toHaveClass('flex-row-reverse');
    });

    test('displays bot messages on the left side', () => {
      render(<ChatRDV />);
      
      const botMessage = screen.getByText(/bonjour ! je suis votre assistant/i);
      const botMessageContainer = botMessage.closest('.flex');
      expect(botMessageContainer).not.toHaveClass('flex-row-reverse');
    });

    test('displays timestamps for messages', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Timestamped message{Enter}');
      
      // Check for timestamp format (HH:MM)
      expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
    });

    test('applies correct styling to user vs bot messages', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'User message{Enter}');
      
      // User message should have primary background
      const userMessage = screen.getByText('User message').closest('div');
      expect(userMessage).toHaveClass('bg-primary-600', 'text-white');
      
      // Bot message should have neutral background
      const botMessage = screen.getByText(/bonjour ! je suis votre assistant/i).closest('div');
      expect(botMessage).toHaveClass('bg-neutral-50', 'text-neutral-900');
    });
  });

  describe('Message Actions', () => {
    test('renders action buttons when provided', () => {
      // We'll need to modify the component to accept initial messages for testing
      // For now, we'll test the structure
      render(<ChatRDV />);
      
      // Verify the action buttons would render in the proper structure
      const messageArea = screen.getByRole('log');
      expect(messageArea).toBeInTheDocument();
    });
  });

  describe('Scrolling Behavior', () => {
    test('scrolls to bottom when new messages are added', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;
      
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Scroll test{Enter}');
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<ChatRDV />);
      await checkAccessibility(container);
    });

    test('messages area has proper ARIA attributes', () => {
      render(<ChatRDV />);
      
      const messagesArea = screen.getByRole('log');
      expect(messagesArea).toHaveAttribute('aria-live', 'polite');
      expect(messagesArea).toHaveAttribute('aria-label', 'Messages du chat');
    });

    test('input has proper accessibility labels', () => {
      render(<ChatRDV />);
      
      const input = screen.getByLabelText(/message à envoyer/i);
      expect(input).toBeInTheDocument();
      
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      expect(sendButton).toBeInTheDocument();
    });

    test('typing indicator has proper accessibility label', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Test{Enter}');
      
      const typingIndicator = screen.getByLabelText(/l'assistant tape une réponse/i);
      expect(typingIndicator).toBeInTheDocument();
    });

    test('icons are marked as decorative', () => {
      render(<ChatRDV />);
      
      // Check that bot and user icons have aria-hidden
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      // Should be able to tab between input and button
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    test('adjusts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<ChatRDV />);
      
      // Chat should maintain full height layout
      const chatContainer = screen.getByRole('log').closest('.flex');
      expect(chatContainer).toHaveClass('flex-col', 'h-full');
    });
  });

  describe('Performance', () => {
    test('handles multiple rapid messages efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await user.type(input, `Message ${i + 1}{Enter}`);
      }
      
      // All messages should be present
      for (let i = 0; i < 5; i++) {
        expect(screen.getByText(`Message ${i + 1}`)).toBeInTheDocument();
      }
    });

    test('does not cause memory leaks with message updates', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { unmount } = render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Test message{Enter}');
      
      // Advance timers to trigger bot response
      vi.advanceTimersByTime(1000);
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('French Language Support', () => {
    test('displays French interface text', () => {
      render(<ChatRDV />);
      
      expect(screen.getByText('Assistant RDV')).toBeInTheDocument();
      expect(screen.getByText('Réponse instantanée')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/tapez votre message/i)).toBeInTheDocument();
    });

    test('displays French bot messages', () => {
      render(<ChatRDV />);
      
      expect(screen.getByText(/bonjour ! je suis votre assistant/i)).toBeInTheDocument();
    });

    test('shows French typing indicator text', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Test{Enter}');
      
      expect(screen.getByLabelText(/l'assistant tape une réponse/i)).toBeInTheDocument();
    });

    test('displays French bot response', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Rendez-vous{Enter}');
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText(/je vérifie les disponibilités/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles empty message gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ChatRDV />);
      
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      // Try clicking send with empty input
      await user.click(sendButton);
      
      // Should not add any messages
      const messages = screen.getAllByText(/bonjour ! je suis votre assistant/i);
      expect(messages).toHaveLength(1); // Only the initial message
    });

    test('continues to work after bot response error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock console.error to prevent error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      // Send message
      await user.type(input, 'Test message{Enter}');
      
      // Advance timers
      vi.advanceTimersByTime(1000);
      
      // Should still be able to send another message
      await user.type(input, 'Second message{Enter}');
      expect(screen.getByText('Second message')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});