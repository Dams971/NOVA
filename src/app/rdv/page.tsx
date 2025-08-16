'use client';

import { useState, useEffect, useRef } from 'react';
import '../globals.css';
import '../../styles/nova-design-system.css';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: {
    type: string;
    label: string;
    value: any;
  }[];
}

interface AppointmentData {
  name?: string;
  phone?: string;
  email?: string;
  reason?: string;
  preferredDate?: string;
  preferredTime?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

export default function RDVPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis l\'assistant NOVA. Je vais vous aider à prendre rendez-vous avec un dentiste. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
      actions: [
        { type: 'quick_reply', label: '🦷 Prendre RDV', value: 'appointment' },
        { type: 'quick_reply', label: '🚨 Urgence', value: 'emergency' },
        { type: 'quick_reply', label: '📅 Voir disponibilités', value: 'availability' },
        { type: 'quick_reply', label: 'ℹ️ Informations', value: 'info' }
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({});
  const [currentStep, setCurrentStep] = useState<'welcome' | 'collecting' | 'confirming' | 'completed'>('welcome');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickReply = (value: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: value === 'appointment' ? 'Je souhaite prendre rendez-vous' :
               value === 'emergency' ? 'J\'ai une urgence dentaire' :
               value === 'availability' ? 'Quelles sont les disponibilités ?' :
               'J\'aimerais avoir des informations',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    processUserInput(value);
  };

  const processUserInput = async (input: string) => {
    setIsTyping(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response: Message;
    
    if (input === 'emergency') {
      response = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🚨 Pour une urgence dentaire, appelez immédiatement notre ligne urgence au +213 555 911 911 ou rendez-vous sur notre page urgences.',
        timestamp: new Date(),
        actions: [
          { type: 'link', label: '📞 Appeler Urgences', value: 'tel:+213555911911' },
          { type: 'link', label: '🚑 Page Urgences', value: '/urgences' },
          { type: 'quick_reply', label: '↩️ Retour', value: 'back' }
        ]
      };
    } else if (input === 'appointment' || currentStep === 'collecting') {
      if (!appointmentData.name) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Parfait ! Pour commencer, quel est votre nom complet ?',
          timestamp: new Date()
        };
        setCurrentStep('collecting');
      } else if (!appointmentData.phone) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Merci ! Maintenant, quel est votre numéro de téléphone ? (Format: +213 XXX XXX XXX)',
          timestamp: new Date()
        };
      } else if (!appointmentData.reason) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Pour quelle raison souhaitez-vous consulter ?',
          timestamp: new Date(),
          actions: [
            { type: 'quick_reply', label: 'Contrôle routine', value: 'checkup' },
            { type: 'quick_reply', label: 'Douleur', value: 'pain' },
            { type: 'quick_reply', label: 'Détartrage', value: 'cleaning' },
            { type: 'quick_reply', label: 'Autre', value: 'other' }
          ]
        };
      } else if (!appointmentData.preferredDate) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Quelle date vous conviendrait le mieux ?',
          timestamp: new Date(),
          actions: [
            { type: 'quick_reply', label: 'Cette semaine', value: 'this_week' },
            { type: 'quick_reply', label: 'Semaine prochaine', value: 'next_week' },
            { type: 'quick_reply', label: 'Dans 2 semaines', value: 'two_weeks' }
          ]
        };
      } else {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Parfait ! J'ai trouvé plusieurs créneaux disponibles. Voici le récapitulatif de votre demande :\n\n👤 ${appointmentData.name}\n📞 ${appointmentData.phone}\n🦷 ${appointmentData.reason}\n📅 ${appointmentData.preferredDate}\n\nVoulez-vous confirmer ce rendez-vous ?`,
          timestamp: new Date(),
          actions: [
            { type: 'quick_reply', label: '✅ Confirmer', value: 'confirm' },
            { type: 'quick_reply', label: '✏️ Modifier', value: 'edit' },
            { type: 'quick_reply', label: '❌ Annuler', value: 'cancel' }
          ]
        };
        setCurrentStep('confirming');
      }
    } else if (input === 'confirm') {
      response = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🎉 Votre rendez-vous est confirmé ! Vous recevrez une confirmation par SMS et email. À bientôt chez NOVA !',
        timestamp: new Date(),
        actions: [
          { type: 'quick_reply', label: '🏠 Accueil', value: 'home' },
          { type: 'quick_reply', label: '📅 Nouveau RDV', value: 'appointment' }
        ]
      };
      setCurrentStep('completed');
    } else {
      response = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Comment puis-je vous aider ?',
        timestamp: new Date(),
        actions: [
          { type: 'quick_reply', label: '🦷 Prendre RDV', value: 'appointment' },
          { type: 'quick_reply', label: '🚨 Urgence', value: 'emergency' },
          { type: 'quick_reply', label: '📅 Disponibilités', value: 'availability' }
        ]
      };
    }
    
    setIsTyping(false);
    setMessages(prev => [...prev, response]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Update appointment data based on current step
    if (currentStep === 'collecting') {
      if (!appointmentData.name) {
        setAppointmentData(prev => ({ ...prev, name: inputValue }));
      } else if (!appointmentData.phone) {
        setAppointmentData(prev => ({ ...prev, phone: inputValue }));
      } else if (!appointmentData.reason) {
        setAppointmentData(prev => ({ ...prev, reason: inputValue }));
      } else if (!appointmentData.preferredDate) {
        setAppointmentData(prev => ({ ...prev, preferredDate: inputValue }));
      }
    }
    
    setInputValue('');
    processUserInput(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Calendar data for visual display
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date,
      available: Math.random() > 0.3,
      slots: Math.floor(Math.random() * 5) + 1
    };
  });

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* Header */}
      <header className="header-nova sticky top-0 z-50">
        <div className="container-nova">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--nova-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V12C2 16.5 4.5 20.74 8.5 22.5L12 24L15.5 22.5C19.5 20.74 22 16.5 22 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M12 8V16M8 12H16" stroke="#107ACA" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                  NOVA
                </div>
                <div className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>
                  Prise de RDV
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Accueil
              </Link>
              <Link href="/cabinets" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Cabinets
              </Link>
              <Link href="/services" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Services
              </Link>
              <Link href="/urgences" className="text-[15px] font-medium text-[var(--nova-urgent)]">
                Urgences
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/urgences" className="btn-nova-urgent">
                🚨 Urgence
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="container-nova py-8">
        <div className="grid lg:grid-cols-[60%_40%] gap-8">
          {/* Left Column - Chat Interface */}
          <div className="card-nova" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--nova-border)' }}>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                Assistant de Prise de Rendez-vous
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--nova-text-muted)' }}>
                Réponse instantanée • Disponible 24/7 • 100% sécurisé
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nova-primary-light)' }}>
                          <span>🤖</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Assistant NOVA</span>
                      </div>
                    )}
                    
                    <div className={`rounded-xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-[var(--nova-primary)] text-white' 
                        : 'bg-white border'
                    }`} style={{ 
                      borderColor: message.role === 'assistant' ? 'var(--nova-border)' : undefined 
                    }}>
                      <p className="whitespace-pre-wrap" style={{ 
                        color: message.role === 'user' ? 'white' : 'var(--nova-text-primary)' 
                      }}>
                        {message.content}
                      </p>
                    </div>
                    
                    {/* Quick Reply Actions */}
                    {message.actions && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.actions.map((action, idx) => (
                          action.type === 'quick_reply' ? (
                            <button
                              key={idx}
                              onClick={() => handleQuickReply(action.value)}
                              className="px-3 py-1.5 rounded-full text-sm border transition-all hover:bg-[var(--nova-primary-light)]"
                              style={{ borderColor: 'var(--nova-primary)', color: 'var(--nova-primary)' }}
                            >
                              {action.label}
                            </button>
                          ) : action.type === 'link' ? (
                            <Link
                              key={idx}
                              href={action.value}
                              className="px-3 py-1.5 rounded-full text-sm border transition-all hover:bg-[var(--nova-primary-light)]"
                              style={{ borderColor: 'var(--nova-primary)', color: 'var(--nova-primary)' }}
                            >
                              {action.label}
                            </Link>
                          ) : null
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs mt-1 block" style={{ color: 'var(--nova-text-muted)' }}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-xl px-4 py-3" style={{ borderColor: 'var(--nova-border)' }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--nova-border)' }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  className="input-nova flex-1"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="btn-nova-primary px-6"
                >
                  Envoyer
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--nova-text-muted)' }}>
                💡 Astuce: Utilisez les boutons de réponse rapide pour gagner du temps
              </p>
            </div>
          </div>

          {/* Right Column - Summary & Calendar */}
          <div className="space-y-6">
            {/* Appointment Summary */}
            <div className="card-nova">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                📋 Résumé du Rendez-vous
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Nom</p>
                    <p className="font-medium" style={{ color: 'var(--nova-text-primary)' }}>
                      {appointmentData.name || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Téléphone</p>
                    <p className="font-medium" style={{ color: 'var(--nova-text-primary)' }}>
                      {appointmentData.phone || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🦷</span>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Motif</p>
                    <p className="font-medium" style={{ color: 'var(--nova-text-primary)' }}>
                      {appointmentData.reason || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Date souhaitée</p>
                    <p className="font-medium" style={{ color: 'var(--nova-text-primary)' }}>
                      {appointmentData.preferredDate || 'Non renseigné'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--nova-border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--nova-text-muted)' }}>Progression</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-1 rounded-full ${currentStep !== 'welcome' ? 'bg-[var(--nova-primary)]' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-1 rounded-full ${currentStep === 'confirming' || currentStep === 'completed' ? 'bg-[var(--nova-primary)]' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-1 rounded-full ${currentStep === 'completed' ? 'bg-[var(--nova-primary)]' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="card-nova">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                📅 Créneaux Disponibles
              </h2>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                  <div key={idx} className="text-xs font-medium py-1" style={{ color: 'var(--nova-text-muted)' }}>
                    {day}
                  </div>
                ))}
                
                {calendarDays.slice(0, 28).map((day, idx) => (
                  <button
                    key={idx}
                    className={`
                      aspect-square rounded-lg text-xs font-medium transition-all
                      ${day.available 
                        ? 'hover:bg-[var(--nova-primary-light)] cursor-pointer' 
                        : 'opacity-30 cursor-not-allowed'
                      }
                    `}
                    style={{
                      background: day.available ? 'var(--nova-secondary)' : 'var(--nova-border)',
                      color: day.available ? 'white' : 'var(--nova-text-muted)'
                    }}
                    disabled={!day.available}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: 'var(--nova-secondary)' }}></div>
                  <span style={{ color: 'var(--nova-text-muted)' }}>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: 'var(--nova-border)' }}></div>
                  <span style={{ color: 'var(--nova-text-muted)' }}>Complet</span>
                </div>
              </div>
            </div>

            {/* Clinic Info */}
            <div className="card-nova">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                🏥 Cabinet NOVA
              </h2>
              
              <div className="space-y-2 text-sm">
                <p style={{ color: 'var(--nova-text-secondary)' }}>
                  📍 Cité 109, Daboussy El Achour, Alger
                </p>
                <p style={{ color: 'var(--nova-text-secondary)' }}>
                  📞 +213 555 000 000
                </p>
                <p style={{ color: 'var(--nova-text-secondary)' }}>
                  🕐 Lun-Ven: 9h-19h | Sam: 9h-14h
                </p>
              </div>
              
              <Link href="/cabinets" className="inline-flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: 'var(--nova-primary)' }}>
                Voir tous nos cabinets
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer-nova mt-16">
        <div className="container-nova">
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
              © 2025 NOVA - Service de prise de RDV en ligne sécurisé et disponible 24/7
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}