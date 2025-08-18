'use client';

import { motion } from 'framer-motion';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Award,
  MapPin,
  Calendar,
  Target,
  Briefcase,
  Heart,
  Star
} from 'lucide-react';
import React from 'react';

interface ExpansionPlan {
  country: string;
  flag: string;
  status: 'active' | 'opening-2024' | 'planned-2025';
  cabinets: number;
  targetCabinets?: number;
  cities: string[];
  opportunities: string[];
}

const expansionPlans: ExpansionPlan[] = [
  {
    country: 'France',
    flag: '🇫🇷',
    status: 'active',
    cabinets: 8,
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
    opportunities: ['Expansion régionale', 'Centres spécialisés']
  },
  {
    country: 'Royaume-Uni',
    flag: '🇬🇧',
    status: 'active',
    cabinets: 4,
    cities: ['Londres', 'Manchester', 'Birmingham'],
    opportunities: ['Nouvelles villes', 'Partenariats NHS']
  },
  {
    country: 'États-Unis',
    flag: '🇺🇸',
    status: 'active',
    cabinets: 6,
    cities: ['New York', 'Los Angeles', 'Miami', 'Chicago'],
    opportunities: ['Côte Ouest', 'Centres urbains']
  },
  {
    country: 'Allemagne',
    flag: '🇩🇪',
    status: 'opening-2024',
    cabinets: 0,
    targetCabinets: 3,
    cities: ['Berlin', 'Munich'],
    opportunities: ['Marché premium', 'Innovation technologique']
  },
  {
    country: 'Japon',
    flag: '🇯🇵',
    status: 'opening-2024',
    cabinets: 0,
    targetCabinets: 2,
    cities: ['Tokyo', 'Osaka'],
    opportunities: ['Marché haut de gamme', 'Technologies avancées']
  },
  {
    country: 'Singapour',
    flag: '🇸🇬',
    status: 'planned-2025',
    cabinets: 0,
    targetCabinets: 2,
    cities: ['Singapour'],
    opportunities: ['Hub Asie-Pacifique', 'Tourisme médical']
  }
];

const globalStats = [
  { label: 'Pays actifs', value: '12', icon: Globe },
  { label: 'Nouveaux marchés 2024', value: '4', icon: TrendingUp },
  { label: 'Praticiens internationaux', value: '150+', icon: Users },
  { label: 'Standards certifiés', value: '100%', icon: Award }
];

export default function InternationalExpansion() {
  return (
    <section className="py-20 bg-white">
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
            Notre Expansion Mondiale
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nova poursuit son développement international avec des ouvertures stratégiques 
            dans les marchés les plus prometteurs du secteur dentaire.
          </p>
        </motion.div>

        {/* Stats globales */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {globalStats.map((stat, _index) => (
            <div key={stat.label} className="text-center">
              <div className="w-16 h-16 bg-nova-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-nova-blue mb-2">{stat.value}</div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Plans d'expansion */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nos Marchés et Opportunités
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expansionPlans.map((plan, index) => (
              <motion.div
                key={plan.country}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{plan.flag}</span>
                    <h4 className="text-lg font-bold text-gray-900">{plan.country}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : plan.status === 'opening-2024'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {plan.status === 'active' ? 'Actif' : 
                     plan.status === 'opening-2024' ? '2024' : '2025'}
                  </div>
                </div>

                {/* Cabinets */}
                <div className="mb-4">
                  {plan.status === 'active' ? (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{plan.cabinets} cabinets actifs</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <Target className="w-4 h-4 mr-2" />
                      <span>{plan.targetCabinets} cabinets prévus</span>
                    </div>
                  )}
                </div>

                {/* Villes */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {plan.cities.map(city => (
                      <span
                        key={city}
                        className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Opportunités */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Opportunités</h5>
                  <ul className="space-y-1">
                    {plan.opportunities.map(opportunity => (
                      <li key={opportunity} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-nova-blue rounded-full mr-2"></div>
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Avantages Nova International */}
        <motion.div
          className="bg-gradient-to-br from-nova-blue to-blue-700 rounded-3xl p-8 md:p-12 text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Pourquoi Choisir Nova International ?</h3>
            <p className="text-white/90 max-w-2xl mx-auto">
              Notre réseau mondial vous offre des avantages uniques, où que vous soyez dans le monde.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Standards Uniformes</h4>
              <p className="text-white/90">
                Même qualité de soins et d'équipements dans tous nos cabinets mondiaux.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Mobilité Internationale</h4>
              <p className="text-white/90">
                Continuité de vos soins lors de vos déplacements professionnels ou personnels.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Expertise Partagée</h4>
              <p className="text-white/90">
                Accès aux meilleures pratiques et innovations de notre réseau mondial.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button className="bg-white text-nova-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              <Calendar className="w-5 h-5 mr-2 inline" />
              Prendre Rendez-vous
            </button>
          </div>
        </motion.div>

        {/* Opportunités de carrière */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Rejoignez Notre Aventure Internationale
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Nova recrute des praticiens passionnés pour accompagner notre expansion mondiale. 
            Découvrez nos opportunités de carrière à l'international.
          </p>
          <button className="bg-nova-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Voir les Opportunités
          </button>
        </motion.div>
      </div>
    </section>
  );
}
