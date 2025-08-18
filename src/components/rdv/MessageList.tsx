'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Message, QuickAction } from './types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  aiLoading: boolean;
  createLoading: boolean;
  onQuickAction: (action: QuickAction) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({
  messages,
  isTyping,
  aiLoading,
  createLoading,
  onQuickAction,
  messagesEndRef
}: MessageListProps) {
  return (
    <div 
      className="h-[500px] overflow-y-auto p-6 bg-gray-50 relative"
      role="log"
      aria-live="polite"
      aria-label="Messages de conversation"
    >
      {/* Messages avec support IA amélioré */}
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 flex ${
              message.type === 'user' ? 'justify-end' : 
              message.type === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className={`max-w-[80%] ${
              message.type === 'user' ? 'order-2' : ''
            } ${
              message.type === 'system' ? 'max-w-[90%]' : ''
            }`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-nova-blue text-white rounded-br-sm'
                    : message.type === 'system'
                    ? 'bg-green-50 border border-green-200 text-green-800 rounded-lg'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}
                role={message.type === 'system' ? 'status' : undefined}
                aria-label={message.type === 'system' ? 'Message système' : undefined}
              >
                {message.type === 'system' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
                    <span className="font-semibold text-sm">Système</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm md:text-base">
                  {message.content}
                </div>
                
                {/* Informations du rendez-vous créé */}
                {message.appointmentData && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-green-300">
                    <div className="flex items-center space-x-2 text-green-700 text-xs font-medium">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>ID Patient: {(message.appointmentData.patientId as string)?.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions Rapides Améliorées */}
              {message.quickActions && message.quickActions.length > 0 && (
                <div className="mt-3 space-y-2" role="group" aria-label="Actions rapides">
                  {message.quickActions.map((action) => {
                    let buttonClasses = 'w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-all border focus:outline-none focus:ring-2 focus:ring-offset-2';
                    
                    switch (action.type) {
                      case 'urgency':
                        buttonClasses += ' bg-red-50 hover:bg-red-100 text-red-700 border-red-200 focus:ring-red-500';
                        break;
                      case 'care_type':
                        buttonClasses += ' bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 focus:ring-purple-500';
                        break;
                      case 'slot_selection':
                        buttonClasses += ' bg-green-50 hover:bg-green-100 text-green-700 border-green-200 focus:ring-green-500';
                        break;
                      default:
                        buttonClasses += ' bg-blue-50 hover:bg-blue-100 text-nova-blue border-blue-200 focus:ring-blue-500';
                    }
                    
                    return (
                      <motion.button
                        key={action.id}
                        onClick={() => onQuickAction(action)}
                        className={buttonClasses}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={aiLoading || isTyping}
                        aria-label={`Action rapide: ${action.label}`}
                      >
                        <span className="flex items-center space-x-2">
                          {action.icon}
                          <span className="font-medium">{action.label}</span>
                        </span>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Référence pour auto-scroll */}
      <div ref={messagesEndRef} />
      
      {/* Indicateur de frappe amélioré */}
      {(isTyping || aiLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mb-4"
          role="status"
          aria-label={aiLoading ? 'IA en réflexion' : 'Assistant écrit'}
        >
          <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1" aria-hidden="true">
                <motion.div
                  className="w-2 h-2 bg-nova-blue rounded-full"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-nova-blue rounded-full"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-nova-blue rounded-full"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span className="text-xs text-gray-500 ml-2">
                {aiLoading ? 'IA en réflexion...' : 'Assistant écrit...'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Overlay de chargement pour création RDV */}
      {createLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-nova-blue" aria-hidden="true" />
            <p className="text-gray-700 font-medium">Création du rendez-vous...</p>
            <p className="text-sm text-gray-500">Veuillez patienter</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}