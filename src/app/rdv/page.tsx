'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal.styled';
import SignupModal from '@/components/auth/SignupModal.styled';
import Navigation from '@/components/landing/Navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppointmentAI, useCreateAppointment } from '@/hooks/useAppointments';
import AppointmentCalendar from '@/components/rdv/AppointmentCalendar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, MessageCircle, Bot, Sparkles,
  ChevronRight, Star, Shield, Zap, Heart, Navigation as NavigationIcon, Target, Activity,
  AlertCircle, CheckCircle2, ArrowRight, Send, Mic, Paperclip, Smile,
  TrendingDown, Globe, Award, Users, ChevronDown, Play, CalendarDays, Loader2,
  X, Check, AlertTriangle, Info, RefreshCw
} from 'lucide-react';

// =============================================
// TYPES ET INTERFACES
// =============================================

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  quickActions?: QuickAction[];
  aiResponse?: any;
  appointmentData?: any;
}

interface QuickAction {
  id: string;
  label: string;
  type: 'location' | 'distance' | 'care_type' | 'urgency' | 'confirmation' | 'slot_selection';
  value: any;
  icon?: React.ReactNode;
  careType?: string;
}

interface AppointmentFormData {
  patient: {
    firstName: string;
    lastName: string;
    phoneE164: string;
    email?: string;
    gdprConsent: boolean;
  };
  appointment: {
    careType: string;
    date: string;
    time: string;
    reason?: string;
  };
}

