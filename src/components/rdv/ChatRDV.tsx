import { useState, useRef, useEffect } from 'react';
import { ButtonMedical } from '@/components/ui/nova/ButtonMedical';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  actions?: Action[];
}

interface Action {
  label: string;
  value: string;
  onSelect: () => void;
}

interface ChatRDVProps {
  className?: string;
}

export function ChatRDV({ className }: ChatRDVProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Bonjour ! Je suis votre assistant pour prendre rendez-vous. Comment puis-je vous aider ?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler réponse bot
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Je vérifie les disponibilités pour vous...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-900">Assistant RDV</h3>
        <p className="text-sm text-neutral-500">Réponse instantanée</p>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Messages du chat"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.type === 'user' && "flex-row-reverse"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.type === 'bot' ? "bg-primary-100" : "bg-neutral-100"
            )}>
              {message.type === 'bot' ? (
                <Bot className="w-4 h-4 text-primary-600" aria-hidden="true" />
              ) : (
                <User className="w-4 h-4 text-neutral-700" aria-hidden="true" />
              )}
            </div>
            <div className={cn(
              "flex-1 rounded-medical-small p-3 max-w-xs",
              message.type === 'bot' 
                ? "bg-neutral-50 text-neutral-900" 
                : "bg-primary-600 text-white"
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <time className={cn(
                "text-xs mt-1 block",
                message.type === 'bot' ? "text-neutral-400" : "text-primary-100"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
              {message.actions && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {message.actions.map((action, idx) => (
                    <ButtonMedical
                      key={idx}
                      size="sm"
                      variant="outline"
                      onClick={action.onSelect}
                    >
                      {action.label}
                    </ButtonMedical>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-600" aria-hidden="true" />
            </div>
            <div className="bg-neutral-50 rounded-medical-small p-3">
              <div className="flex gap-1" aria-label="L'assistant tape une réponse">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-neutral-200 rounded-medical-small focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            disabled={isTyping}
            aria-label="Message à envoyer"
          />
          <ButtonMedical
            onClick={handleSend}
            size="md"
            leftIcon={<Send className="w-4 h-4" />}
            disabled={!input.trim() || isTyping}
            aria-label="Envoyer le message"
          >
            <span className="sr-only">Envoyer</span>
          </ButtonMedical>
        </div>
      </div>
    </div>
  );
}