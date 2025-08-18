'use client';

import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Users, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import React, { useState } from 'react';

interface Cabinet {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  reviews: number;
  specialties: string[];
  image: string;
  practitioners: number;
}

const cabinets: Cabinet[] = [
  {
    id: 'paris-opera',
    name: 'Nova Paris Opéra',
    city: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    address: '15 Avenue de l\'Opéra, 75001 Paris',
    phone: '+33 1 42 96 12 34',
    hours: 'Lun-Ven: 8h-19h, Sam: 9h-17h',
    rating: 4.9,
    reviews: 342,
    specialties: ['Implantologie', 'Orthodontie', 'Esthétique'],
    image: '/images/cabinet-paris.jpg',
    practitioners: 8
  },
  {
    id: 'london-city',
    name: 'Nova London City',
    city: 'Londres',
    country: 'Royaume-Uni',
    flag: '🇬🇧',
    address: '42 Harley Street, London W1G 9PR',
    phone: '+44 20 7123 4567',
    hours: 'Mon-Fri: 8am-7pm, Sat: 9am-5pm',
    rating: 4.8,
    reviews: 287,
    specialties: ['Cosmetic Dentistry', 'Implants', 'Orthodontics'],
    image: '/images/cabinet-london.jpg',
    practitioners: 6
  },
  {
    id: 'nyc-manhattan',
    name: 'Nova Manhattan',
    city: 'New York',
    country: 'États-Unis',
    flag: '🇺🇸',
    address: '350 5th Avenue, New York, NY 10118',
    phone: '+1 212 555 0123',
    hours: 'Mon-Fri: 8am-7pm, Sat: 9am-5pm',
    rating: 4.9,
    reviews: 456,
    specialties: ['Cosmetic Dentistry', 'Implants', 'Periodontics'],
    image: '/images/cabinet-nyc.jpg',
    practitioners: 10
  },
  {
    id: 'toronto-downtown',
    name: 'Nova Toronto Downtown',
    city: 'Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    address: '100 King Street West, Toronto, ON M5X 1C7',
    phone: '+1 416 555 0123',
    hours: 'Mon-Fri: 8am-7pm, Sat: 9am-5pm',
    rating: 4.7,
    reviews: 198,
    specialties: ['General Dentistry', 'Orthodontics', 'Oral Surgery'],
    image: '/images/cabinet-toronto.jpg',
    practitioners: 5
  },
  {
    id: 'sydney-cbd',
    name: 'Nova Sydney CBD',
    city: 'Sydney',
    country: 'Australie',
    flag: '🇦🇺',
    address: '123 George Street, Sydney NSW 2000',
    phone: '+61 2 9123 4567',
    hours: 'Mon-Fri: 8am-6pm, Sat: 9am-4pm',
    rating: 4.8,
    reviews: 234,
    specialties: ['Preventive Care', 'Cosmetic Dentistry', 'Implants'],
    image: '/images/cabinet-sydney.jpg',
    practitioners: 7
  },
  {
    id: 'dubai-marina',
    name: 'Nova Dubai Marina',
    city: 'Dubaï',
    country: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    address: 'Marina Walk, Dubai Marina, Dubai',
    phone: '+971 4 123 4567',
    hours: 'Sun-Thu: 8am-7pm, Fri-Sat: 9am-5pm',
    rating: 4.9,
    reviews: 167,
    specialties: ['Luxury Dentistry', 'Implants', 'Orthodontics'],
    image: '/images/cabinet-dubai.jpg',
    practitioners: 6
  }
];

export default function CabinetsDetails() {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const countries = Array.from(new Set(cabinets.map(c => c.country)));

  const filteredCabinets = selectedCountry === 'all'
    ? cabinets
    : cabinets.filter(c => c.country === selectedCountry);

  const handleBookAppointment = (_cabinetId: string) => {
    // Redirection vers l'interface moderne de prise de rendez-vous
    window.location.href = '/rdv';
  };
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-6">
            Nos Cabinets d'Excellence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Chaque cabinet Nova respecte les mêmes standards internationaux de qualité, 
            avec des équipements de pointe et des praticiens certifiés.
          </p>

          {/* Filtres par pays */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCountry('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCountry === 'all'
                  ? 'bg-nova-blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tous les pays
            </button>
            {countries.map(country => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCountry === country
                    ? 'bg-nova-blue text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grille des cabinets */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCabinets.map((cabinet, index) => (
            <motion.div
              key={cabinet.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              {/* Image du cabinet */}
              <div className="h-48 bg-gradient-to-br from-nova-blue to-blue-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">{cabinet.flag}</div>
                    <div className="text-lg font-semibold">{cabinet.city}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Header du cabinet */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {cabinet.name}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {cabinet.city}, {cabinet.country}
                    </div>
                  </div>
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {cabinet.rating}
                  </div>
                </div>

                {/* Informations pratiques */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Phone className="w-4 h-4 mr-2 text-nova-blue" />
                    {cabinet.phone}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-2 text-nova-blue" />
                    {cabinet.hours}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="w-4 h-4 mr-2 text-nova-blue" />
                    {cabinet.practitioners} praticiens
                  </div>
                </div>

                {/* Spécialités */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {cabinet.specialties.slice(0, 2).map(specialty => (
                      <span
                        key={specialty}
                        className="bg-blue-50 text-nova-blue px-2 py-1 rounded-full text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                    {cabinet.specialties.length > 2 && (
                      <span className="text-gray-500 text-xs">
                        +{cabinet.specialties.length - 2} autres
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleBookAppointment(cabinet.id)}
                    className="flex-1 bg-nova-blue text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Prendre RDV
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats globales */}
        <motion.div
          className="mt-20 bg-white rounded-2xl p-8 shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-nova-blue mb-2">25+</div>
              <p className="text-gray-600">Cabinets</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-nova-blue mb-2">150+</div>
              <p className="text-gray-600">Praticiens</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-nova-blue mb-2">50K+</div>
              <p className="text-gray-600">Patients</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-nova-blue mb-2">4.8</div>
              <p className="text-gray-600">Note moyenne</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
