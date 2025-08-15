'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal.styled';
import SignupModal from '@/components/auth/SignupModal.styled';
import { useWebSocket } from '@/hooks/useWebSocket';
import { colors, shadows, borderRadius, spacing, typography, transitions, gradients, glass, animations } from '@/styles/design-system';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, MessageCircle, Bot, Sparkles,
  ChevronRight, Star, Shield, Zap, Heart, Navigation, Target, Activity,
  AlertCircle, CheckCircle2, LogOut, Settings, Grid3x3, ArrowRight
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  quickActions?: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  type: 'location' | 'distance' | 'care_type' | 'urgency' | 'confirmation';
  value: any;
  icon?: string;
}

interface UserPreferences {
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    accuracy?: number;
    manual?: boolean;
    validated?: boolean;
  };
  maxDistance: number;
  careType: string;
  careDetails: {
    symptoms?: string[];
    painLevel?: number;
    duration?: string;
    previousTreatment?: boolean;
  };
  urgency: 'normal' | 'urgent' | 'emergency';
  availability: {
    timePreference: 'morning' | 'afternoon' | 'evening' | 'flexible';
    datePreference: 'today' | 'this_week' | 'next_week' | 'flexible';
    specificDates?: string[];
    blackoutDates?: string[];
  };
  patient: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    isNewPatient: boolean;
    insurance?: string;
    allergies?: string;
    currentMedications?: string;
  };
  preferences: {
    language: 'fr' | 'en' | 'es';
    communicationMethod: 'email' | 'sms' | 'phone';
    reminderPreference: boolean;
    practitionerGender?: 'male' | 'female' | 'no_preference';
  };
}

interface Cabinet {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  specialties: string[];
  rating: number;
  nextAvailable: string;
  distance?: number;
}

const cabinets: Cabinet[] = [
  {
    id: '1',
    name: 'Nova Paris Châtelet',
    address: '15 Rue de Rivoli, 75001 Paris',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    specialties: ['Dentisterie générale', 'Orthodontie', 'Implants', 'Urgences'],
    rating: 4.9,
    nextAvailable: 'Aujourd\'hui 15h30'
  },
  {
    id: '2',
    name: 'Nova Lyon Part-Dieu',
    address: '25 Avenue Jean Jaurès, 69007 Lyon',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357,
    specialties: ['Dentisterie générale', 'Chirurgie', 'Parodontologie'],
    rating: 4.8,
    nextAvailable: 'Demain 9h15'
  },
  {
    id: '3',
    name: 'Nova Marseille Vieux-Port',
    address: '12 Quai du Port, 13002 Marseille',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    specialties: ['Dentisterie générale', 'Esthétique', 'Blanchiment'],
    rating: 4.7,
    nextAvailable: 'Jeudi 14h00'
  }
];

const careTypes = [
  { id: 'consultation', label: 'Consultation de routine', duration: 30, urgent: false, icon: '👩‍⚕️', price: 50 },
  { id: 'cleaning', label: 'Détartrage / Nettoyage', duration: 45, urgent: false, icon: '✨', price: 80 },
  { id: 'filling', label: 'Soin de carie', duration: 60, urgent: false, icon: '🦷', price: 120 },
  { id: 'extraction', label: 'Extraction dentaire', duration: 45, urgent: true, icon: '🔧', price: 100 },
  { id: 'root_canal', label: 'Dévitalisation', duration: 90, urgent: true, icon: '🩺', price: 300 },
  { id: 'crown', label: 'Couronne / Prothèse', duration: 75, urgent: false, icon: '👑', price: 600 },
  { id: 'orthodontics', label: 'Orthodontie', duration: 45, urgent: false, icon: '🦷', price: 150 },
  { id: 'surgery', label: 'Chirurgie orale', duration: 120, urgent: true, icon: '🔬', price: 400 },
  { id: 'emergency', label: 'Urgence dentaire', duration: 30, urgent: true, icon: '🚨', price: 80 }
];

