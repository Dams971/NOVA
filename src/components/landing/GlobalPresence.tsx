'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Users, Award, Calendar, Clock } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  flag: string;
  cabinets: number;
  patients: string;
  status: 'active' | 'expanding' | 'planned';
  cities: string[];
}

const countries: Country[] = [
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    cabinets: 8,
    patients: '15K+',
    status: 'active',
    cities: ['Paris', 'Lyon', 'Marseille']
  },
  {
    id: 'uk',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    cabinets: 4,
    patients: '8K+',
    status: 'active',
    cities: ['Londres', 'Manchester']
  },
  {
    id: 'usa',
    name: 'États-Unis',
    flag: '🇺🇸',
    cabinets: 6,
    patients: '12K+',
    status: 'active',
    cities: ['New York', 'Los Angeles', 'Miami']
  },
  {
    id: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    cabinets: 3,
    patients: '5K+',
    status: 'active',
    cities: ['Toronto', 'Vancouver']
  },
  {
    id: 'uae',
    name: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    cabinets: 2,
    patients: '3K+',
    status: 'expanding',
    cities: ['Dubai', 'Abu Dhabi']
  },
  {
    id: 'singapore',
    name: 'Singapour',
    flag: '🇸🇬',
    cabinets: 1,
    patients: '2K+',
    status: 'expanding',
    cities: ['Singapour']
  },
  {
    id: 'australia',
    name: 'Australie',
    flag: '🇦🇺',
    cabinets: 2,
    patients: '4K+',
    status: 'active',
    cities: ['Sydney', 'Melbourne']
  },
  {
    id: 'japan',
    name: 'Japon',
    flag: '🇯🇵',
    cabinets: 0,
    patients: '0',
    status: 'planned',
    cities: ['Tokyo', 'Osaka']
  },
  {
    id: 'germany',
    name: 'Allemagne',
    flag: '🇩🇪',
    cabinets: 0,
    patients: '0',
    status: 'planned',
    cities: ['Berlin', 'Munich']
  },
  {
    id: 'brazil',
    name: 'Brésil',
    flag: '🇧🇷',
    cabinets: 0,
    patients: '0',
    status: 'planned',
    cities: ['São Paulo', 'Rio de Janeiro']
  },
  {
    id: 'india',
    name: 'Inde',
    flag: '🇮🇳',
    cabinets: 0,
    patients: '0',
    status: 'planned',
    cities: ['Mumbai', 'Delhi']
  },
  {
    id: 'south-africa',
    name: 'Afrique du Sud',
    flag: '🇿🇦',
    cabinets: 0,
    patients: '0',
    status: 'planned',
    cities: ['Le Cap', 'Johannesburg']
  }
];

const statusConfig = {
  active: {
    label: 'Actif',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢'
  },
  expanding: {
    label: 'En expansion',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🟡'
  },
  planned: {
    label: 'Planifié 2024-2025',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🔵'
  }
};

export default function GlobalPresence() {
  const activeCountries = countries.filter(c => c.status === 'active');
  const expandingCountries = countries.filter(c => c.status === 'expanding');
  const plannedCountries = countries.filter(c => c.status === 'planned');

  const totalCabinets = countries.reduce((sum, country) => sum + country.cabinets, 0);
  const totalPatients = '50K+'; // Calculé approximativement

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Présence mondiale</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Nova dans le Monde
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un réseau international en expansion constante, offrant les mêmes standards 
            d'excellence dentaire sur tous les continents.
          </p>
        </motion.div>

        {/* Statistiques globales */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{totalCabinets}+</h3>
            <p className="text-gray-600">Cabinets actifs</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">12</h3>
            <p className="text-gray-600">Pays</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{totalPatients}</h3>
            <p className="text-gray-600">Patients</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">24/7</h3>
            <p className="text-gray-600">Support global</p>
          </div>
        </motion.div>

        {/* Pays actifs */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            🟢 Pays Actifs ({activeCountries.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCountries.map((country, index) => (
              <motion.div
                key={country.id}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{country.name}</h4>
                      <p className="text-sm text-gray-600">{country.cabinets} cabinets</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{country.patients}</p>
                    <p className="text-xs text-gray-500">patients</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {country.cities.map((city, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pays en expansion */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            🟡 En Expansion ({expandingCountries.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expandingCountries.map((country, index) => (
              <motion.div
                key={country.id}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-orange-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{country.name}</h4>
                      <p className="text-sm text-orange-600">Expansion en cours</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">{country.patients}</p>
                    <p className="text-xs text-gray-500">patients</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {country.cities.map((city, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pays planifiés */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            🔵 Expansion Planifiée 2024-2025 ({plannedCountries.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {plannedCountries.map((country, index) => (
              <motion.div
                key={country.id}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 text-center border-2 border-blue-200"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <span className="text-4xl mb-2 block">{country.flag}</span>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{country.name}</h4>
                <p className="text-xs text-blue-600">Bientôt</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Nova arrive bientôt près de chez vous
          </h3>
          <p className="text-gray-600 mb-6">
            Restez informé de nos ouvertures internationales et bénéficiez d'offres exclusives.
          </p>
          <button type="button" className="btn-primary bg-blue-600 hover:bg-blue-700">
            <Globe className="w-4 h-4 mr-2" />
            Suivre l'expansion Nova
          </button>
        </motion.div>
      </div>
    </section>
  );
}
