'use client';

import { User, Bot, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import React, { useState, useEffect } from 'react';

/**
 * NOVA Animated Message Components
 * Enhanced message display with animations and interactions
 */

export interface AnimatedMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isNew?: boolean;
  isTyping?: boolean;
  metadata?: {
    intent?: string;
    confidence?: number;
    escalated?: boolean;
    completed?: boolean;
  };
  primaryColor?: string;
  onAnimationComplete?: () => void;
}

export function AnimatedMessage({
  role,
  content,
  timestamp,
  isNew = false,
  isTyping = false,
  metadata,
  primaryColor = '#3b82f6',
  onAnimationComplete
}: AnimatedMessageProps) {
  const [isVisible, setIsVisible] = useState(!isNew);
  const [displayedContent, setDisplayedContent] = useState(isNew ? '' : content);
  const [currentIndex, setCurrentIndex] = useState(isNew ? 0 : content.length);

  const isUser = role === 'user';
  const isSystem = role === 'system';
  const isAssistant = role === 'assistant';

  // Animate message appearance
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (isNew && isAssistant && isVisible) {
      if (currentIndex < content.length) {
        const timer = setTimeout(() => {
          setDisplayedContent(content.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, 30); // Typing speed
        return () => clearTimeout(timer);
      } else {
        onAnimationComplete?.();
      }
    }
  }, [isNew, isAssistant, isVisible, currentIndex, content, onAnimationComplete]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = () => {
    if (isSystem) {
      if (metadata?.escalated) return <Phone className="w-4 h-4 text-orange-600" />;
      if (metadata?.completed) return <CheckCircle className="w-4 h-4 text-green-600" />;
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
    if (isUser) return <User className="w-4 h-4 text-white" />;
    return <Bot className="w-4 h-4 text-gray-600" />;
  };

  const getMessageStyles = () => {
    if (isSystem) {
      return {
        container: 'justify-center',
        wrapper: 'max-w-[90%]',
        bubble: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
        avatar: 'bg-yellow-100'
      };
    }
    
    if (isUser) {
      return {
        container: 'justify-end',
        wrapper: 'flex-row-reverse max-w-[80%]',
        bubble: 'bg-blue-500 text-white',
        avatar: 'bg-blue-500'
      };
    }

    return {
      container: 'justify-start',
      wrapper: 'flex-row max-w-[80%]',
      bubble: 'bg-gray-100 text-gray-900',
      avatar: 'bg-gray-100'
    };
  };

  const styles = getMessageStyles();

  return (
    <div 
      className={`flex ${styles.container} mb-4 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`flex ${styles.wrapper} items-end`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'ml-2' : 'mr-2'
        } ${styles.avatar} shadow-sm`}>
          {getMessageIcon()}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-lg shadow-sm ${styles.bubble} relative`}
            style={isUser ? { backgroundColor: primaryColor } : {}}
          >
            {/* Message Content */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {isNew && isAssistant ? displayedContent : content}
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-current opacity-75 animate-pulse">|</span>
              )}
            </div>

            {/* Metadata indicators */}
            {metadata && (
              <div className="flex items-center justify-between mt-2 text-xs">
                <div className="flex items-center space-x-2">
                  {metadata.intent && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isUser ? 'bg-blue-400 text-blue-100' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {metadata.intent}
                    </span>
                  )}
                  
                  {metadata.confidence !== undefined && (
                    <span className={`text-xs ${
                      isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {Math.round(metadata.confidence * 100)}%
                    </span>
                  )}
                </div>

                {/* Status indicators */}
                <div className="flex items-center space-x-1">
                  {metadata.completed && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {metadata.escalated && <Phone className="w-3 h-3 text-orange-500" />}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(timestamp)}
            </div>

            {/* Speech bubble tail */}
            <div className={`absolute top-4 ${
              isUser ? 'right-0 translate-x-1' : 'left-0 -translate-x-1'
            }`}>
              <div className={`w-3 h-3 rotate-45 ${styles.bubble.split(' ')[0]} border-r border-b ${
                isSystem ? 'border-yellow-200' : isUser ? 'border-blue-500' : 'border-gray-200'
              }`} 
              style={isUser ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicatorMessage({ 
  primaryColor: _primaryColor = '#3b82f6',
  userName = 'Nova' 
}: { 
  primaryColor?: string;
  userName?: string;
}) {
  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex flex-row items-end max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-gray-100">
          <Bot className="w-4 h-4 text-gray-600" />
        </div>

        {/* Typing bubble */}
        <div className="px-4 py-3 bg-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-xs text-gray-500">{userName} écrit...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuggestedRepliesAnimated({
  replies,
  onReplyClick,
  isVisible = true,
  primaryColor: _primaryColor = '#3b82f6'
}: {
  replies: string[];
  onReplyClick: (reply: string) => void;
  isVisible?: boolean;
  primaryColor?: string;
}) {
  const [visibleReplies, setVisibleReplies] = useState<number>(0);

  useEffect(() => {
    if (isVisible && replies.length > 0) {
      replies.forEach((_, index) => {
        setTimeout(() => {
          setVisibleReplies(index + 1);
        }, index * 150); // Stagger animation
      });
    } else {
      setVisibleReplies(0);
    }
  }, [isVisible, replies]);

  if (!isVisible || replies.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap gap-2">
        {replies.slice(0, visibleReplies).map((reply, index) => (
          <button
            key={index}
            onClick={() => onReplyClick(reply)}
            className={`px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 transform hover:scale-105 animate-slide-up border border-gray-200 hover:border-gray-300`}
            style={{ 
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'both'
            }}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageActions({
  onCopy,
  onRegenerate,
  onFeedback,
  isVisible = false
}: {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (positive: boolean) => void;
  isVisible?: boolean;
}) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 text-gray-400 text-xs animate-fade-in">
      {onCopy && (
        <button
          onClick={onCopy}
          className="hover:text-gray-600 transition-colors"
          title="Copier"
        >
          📋
        </button>
      )}
      
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="hover:text-gray-600 transition-colors"
          title="Régénérer"
        >
          🔄
        </button>
      )}
      
      {onFeedback && (
        <div className="flex space-x-1">
          <button
            onClick={() => onFeedback(true)}
            className="hover:text-green-600 transition-colors"
            title="Utile"
          >
            👍
          </button>
          <button
            onClick={() => onFeedback(false)}
            className="hover:text-red-600 transition-colors"
            title="Pas utile"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}

// CSS animations (to be added to global styles)
export const messageAnimationStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slide-up 0.4s ease-out forwards;
  }
`;

export default AnimatedMessage;