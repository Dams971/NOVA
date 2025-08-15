'use client';

import React, { useState } from 'react';
import ChatWidget from '@/components/chat/chat-widget';
import { Bot, MessageCircle, Settings, Users, Calendar } from 'lucide-react';

/**
 * NOVA Chat Demo Page
 * Test page for the AI chatbot functionality
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
    position: 'bottom-right' as const
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

  const handleEscalation = (conversationId: string) => {
    console.log('Escalation triggered:', conversationId);
    alert(`Conversation ${conversationId} escalée vers un conseiller humain`);
  };

  const handleAppointmentBooked = (appointmentData: any) => {
    console.log('Appointment booked:', appointmentData);
    alert(`Rendez-vous confirmé ! ID: ${appointmentData.appointmentId}`);
  };

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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Bot className="w-16 h-16 text-blue-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                NOVA AI Chatbot
              </h1>
              <p className="text-xl text-gray-600">
                Assistant intelligent pour la prise de rendez-vous dentaires
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Features */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                Fonctionnalités du Chatbot
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Prise de rendez-vous</h3>
                      <p className="text-sm text-gray-600">Réservation automatique avec vérification de disponibilité</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Support multilingue</h3>
                      <p className="text-sm text-gray-600">Conversation en français avec compréhension naturelle</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Settings className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Gestion intelligente</h3>
                      <p className="text-sm text-gray-600">Annulation, modification et suivi des rendez-vous</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-indigo-500 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">IA Conversationnelle</h3>
                      <p className="text-sm text-gray-600">Compréhension du contexte et réponses personnalisées</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="w-5 h-5 text-red-500 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Escalade automatique</h3>
                      <p className="text-sm text-gray-600">Transfer vers un conseiller humain si nécessaire</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-yellow-500 mt-1" />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleConversations.map((example, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <p className="text-gray-800 text-sm">"{example}"</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Comment tester :</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Cliquez sur l'icône de chat en bas à droite</li>
                  <li>2. Attendez la connexion WebSocket</li>
                  <li>3. Tapez votre message ou utilisez les suggestions</li>
                  <li>4. Suivez les instructions du chatbot</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cabinet
                  </label>
                  <select
                    value={widgetSettings.tenantId}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, tenantId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cabinet-1">Cabinet Dentaire Central</option>
                    <option value="cabinet-2">Clinique Dentaire Nord</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle utilisateur
                  </label>
                  <select
                    value={widgetSettings.userRole}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, userRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="patient">Patient</option>
                    <option value="staff">Personnel</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur principale
                  </label>
                  <input
                    type="color"
                    value={widgetSettings.primaryColor}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full h-10 rounded-md border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={widgetSettings.position}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, position: e.target.value as 'bottom-right' | 'bottom-left' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowWidget(!showWidget)}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                      showWidget
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {showWidget ? 'Masquer le Chat' : 'Afficher le Chat'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Statut des services
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket Server</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">En attente</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Chat</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">Opérationnel</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base de données</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">Connectée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Instructions de test
          </h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Cette page permet de tester le chatbot NOVA avec différentes configurations. 
              Le chatbot utilise l'intelligence artificielle pour comprendre les demandes des patients 
              et faciliter la prise de rendez-vous.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Note importante</h3>
              <p className="text-yellow-700 text-sm">
                Le serveur WebSocket doit être démarré séparément pour utiliser la fonctionnalité temps réel.
                En cas d'échec de connexion WebSocket, le chatbot basculera automatiquement sur l'API HTTP.
              </p>
            </div>
          </div>
        </div>
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