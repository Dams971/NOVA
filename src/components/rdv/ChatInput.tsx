'use client';

import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}

const suggestions = [
  "J'ai mal aux dents, RDV urgent",
  'Consultation de contrôle',
  'Détartrage la semaine prochaine',
  'RDV orthodontie pour mon enfant',
  'Combien coûte une extraction ?',
  "Vos horaires d'ouverture"
];

export default function ChatInput({ onSendMessage, disabled, loading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || disabled) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  }, [inputValue, disabled, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => {
      onSendMessage(suggestion);
      setInputValue('');
    }, 100);
  }, [onSendMessage]);

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Message à l'assistant IA
          </label>
          <textarea
            id="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Décrivez votre besoin: 'J'ai mal aux dents, je veux un RDV urgent' ou 'Consultation de contrôle mardi matin'..."
            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-nova-blue transition-all resize-none min-h-[48px] max-h-[120px]"
            rows={1}
            disabled={disabled}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            aria-label="Saisissez votre message pour l'assistant IA"
          />
        </div>
        
        <motion.button
          onClick={handleSendMessage}
          className={`p-3 rounded-xl transition-all flex items-center justify-center ${
            inputValue.trim() && !disabled
              ? 'bg-nova-blue text-white hover:bg-nova-blue-dark shadow-lg focus:outline-none focus:ring-2 focus:ring-nova-blue focus:ring-offset-2'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          whileHover={inputValue.trim() && !disabled ? { scale: 1.05 } : {}}
          whileTap={inputValue.trim() && !disabled ? { scale: 0.95 } : {}}
          disabled={!inputValue.trim() || disabled}
          aria-label={loading ? 'Envoi en cours' : 'Envoyer le message'}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-5 h-5" aria-hidden="true" />
          )}
        </motion.button>
      </div>
      
      {/* Suggestions Intelligentes */}
      <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Suggestions de messages">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-nova-blue hover:text-white rounded-full text-gray-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-nova-blue focus:ring-offset-1"
            disabled={disabled}
            aria-label={`Suggestion: ${suggestion}`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}