// Configuration des types de soins NOVA
const careTypes = [
  { id: 'consultation', label: 'Consultation générale', icon: '🩺', color: 'blue', duration: 30, price: 3000 },
  { id: 'urgence', label: 'Urgence dentaire', icon: '🚨', color: 'red', duration: 20, price: 4000 },
  { id: 'detartrage', label: 'Détartrage', icon: '✨', color: 'purple', duration: 45, price: 5000 },
  { id: 'soin', label: 'Soin de carie', icon: '🦷', color: 'green', duration: 60, price: 8000 },
  { id: 'extraction', label: 'Extraction', icon: '🔧', color: 'orange', duration: 30, price: 6000 },
  { id: 'prothese', label: 'Prothèse', icon: '🦷', color: 'pink', duration: 90, price: 25000 },
  { id: 'orthodontie', label: 'Orthodontie', icon: '⚙️', color: 'cyan', duration: 45, price: 15000 },
  { id: 'chirurgie', label: 'Chirurgie orale', icon: '🔪', color: 'red', duration: 120, price: 50000 }
];

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function RDVPageNova() {
  // Hooks d'authentification et WebSocket
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isConnected: wsConnected, connect: wsConnect } = useWebSocket({ autoConnect: false });
  
  // États de l'interface de chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  
  // États de l'assistant IA et rendez-vous
  const sessionId = useRef(`rdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const { response: aiResponse, loading: aiLoading, processMessage } = useAppointmentAI(sessionId.current);
  const { createAppointment, loading: createLoading } = useCreateAppointment();
  
  // États du formulaire de rendez-vous
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCareType, setSelectedCareType] = useState<string>('consultation');
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  
  // Référence pour scroll automatique
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // =============================================
  // FONCTIONS UTILITAIRES
  // =============================================
  
  const generateUniqueId = useCallback((type: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter;
    setMessageIdCounter(prev => prev + 1);
    return `${type}_${timestamp}_${counter}_${random}`;
  }, [messageIdCounter]);

  const addBotMessage = useCallback((content: string, suggestions?: string[], quickActions?: QuickAction[], aiResponse?: any) => {
    const newMessage: Message = {
      id: generateUniqueId('bot'),
      type: 'bot',
      content,
      timestamp: new Date(),
      suggestions,
      quickActions,
      aiResponse
    };
    setMessages(prev => [...prev, newMessage]);
  }, [generateUniqueId]);

  const addUserMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: generateUniqueId('user'),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, [generateUniqueId]);
  
  const addSystemMessage = useCallback((content: string, type: 'success' | 'error' | 'info' = 'info', appointmentData?: any) => {
    const newMessage: Message = {
      id: generateUniqueId('system'),
      type: 'system',
      content,
      timestamp: new Date(),
      appointmentData
    };
    setMessages(prev => [...prev, newMessage]);
  }, [generateUniqueId]);

  // =============================================
  // GESTION DES MESSAGES IA
  // =============================================
  
  // Traiter un message utilisateur avec l'IA
  const handleAIMessage = useCallback(async (message: string) => {
    setIsTyping(true);
    
    try {
      const response = await processMessage(message, {
        phone: user?.phone,
        name: user ? `${user.firstName} ${user.lastName}` : undefined,
        patientId: user?.id
      });
      
      if (response) {
        let botContent = '';
        let quickActions: QuickAction[] = [];
        
        switch (response.action) {
          case 'FIND_SLOTS':
            botContent = response.clarification_question || 'Voici les créneaux disponibles pour votre demande :';
            if (response.available_slots && response.available_slots.length > 0) {
              quickActions = response.available_slots.slice(0, 3).map((slot, index) => ({
                id: `slot_${index}`,
                label: new Date(slot.start_iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                type: 'slot_selection',
                value: slot,
                icon: <Clock className="w-4 h-4" />,
                careType: response.care_type
              }));
              quickActions.push({
                id: 'view_calendar',
                label: 'Voir le calendrier',
                type: 'confirmation',
                value: 'show_calendar',
                icon: <CalendarDays className="w-4 h-4" />
              });
            }
            break;
            
          case 'CREATE':
            if (response.patient && response.slot) {
              botContent = 'Parfait ! Je résume votre demande :';
              quickActions = [
                {
                  id: 'confirm_appointment',
                  label: 'Confirmer le RDV',
                  type: 'confirmation',
                  value: 'confirm',
                  icon: <CheckCircle2 className="w-4 h-4" />
                },
                {
                  id: 'modify_appointment',
                  label: 'Modifier',
                  type: 'confirmation',
                  value: 'modify',
                  icon: <Calendar className="w-4 h-4" />
                }
              ];
            }
            break;
            
          case 'NEED_INFO':
            botContent = response.clarification_question || 'J’ai besoin de plus d’informations pour vous aider.';
            if (response.missing_fields?.includes('care_type')) {
              quickActions = careTypes.slice(0, 4).map(care => ({
                id: care.id,
                label: care.label,
                type: 'care_type',
                value: care.id,
                icon: <span className="text-lg">{care.icon}</span>
              }));
            }
            break;
            
          default:
            botContent = response.clarification_question || 'Comment puis-je vous aider avec votre rendez-vous ?';
        }
        
        addBotMessage(botContent, [], quickActions, response);
      }
    } catch (error) {
      console.error('Erreur IA:', error);
      addBotMessage('Désolé, une erreur s’est produite. Pouvez-vous réessayer ?');
    } finally {
      setIsTyping(false);
    }
  }, [processMessage, user, addBotMessage]);
  
  // Initialisation du message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage = isAuthenticated && user
          ? `Bonjour ${user.firstName} ! 👋 Je suis Nova, votre assistant IA spécialisé dans la prise de rendez-vous dentaires. Comment puis-je vous aider ?`
          : "Bienvenue chez Nova ! 🦷 Je suis votre assistant IA disponible 24/7 pour vous aider à prendre rendez-vous. Adresse: Cité 109, Daboussy El Achour, Alger.";
        
        const quickActions: QuickAction[] = [
          { 
            id: 'appointment', 
            label: 'Prendre RDV', 
            type: 'confirmation', 
            value: 'start_booking',
            icon: <Calendar className="w-4 h-4" />
          },
          { 
            id: 'emergency', 
            label: 'Urgence', 
            type: 'urgency', 
            value: 'emergency',
            icon: <AlertCircle className="w-4 h-4" />
          },
          { 
            id: 'calendar', 
            label: 'Voir calendrier', 
            type: 'confirmation', 
            value: 'show_calendar',
            icon: <CalendarDays className="w-4 h-4" />
          },
          { 
            id: 'info', 
            label: 'Informations', 
            type: 'confirmation', 
            value: 'show_info',
            icon: <Info className="w-4 h-4" />
          }
        ];
        
        addBotMessage(welcomeMessage, [], quickActions);
      }, 800);
    }
  }, [messages.length, isAuthenticated, user, addBotMessage]);
  
  // Connexion WebSocket pour utilisateurs authentifiés
  useEffect(() => {
    if (isAuthenticated && !wsConnected) {
      const token = localStorage.getItem('accessToken');
      if (token) wsConnect();
    }
  }, [isAuthenticated, wsConnected, wsConnect]);

  // =============================================
  // GESTION DES ACTIONS RAPIDES
  // =============================================
  
  const handleQuickAction = useCallback(async (action: QuickAction) => {
    addUserMessage(action.label);
    
    switch (action.type) {
      case 'confirmation':
        if (action.value === 'start_booking') {
          await handleAIMessage('Je souhaite prendre un rendez-vous');
        } else if (action.value === 'show_calendar') {
          setShowCalendar(true);
          addBotMessage('Voici notre calendrier de disponibilités. Sélectionnez la date et l’heure qui vous conviennent.');
        } else if (action.value === 'show_info') {
          addBotMessage(
            'Cabinet Nova - Informations pratiques :\n\n📍 Adresse: Cité 109, Daboussy El Achour, Alger\n🕰 Horaires: Lun-Ven 8h-18h, Sam 8h-13h\n📞 Téléphone: +213[567]XXXXXXXX\n🏥 Tous nos soins dentaires sous un même toit',
            [],
            [{
              id: 'book_now',
              label: 'Prendre RDV maintenant',
              type: 'confirmation',
              value: 'start_booking',
              icon: <Calendar className="w-4 h-4" />
            }]
          );
        } else if (action.value === 'confirm') {
          // Confirmer un rendez-vous via l'IA
          await handleCreateAppointmentFromAI();
        }
        break;
        
      case 'urgency':
        if (action.value === 'emergency') {
          await handleAIMessage('J’ai une urgence dentaire, j’ai besoin d’un rendez-vous rapidement');
        } else {
          await handleAIMessage(`J’ai une urgence: ${action.label}`);
        }
        break;
        
      case 'care_type':
        setSelectedCareType(action.value);
        await handleAIMessage(`Je souhaite un rendez-vous pour: ${action.label}`);
        break;
        
      case 'slot_selection':
        // Sélection directe d'un créneau
        const slot = action.value;
        const slotDate = new Date(slot.start_iso);
        const careTypeLabel = careTypes.find(c => c.id === (action.careType || selectedCareType))?.label || 'Consultation';
        
        addBotMessage(
          `Excellent ! Vous avez choisi :\n\n📅 ${slotDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n🕰 ${slotDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n🦷 ${careTypeLabel}\n\nPour finaliser, j’ai besoin de vos coordonnées:`,
          [],
          [{
            id: 'provide_details',
            label: 'Remplir mes informations',
            type: 'confirmation',
            value: 'show_form',
            icon: <User className="w-4 h-4" />
          }]
        );
        
        // Préparer les données du formulaire
        setAppointmentForm({
          patient: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phoneE164: user?.phone || '',
            email: user?.email,
            gdprConsent: false
          },
          appointment: {
            careType: action.careType || selectedCareType,
            date: slot.start_iso.split('T')[0],
            time: slotDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            reason: `${careTypeLabel} - Prise de rendez-vous via assistant IA`
          }
        });
        break;
        
      default:
        await handleAIMessage(action.label);
    }
  }, [addUserMessage, handleAIMessage, selectedCareType, user, addBotMessage]);

  // Création de rendez-vous depuis les données IA
  const handleCreateAppointmentFromAI = useCallback(async () => {
    if (!aiResponse || !aiResponse.patient || !aiResponse.slot) {
      addBotMessage('Désolé, il manque des informations pour créer le rendez-vous.');
      return;
    }
    
    try {
      const patientData = {
        firstName: aiResponse.patient.name.split(' ')[0],
        lastName: aiResponse.patient.name.split(' ').slice(1).join(' ') || 'Patient',
        phoneE164: aiResponse.patient.phone_e164,
        email: aiResponse.patient.email,
        communicationMethod: 'sms' as const,
        reminderEnabled: true,
        gdprConsent: {
          dataProcessing: { consent: true, date: new Date().toISOString() }
        }
      };
      
      const appointmentData = {
        careType: aiResponse.care_type as any || 'consultation',
        scheduledAt: aiResponse.slot.start_iso,
        durationMinutes: aiResponse.slot.duration_minutes || 30,
        title: `${aiResponse.care_type || 'Consultation'} - ${aiResponse.patient.name}`,
        description: aiResponse.reason,
        reason: aiResponse.reason,
        aiSessionId: sessionId.current,
        originalMessage: messages.find(m => m.type === 'user')?.content
      };
      
      const result = await createAppointment(patientData, appointmentData);
      
      if (result) {
        addSystemMessage(
          `✅ Rendez-vous confirmé !\n\nVotre rendez-vous a été créé avec succès.\nRéférence: ${result.appointmentId.slice(-8).toUpperCase()}\n\nVous recevrez une confirmation par SMS.`,
          'success',
          result
        );
      }
    } catch (error) {
      console.error('Erreur création RDV:', error);
      addBotMessage('Une erreur s’est produite lors de la création du rendez-vous. Pouvez-vous réessayer ?');
    }
  }, [aiResponse, createAppointment, messages, addSystemMessage, addBotMessage]);
  
  // Envoyer un message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue;
    setInputValue('');
    addUserMessage(message);
    
    await handleAIMessage(message);
  }, [inputValue, addUserMessage, handleAIMessage]);
  
  // Gestion de la touche Entrée
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Sélection d'un créneau depuis le calendrier
  const handleSlotSelect = useCallback((slot: any) => {
    setShowCalendar(false);
    const slotDate = new Date(slot.startTime);
    const careTypeData = careTypes.find(c => c.id === selectedCareType);
    
    addBotMessage(
      `Parfait ! Vous avez sélectionné :\n\n📅 ${slotDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n🕰 ${slot.time}\n🦷 ${careTypeData?.label}\n💰 ${careTypeData?.price} DA\n\nVeuillez confirmer vos informations:`,
      [],
      [{
        id: 'show_form',
        label: 'Confirmer mes informations',
        type: 'confirmation',
        value: 'show_form',
        icon: <CheckCircle2 className="w-4 h-4" />
      }]
    );
    
    setAppointmentForm({
      patient: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phoneE164: user?.phone || '',
        email: user?.email,
        gdprConsent: false
      },
      appointment: {
        careType: selectedCareType,
        date: slot.date,
        time: slot.time,
        reason: `${careTypeData?.label} - Réservation via calendrier`
      }
    });
    
    setShowAppointmentForm(true);
  }, [selectedCareType, user, addBotMessage]);

  // =============================================
  // RENDU PRINCIPAL
  // =============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-nova-blue via-nova-blue-light to-nova-blue-dark">
      {/* Navigation */}
      <Navigation />

      {/* Section Hero optimisée RDV */}
      <section className="relative overflow-hidden">
        {/* Éléments décoratifs animés */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Header Content */}
        <div className="relative z-10 pt-32 pb-12">
          <div className="container-custom">
            <motion.div
              className="text-center text-white mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Assistant disponible 24/7</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
                Assistant IA{' '}
                <span className="relative">
                  Nova
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                Prenez rendez-vous en <span className="font-semibold text-yellow-400">langage naturel</span> avec notre IA spécialisée
              </p>

              {/* Trust indicators */}
              <div className="flex justify-center space-x-8 mt-8">
                <div className="flex items-center space-x-2 text-white/80">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">100% Sécurisé</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm">Instantané</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm">IA Avancée</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interface Chat Principale */}
      <div className="relative z-10 -mt-8 pb-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Interface de Chat IA */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* En-tête du Chat IA */}
                <div className="bg-gradient-to-r from-nova-blue to-nova-blue-light p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-heading font-semibold text-white">Assistant Nova IA</h3>
                        <div className="flex items-center space-x-2 text-white/80 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Claude 3.5 Sonnet • Spécialisé RDV dentaires</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex items-center space-x-2">
                      {!showCalendar && (
                        <button
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                          title="Afficher le calendrier"
                        >
                          <CalendarDays className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMessages([]);
                          setShowCalendar(false);
                          setShowAppointmentForm(false);
                        }}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        title="Nouvelle conversation"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zone des Messages */}
                <div className="h-[500px] overflow-y-auto p-6 bg-gray-50 relative">
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
                          >
                            {message.type === 'system' && (
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
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
                                  <Calendar className="w-4 h-4" />
                                  <span>ID Patient: {message.appointmentData.patientId.slice(-8).toUpperCase()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions Rapides Améliorées */}
                          {message.quickActions && message.quickActions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.quickActions.map((action) => {
                                let buttonClasses = 'w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-all border';
                                
                                switch (action.type) {
                                  case 'urgency':
                                    buttonClasses += ' bg-red-50 hover:bg-red-100 text-red-700 border-red-200';
                                    break;
                                  case 'care_type':
                                    buttonClasses += ' bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200';
                                    break;
                                  case 'slot_selection':
                                    buttonClasses += ' bg-green-50 hover:bg-green-100 text-green-700 border-green-200';
                                    break;
                                  default:
                                    buttonClasses += ' bg-blue-50 hover:bg-blue-100 text-nova-blue border-blue-200';
                                }
                                
                                return (
                                  <motion.button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    className={buttonClasses}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={aiLoading || isTyping}
                                  >
                                    <span className="flex items-center space-x-2">
                                      {action.icon}
                                      <span className="font-medium">{action.label}</span>
                                    </span>
                                    <ChevronRight className="w-4 h-4" />
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
                    >
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
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
                        <Loader2 className="w-8 h-8 animate-spin text-nova-blue" />
                        <p className="text-gray-700 font-medium">Création du rendez-vous...</p>
                        <p className="text-sm text-gray-500">Veuillez patienter</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Zone de Saisie Améliorée */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Décrivez votre besoin: 'J'ai mal aux dents, je veux un RDV urgent' ou 'Consultation de contrôle mardi matin'..."
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-nova-blue transition-all resize-none min-h-[48px] max-h-[120px]"
                        rows={1}
                        disabled={aiLoading || isTyping || createLoading}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                    
                    <motion.button
                      onClick={handleSendMessage}
                      className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                        inputValue.trim() && !aiLoading && !isTyping && !createLoading
                          ? 'bg-nova-blue text-white hover:bg-nova-blue-dark shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                      whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                      disabled={!inputValue.trim() || aiLoading || isTyping || createLoading}
                    >
                      {aiLoading || isTyping ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Suggestions Intelligentes */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      'J’ai mal aux dents, RDV urgent',
                      'Consultation de contrôle',
                      'Détartrage la semaine prochaine',
                      'RDV orthodontie pour mon enfant',
                      'Combien coûte une extraction ?',
                      'Vos horaires d’ouverture'
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInputValue(suggestion);
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-nova-blue hover:text-white rounded-full text-gray-600 transition-all transform hover:scale-105"
                        disabled={aiLoading || isTyping || createLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Barre Latérale Améliorée */}
            <div className="space-y-6">
              {/* Calendrier intégré */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="p-4 bg-nova-blue text-white flex items-center justify-between">
                      <h3 className="font-heading font-semibold">Calendrier</h3>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <AppointmentCalendar
                      careType={selectedCareType as any}
                      onSlotSelect={handleSlotSelect}
                      compact={true}
                      className="border-0 shadow-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Types de Soins */}
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Types de soins
                </h3>
                <div className="space-y-2">
                  {careTypes.slice(0, 6).map((care) => (
                    <button
                      key={care.id}
                      onClick={() => {
                        setSelectedCareType(care.id);
                        handleAIMessage(`Je souhaite un rendez-vous pour: ${care.label}`);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                        selectedCareType === care.id
                          ? 'bg-nova-blue text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      disabled={aiLoading || isTyping}
                    >
                      <span className="flex items-center space-x-3">
                        <span className="text-xl">{care.icon}</span>
                        <div className="text-left">
                          <div className={`font-medium ${
                            selectedCareType === care.id ? 'text-white' : 'text-gray-700'
                          }`}>
                            {care.label}
                          </div>
                          <div className={`text-xs ${
                            selectedCareType === care.id ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            {care.duration}min • {care.price.toLocaleString()} DA
                          </div>
                        </div>
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-colors ${
                        selectedCareType === care.id 
                          ? 'text-white' 
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Statistiques IA */}
              <motion.div
                className="bg-gradient-to-br from-nova-blue to-nova-blue-light rounded-2xl p-6 text-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-heading font-semibold mb-4">Assistant IA</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold font-heading">Claude</div>
                    <div className="text-sm text-white/80">3.5 Sonnet</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading">24/7</div>
                    <div className="text-sm text-white/80">Disponible</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading">99%</div>
                    <div className="text-sm text-white/80">Précision</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading">&lt;3s</div>
                    <div className="text-sm text-white/80">Réponse</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Bot className="w-4 h-4" />
                    <span>Spécialisé en RDV dentaires</span>
                  </div>
                </div>
              </motion.div>

              {/* Informations Pratiques */}
              <motion.div
                className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-nova-blue mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cabinet Nova</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-nova-blue" />
                        <span>Cité 109, Daboussy El Achour</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-nova-blue" />
                        <span>Lun-Ven 8h-18h, Sam 8h-13h</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-nova-blue" />
                        <span>+213[567]XXXXXXXX</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAIMessage('Je veux plus d’informations sur votre cabinet')}
                      className="mt-3 text-sm font-medium text-nova-blue hover:underline"
                      disabled={aiLoading || isTyping}
                    >
                      Plus d’informations →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales et Overlays */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
      
      {/* Formulaire de Rendez-vous Modal */}
      <AnimatePresence>
        {showAppointmentForm && appointmentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAppointmentForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-semibold text-gray-900">
                  Confirmer le RDV
                </h3>
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <AppointmentFormContent
                formData={appointmentForm}
                onSubmit={async (data) => {
                  try {
                    const result = await createAppointment(data.patient, {
                      careType: data.appointment.careType as any,
                      scheduledAt: `${data.appointment.date}T${data.appointment.time}:00`,
                      title: `${careTypes.find(c => c.id === data.appointment.careType)?.label} - ${data.patient.firstName} ${data.patient.lastName}`,
                      reason: data.appointment.reason,
                      durationMinutes: careTypes.find(c => c.id === data.appointment.careType)?.duration || 30
                    });
                    
                    if (result) {
                      setShowAppointmentForm(false);
                      addSystemMessage(
                        `✅ Rendez-vous confirmé !\n\nVotre RDV a été créé avec succès.\nRéf: ${result.appointmentId.slice(-8).toUpperCase()}\n\nConfirmation par SMS en cours...`,
                        'success',
                        result
                      );
                    }
                  } catch (error) {
                    console.error('Erreur:', error);
                    addBotMessage('Une erreur s’est produite. Veuillez réessayer.');
                  }
                }}
                onCancel={() => setShowAppointmentForm(false)}
                loading={createLoading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// COMPOSANT FORMULAIRE RENDEZ-VOUS
// =============================================

function AppointmentFormContent({
  formData,
  onSubmit,
  onCancel,
  loading
}: {
  formData: AppointmentFormData;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(formData);
  
  const careTypeData = careTypes.find(c => c.id === form.appointment.careType);
  
  return (
    <div className="space-y-4">
      {/* Résumé du RDV */}
      <div className="bg-nova-blue/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Votre rendez-vous</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(`${form.appointment.date}T${form.appointment.time}`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{form.appointment.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{careTypeData?.icon}</span>
            <span>{careTypeData?.label} ({careTypeData?.duration}min)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{careTypeData?.price.toLocaleString()} DA</span>
          </div>
        </div>
      </div>
      
      {/* Informations patient */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Vos informations</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Prénom"
            value={form.patient.firstName}
            onChange={(e) => setForm(prev => ({
              ...prev,
              patient: { ...prev.patient, firstName: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
            required
          />
          <input
            type="text"
            placeholder="Nom"
            value={form.patient.lastName}
            onChange={(e) => setForm(prev => ({
              ...prev,
              patient: { ...prev.patient, lastName: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
            required
          />
        </div>
        
        <input
          type="tel"
          placeholder="Téléphone (+213XXXXXXXXX)"
          value={form.patient.phoneE164}
          onChange={(e) => setForm(prev => ({
            ...prev,
            patient: { ...prev.patient, phoneE164: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
          pattern="^\+213[567]\d{8}$"
          required
        />
        
        <input
          type="email"
          placeholder="Email (optionnel)"
          value={form.patient.email || ''}
          onChange={(e) => setForm(prev => ({
            ...prev,
            patient: { ...prev.patient, email: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
        />
        
        <textarea
          placeholder="Motif ou précisions (optionnel)"
          value={form.appointment.reason || ''}
          onChange={(e) => setForm(prev => ({
            ...prev,
            appointment: { ...prev.appointment, reason: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue resize-none"
          rows={2}
        />
      </div>
      
      {/* Consentement RGPD */}
      <label className="flex items-start space-x-2 text-sm">
        <input
          type="checkbox"
          checked={form.patient.gdprConsent}
          onChange={(e) => setForm(prev => ({
            ...prev,
            patient: { ...prev.patient, gdprConsent: e.target.checked }
          }))}
          className="mt-1 h-4 w-4 text-nova-blue focus:ring-nova-blue border-gray-300 rounded"
          required
        />
        <span className="text-gray-600">
          J'accepte le traitement de mes données personnelles pour la prise de rendez-vous (requis)
        </span>
      </label>
      
      {/* Boutons d'action */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          onClick={() => onSubmit({
            patient: {
              ...form.patient,
              gdprConsent: {
                dataProcessing: { consent: form.patient.gdprConsent, date: new Date().toISOString() }
              }
            },
            appointment: form.appointment
          })}
          disabled={loading || !form.patient.firstName || !form.patient.lastName || !form.patient.phoneE164 || !form.patient.gdprConsent}
          className="flex-1 px-4 py-2 bg-nova-blue text-white rounded-lg hover:bg-nova-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmer le RDV</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}