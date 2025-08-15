'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Calendar, Users, Award, Mail } from 'lucide-react';

interface Cabinet {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  rating: number;
  reviews: number;
  specialties: string[];
  image: string;
  status: 'open' | 'opening-soon' | 'planned';
}

const cabinets: Cabinet[] = [
  // France - Paris
  {
    id: '1',
    name: 'Nova Paris Châtelet',
    address: '15 Rue de Rivoli',
    city: 'Paris, France 🇫🇷',
    phone: '+33 1 42 33 44 55',
    hours: '8h-20h',
    rating: 4.9,
    reviews: 247,
    specialties: ['Implantologie', 'Orthodontie', 'Esthétique'],
    image: '/images/cabinet-chatelet.jpg',
    status: 'open'
  },
  {
    id: '2',
    name: 'Nova Paris Opéra',
    address: '8 Boulevard des Capucines',
    city: 'Paris, France 🇫🇷',
    phone: '+33 1 47 42 85 96',
    hours: '8h-19h',
    rating: 4.8,
    reviews: 189,
    specialties: ['Parodontologie', 'Chirurgie', 'Prothèses'],
    image: '/images/cabinet-opera.jpg',
    status: 'open'
  },
  // Royaume-Uni - Londres
  {
    id: '3',
    name: 'Nova London Mayfair',
    address: '25 Bond Street',
    city: 'London, UK 🇬🇧',
    phone: '+44 20 7123 4567',
    hours: '9h-18h',
    rating: 4.7,
    reviews: 156,
    specialties: ['Dentisterie générale', 'Esthétique', 'Urgences'],
    image: '/images/cabinet-london.jpg',
    status: 'open'
  },
  // États-Unis - New York
  {
    id: '4',
    name: 'Nova NYC Manhattan',
    address: '350 5th Avenue',
    city: 'New York, USA 🇺🇸',
    phone: '+1 212 555 0123',
    hours: '8h30-19h30',
    rating: 4.6,
    reviews: 203,
    specialties: ['Implantologie', 'Esthétique', 'Orthodontie'],
    image: '/images/cabinet-nyc.jpg',
    status: 'open'
  },
  // Dubaï - En ouverture
  {
    id: '5',
    name: 'Nova Dubai Marina',
    address: 'Dubai Marina Mall',
    city: 'Dubai, UAE 🇦🇪',
    phone: '+971 4 123 4567',
    hours: '8h-20h',
    rating: 0,
    reviews: 0,
    specialties: ['Chirurgie', 'Implantologie', 'Esthétique VIP'],
    image: '/images/cabinet-dubai.jpg',
    status: 'opening-soon'
  },
  // Singapour - En projet
  {
    id: '6',
    name: 'Nova Singapore Orchard',
    address: 'Orchard Road',
    city: 'Singapore 🇸🇬',
    phone: '+65 6123 4567',
    hours: '8h-20h',
    rating: 0,
    reviews: 0,
    specialties: ['Dentisterie digitale', 'Implantologie', 'Esthétique'],
    image: '/images/cabinet-singapore.jpg',
    status: 'planned'
  }
];

const statusConfig = {
  open: {
    label: 'Ouvert',
    color: 'bg-green-100 text-green-800',
    icon: '🟢'
  },
  'opening-soon': {
    label: 'Ouverture prochaine',
    color: 'bg-orange-100 text-orange-800',
    icon: '🟡'
  },
  planned: {
    label: 'En projet',
    color: 'bg-blue-100 text-blue-800',
    icon: '🔵'
  }
};

export default function CabinetsNetwork() {
  const handleBookAppointment = (cabinetId: string) => {
    // Redirection vers l'interface moderne de prise de rendez-vous
    window.location.href = '/rdv';
  };

  const handleViewDetails = (cabinetId: string) => {
    console.log(`Voir détails du cabinet ${cabinetId}`);
    // Logique pour afficher les détails du cabinet
  };

  return (
    <section id="cabinets" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* En-tête de section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Le Réseau Nova International
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            25+ cabinets dentaires d'excellence dans 12 pays, équipés des dernières technologies
            pour vous offrir les meilleurs soins avec des standards internationaux.
          </p>
        </motion.div>

        {/* Statistiques du réseau */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-nova-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">150+</h3>
            <p className="text-gray-600">Praticiens dans le monde</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-nova-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">50K+</h3>
            <p className="text-gray-600">Patients internationaux</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-nova-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">12</h3>
            <p className="text-gray-600">Pays de présence</p>
          </div>
        </motion.div>

        {/* Liste des cabinets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cabinets.map((cabinet, index) => (
            <motion.div
              key={cabinet.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {/* Image du cabinet */}
              <div className="h-48 bg-gradient-to-br from-nova-blue to-blue-600 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[cabinet.status].color}`}>
                    {statusConfig[cabinet.status].icon} {statusConfig[cabinet.status].label}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{cabinet.name}</h3>
                  <p className="text-white/90">{cabinet.city}</p>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {/* Adresse et contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{cabinet.address}, {cabinet.city}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{cabinet.hours}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{cabinet.phone}</span>
                  </div>
                </div>

                {/* Note et avis */}
                {cabinet.status === 'open' && (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-900">{cabinet.rating}</span>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">({cabinet.reviews} avis)</span>
                  </div>
                )}

                {/* Spécialités */}
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Spécialités :</p>
                  <div className="flex flex-wrap gap-1">
                    {cabinet.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {cabinet.status === 'open' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleBookAppointment(cabinet.id)}
                        className="flex-1 bg-nova-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-nova-blue-dark transition-colors"
                      >
                        Prendre RDV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(cabinet.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Détails
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewDetails(cabinet.id)}
                      className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                      disabled
                    >
                      {cabinet.status === 'opening-soon' ? 'Bientôt disponible' : 'En projet'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Vous ne trouvez pas de cabinet près de chez vous ?
          </h3>
          <p className="text-gray-600 mb-6">
            Le réseau Nova s'agrandit ! Restez informé de nos prochaines ouvertures.
          </p>
          <button type="button" className="btn-primary">
            <Mail className="w-4 h-4 mr-2" />
            Être notifié des ouvertures
          </button>
        </motion.div>
      </div>
    </section>
  );
}
