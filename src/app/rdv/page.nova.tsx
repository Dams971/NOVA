'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal.styled';
import SignupModal from '@/components/auth/SignupModal.styled';
import Navigation from '@/components/landing/Navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, MessageCircle, Bot, Sparkles,
  ChevronRight, Star, Shield, Zap, Heart, Navigation as NavigationIcon, Target, Activity,
  AlertCircle, CheckCircle2, ArrowRight, Send, Mic, Paperclip, Smile,
  TrendingDown, Globe, Award, Users, ChevronDown, Play
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
  icon?: React.ReactNode;
}

const careTypes = [
  { id: 'consultation', label: 'Consultation', icon: '🔍', color: 'blue' },
  { id: 'cleaning', label: 'Détartrage', icon: '✨', color: 'purple' },
  { id: 'filling', label: 'Soin de carie', icon: '🦷', color: 'green' },
  { id: 'emergency', label: 'Urgence', icon: '🚨', color: 'red' }
];

export default function RDVPageNova() {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isConnected: wsConnected, connect: wsConnect } = useWebSocket({ autoConnect: false });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(0);

  const generateUniqueId = (type: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter;
    setMessageIdCounter(prev => prev + 1);
    return `${type}_${timestamp}_${counter}_${random}`;
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
        ? `Bonjour ${user.firstName} ! 👋 Je suis Nova, votre assistant personnel. Comment puis-je vous aider aujourd'hui ?`
        : "Bienvenue chez Nova ! 🦷 Je suis votre assistant virtuel disponible 24/7. Comment puis-je vous aider ?";
      
      const quickActions = [
        { 
          id: 'appointment', 
          label: 'Prendre RDV', 
          type: 'confirmation' as const, 
          value: 'start',
          icon: <Calendar className="w-4 h-4" />
        },
        { 
          id: 'emergency', 
          label: 'Urgence', 
          type: 'urgency' as const, 
          value: 'emergency',
          icon: <AlertCircle className="w-4 h-4" />
        },
        { 
          id: 'locations', 
          label: 'Nos cabinets', 
          type: 'location' as const, 
          value: 'show_locations',
          icon: <MapPin className="w-4 h-4" />
        }
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
      
      if (action.value === 'start') {
        addBotMessage(
          "Parfait ! Pour vous proposer les meilleurs créneaux, j'ai besoin de quelques informations. 📍 Où souhaitez-vous consulter ?",
          undefined,
          [
            { id: 'paris', label: 'Paris', type: 'location', value: 'paris', icon: <MapPin className="w-4 h-4" /> },
            { id: 'lyon', label: 'Lyon', type: 'location', value: 'lyon', icon: <MapPin className="w-4 h-4" /> },
            { id: 'marseille', label: 'Marseille', type: 'location', value: 'marseille', icon: <MapPin className="w-4 h-4" /> },
            { id: 'other', label: 'Autre ville', type: 'location', value: 'other', icon: <Globe className="w-4 h-4" /> }
          ]
        );
      } else if (action.value === 'emergency') {
        addBotMessage(
          "🚨 Je comprends votre urgence. Nos cabinets peuvent vous recevoir rapidement. Quelle est la nature de votre urgence ?",
          undefined,
          [
            { id: 'pain', label: 'Douleur intense', type: 'urgency', value: 'pain', icon: <AlertCircle className="w-4 h-4" /> },
            { id: 'broken', label: 'Dent cassée', type: 'urgency', value: 'broken', icon: <Activity className="w-4 h-4" /> },
            { id: 'bleeding', label: 'Saignement', type: 'urgency', value: 'bleeding', icon: <Heart className="w-4 h-4" /> }
          ]
        );
      }
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        "Je traite votre demande... Comment puis-je vous aider spécifiquement ?",
        undefined,
        [
          { id: 'book', label: 'Réserver un RDV', type: 'confirmation', value: 'start', icon: <Calendar className="w-4 h-4" /> },
          { id: 'info', label: 'Informations', type: 'confirmation', value: 'info', icon: <AlertCircle className="w-4 h-4" /> }
        ]
      );
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nova-blue via-nova-blue-light to-nova-blue-dark">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section similaire à la home */}
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
                Réservation{' '}
                <span className="relative">
                  instantanée
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                Prenez rendez-vous en moins de <span className="font-semibold text-yellow-400">60 secondes</span> grâce à notre assistant IA
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
                  <Users className="w-5 h-5" />
                  <span className="text-sm">25+ Cabinets</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Chat Interface */}
      <div className="relative z-10 -mt-8 pb-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Chat principale */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-nova-blue to-nova-blue-light p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Bot className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-semibold text-white">Assistant Nova</h3>
                      <div className="flex items-center space-x-2 text-white/80 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>En ligne • Répond instantanément</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="h-[500px] overflow-y-auto p-6 bg-gray-50">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              message.type === 'user'
                                ? 'bg-nova-blue text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            <p className="text-sm md:text-base">{message.content}</p>
                          </div>
                          
                          {/* Quick Actions */}
                          {message.quickActions && (
                            <div className="mt-3 space-y-2">
                              {message.quickActions.map((action) => (
                                <motion.button
                                  key={action.id}
                                  onClick={() => handleQuickAction(action)}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                                    action.type === 'urgency'
                                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                      : action.type === 'location'
                                      ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                                      : 'bg-blue-50 hover:bg-blue-100 text-nova-blue border border-blue-200'
                                  }`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="flex items-center space-x-2">
                                    {action.icon}
                                    <span className="font-medium">{action.label}</span>
                                  </span>
                                  <ChevronRight className="w-4 h-4" />
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                        <div className="flex space-x-2">
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-nova-blue transition-all"
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                    <motion.button
                      onClick={handleSendMessage}
                      className="p-3 bg-nova-blue text-white rounded-xl hover:bg-nova-blue-dark transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Prendre un RDV', 'Urgence dentaire', 'Tarifs', 'Horaires'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInputValue(suggestion);
                          handleSendMessage();
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Access Card */}
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Accès rapide
                </h3>
                <div className="space-y-3">
                  {careTypes.map((care) => (
                    <button
                      key={care.id}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <span className="flex items-center space-x-3">
                        <span className="text-2xl">{care.icon}</span>
                        <span className="font-medium text-gray-700">{care.label}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                className="bg-gradient-to-br from-nova-blue to-nova-blue-light rounded-2xl p-6 text-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-heading font-semibold mb-4">Notre réseau</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold font-heading">25+</div>
                    <div className="text-sm text-white/80">Cabinets</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-heading">24/7</div>
                    <div className="text-sm text-white/80">Disponible</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-heading">98%</div>
                    <div className="text-sm text-white/80">Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-heading">60s</div>
                    <div className="text-sm text-white/80">Réservation</div>
                  </div>
                </div>
              </motion.div>

              {/* Help Card */}
              <motion.div
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Besoin d'aide ?</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Notre équipe est disponible pour vous assister
                    </p>
                    <button className="text-sm font-medium text-nova-blue hover:underline">
                      Contacter le support →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
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
    </div>
  );
}