export default function SmartBookingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { messages: wsMessages, sendMessage: wsSendMessage, isConnected: wsConnected, connect: wsConnect, isTyping: wsTyping } = useWebSocket({ autoConnect: false });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    location: { validated: false },
    maxDistance: 10,
    careType: '',
    careDetails: {},
    urgency: 'normal',
    availability: { timePreference: 'flexible', datePreference: 'flexible' },
    patient: { isNewPatient: true },
    preferences: { language: 'fr', communicationMethod: 'email', reminderPreference: true }
  });
  const [nearbyCabinets, setNearbyCabinets] = useState<Cabinet[]>([]);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isManualAddressMode, setIsManualAddressMode] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(0);

  const generateUniqueId = (type: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter;
    setMessageIdCounter(prev => prev + 1);
    return `${type}_${timestamp}_${counter}_${random}`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearbyCabinets = (userLat: number, userLon: number, maxDistance: number): Cabinet[] => {
    return cabinets.map(cabinet => ({
      ...cabinet,
      distance: calculateDistance(userLat, userLon, cabinet.latitude, cabinet.longitude)
    }))
    .filter(cabinet => cabinet.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
  };

  const addBotMessage = (content: string, suggestions?: string[], quickActions?: QuickAction[]) => {
    const newMessage: Message = {
      id: generateUniqueId('bot'),
      type: 'bot',
      content,
      timestamp: new Date(),
      suggestions,
      quickActions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: generateUniqueId('user'),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  useEffect(() => {
    setTimeout(() => {
      const welcomeMessage = isAuthenticated && user
        ? `👋 Bonjour ${user.firstName || 'cher patient'} ! Ravi de vous revoir sur NOVA.`
        : "👋 Bienvenue sur NOVA ! Je suis votre assistant IA spécialisé.";
      
      const quickActions = isAuthenticated
        ? [
            { id: 'start_booking', label: '📅 Nouveau rendez-vous', type: 'confirmation', value: 'start' },
            { id: 'my_appointments', label: '📋 Mes rendez-vous', type: 'confirmation', value: 'view_appointments' },
            { id: 'emergency', label: '🚨 Urgence', type: 'urgency', value: 'emergency' }
          ]
        : [
            { id: 'start_booking', label: '🚀 Réserver maintenant', type: 'confirmation', value: 'start' },
            { id: 'login', label: '🔐 Me connecter', type: 'confirmation', value: 'show_login' },
            { id: 'emergency', label: '🚨 C\'est urgent !', type: 'urgency', value: 'emergency' }
          ];
      
      addBotMessage(welcomeMessage, undefined, quickActions);
    }, 800);
    
    if (isAuthenticated && !wsConnected) {
      const token = localStorage.getItem('accessToken');
      if (token) wsConnect();
    }
  }, [isAuthenticated, user, wsConnected]);

  const handleQuickAction = (action: QuickAction) => {
    addUserMessage(action.label);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      if (action.value === 'show_login') {
        setShowLoginModal(true);
      } else if (action.value === 'start') {
        setCurrentStep('location');
        addBotMessage(
          "🎯 Pour vous proposer les cabinets proches, j'ai besoin de votre localisation.",
          undefined,
          [
            { id: 'allow_location', label: '📍 Géolocalisation', type: 'location', value: 'auto' },
            { id: 'manual_location', label: '✍️ Saisir manuellement', type: 'location', value: 'manual' }
          ]
        );
      }
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    const userInput = inputValue.toLowerCase();
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      if (userInput.includes('rdv') || userInput.includes('rendez-vous')) {
        addBotMessage(
          "✨ Je vais vous guider pour votre prise de rendez-vous.",
          undefined,
          [
            { id: 'allow_location', label: '📍 Géolocalisation', type: 'location', value: 'auto' },
            { id: 'manual_address', label: '📝 Saisir adresse', type: 'location', value: 'manual_address' }
          ]
        );
      } else {
        addBotMessage(
          "Comment puis-je vous aider aujourd'hui ?",
          undefined,
          [
            { id: 'book_appointment', label: '📅 Prendre rendez-vous', type: 'confirmation', value: 'start' },
            { id: 'emergency_help', label: '🚨 Urgence', type: 'urgency', value: 'emergency' }
          ]
        );
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen" style={{ background: gradients.mesh }}>
      {/* Professional Header */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: gradients.brand,
          boxShadow: shadows.xl,
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        
        <div className="relative container mx-auto px-4 py-12">
          {/* Navigation Bar */}
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-2">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
              <span 
                className="text-2xl font-bold text-white"
                style={{ fontFamily: typography.fonts.heading }}
              >
                NOVA
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className="px-6 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                    style={{
                      background: 'white',
                      color: colors.primary[600],
                      boxShadow: shadows.md,
                    }}
                  >
                    Créer un compte
                  </button>
                </>
              )}
              
              {isAuthenticated && user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: gradients.accent }}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-white transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden"
                      style={{
                        background: 'white',
                        boxShadow: shadows['2xl'],
                      }}
                    >
                      <button className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4" style={{ color: colors.neutral[600] }} />
                        <span style={{ color: colors.neutral[800] }}>Paramètres</span>
                      </button>
                      <button 
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-t"
                      >
                        <LogOut className="w-4 h-4" style={{ color: colors.error[600] }} />
                        <span style={{ color: colors.error[600] }}>Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            
            <h1 
              className="text-5xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: typography.fonts.heading }}
            >
              Assistant IA Nova
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95">
              Réservez votre consultation dentaire en moins de 60 secondes
            </p>
            
            {/* Trust Badges */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">100% Sécurisé</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Ultra Rapide</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">4.9/5 Satisfaction</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleQuickAction({ id: 'start', label: 'Commencer', type: 'confirmation', value: 'start' })}
              className="group px-8 py-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105"
              style={{
                background: 'white',
                color: colors.primary[600],
                boxShadow: shadows['2xl'],
              }}
            >
              <span className="flex items-center space-x-3">
                <span>Commencer maintenant</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Enhanced Chat Interface */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: borderRadius['3xl'],
                boxShadow: shadows['2xl'],
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              {/* Chat Header */}
              <div 
                className="p-6"
                style={{
                  background: gradients.ocean,
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Nova Assistant</h3>
                    <p className="text-white/80 text-sm">En ligne • Répond instantanément</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                className="h-96 overflow-y-auto p-6 space-y-4"
                style={{ background: colors.neutral[50] }}
              >
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className="max-w-sm px-5 py-3 rounded-2xl"
                        style={{
                          background: message.type === 'user' ? gradients.primary : 'white',
                          color: message.type === 'user' ? 'white' : colors.neutral[800],
                          boxShadow: shadows.md,
                          border: message.type === 'user' ? 'none' : `1px solid ${colors.neutral[200]}`,
                        }}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                        
                        {message.quickActions && (
                          <div className="mt-3 space-y-2">
                            {message.quickActions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                className="block w-full text-left px-4 py-2.5 rounded-xl transition-all transform hover:scale-[1.02]"
                                style={{
                                  background: action.type === 'urgency' 
                                    ? `${colors.error[50]}`
                                    : action.type === 'location'
                                    ? `${colors.success[50]}`
                                    : `${colors.primary[50]}`,
                                  color: action.type === 'urgency'
                                    ? colors.error[700]
                                    : action.type === 'location'
                                    ? colors.success[700]
                                    : colors.primary[700],
                                  border: `1px solid ${
                                    action.type === 'urgency'
                                      ? colors.error[200]
                                      : action.type === 'location'
                                      ? colors.success[200]
                                      : colors.primary[200]
                                  }`,
                                }}
                              >
                                <span className="flex items-center justify-between">
                                  <span>{action.label}</span>
                                  <ChevronRight className="w-4 h-4 opacity-60" />
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div 
                      className="px-5 py-3 rounded-2xl"
                      style={{
                        background: 'white',
                        boxShadow: shadows.sm,
                        border: `1px solid ${colors.neutral[200]}`,
                      }}
                    >
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.primary[400], animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.primary[400], animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.primary[400], animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div 
                className="p-6"
                style={{
                  background: 'white',
                  borderTop: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-5 py-3 rounded-xl transition-all"
                    style={{
                      background: colors.neutral[50],
                      border: `2px solid ${colors.neutral[200]}`,
                      fontSize: typography.sizes.base,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.primary[500]}
                    onBlur={(e) => e.target.style.borderColor = colors.neutral[200]}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-3 rounded-xl font-medium text-white transition-all transform hover:scale-105"
                    style={{
                      background: gradients.primary,
                      boxShadow: shadows.primary,
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Professional Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            {userPrefs.location.latitude && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: borderRadius['2xl'],
                  boxShadow: shadows.lg,
                  border: `1px solid ${colors.primary[100]}`,
                }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: colors.neutral[900] }}>
                  <Target className="w-5 h-5 mr-2" style={{ color: colors.primary[500] }} />
                  Vos préférences
                </h3>
                <div className="space-y-3">
                  {userPrefs.location.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-0.5" style={{ color: colors.success[500] }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: colors.neutral[700] }}>Localisation</p>
                        <p className="text-xs" style={{ color: colors.neutral[500] }}>{userPrefs.location.address}</p>
                      </div>
                    </div>
                  )}
                  {nearbyCabinets.length > 0 && (
                    <div className="pt-3 border-t" style={{ borderColor: colors.neutral[200] }}>
                      <p className="text-sm font-medium mb-2" style={{ color: colors.neutral[700] }}>
                        {nearbyCabinets.length} cabinet(s) trouvé(s)
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Features Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6"
              style={{
                background: 'white',
                borderRadius: borderRadius['2xl'],
                boxShadow: shadows.lg,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.neutral[900] }}>
                Pourquoi Nova ?
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Navigation, text: 'Géolocalisation précise', color: colors.primary[500] },
                  { icon: Zap, text: 'Réservation instantanée', color: colors.accent[500] },
                  { icon: Shield, text: 'Données sécurisées', color: colors.success[500] }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <item.icon className="w-5 h-5 mt-0.5" style={{ color: item.color }} />
                    <p className="text-sm" style={{ color: colors.neutral[700] }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}