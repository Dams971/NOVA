/**
 * NOVA RDV - Page principale avec layout split-screen 60/40
 * Architecture conforme aux spécifications WCAG AAA
 */

'use client'

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
// Import nouveaux composants médicaux
// TODO: Create these components in '@/components/ui/medical'
// import {
//   MedicalButton,
//   MedicalInput, 
//   ChatBubble,
//   PatientSummaryCard,
//   UrgencyBanner,
//   type ChatMessage,
//   type PatientSummaryData,
//   type AppointmentSummary
// } from '@/components/ui/medical'

// Temporary type definitions and component placeholders
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface PatientSummaryData {
  name: string;
  phone: string;
  email?: string;
  appointmentReason?: string;
  preferredDate?: string;
}

interface AppointmentSummary {
  id?: string;
  date?: string;
  time?: string;
  doctor?: string;
  reason?: string;
  status: 'selecting' | 'confirming' | 'confirmed' | 'pending' | 'cancelled';
  currentStep?: number;
  totalSteps?: number;
}

const MedicalButton = 'button' as React.ElementType;
const MedicalInput = 'input' as React.ElementType;
const ChatBubble = 'div' as React.ElementType;
const PatientSummaryCard = 'div' as React.ElementType;
const UrgencyBanner = 'div' as React.ElementType;

/**
 * Interface pour les créneaux disponibles
 */
interface TimeSlot {
  id: string
  date: Date
  time: string
  duration: number
  available: boolean
  practitioner?: string
  type: 'consultation' | 'controle' | 'urgence'
}

/**
 * État de l'application RDV
 */
interface RDVState {
  currentStep: number
  patient: PatientSummaryData
  selectedSlot?: TimeSlot
  chatMessages: ChatMessage[]
  appointment: AppointmentSummary
}

/**
 * Données de démonstration - créneaux disponibles
 */
const sampleSlots: TimeSlot[] = [
  {
    id: '1',
    date: new Date('2024-01-15T14:30:00'),
    time: '14:30',
    duration: 30,
    available: true,
    practitioner: 'Dr. Amina Benali',
    type: 'consultation'
  },
  {
    id: '2', 
    date: new Date('2024-01-15T15:00:00'),
    time: '15:00',
    duration: 30,
    available: true,
    practitioner: 'Dr. Amina Benali',
    type: 'consultation'
  },
  {
    id: '3',
    date: new Date('2024-01-15T16:30:00'),
    time: '16:30',
    duration: 60,
    available: false,
    practitioner: 'Dr. Said Boumediene',
    type: 'controle'
  },
  {
    id: '4',
    date: new Date('2024-01-16T09:00:00'),
    time: '09:00',
    duration: 30,
    available: true,
    practitioner: 'Dr. Amina Benali',
    type: 'consultation'
  }
]

/**
 * Messages initiaux du chatbot
 */
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    text: 'Bienvenue sur NOVA RDV ! Je suis votre assistant pour prendre rendez-vous. Comment vous appelez-vous ?',
    sender: 'bot',
    timestamp: new Date()
  }
]

/**
 * Composant principal de la page RDV
 */
