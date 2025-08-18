'use client';

import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Globe, Clock, Shield } from 'lucide-react';
import React from 'react';

const highlights = [
  {
    icon: Globe,
    title: 'Présence Mondiale',
    description: '25+ cabinets dans 12 pays',
    link: '/international'
  },
  {
    icon: Shield,
    title: 'Excellence Garantie',
    description: 'Standards internationaux uniformes',
    link: '/services'
  },
  {
    icon: Clock,
    title: 'Service 24/7',
    description: 'Urgences prises en charge partout',
    link: '/urgences'
  }
];

export default function GlobalOverview() {
  const handleLearnMore = (link: string) => {
    window.location.href = link;
  };

  const handleFindCabinet = () => {
    window.location.href = '/cabinets';
  };

  return (
    <section className="py-20 bg-white">
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
            Nova dans le Monde
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un réseau international d'excellence dentaire, des standards uniformes partout dans le monde
          </p>
        </motion.div>

        {/* 3 points clés maximum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                className="text-center group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                onClick={() => handleLearnMore(highlight.link)}
              >
                <div className="w-16 h-16 bg-nova-blue rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-nova-blue-dark transition-colors">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-nova-blue transition-colors">
                  {highlight.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {highlight.description}
                </p>
                
                <div className="flex items-center justify-center text-nova-blue group-hover:text-nova-blue-dark transition-colors">
                  <span className="text-sm font-medium mr-2">En savoir plus</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Carte du monde simplifiée */}
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Trouvez votre cabinet Nova
            </h3>
            
            <p className="text-gray-600 mb-8">
              De Paris à New York, de Londres à Dubai, découvrez nos cabinets près de chez vous
            </p>

            {/* Drapeaux des pays principaux */}
            <div className="flex justify-center items-center space-x-6 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🇫🇷</div>
                <p className="text-sm text-gray-600">France</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🇬🇧</div>
                <p className="text-sm text-gray-600">UK</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🇺🇸</div>
                <p className="text-sm text-gray-600">USA</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🇦🇪</div>
                <p className="text-sm text-gray-600">UAE</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🇸🇬</div>
                <p className="text-sm text-gray-600">Singapore</p>
              </div>
              <div className="text-center opacity-50">
                <div className="text-2xl mb-2">+7</div>
                <p className="text-xs text-gray-500">autres pays</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFindCabinet}
              className="btn-primary bg-nova-blue hover:bg-nova-blue-dark group"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Trouver un cabinet
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
