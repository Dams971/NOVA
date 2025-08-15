'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal.styled';
import SignupModal from '@/components/auth/SignupModal.styled';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  Bot, 
  Sparkles,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Heart,
  Navigation,
  Target,
  Activity,
  AlertCircle,
  CheckCircle2
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
    painLevel?: number; // 1-10
    duration?: string; // how long has the issue persisted
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
  { 
    id: 'consultation', 
    label: 'Consultation de routine', 
    duration: 30, 
    urgent: false, 
    icon: '👩‍⚕️',
    price: 50,
    description: 'Examen dentaire complet avec nettoyage de base',
    symptoms: ['Contrôle préventif', 'Pas de douleur', 'Suivi régulier'],
    followUp: ['Détartrage si nécessaire', 'Radiographies', 'Plan de traitement']
  },
  { 
    id: 'cleaning', 
    label: 'Détartrage / Nettoyage', 
    duration: 45, 
    urgent: false, 
    icon: '✨',
    price: 80,
    description: 'Nettoyage professionnel approfondi et polissage',
    symptoms: ['Tartre visible', 'Saignements légers', 'Mauvaise haleine'],
    followUp: ['Conseils d\'hygiène', 'Contrôle dans 6 mois']
  },
  { 
    id: 'filling', 
    label: 'Soin de carie', 
    duration: 60, 
    urgent: false, 
    icon: '🦷',
    price: 120,
    description: 'Traitement des caries avec composite moderne',
    symptoms: ['Sensibilité au froid', 'Douleur modérée', 'Trou visible'],
    followUp: ['Éviter aliments durs 24h', 'Contrôle dans 1 mois']
  },
  { 
    id: 'extraction', 
    label: 'Extraction dentaire', 
    duration: 45, 
    urgent: true, 
    icon: '🔧',
    price: 100,
    description: 'Extraction simple ou chirurgicale selon le cas',
    symptoms: ['Dent très abîmée', 'Infection', 'Douleur intense'],
    followUp: ['Repos 24-48h', 'Antidouleurs', 'Suivi cicatrisation']
  },
  { 
    id: 'root_canal', 
    label: 'Dévitalisation', 
    duration: 90, 
    urgent: true, 
    icon: '🩺',
    price: 300,
    description: 'Traitement du canal radiculaire pour sauver la dent',
    symptoms: ['Douleur pulsatile', 'Sensibilité extrême', 'Abcès possible'],
    followUp: ['Antibiotiques si nécessaire', 'Couronne recommandée', 'Suivi 1 semaine']
  },
  { 
    id: 'crown', 
    label: 'Couronne / Prothèse', 
    duration: 75, 
    urgent: false, 
    icon: '👑',
    price: 600,
    description: 'Pose de couronne céramique ou prothèse partielle',
    symptoms: ['Dent cassée', 'Après dévitalisation', 'Esthétique'],
    followUp: ['Adaptation progressive', 'Contrôle ajustement', 'Hygiène spécifique']
  },
  { 
    id: 'orthodontics', 
    label: 'Orthodontie', 
    duration: 45, 
    urgent: false, 
    icon: '🦷',
    price: 150,
    description: 'Consultation orthodontique et plan de traitement',
    symptoms: ['Dents mal alignées', 'Problème de mâchoire', 'Esthétique'],
    followUp: ['Moulages', 'Radiographies', 'Devis personnalisé']
  },
  { 
    id: 'surgery', 
    label: 'Chirurgie orale', 
    duration: 120, 
    urgent: true, 
    icon: '🔬',
    price: 400,
    description: 'Intervention chirurgicale complexe',
    symptoms: ['Kyste', 'Dent de sagesse', 'Implant'],
    followUp: ['Repos complet', 'Suivi post-op', 'Cicatrisation 2 semaines']
  },
  { 
    id: 'emergency', 
    label: 'Urgence dentaire', 
    duration: 30, 
    urgent: true, 
    icon: '🚨',
    price: 80,
    description: 'Prise en charge immédiate des urgences',
    symptoms: ['Douleur insupportable', 'Traumatisme', 'Hémorragie'],
    followUp: ['Traitement immédiat', 'Antidouleurs', 'Suivi rapproché']
  }
];

const symptoms = [
  { id: 'pain', label: '😣 Douleur dentaire', severity: 'high' },
  { id: 'sensitivity', label: '🥶 Sensibilité au froid/chaud', severity: 'medium' },
  { id: 'bleeding', label: '🩸 Saignements des gencives', severity: 'medium' },
  { id: 'swelling', label: '😵 Gonflement/Abcès', severity: 'high' },
  { id: 'broken_tooth', label: '💥 Dent cassée/ébréchée', severity: 'high' },
  { id: 'bad_breath', label: '😷 Mauvaise haleine persistante', severity: 'low' },
  { id: 'loose_tooth', label: '🦷 Dent qui bouge', severity: 'medium' },
  { id: 'jaw_pain', label: '😖 Douleur à la mâchoire', severity: 'medium' },
  { id: 'aesthetic', label: '✨ Problème esthétique', severity: 'low' },
  { id: 'routine', label: '🔍 Contrôle de routine', severity: 'low' }
];

const timeSlots = {
  morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
  evening: ['18:00', '18:30', '19:00', '19:30', '20:00']
};

