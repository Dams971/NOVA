'use client';

import { Bot, CalendarDays, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  showCalendar: boolean;
  onToggleCalendar: () => void;
  onResetChat: () => void;
}

export default function ChatHeader({ showCalendar, onToggleCalendar, onResetChat }: ChatHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-nova-blue to-nova-blue-light p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold text-white">
              Assistant Nova IA
            </h1>
            <div className="flex items-center space-x-2 text-white/80 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true" />
              <span>Claude 3.5 Sonnet • Spécialisé RDV dentaires</span>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center space-x-2">
          {!showCalendar && (
            <button
              onClick={onToggleCalendar}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              title="Afficher le calendrier"
              aria-label="Afficher le calendrier"
            >
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={onResetChat}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            title="Nouvelle conversation"
            aria-label="Nouvelle conversation"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}