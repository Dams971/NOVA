'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Heart, 
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';

const emergencyTypes = [
  {
    id: '1',
    title: 'Douleur dentaire intense',
    description: 'Rage de dent, abcès, inflammation',
    icon: AlertTriangle,
    urgency: 'high'
  },
  {
    id: '2',
    title: 'Traumatisme dentaire',
    description: 'Dent cassée, expulsée, déplacée',
    icon: Heart,
    urgency: 'high'
  },
  {
    id: '3',
    title: 'Saignement important',
    description: 'Hémorragie post-opératoire, gingivale',
    icon: Shield,
    urgency: 'high'
  },
  {
    id: '4',
    title: 'Prothèse cassée',
    description: 'Couronne, bridge, appareil dentaire',
    icon: Zap,
    urgency: 'medium'
  }
];

const emergencyCabinets = [
  {
    id: '1',
    name: 'Nova Châtelet',
    address: '15 Rue de Rivoli, Paris 1er',
    phone: '01 42 33 44 55',
    available: true,
    nextSlot: '15 min'
  },
  {
    id: '2',
    name: 'Nova Opéra',
    address: '8 Boulevard des Capucines, Paris 9ème',
    phone: '01 47 42 85 96',
    available: true,
    nextSlot: '25 min'
  },
  {
    id: '3',
    name: 'Nova République',
    address: '25 Rue du Temple, Paris 3ème',
    phone: '01 42 78 91 23',
    available: false,
    nextSlot: '2h'
  }
];

export default function EmergencySection() {
  const handleEmergencyCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmergencyBooking = () => {
    console.log('Réservation urgence');
    // Logique de redirection vers le formulaire d'urgence
  };

  return (
    <section id="urgences" className="py-20 bg-red-50">
      <div className="container mx-auto px-4">
        {/* En-tête d'urgence */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Service d'urgence 24h/7j</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Urgences Dentaires
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une douleur dentaire ? Un traumatisme ? Notre réseau Nova vous prend en charge 
            rapidement, même en dehors des heures d'ouverture.
          </p>
        </motion.div>

        {/* Numéro d'urgence principal */}
        <motion.div
          className="bg-red-600 text-white rounded-2xl p-8 mb-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Phone className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Ligne d'urgence Nova</h3>
          <a 
            href="tel:+33123456789"
            className="text-4xl font-bold hover:text-red-200 transition-colors"
          >
            01 23 45 67 89
          </a>
          <p className="mt-4 text-red-100">
            Disponible 24h/24 - 7j/7 • Réponse garantie en moins de 5 minutes
          </p>
        </motion.div>

        {/* Types d'urgences */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nous traitons toutes les urgences dentaires
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emergencyTypes.map((emergency, index) => {
              const Icon = emergency.icon;
              return (
                <motion.div
                  key={emergency.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    emergency.urgency === 'high' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{emergency.title}</h4>
                  <p className="text-sm text-gray-600">{emergency.description}</p>
                  
                  <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    emergency.urgency === 'high'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {emergency.urgency === 'high' ? 'Urgence élevée' : 'Urgence modérée'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Cabinets disponibles pour urgences */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Disponibilités en temps réel
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {emergencyCabinets.map((cabinet, index) => (
              <motion.div
                key={cabinet.id}
                className="bg-white rounded-xl p-6 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{cabinet.name}</h4>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{cabinet.address}</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    cabinet.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      cabinet.available ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <span>{cabinet.available ? 'Disponible' : 'Occupé'}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 text-sm mb-4">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Prochain créneau : {cabinet.nextSlot}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEmergencyCall(cabinet.phone)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Appeler
                  </button>
                  {cabinet.available && (
                    <button
                      onClick={handleEmergencyBooking}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Réserver
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Processus d'urgence */}
        <motion.div
          className="bg-white rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Comment ça marche ?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Appelez</h4>
              <p className="text-sm text-gray-600">
                Contactez notre ligne d'urgence 24h/7j
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Évaluation</h4>
              <p className="text-sm text-gray-600">
                Notre équipe évalue l'urgence de votre situation
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Orientation</h4>
              <p className="text-sm text-gray-600">
                Nous vous orientons vers le cabinet le plus proche
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">4. Prise en charge</h4>
              <p className="text-sm text-gray-600">
                Soulagement immédiat de la douleur
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA final */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Une urgence dentaire ?
          </h3>
          <p className="text-gray-600 mb-6">
            N'attendez pas que la douleur s'aggrave. Contactez-nous immédiatement.
          </p>
          <button
            onClick={() => handleEmergencyCall('+33123456789')}
            className="btn-primary bg-red-600 hover:bg-red-700 text-lg px-8 py-4"
          >
            <Phone className="w-5 h-5 mr-2" />
            Appeler maintenant
          </button>
        </motion.div>
      </div>
    </section>
  );
}