export default function SmartBookingPage() {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { 
    messages: wsMessages, 
    sendMessage: wsSendMessage, 
    isConnected: wsConnected,
    connect: wsConnect,
    isTyping: wsTyping 
  } = useWebSocket({ autoConnect: false });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    location: {
      validated: false
    },
    maxDistance: 10,
    careType: '',
    careDetails: {},
    urgency: 'normal',
    availability: {
      timePreference: 'flexible',
      datePreference: 'flexible'
    },
    patient: {
      isNewPatient: true
    },
    preferences: {
      language: 'fr',
      communicationMethod: 'email',
      reminderPreference: true
    }
  });
  const [nearbyCabinets, setNearbyCabinets] = useState<Cabinet[]>([]);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isManualAddressMode, setIsManualAddressMode] = useState(false);
  const [pendingAddress, setPendingAddress] = useState('');
  const [messageIdCounter, setMessageIdCounter] = useState(0);

  // Fonction utilitaire pour générer des IDs uniques
  const generateUniqueId = (type: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter;
    setMessageIdCounter(prev => prev + 1);
    return `${type}_${timestamp}_${counter}_${random}`;
  };

  // Fonctions utilitaires
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
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

  // Validation functions
  const validateLocation = (lat: number, lon: number): boolean => {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[\+]?[0-9]{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const geocodeAddress = async (address: string): Promise<{lat: number, lon: number, fullAddress: string} | null> => {
    try {
      // Using OpenStreetMap Nominatim for address geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=1&countrycodes=FR`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          fullAddress: result.display_name
        };
      }
    } catch (_error) {
      console.warn('Geocoding failed:', error);
    }
    
    return null;
  };

  const handleManualAddress = async (address: string) => {
    addBotMessage("🔍 Recherche de votre adresse...");
    
    const geocoded = await geocodeAddress(address);
    
    if (geocoded) {
      setUserPrefs(prev => ({
        ...prev,
        location: { 
          latitude: geocoded.lat, 
          longitude: geocoded.lon, 
          accuracy: 100, // Manual entry approximation
          address: geocoded.fullAddress,
          validated: true,
          manual: true,
          city: geocoded.fullAddress.split(',').pop()?.trim()
        }
      }));
      
      const nearby = findNearbyCabinets(geocoded.lat, geocoded.lon, userPrefs.maxDistance);
      setNearbyCabinets(nearby);
      
      addBotMessage(
        `📍 **Adresse trouvée et confirmée**

📬 ${geocoded.fullAddress}
🏥 ${nearby.length} cabinet(s) Nova trouvé(s) à proximité`,
        undefined,
        [
          { id: 'confirm_manual', label: '✅ Adresse correcte', type: 'confirmation', value: 'location_confirmed' },
          { id: 'modify_address', label: '📝 Modifier l\'adresse', type: 'confirmation', value: 'manual_address' },
          { id: 'view_cabinets', label: '🏥 Voir les cabinets proches', type: 'confirmation', value: 'view_cabinets' }
        ]
      );
    } else {
      addBotMessage(
        `❌ **Adresse introuvable** : "${address}"

Veuillez essayer avec une adresse plus précise (exemple: "15 rue de la Paix, 75002 Paris")`,
        undefined,
        [
          { id: 'retry_address', label: '🔄 Essayer une autre adresse', type: 'confirmation', value: 'manual_address' },
          { id: 'paris_center', label: '🗼 Centre de Paris', type: 'location', value: 'paris' },
          { id: 'lyon_center', label: '🦁 Centre de Lyon', type: 'location', value: 'lyon' }
        ]
      );
    }
  };

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim for precise reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.display_name) {
        const address = data.address || {};
        const street = address.road || address.pedestrian || address.footway || '';
        const number = address.house_number || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const postalCode = address.postcode || '';
        
        // Build precise address
        let fullAddress = '';
        if (number && street) {
          fullAddress = `${number} ${street}`;
        } else if (street) {
          fullAddress = street;
        }
        if (postalCode && city) {
          fullAddress += fullAddress ? `, ${postalCode} ${city}` : `${postalCode} ${city}`;
        } else if (city) {
          fullAddress += fullAddress ? `, ${city}` : city;
        }
        
        return fullAddress || data.display_name;
      }
    } catch (_error) {
      console.warn('Reverse geocoding failed, using fallback:', error);
    }
    
    // Fallback with simulated precise locations
    const preciseLocations = [
      '15 rue de Rivoli, 75001 Paris',
      '25 avenue Jean Jaurès, 69007 Lyon', 
      '12 quai du Port, 13002 Marseille',
      '45 rue Saint-Rome, 31000 Toulouse',
      '30 avenue Jean Médecin, 06000 Nice'
    ];
    return preciseLocations[Math.floor(Math.random() * preciseLocations.length)];
  };

  const requestLocation = () => {
    if (!locationRequested && navigator.geolocation) {
      setLocationRequested(true);
      addBotMessage("🎯 Localisation haute précision en cours... Veuillez autoriser l'accès à votre position.");
      
      // Enhanced geolocation with multiple attempts and averaging
      const attemptPreciseLocation = async (attemptCount = 0): Promise<any> => {
        return new Promise((resolve, reject) => {
          const options = {
            enableHighAccuracy: true,
            timeout: attemptCount === 0 ? 20000 : 15000, // Longer timeout for first attempt
            maximumAge: attemptCount === 0 ? 0 : 60000 // Fresh position for first attempt
          };

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              resolve({
                coords: position.coords,
                timestamp: position.timestamp,
                attempt: attemptCount + 1
              });
            },
            (error) => reject(error),
            options
          );
        });
      };

      // Try multiple position readings for better accuracy
      const getAveragePosition = async () => {
        const positions = [];
        const maxAttempts = 3;
        
        for (let i = 0; i < maxAttempts; i++) {
          try {
            addBotMessage(`🔄 Amélioration de la précision... (${i + 1}/${maxAttempts})`);
            const position = await attemptPreciseLocation(i);
            positions.push(position);
            
            // If we get a high-accuracy reading (< 20m), we can stop early
            if (position.coords.accuracy < 20 && i > 0) {
              break;
            }
            
            // Wait between attempts
            if (i < maxAttempts - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (_error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            if (i === 0) {
              throw error; // If first attempt fails, throw to handle normally
            }
          }
        }

        if (positions.length === 0) {
          throw new Error('All positioning attempts failed');
        }

        // Calculate weighted average based on accuracy (higher weight for more accurate readings)
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLon = 0;
        let bestAccuracy = Math.min(...positions.map(p => p.coords.accuracy));

        positions.forEach(pos => {
          const weight = 1 / (pos.coords.accuracy * pos.coords.accuracy); // Inverse square weighting
          totalWeight += weight;
          weightedLat += pos.coords.latitude * weight;
          weightedLon += pos.coords.longitude * weight;
        });

        return {
          latitude: weightedLat / totalWeight,
          longitude: weightedLon / totalWeight,
          accuracy: bestAccuracy,
          attempts: positions.length,
          originalPositions: positions
        };
      };

      getAveragePosition()
        .then(async (averagedPosition) => {
          const { latitude, longitude, accuracy, attempts } = averagedPosition;
          
          if (!validateLocation(latitude, longitude)) {
            addBotMessage(
              "❌ Position invalide détectée après validation. Veuillez saisir manuellement votre adresse.",
              undefined,
              [
                { id: 'manual_address', label: '📝 Saisir mon adresse', type: 'location', value: 'manual_address' },
                { id: 'paris', label: '🗼 Paris', type: 'location', value: 'paris' },
                { id: 'lyon', label: '🦁 Lyon', type: 'location', value: 'lyon' },
                { id: 'marseille', label: '🌊 Marseille', type: 'location', value: 'marseille' }
              ]
            );
            return;
          }

          addBotMessage("🔍 Recherche de l'adresse exacte...");
          const locationName = await getLocationName(latitude, longitude);
          
          setUserPrefs(prev => ({
            ...prev,
            location: { 
              latitude, 
              longitude, 
              accuracy, 
              address: locationName,
              validated: true,
              manual: false,
              city: locationName.split(',').pop()?.trim()
            }
          }));
          
          const nearby = findNearbyCabinets(latitude, longitude, userPrefs.maxDistance);
          setNearbyCabinets(nearby);
          
          const precisionLevel = accuracy < 10 ? 'excellente' : accuracy < 50 ? 'très bonne' : accuracy < 100 ? 'bonne' : 'correcte';
          const precisionEmoji = accuracy < 10 ? '🎯' : accuracy < 50 ? '📍' : accuracy < 100 ? '📌' : '📍';
          
          addBotMessage(
            `${precisionEmoji} **Position confirmée avec précision ${precisionLevel}**

📬 **Adresse** : ${locationName}
🎯 **Précision** : ±${Math.round(accuracy)}m (${attempts} mesures)

🏥 **Cabinets trouvés** : ${nearby.length} dans un rayon de ${userPrefs.maxDistance}km`,
            undefined,
            [
              { id: 'confirm_location', label: '✅ Adresse correcte', type: 'confirmation', value: 'location_confirmed' },
              { id: 'refine_location', label: '📝 Préciser l\'adresse', type: 'confirmation', value: 'refine_address' },
              { id: 'view_cabinets', label: '🏥 Voir les cabinets proches', type: 'confirmation', value: 'view_cabinets' },
              { id: 'select_symptoms', label: '🩺 Décrire mes symptômes', type: 'confirmation', value: 'symptoms' }
            ]
          );
        })
        .catch((error) => {
          console.error('Enhanced geolocation failed:', error);
          let errorMessage = "🗺️ ";
          
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage += `**Géolocalisation bloquée**

Pour une expérience optimale, autorisez l'accès à votre position. Sinon, saisissez votre adresse :`;
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage += `**Position indisponible**

Impossible de vous localiser avec précision. Veuillez indiquer votre adresse :`;
              break;
            case 3: // TIMEOUT
              errorMessage += `**Délai de localisation dépassé**

La localisation prend trop de temps. Sélectionnez votre zone :`;
              break;
            default:
              errorMessage += `**Erreur de géolocalisation**

Problème technique rencontré. Choisissez votre localisation :`;
          }

          addBotMessage(
            errorMessage,
            undefined,
            [
              { id: 'manual_address', label: '📝 Saisir mon adresse complète', type: 'location', value: 'manual_address' },
              { id: 'paris', label: '🗼 Paris', type: 'location', value: 'paris' },
              { id: 'lyon', label: '🦁 Lyon', type: 'location', value: 'lyon' },
              { id: 'marseille', label: '🌊 Marseille', type: 'location', value: 'marseille' },
              { id: 'other_city', label: '🌍 Autre ville', type: 'location', value: 'other_city' }
            ]
          );
        });
    }
  };

  useEffect(() => {
    // Message de bienvenue automatique
    setTimeout(() => {
      const welcomeMessage = isAuthenticated && user
        ? `👋 Bonjour ${user.firstName || 'cher patient'} ! Ravi de vous revoir. Je suis Nova, votre assistant IA. Comment puis-je vous aider aujourd'hui ?`
        : "👋 Bonjour ! Je suis Nova, votre assistant IA spécialisé dans la prise de rendez-vous dentaires. Je vais vous aider à trouver le cabinet le plus proche et adapté à vos besoins.";
      
      const quickActions = isAuthenticated
        ? [
            { id: 'start_booking', label: '📅 Nouveau rendez-vous', type: 'confirmation', value: 'start' },
            { id: 'my_appointments', label: '📋 Mes rendez-vous', type: 'confirmation', value: 'view_appointments' },
            { id: 'emergency', label: '🚨 Urgence', type: 'urgency', value: 'emergency' }
          ]
        : [
            { id: 'start_booking', label: '🚀 Commencer ma réservation', type: 'confirmation', value: 'start' },
            { id: 'login', label: '🔐 Me connecter', type: 'confirmation', value: 'show_login' },
            { id: 'emergency', label: '🚨 C\'est urgent !', type: 'urgency', value: 'emergency' }
          ];
      
      addBotMessage(welcomeMessage, undefined, quickActions);
    }, 800);
    
    // Connect to WebSocket if authenticated
    if (isAuthenticated && !wsConnected) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        wsConnect();
      }
    }
  }, [isAuthenticated, user, wsConnected]);

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

  const handleQuickAction = (action: QuickAction) => {
    addUserMessage(action.label);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      switch (action.type) {
        case 'confirmation':
          if (action.value === 'show_login') {
            setShowLoginModal(true);
            return;
          } else if (action.value === 'view_appointments') {
            addBotMessage(
              "📋 Vos rendez-vous à venir seront affichés ici. Cette fonctionnalité arrive bientôt !",
              undefined,
              [
                { id: 'new_appointment', label: '📅 Nouveau rendez-vous', type: 'confirmation', value: 'start' },
                { id: 'back', label: '⬅️ Retour', type: 'confirmation', value: 'back' }
              ]
            );
            return;
          } else if (action.value === 'start') {
            setCurrentStep('location');
            addBotMessage(
              "🎯 Excellent ! Pour vous proposer les cabinets les plus proches, j'ai besoin de connaître votre localisation. Puis-je y accéder ?",
              undefined,
              [
                { id: 'allow_location', label: '📍 Autoriser la géolocalisation', type: 'location', value: 'auto' },
                { id: 'manual_location', label: '✍️ Saisir manuellement', type: 'location', value: 'manual' }
              ]
            );
          } else if (action.value === 'emergency') {
            setUserPrefs(prev => ({ ...prev, urgency: 'emergency' }));
            requestLocation();
            addBotMessage(
              "🚨 Urgence comprise ! Je recherche les cabinets les plus proches avec des créneaux d'urgence disponibles immédiatement.",
              undefined,
              [
                { id: 'call_emergency', label: '📞 Appeler directement', type: 'confirmation', value: 'call' },
                { id: 'book_emergency', label: '⚡ Réserver en urgence', type: 'confirmation', value: 'book_urgent' }
              ]
            );
          }
          break;
          
        case 'location':
          if (action.value === 'auto') {
            requestLocation();
          } else if (action.value === 'manual_address') {
            setIsManualAddressMode(true);
            addBotMessage(
              "📝 **Saisie manuelle d'adresse**\n\nVeuillez entrer votre adresse complète pour une précision optimale :\n\n**Format recommandé** : Numéro rue, code postal ville\n**Exemple** : 15 rue de Rivoli, 75001 Paris",
              undefined,
              [
                { id: 'example_paris', label: '📍 15 rue de Rivoli, 75001 Paris', type: 'confirmation', value: 'use_example_address' },
                { id: 'type_address', label: '✍️ Taper mon adresse', type: 'confirmation', value: 'type_address_prompt' }
              ]
            );
          } else if (action.value === 'paris') {
            handleManualAddress('Paris, France');
          } else if (action.value === 'lyon') {
            handleManualAddress('Lyon, France');
          } else if (action.value === 'marseille') {
            handleManualAddress('Marseille, France');
          } else if (action.value === 'other_city') {
            setIsManualAddressMode(true);
            addBotMessage(
              "🌍 **Autre ville**\n\nIndiquez le nom de votre ville ou votre adresse complète :",
              undefined,
              [
                { id: 'type_city', label: '✍️ Taper ma ville/adresse', type: 'confirmation', value: 'type_address_prompt' }
              ]
            );
          }
          break;
          
        case 'distance':
          setUserPrefs(prev => ({ ...prev, maxDistance: action.value }));
          if (userPrefs.location.latitude) {
            const nearby = findNearbyCabinets(userPrefs.location.latitude!, userPrefs.location.longitude!, action.value);
            setNearbyCabinets(nearby);
            addBotMessage(
              `📏 Zone de recherche étendue à ${action.value}km. ${nearby.length} cabinet(s) trouvé(s).`,
              undefined,
              [
                { id: 'show_cabinets', label: '🏥 Voir les cabinets', type: 'confirmation', value: 'show_cabinets' },
                { id: 'select_care', label: '🦷 Choisir le type de soins', type: 'confirmation', value: 'select_care' }
              ]
            );
          }
          break;
          
        case 'care_type':
          setUserPrefs(prev => ({ ...prev, careType: action.value }));
          const selectedCare = careTypes.find(c => c.id === action.value);
          if (selectedCare) {
            setCurrentStep('care_details');
            addBotMessage(
              `${selectedCare.icon} **${selectedCare.label}** sélectionné

${selectedCare.description}

💰 **Tarif** : ${selectedCare.price}€
⏱️ **Durée** : ${selectedCare.duration} min

Pour mieux vous aider, pouvez-vous me préciser vos symptômes ?`,
              undefined,
              symptoms.filter(s => 
                selectedCare.symptoms.some(symptom => 
                  s.label.toLowerCase().includes(symptom.toLowerCase()) ||
                  symptom.toLowerCase().includes(s.label.toLowerCase())
                )
              ).slice(0, 4).map(symptom => ({
                id: symptom.id,
                label: symptom.label,
                type: 'confirmation' as const,
                value: `symptom_${symptom.id}`
              })).concat([
                { id: 'no_symptoms', label: '✅ Pas de symptômes particuliers', type: 'confirmation', value: 'no_symptoms' }
              ])
            );
          }
          break;
          
        case 'confirmation':
          if (action.value === 'symptoms') {
            addBotMessage(
              "🩺 Décrivez-moi vos symptômes pour que je puisse vous orienter vers le bon type de soins :",
              undefined,
              symptoms.slice(0, 6).map(symptom => ({
                id: symptom.id,
                label: symptom.label,
                type: 'confirmation' as const,
                value: `symptom_${symptom.id}`
              }))
            );
          } else if (action.value.startsWith('symptom_')) {
            const symptomId = action.value.replace('symptom_', '');
            const selectedSymptom = symptoms.find(s => s.id === symptomId);
            
            if (selectedSymptom) {
              setUserPrefs(prev => ({
                ...prev,
                careDetails: {
                  ...prev.careDetails,
                  symptoms: [...(prev.careDetails.symptoms || []), selectedSymptom.id]
                },
                urgency: selectedSymptom.severity === 'high' ? 'urgent' : prev.urgency
              }));

              const recommendedCares = careTypes.filter(care => 
                care.symptoms.some(s => s.toLowerCase().includes(selectedSymptom.label.toLowerCase().substring(2)))
              );

              if (selectedSymptom.severity === 'high') {
                addBotMessage(
                  `${selectedSymptom.label} noté. **Situation prioritaire détectée.**

🚨 Je recommande une consultation rapide. Voici les soins appropriés :`,
                  undefined,
                  recommendedCares.slice(0, 3).map(care => ({
                    id: care.id,
                    label: `${care.icon} ${care.label} (${care.price}€)`,
                    type: 'care_type' as const,
                    value: care.id
                  }))
                );
              } else {
                addBotMessage(
                  `${selectedSymptom.label} noté. Sur une échelle de 1 à 10, comment évaluez-vous votre gêne/douleur ?`,
                  undefined,
                  [
                    { id: 'pain_1_3', label: '😌 Faible (1-3)', type: 'confirmation', value: 'pain_low' },
                    { id: 'pain_4_6', label: '😐 Modérée (4-6)', type: 'confirmation', value: 'pain_medium' },
                    { id: 'pain_7_10', label: '😣 Intense (7-10)', type: 'confirmation', value: 'pain_high' }
                  ]
                );
              }
            }
          } else if (action.value.startsWith('pain_')) {
            const painLevel = action.value.replace('pain_', '');
            let painValue = 0;
            
            switch (painLevel) {
              case 'low': painValue = 2; break;
              case 'medium': painValue = 5; break;
              case 'high': painValue = 8; break;
            }

            setUserPrefs(prev => ({
              ...prev,
              careDetails: { ...prev.careDetails, painLevel: painValue },
              urgency: painLevel === 'high' ? 'urgent' : prev.urgency
            }));

            if (painLevel === 'high') {
              addBotMessage(
                `😰 Douleur intense comprise. **Prise en charge prioritaire nécessaire.**

Depuis combien de temps ressentez-vous cette douleur ?`,
                undefined,
                [
                  { id: 'duration_hours', label: '⚡ Quelques heures', type: 'confirmation', value: 'duration_hours' },
                  { id: 'duration_days', label: '📅 Quelques jours', type: 'confirmation', value: 'duration_days' },
                  { id: 'duration_weeks', label: '📆 Plusieurs semaines', type: 'confirmation', value: 'duration_weeks' }
                ]
              );
            } else {
              addBotMessage(
                "Merci pour ces précisions. Maintenant, trouvons-vous le bon créneau ! Quand souhaitez-vous venir ?",
                undefined,
                [
                  { id: 'today', label: '🌅 Aujourd\'hui si possible', type: 'confirmation', value: 'schedule_today' },
                  { id: 'this_week', label: '📅 Dans les 7 jours', type: 'confirmation', value: 'schedule_week' },
                  { id: 'flexible', label: '🤷 Je suis flexible', type: 'confirmation', value: 'schedule_flexible' }
                ]
              );
            }
          } else if (action.value.startsWith('schedule_')) {
            const when = action.value.replace('schedule_', '');
            const today = new Date().toISOString().split('T')[0];
            
            switch (when) {
              case 'today':
                showAvailableSlots(today);
                break;
              case 'week':
                addBotMessage(
                  "📅 Parfait ! Voici les prochains jours disponibles :",
                  undefined,
                  Array.from({length: 7}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('fr', { weekday: 'long' });
                    return {
                      id: `date_${dateStr}`,
                      label: `${dayName} ${date.getDate()}/${date.getMonth() + 1}`,
                      type: 'confirmation' as const,
                      value: `select_date_${dateStr}`
                    };
                  })
                );
                break;
              case 'flexible':
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                showAvailableSlots(tomorrow.toISOString().split('T')[0]);
                break;
            }
          } else if (action.value.startsWith('select_date_')) {
            const selectedDate = action.value.replace('select_date_', '');
            showAvailableSlots(selectedDate);
          } else if (action.value.startsWith('book_')) {
            const [, cabinetId, date, time] = action.value.split('_');
            initiateBookingConfirmation(cabinetId, date, time);
          } else if (action.value === 'existing_patient') {
            addBotMessage(
              "👤 Parfait ! Pour retrouver votre dossier, j'ai besoin de votre email ou numéro de téléphone :",
              undefined,
              [
                { id: 'provide_email', label: '📧 Donner mon email', type: 'confirmation', value: 'input_email' },
                { id: 'provide_phone', label: '📱 Donner mon téléphone', type: 'confirmation', value: 'input_phone' }
              ]
            );
          } else if (action.value === 'new_patient') {
            setUserPrefs(prev => ({
              ...prev,
              patient: { ...prev.patient, isNewPatient: true }
            }));
            addBotMessage(
              `🆕 Bienvenue chez Nova ! Pour créer votre dossier patient, j'ai besoin de quelques informations :

📝 **Informations requises** :
• Nom et prénom
• Email et téléphone
• Date de naissance

Commençons par votre nom complet :`,
              undefined,
              [
                { id: 'input_name', label: '✍️ Saisir mes informations', type: 'confirmation', value: 'patient_form' }
              ]
            );
          } else if (action.value === 'view_cabinets') {
            showNearbyResults();
          } else if (action.value === 'patient_form') {
            setCurrentStep('patient_form');
            addBotMessage(
              `📋 **Formulaire patient**

Veuillez me donner vos informations une par une. Commençons par votre prénom :`,
              undefined,
              []
            );
          } else if (action.value === 'location_confirmed') {
            addBotMessage(
              `✅ **Localisation confirmée !**

Maintenant, quel type de soins recherchez-vous ?`,
              undefined,
              careTypes.filter(care => 
                userPrefs.urgency === 'emergency' ? care.urgent : true
              ).slice(0, 4).map(care => ({
                id: care.id,
                label: `${care.icon} ${care.label} (${care.price}€)`,
                type: 'care_type' as const,
                value: care.id
              }))
            );
          } else if (action.value === 'refine_address') {
            setIsManualAddressMode(true);
            addBotMessage(
              `📝 **Précision de l'adresse**

Pour une localisation encore plus précise, veuillez saisir votre adresse exacte :

**Votre adresse actuelle** : ${userPrefs.location.address || 'Non définie'}`,
              undefined,
              [
                { id: 'type_precise', label: '✍️ Saisir l\'adresse précise', type: 'confirmation', value: 'type_address_prompt' }
              ]
            );
          } else if (action.value === 'use_example_address') {
            handleManualAddress('15 rue de Rivoli, 75001 Paris');
          } else if (action.value === 'type_address_prompt') {
            setIsManualAddressMode(true);
            addBotMessage("✍️ Tapez votre adresse dans le champ de saisie ci-dessous, puis appuyez sur Entrée.");
          }
          break;
      }
    }, 1200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addUserMessage(suggestion);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      if (suggestion.includes('Voir les cabinets proches')) {
        showNearbyResults();
      } else if (suggestion.includes('Modifier la distance')) {
        addBotMessage(
          "📏 Quelle distance êtes-vous prêt(e) à parcourir ?",
          undefined,
          [
            { id: 'dist_5', label: '🚶 5 km maximum', type: 'distance', value: 5 },
            { id: 'dist_15', label: '🚗 15 km maximum', type: 'distance', value: 15 },
            { id: 'dist_30', label: '🛣️ 30 km maximum', type: 'distance', value: 30 },
            { id: 'dist_50', label: '✈️ 50 km maximum', type: 'distance', value: 50 }
          ]
        );
      } else {
        // Logique existante pour les autres suggestions
        addBotMessage(
          "Je vous aide avec cela ! Que puis-je faire pour vous ?",
          ['Prendre RDV', 'Informations', 'Urgence']
        );
      }
    }, 1000);
  };

  // Advanced scheduling functions
  const generateAvailableSlots = (cabinet: Cabinet, date: string, careType: string) => {
    const selectedCare = careTypes.find(c => c.id === careType);
    const duration = selectedCare?.duration || 30;
    const slots = [];
    
    // Generate realistic availability based on time of day and urgency
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const currentHour = new Date().getHours();
    
    Object.entries(timeSlots).forEach(([period, times]) => {
      times.forEach(time => {
        const [hour] = time.split(':').map(Number);
        
        // Skip past times if today
        if (isToday && hour <= currentHour) return;
        
        // Simulate realistic availability (70% chance)
        const isAvailable = Math.random() > 0.3;
        
        // Emergency slots are more available
        const isEmergencySlot = userPrefs.urgency === 'urgent' || userPrefs.urgency === 'emergency';
        const finalAvailable = isEmergencySlot ? Math.random() > 0.1 : isAvailable;
        
        if (finalAvailable) {
          slots.push({
            time,
            period,
            available: true,
            cabinet: cabinet.id,
            duration,
            price: selectedCare?.price || 0
          });
        }
      });
    });
    
    return slots.slice(0, 8); // Limit to 8 slots per day
  };

  const showNearbyResults = () => {
    if (nearbyCabinets.length > 0) {
      const cabinetsList = nearbyCabinets.map((cabinet, index) => 
        `${index + 1}. 🏥 **${cabinet.name}**
📍 ${cabinet.address} (${cabinet.distance?.toFixed(1)}km)
⭐ ${cabinet.rating}/5 - Disponible ${cabinet.nextAvailable}`
      ).join('\n\n');
      
      addBotMessage(
        `🏥 **Cabinets Nova les plus proches** (triés par distance)

${cabinetsList}

Quel type de soins recherchez-vous ?`,
        undefined,
        careTypes.filter(care => 
          userPrefs.urgency === 'emergency' ? care.urgent : true
        ).slice(0, 4).map(care => ({
          id: care.id,
          label: `${care.icon} ${care.label} (${care.price}€)`,
          type: 'care_type' as const,
          value: care.id
        }))
      );
    }
  };

  const showAvailableSlots = (selectedDate: string) => {
    if (!userPrefs.careType || nearbyCabinets.length === 0) return;
    
    const bestCabinet = nearbyCabinets[0]; // Closest cabinet
    const slots = generateAvailableSlots(bestCabinet, selectedDate, userPrefs.careType);
    
    if (slots.length === 0) {
      addBotMessage(
        `😔 Aucun créneau disponible le ${selectedDate} au ${bestCabinet.name}.

Voulez-vous essayer une autre date ou un autre cabinet ?`,
        undefined,
        [
          { id: 'try_tomorrow', label: '📅 Essayer demain', type: 'confirmation', value: 'try_tomorrow' },
          { id: 'try_other_cabinet', label: '🏥 Essayer un autre cabinet', type: 'confirmation', value: 'try_other_cabinet' },
          { id: 'be_flexible', label: '🤷 Je suis flexible sur la date', type: 'confirmation', value: 'flexible_date' }
        ]
      );
      return;
    }

    const slotsByPeriod = slots.reduce((acc, slot) => {
      if (!acc[slot.period]) acc[slot.period] = [];
      acc[slot.period].push(slot);
      return acc;
    }, {} as Record<string, any[]>);

    let slotsMessage = `📅 **Créneaux disponibles le ${selectedDate}**
🏥 ${bestCabinet.name}

`;
    
    Object.entries(slotsByPeriod).forEach(([period, periodSlots]) => {
      const periodName = {
        morning: '🌅 Matin',
        afternoon: '☀️ Après-midi', 
        evening: '🌙 Soir'
      }[period];
      
      slotsMessage += `**${periodName}**\n`;
      periodSlots.forEach(slot => {
        slotsMessage += `• ${slot.time}\n`;
      });
      slotsMessage += '\n';
    });

    addBotMessage(
      slotsMessage,
      undefined,
      slots.slice(0, 6).map(slot => ({
        id: `slot_${slot.time}`,
        label: `${slot.time} (${slot.period === 'morning' ? '🌅' : slot.period === 'afternoon' ? '☀️' : '🌙'})`,
        type: 'confirmation' as const,
        value: `book_${bestCabinet.id}_${selectedDate}_${slot.time}`
      }))
    );
  };

  const initiateBookingConfirmation = (cabinetId: string, date: string, time: string) => {
    const cabinet = cabinets.find(c => c.id === cabinetId);
    const care = careTypes.find(c => c.id === userPrefs.careType);
    
    if (!cabinet || !care) return;

    setCurrentStep('patient_info');
    addBotMessage(
      `✅ **Récapitulatif de votre rendez-vous**

🏥 **Cabinet** : ${cabinet.name}
📍 **Adresse** : ${cabinet.address}
🩺 **Soin** : ${care.label}
📅 **Date** : ${date}
⏰ **Heure** : ${time}
⏱️ **Durée** : ${care.duration} min
💰 **Tarif** : ${care.price}€

Pour finaliser votre réservation, j'ai besoin de quelques informations personnelles. Êtes-vous déjà patient chez Nova ?`,
      undefined,
      [
        { id: 'existing_patient', label: '👤 Oui, je suis déjà patient', type: 'confirmation', value: 'existing_patient' },
        { id: 'new_patient', label: '🆕 Non, je suis nouveau patient', type: 'confirmation', value: 'new_patient' }
      ]
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    const userInput = inputValue.toLowerCase();
    const originalInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Handle manual address input mode
      if (isManualAddressMode) {
        setIsManualAddressMode(false);
        handleManualAddress(originalInput);
        return;
      }

      // Handle patient form mode
      if (currentStep === 'patient_form') {
        // Handle patient information input
        addBotMessage("📝 Information notée ! Continuons avec les autres détails...");
        return;
      }
      
      // Normal conversation flow
      if (userInput.includes('rdv') || userInput.includes('rendez-vous')) {
        addBotMessage(
          "✨ Excellent ! Je vais vous guider pour votre prise de rendez-vous. Pour commencer, j'ai besoin de votre localisation.",
          undefined,
          [
            { id: 'allow_location', label: '📍 Autoriser la géolocalisation', type: 'location', value: 'auto' },
            { id: 'manual_address', label: '📝 Saisir mon adresse', type: 'location', value: 'manual_address' },
            { id: 'choose_city', label: '🏙️ Choisir une ville', type: 'confirmation', value: 'choose_city' }
          ]
        );
      } else if (userInput.includes('urgent') || userInput.includes('mal') || userInput.includes('douleur')) {
        setUserPrefs(prev => ({ ...prev, urgency: 'urgent' }));
        addBotMessage(
          `🚨 **Situation prioritaire détectée !**

Je vais vous trouver un créneau d'urgence. Où êtes-vous situé ?`,
          undefined,
          [
            { id: 'emergency_location', label: '📍 Ma position GPS', type: 'location', value: 'auto' },
            { id: 'emergency_manual', label: '📝 Saisir mon adresse', type: 'location', value: 'manual_address' },
            { id: 'emergency_call', label: '📞 Appeler directement', type: 'confirmation', value: 'call_emergency' }
          ]
        );
      } else if (userInput.includes('adresse') || userInput.includes('localisation')) {
        addBotMessage(
          "📍 **Localisation requise**\n\nPour vous proposer les cabinets les plus proches, choisissez votre méthode de localisation :",
          undefined,
          [
            { id: 'gps_location', label: '🎯 Géolocalisation précise', type: 'location', value: 'auto' },
            { id: 'manual_address', label: '📝 Saisir mon adresse', type: 'location', value: 'manual_address' },
            { id: 'select_city', label: '🏙️ Sélectionner ma ville', type: 'confirmation', value: 'select_city' }
          ]
        );
      } else {
        addBotMessage(
          "💬 Merci pour votre message ! Comment puis-je vous aider aujourd'hui ?",
          undefined,
          [
            { id: 'book_appointment', label: '📅 Prendre rendez-vous', type: 'confirmation', value: 'start' },
            { id: 'emergency_help', label: '🚨 Urgence dentaire', type: 'urgency', value: 'emergency' },
            { id: 'info_help', label: '❓ Informations et tarifs', type: 'confirmation', value: 'info' }
          ]
        );
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header moderne */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Bot className="w-16 h-16 text-white" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Prise de Rendez-vous IA
            </h1>
            {!isAuthenticated && (
              <div className="mt-6">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all mr-4"
                >
                  🔐 Se connecter
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-50 transition-all"
                >
                  ✨ Créer un compte
                </button>
              </div>
            )}
            {isAuthenticated && user && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
                <p className="text-white font-medium">
                  👤 Connecté en tant que {user.firstName} {user.lastName}
                </p>
              </div>
            )}
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Réservez votre consultation dentaire en 2 minutes avec notre assistant intelligent
            </p>
            
            {/* Badges de confiance */}
            <div className="flex justify-center space-x-6 mb-8">
              <div className="flex items-center space-x-2 text-blue-100">
                <Shield className="w-5 h-5" />
                <span className="text-sm">100% Sécurisé</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Zap className="w-5 h-5" />
                <span className="text-sm">Instantané</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Heart className="w-5 h-5" />
                <span className="text-sm">Personnalisé</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Interface de chat moderne */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* En-tête du chat */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Nova Assistant</h3>
                    <p className="text-blue-100 text-sm">En ligne • Répond en quelques secondes</p>
                  </div>
                </div>
              </div>

              {/* Zone de messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-sm px-6 py-4 rounded-2xl shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        <p className="whitespace-pre-line">{message.content}</p>
                        
                        {/* Quick Actions - Boutons intelligents */}
                        {message.quickActions && (
                          <div className="mt-4 space-y-2">
                            {message.quickActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleQuickAction(action)}
                                className={`block w-full text-left px-4 py-3 rounded-xl transition-all transform hover:scale-105 text-sm font-medium flex items-center justify-between ${
                                  action.type === 'urgency' 
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                    : action.type === 'location'
                                    ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                                    : action.type === 'care_type'
                                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                              >
                                <span>{action.label}</span>
                                <ChevronRight className="w-4 h-4 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Suggestions classiques */}
                        {message.suggestions && !message.quickActions && (
                          <div className="mt-4 space-y-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors text-sm font-medium"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Indicateur de frappe */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="p-6 bg-white border-t border-gray-100">
                {isManualAddressMode && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">Mode saisie d'adresse</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Tapez votre adresse complète (ex: 15 rue de Rivoli, 75001 Paris)
                    </p>
                  </div>
                )}
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      isManualAddressMode 
                        ? "📍 Saisissez votre adresse..." 
                        : currentStep === 'patient_form'
                        ? "📝 Vos informations personnelles..."
                        : "💬 Tapez votre message..."
                    }
                    className={`flex-1 px-6 py-4 border rounded-2xl focus:ring-2 focus:border-transparent transition-all ${
                      isManualAddressMode 
                        ? 'border-blue-300 focus:ring-blue-500 bg-blue-50' 
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    className={`px-8 py-4 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 ${
                      isManualAddressMode
                        ? 'bg-gradient-to-r from-green-600 to-blue-600'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}
                  >
                    {isManualAddressMode ? <Target className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar avec informations */}
          <div className="space-y-6">
            
            {/* Récapitulatif des préférences */}
            {(userPrefs.location.latitude || userPrefs.careType || userPrefs.urgency !== 'normal') && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-blue-600 mr-2" />
                  Vos préférences
                </h3>
                <div className="space-y-3 text-sm">
                  {userPrefs.location.latitude && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <MapPin className={`w-4 h-4 ${userPrefs.location.manual ? 'text-blue-600' : 'text-green-600'}`} />
                        <span className="text-gray-700 font-medium">
                          {userPrefs.location.manual ? 'Adresse saisie' : 'Position GPS'}
                        </span>
                        <CheckCircle2 className={`w-4 h-4 ${userPrefs.location.manual ? 'text-blue-600' : 'text-green-600'}`} />
                      </div>
                      {userPrefs.location.address && (
                        <p className="text-xs text-gray-600 ml-6 truncate">
                          {userPrefs.location.address.length > 40 
                            ? userPrefs.location.address.substring(0, 40) + '...' 
                            : userPrefs.location.address}
                        </p>
                      )}
                      {userPrefs.location.accuracy && (
                        <div className="flex items-center space-x-1 ml-6">
                          <Target className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            ±{Math.round(userPrefs.location.accuracy)}m
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {userPrefs.maxDistance && (
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Rayon : {userPrefs.maxDistance} km</span>
                    </div>
                  )}
                  {userPrefs.careType && (
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">
                        {careTypes.find(c => c.id === userPrefs.careType)?.label}
                      </span>
                    </div>
                  )}
                  {userPrefs.urgency !== 'normal' && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-gray-700">
                        {userPrefs.urgency === 'emergency' ? 'Urgence' : 'Prioritaire'}
                      </span>
                    </div>
                  )}
                </div>
                {nearbyCabinets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      🏥 {nearbyCabinets.length} cabinet(s) trouvé(s)
                    </p>
                    <div className="space-y-1">
                      {nearbyCabinets.slice(0, 2).map((cabinet) => (
                        <div key={cabinet.id} className="text-xs text-gray-600">
                          <span className="font-medium">{cabinet.name}</span>
                          <span className="text-green-600 ml-2">
                            {cabinet.distance?.toFixed(1)}km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Avantages */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pourquoi choisir Nova ?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Géolocalisation intelligente</p>
                    <p className="text-sm text-gray-600">Trouve le cabinet le plus proche</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">IA personnalisée</p>
                    <p className="text-sm text-gray-600">Suggestions adaptées à vos besoins</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Praticiens experts</p>
                    <p className="text-sm text-gray-600">4.9/5 de satisfaction patient</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Données sécurisées</p>
                    <p className="text-sm text-gray-600">Conformité RGPD garantie</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Urgences */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-red-100"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Urgence Dentaire ?</h3>
              </div>
              <p className="text-red-700 text-sm mb-4">
                Douleur intense, dent cassée ? Nous avons des créneaux d'urgence disponibles.
              </p>
              <button
                onClick={() => handleSuggestionClick('Urgence dentaire')}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Demander une urgence
              </button>
            </motion.div>

            {/* Témoignages */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-blue-50 rounded-2xl p-6 shadow-lg border border-blue-100"
            >
              <div className="flex items-center space-x-1 mb-3">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-3 italic">
                "Prise de RDV ultra rapide ! L'assistant IA m'a trouvé un créneau parfait en 2 minutes."
              </p>
              <p className="text-xs text-gray-500">— Marie D., Paris</p>
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
    </div>
  );
}