'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Shield,
  Sparkles,
  Scissors,
  Heart,
  Baby,
  Check,
  Info,
  CreditCard,
  FileText
} from 'lucide-react';
import React, { useState } from 'react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  icon: React.ElementType;
  category: 'general' | 'esthetic' | 'surgery' | 'orthodontics' | 'pediatric';
  insuranceCovered: boolean;
}

const services: Service[] = [
  // Soins généraux
  {
    id: '1',
    name: 'Consultation + Bilan',
    description: 'Examen complet, radiographies, plan de traitement',
    price: '60€',
    duration: '45 min',
    icon: Activity,
    category: 'general',
    insuranceCovered: true
  },
  {
    id: '2',
    name: 'Détartrage',
    description: 'Nettoyage professionnel, polissage',
    price: '80€',
    duration: '30 min',
    icon: Sparkles,
    category: 'general',
    insuranceCovered: true
  },
  {
    id: '3',
    name: 'Soin de carie',
    description: 'Composite esthétique, restauration',
    price: '120€',
    duration: '60 min',
    icon: Shield,
    category: 'general',
    insuranceCovered: true
  },
  
  // Esthétique
  {
    id: '4',
    name: 'Blanchiment dentaire',
    description: 'Traitement professionnel au fauteuil',
    price: '350€',
    duration: '90 min',
    icon: Sparkles,
    category: 'esthetic',
    insuranceCovered: false
  },
  {
    id: '5',
    name: 'Facettes céramique',
    description: 'Transformation esthétique complète',
    price: '800€',
    duration: '2h',
    icon: Sparkles,
    category: 'esthetic',
    insuranceCovered: false
  },
  
  // Chirurgie
  {
    id: '6',
    name: 'Extraction simple',
    description: 'Extraction sous anesthésie locale',
    price: '150€',
    duration: '45 min',
    icon: Scissors,
    category: 'surgery',
    insuranceCovered: true
  },
  {
    id: '7',
    name: 'Implant dentaire',
    description: 'Pose d\'implant + couronne céramique',
    price: '1800€',
    duration: '2h',
    icon: Heart,
    category: 'surgery',
    insuranceCovered: false
  },
  
  // Pédodontie
  {
    id: '8',
    name: 'Soin enfant',
    description: 'Consultation et soins adaptés aux enfants',
    price: '45€',
    duration: '30 min',
    icon: Baby,
    category: 'pediatric',
    insuranceCovered: true
  }
];

const categories = [
  { id: 'all', name: 'Tous les soins', icon: Activity },
  { id: 'general', name: 'Soins généraux', icon: Shield },
  { id: 'esthetic', name: 'Esthétique', icon: Sparkles },
  { id: 'surgery', name: 'Chirurgie', icon: Scissors },
  { id: 'pediatric', name: 'Enfants', icon: Baby }
];

export default function ServicesAndPricing() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  const handleBookService = (serviceId: string) => {
    console.warn(`Réserver le service ${serviceId}`);
    // Logique de redirection vers la prise de RDV avec service pré-sélectionné
  };

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Services & Tarifs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Des soins dentaires d'excellence avec une tarification transparente.
            Prise en charge par les assurances santé selon les soins et pays.
          </p>
          
          {/* Informations importantes */}
          <div className="bg-blue-50 rounded-lg p-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Informations importantes</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tiers payant accepté pour tous les soins remboursés</li>
                  <li>• Devis gratuit pour tous les traitements esthétiques</li>
                  <li>• Facilités de paiement disponibles (3x sans frais)</li>
                  <li>• Urgences dentaires prises en charge 24h/7j</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtres par catégorie */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-nova-blue text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Grille des services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {/* En-tête du service */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-nova-blue/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-nova-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.duration}</p>
                    </div>
                  </div>
                  
                  {service.insuranceCovered && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      <Check className="w-3 h-3" />
                      <span>Assurance</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                {/* Prix et action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-nova-blue">{service.price}</span>
                    {service.insuranceCovered && (
                      <p className="text-xs text-green-600">Couvert par assurance santé*</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBookService(service.id)}
                    className="bg-nova-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-nova-blue-dark transition-colors"
                  >
                    Réserver
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Section paiement et assurances */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Moyens de paiement */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-nova-blue rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Moyens de paiement</h3>
            </div>
            
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Carte bancaire (sans contact)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Espèces</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Chèque</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Paiement en 3x sans frais</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Paiement direct assurance (selon pays)</span>
              </li>
            </ul>
          </div>

          {/* Remboursements */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-nova-blue rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Assurances Acceptées</h3>
            </div>
            
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Assurances santé nationales</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Assurances privées internationales</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Assurances expatriés</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Devis détaillé fourni</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Documentation électronique</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Besoin d'un devis personnalisé ?
          </h3>
          <p className="text-gray-600 mb-6">
            Nos praticiens établissent un plan de traitement adapté à vos besoins et votre budget.
          </p>
          <button className="btn-primary">
            Demander un devis gratuit
          </button>

          <p className="text-sm text-gray-500 mt-4">
            * La couverture par assurance santé varie selon les pays et les contrats.
            Nos équipes vous renseignent sur les modalités locales.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
