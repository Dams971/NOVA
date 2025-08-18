'use client';

import { Bot, MessageCircle, Settings, Users, Calendar } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import ChatWidget from '@/components/chat/chat-widget';

/**
 * NOVA Chat Demo Page
 * Features:
 * - Accessible chat interface
 * - Keyboard navigation support
 * - ARIA landmarks and roles
 * - Screen reader friendly
 * - Focus management
 */

export default function ChatPage() {
  const [showWidget, setShowWidget] = useState(true);
  const [widgetSettings, setWidgetSettings] = useState({
    tenantId: 'cabinet-1',
    userId: 'demo-user-1',
    userRole: 'patient',
    userEmail: 'demo@example.com',
    cabinetName: 'Cabinet Dentaire Central',
    primaryColor: '#3b82f6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left'
  });

  const businessHours = {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { open: '', close: '' }
  };

  const handleEscalation = useCallback((conversationId: string) => {
    // TODO: Implement proper toast notification system
    alert(`Conversation ${conversationId} escalée vers un conseiller humain`);
  }, []);

  const handleAppointmentBooked = useCallback((appointmentData: Record<string, unknown>) => {
    // TODO: Implement proper toast notification system
    alert(`Rendez-vous confirmé ! ID: ${appointmentData.appointmentId}`);
  }, []);

  const handleSampleConversationClick = useCallback((_example: string) => {
    // TODO: Implement chat widget pre-fill functionality
    // This could trigger the chat widget to pre-fill the message
  }, []);

  const sampleConversations = [
    "Bonjour, je voudrais prendre rendez-vous",
    "Avez-vous des créneaux disponibles demain matin ?",
    "Je voudrais annuler mon rendez-vous",
    "Qui sont vos dentistes ?",
    "Quels sont vos horaires ?",
    "J'ai mal aux dents, c'est urgent !"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Bot className="w-16 h-16 text-blue-600 mr-4" aria-hidden="true" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                NOVA AI Chatbot
              </h1>
              <p className="text-xl text-gray-600">
                Assistant intelligent pour la prise de rendez-vous dentaires
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Features */}
          <section className="lg:col-span-2 space-y-6" aria-label="Fonctionnalités et exemples du chatbot">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-blue-600" aria-hidden="true" />
                Fonctionnalités du Chatbot
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3" role="listitem">
                    <Calendar className="w-5 h-5 text-green-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">Prise de rendez-vous</h3>
                      <p className="text-sm text-gray-600">Réservation automatique avec vérification de disponibilité</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3" role="listitem">
                    <Users className="w-5 h-5 text-blue-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">Support multilingue</h3>
                      <p className="text-sm text-gray-600">Conversation en français avec compréhension naturelle</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3" role="listitem">
                    <Settings className="w-5 h-5 text-purple-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">Gestion intelligente</h3>
                      <p className="text-sm text-gray-600">Annulation, modification et suivi des rendez-vous</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3" role="listitem">
                    <Bot className="w-5 h-5 text-indigo-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">IA Conversationnelle</h3>
                      <p className="text-sm text-gray-600">Compréhension du contexte et réponses personnalisées</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3" role="listitem">
                    <MessageCircle className="w-5 h-5 text-red-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">Escalade automatique</h3>
                      <p className="text-sm text-gray-600">Transfer vers un conseiller humain si nécessaire</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3" role="listitem">
                    <Calendar className="w-5 h-5 text-yellow-500 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900">Urgences dentaires</h3>
                      <p className="text-sm text-gray-600">Détection et prise en charge des urgences</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Conversations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Exemples de conversation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="group" aria-label="Exemples de phrases à tester">
                {sampleConversations.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleConversationClick(example)}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer text-left"
                    aria-label={`Exemple de conversation: ${example}`}
                  >
                    <p className="text-gray-800 text-sm">&quot;{example}&quot;</p>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Comment tester :</h3>
                <ol className="text-sm text-blue-800 space-y-1" role="list">
                  <li role="listitem">1. Cliquez sur l&apos;icône de chat en bas à droite</li>
                  <li role="listitem">2. Attendez la connexion WebSocket</li>
                  <li role="listitem">3. Tapez votre message ou utilisez les suggestions</li>
                  <li role="listitem">4. Suivez les instructions du chatbot</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Settings Panel */}
          <aside className="space-y-6" aria-label="Configuration et statut du chatbot">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" aria-hidden="true" />
                Configuration
              </h2>
              
              <fieldset className="space-y-4">
                <legend className="sr-only">Configuration du widget de chat</legend>
                
                <div>
                  <label htmlFor="cabinet-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Cabinet
                  </label>
                  <select
                    id="cabinet-select"
                    value={widgetSettings.tenantId}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, tenantId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="cabinet-help"
                  >
                    <option value="cabinet-1">Cabinet Dentaire Central</option>
                    <option value="cabinet-2">Clinique Dentaire Nord</option>
                  </select>
                  <p id="cabinet-help" className="sr-only">Sélectionnez le cabinet pour lequel configurer le chatbot</p>
                </div>

                <div>
                  <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle utilisateur
                  </label>
                  <select
                    id="role-select"
                    value={widgetSettings.userRole}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, userRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="role-help"
                  >
                    <option value="patient">Patient</option>
                    <option value="staff">Personnel</option>
                    <option value="manager">Manager</option>
                  </select>
                  <p id="role-help" className="sr-only">Rôle de l&apos;utilisateur qui utilise le chatbot</p>
                </div>

                <div>
                  <label htmlFor="color-picker" className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur principale
                  </label>
                  <input
                    id="color-picker"
                    type="color"
                    value={widgetSettings.primaryColor}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full h-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-describedby="color-help"
                  />
                  <p id="color-help" className="sr-only">Couleur principale du thème du chatbot</p>
                </div>

                <div>
                  <label htmlFor="position-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    id="position-select"
                    value={widgetSettings.position}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, position: e.target.value as 'bottom-right' | 'bottom-left' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="position-help"
                  >
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                  </select>
                  <p id="position-help" className="sr-only">Position du widget de chat sur l&apos;écran</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowWidget(!showWidget)}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      showWidget
                        ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
                        : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                    }`}
                    aria-pressed={showWidget}
                    aria-label={showWidget ? 'Masquer le widget de chat' : 'Afficher le widget de chat'}
                  >
                    {showWidget ? 'Masquer le Chat' : 'Afficher le Chat'}
                  </button>
                </div>
              </fieldset>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Statut des services
              </h2>
              
              <div className="space-y-3" role="status" aria-label="Statut des services Nova">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket Server</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" aria-hidden="true"></div>
                    <span className="text-xs text-gray-500">En attente</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Chat</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></div>
                    <span className="text-xs text-gray-500">Opérationnel</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base de données</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></div>
                    <span className="text-xs text-gray-500">Connectée</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {/* Instructions */}
        <section className="bg-white rounded-lg shadow-lg p-6" aria-labelledby="instructions-title">
          <h2 id="instructions-title" className="text-2xl font-semibold text-gray-900 mb-4">
            Instructions de test
          </h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Cette page permet de tester le chatbot NOVA avec différentes configurations. 
              Le chatbot utilise l&apos;intelligence artificielle pour comprendre les demandes des patients 
              et faciliter la prise de rendez-vous.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="note">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Note importante</h3>
              <p className="text-yellow-700 text-sm">
                Le serveur WebSocket doit être démarré séparément pour utiliser la fonctionnalité temps réel.
                En cas d&apos;échec de connexion WebSocket, le chatbot basculera automatiquement sur l&apos;API HTTP.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Chat Widget */}
      {showWidget && (
        <ChatWidget
          {...widgetSettings}
          businessHours={businessHours}
          minimized={false}
          onEscalation={handleEscalation}
          onAppointmentBooked={handleAppointmentBooked}
          onClose={() => setShowWidget(false)}
        />
      )}
    </div>
  );
}