export default function NovaRDVPage() {
  // État principal de l'application
  const [rdvState, setRDVState] = useState<RDVState>({
    currentStep: 1,
    patient: { name: '', phone: '' },
    chatMessages: initialMessages,
    appointment: {
      status: 'selecting',
      currentStep: 1,
      totalSteps: 4
    }
  })
  
  const [showUrgencyBanner, setShowUrgencyBanner] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  
  // Gestion de l'ajout de message
  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: content,
      sender: 'user',
      timestamp: new Date()
    }
    
    setRDVState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage]
    }))
    
    // Simulation réponse bot après 1s
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Parfait ! Merci pour cette information. Maintenant, pouvez-vous me donner votre numéro de téléphone au format +213XXXXXXXXX ?',
        sender: 'bot',
        timestamp: new Date()
      }
      
      setRDVState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, botResponse],
        patient: { ...prev.patient, name: content }
      }))
    }, 1000)
    
    setNewMessage('')
  }, [])
  
  // Gestion de la sélection de suggestion
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    handleSendMessage(suggestion)
  }, [handleSendMessage])
  
  // Gestion de la sélection de créneau
  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    setRDVState(prev => ({
      ...prev,
      selectedSlot: slot,
      appointment: {
        ...prev.appointment,
        selectedSlot: {
          date: slot.date,
          time: slot.time,
          duration: slot.duration,
          type: slot.type,
          practitioner: slot.practitioner
        },
        currentStep: 3,
        status: 'confirming'
      }
    }))
    
    // Ajouter message de confirmation bot
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `Excellent ! J'ai réservé votre créneau pour le ${slot.date.toLocaleDateString('fr-FR')} à ${slot.time}. Veuillez vérifier les détails dans le résumé à droite.`,
      sender: 'bot',
      timestamp: new Date()
    }
    
    setRDVState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, confirmMessage]
    }))
  }, [])
  
  // Gestion de la confirmation finale
  const handleConfirmAppointment = useCallback(() => {
    setRDVState(prev => ({
      ...prev,
      appointment: {
        ...prev.appointment,
        status: 'confirmed',
        currentStep: 4,
        confirmationId: 'NOVA-' + Math.random().toString(36).substr(2, 8).toUpperCase()
      }
    }))
    
    // Message de confirmation final
    const finalMessage: ChatMessage = {
      id: Date.now().toString(),
      text: 'Parfait ! Votre rendez-vous est confirmé. Vous recevrez un SMS de confirmation avec tous les détails.',
      sender: 'bot',
      timestamp: new Date()
    }
    
    setRDVState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, finalMessage]
    }))
  }, [])
  
  // Gestion de l'urgence
  const handleEmergencyCall = useCallback(() => {
    window.location.href = 'tel:+213123456789'
  }, [])
  
  return (
    <div className="min-h-screen bg-medical-gray-50">
      {/* Skip Link pour accessibilité */}
      <a 
        href="#main-content" 
        className="skip-to-content"
      >
        Aller au contenu principal
      </a>
      
      {/* Bannière d'urgence (conditionnelle) */}
      {showUrgencyBanner && (
        <UrgencyBanner
          urgency={{ level: 'urgent' }}
          message="Service d'urgence disponible 24h/24"
          subtitle="Appelez immédiatement si vous avez une urgence médicale"
          actions={[
            {
              label: 'Appeler +213 123 456 789',
              onClick: handleEmergencyCall,
              variant: 'primary'
            }
          ]}
          dismissible
          onDismiss={() => setShowUrgencyBanner(false)}
          fixed
        />
      )}
      
      {/* Header principal */}
      <header className="bg-white border-b border-medical-gray-200 shadow-medical-subtle">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-medical-gray-900">
                NOVA RDV
              </h1>
              <p className="text-sm text-medical-gray-600">
                Votre assistant intelligent pour prendre rendez-vous
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Bouton d'urgence */}
              <MedicalButton
                variant="urgent"
                size="emergency"
                onClick={() => setShowUrgencyBanner(true)}
              >
                🚨 Urgence
              </MedicalButton>
              
              {/* Indicateur d'étape */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-medical-gray-600">Étape</span>
                <span className="font-bold text-medical-blue-600">
                  {rdvState.appointment.currentStep}/{rdvState.appointment.totalSteps}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Layout split-screen principal */}
      <main 
        id="main-content"
        className="max-w-[1440px] mx-auto h-[calc(100vh-140px)] flex gap-6 p-6"
      >
        {/* Panneau gauche - Chat (60%) */}
        <section 
          className="flex-1 bg-white rounded-medical-large shadow-medical-card overflow-hidden flex flex-col"
          style={{ maxWidth: '60%' }}
          aria-label="Interface de chat avec l'assistant"
        >
          <div className="p-6 border-b border-medical-gray-200 bg-medical-blue-50">
            <h2 className="text-lg font-semibold text-medical-gray-900 mb-2">
              Assistant NOVA
            </h2>
            <p className="text-sm text-medical-gray-600">
              Je vous accompagne pour prendre rendez-vous facilement
            </p>
          </div>
          
          {/* Zone de messages */}
          <div 
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ fontSize: 'var(--nova-font-rdv)' }} // 18px pour page RDV
          >
            {rdvState.chatMessages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onSuggestionSelect={handleSuggestionSelect}
                showAvatar
                showTimestamp
              />
            ))}
          </div>
          
          {/* Affichage des créneaux si étape 2 */}
          {rdvState.appointment.currentStep === 2 && (
            <div className="p-6 border-t border-medical-gray-200 bg-medical-gray-50">
              <h3 className="text-md font-semibold text-medical-gray-900 mb-4">
                Créneaux disponibles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {sampleSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      'p-3 rounded-medical-small border cursor-pointer transition-all',
                      slot.available 
                        ? 'border-medical-blue-200 hover:border-medical-blue-600 hover:bg-medical-blue-50'
                        : 'border-medical-gray-200 bg-medical-gray-100 opacity-60 cursor-not-allowed',
                      rdvState.selectedSlot?.id === slot.id && 'ring-3 ring-medical-blue-600 bg-medical-blue-50'
                    )}
                    onClick={() => slot.available && handleSlotSelect(slot)}
                    role="button"
                    tabIndex={slot.available ? 0 : -1}
                    aria-pressed={rdvState.selectedSlot?.id === slot.id}
                    aria-disabled={!slot.available}
                  >
                    <div className="font-medium text-medical-gray-900">
                      {slot.date.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                    <div className="text-lg font-bold text-medical-blue-700">
                      {slot.time}
                    </div>
                    <div className="text-xs text-medical-gray-600">
                      {slot.duration} min • {slot.practitioner}
                    </div>
                    <div className={cn(
                      'inline-block px-2 py-1 rounded-full text-xs font-medium mt-2',
                      slot.type === 'urgence' ? 'bg-medical-red-100 text-medical-red-700' :
                      slot.type === 'controle' ? 'bg-medical-green-100 text-medical-green-700' :
                      'bg-medical-blue-100 text-medical-blue-700'
                    )}>
                      {slot.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Zone de saisie */}
          <div className="p-6 border-t border-medical-gray-200">
            <div className="flex gap-3">
              <MedicalInput
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(newMessage)
                  }
                }}
              />
              <MedicalButton
                variant="primary"
                onClick={() => handleSendMessage(newMessage)}
                disabled={!newMessage.trim()}
              >
                Envoyer
              </MedicalButton>
            </div>
          </div>
        </section>
        
        {/* Panneau droit - Résumé patient (40%) */}
        <aside 
          className="w-2/5 max-w-md"
          aria-label="Résumé du rendez-vous"
        >
          <PatientSummaryCard
            patient={rdvState.patient}
            appointment={rdvState.appointment}
            sticky
            realTimeUpdates
            onConfirm={handleConfirmAppointment}
            onCancel={() => {
              setRDVState(prev => ({
                ...prev,
                selectedSlot: undefined,
                appointment: {
                  ...prev.appointment,
                  status: 'selecting',
                  currentStep: 1,
                  selectedSlot: undefined
                }
              }))
            }}
          />
        </aside>
      </main>
      
      {/* Footer avec informations importantes */}
      <footer className="bg-white border-t border-medical-gray-200 mt-8">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-medical-gray-600">
            <div className="flex items-center gap-4">
              <span>📍 Cité 109, Daboussy El Achour, Alger</span>
              <span>⏰ Zone horaire: Africa/Algiers</span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="tel:+213555000000" 
                className="text-medical-blue-600 hover:underline"
              >
                📞 +213 555 000 000
              </a>
              <span>✉️ contact@nova-rdv.dz</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}