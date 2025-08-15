'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingDown, ArrowRight, Play } from 'lucide-react';
import Navigation from './Navigation';

export default function Hero() {
  const handleAppointmentClick = () => {
    console.log('Prendre rendez-vous cliqué');
    // Logique pour rediriger vers la prise de RDV
  };

  const handleFindCabinetClick = () => {
    console.log('Trouver un cabinet cliqué');
    // Logique pour afficher la carte des cabinets
  };

  const handleVideoClick = () => {
    console.log('Voir la vidéo cliqué');
    // Logique pour ouvrir la vidéo de présentation du réseau
  };

  // Statistiques essentielles (3 maximum selon best practices)
  const essentialStats = [
    { icon: Calendar, value: '25+', unit: 'cabinets', label: 'Dans le monde' },
    { icon: Clock, value: '24/7', unit: '', label: 'Service disponible' },
    { icon: TrendingDown, value: '98%', unit: '', label: 'Satisfaction' },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-nova-blue via-nova-blue-light to-nova-blue-dark overflow-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden">
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

      {/* Contenu principal */}
      <div className="relative z-10 pt-32 pb-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenu textuel */}
            <div className="text-white">
              {/* Badge */}
              <motion.div
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Réseau dentaire international</span>
              </motion.div>

              {/* Titre principal */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                L'excellence{' '}
                <span className="relative">
                  dentaire
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
                , partout dans le monde
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Des soins dentaires d'exception avec{' '}
                <span className="font-semibold text-yellow-400">des standards internationaux</span>{' '}
                et un service disponible{' '}
                <span className="font-semibold text-yellow-400">24h/24, 7j/7</span>.
              </motion.p>

              {/* Statistiques */}
              <motion.div
                className="grid grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {essentialStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-2">
                      <stat.icon className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                      <div className="text-2xl font-bold font-heading">
                        {stat.value}
                        <span className="text-lg">{stat.unit}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Boutons CTA */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <motion.button
                  onClick={handleAppointmentClick}
                  className="btn-primary bg-white text-nova-blue hover:bg-gray-50 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Prendre rendez-vous
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={handleFindCabinetClick}
                  className="btn-secondary border-white text-white hover:bg-white hover:text-nova-blue"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Trouver un cabinet Nova
                </motion.button>
              </motion.div>

              {/* Lien vidéo */}
              <motion.button
                onClick={handleVideoClick}
                className="flex items-center space-x-2 mt-6 text-white/80 hover:text-white transition-colors group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                <span className="text-sm font-medium">Découvrir le réseau Nova (2 min)</span>
              </motion.button>
            </div>

            {/* Illustration/Animation côté droit */}
            <div className="relative">
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {/* Illustration simple Nova */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-nova-blue" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">
                    Prise de RDV Simplifiée
                  </h3>

                  <p className="text-white/90 text-sm">
                    Réservez en ligne dans l'un de nos 25+ cabinets internationaux
                  </p>
                </div>

                {/* Éléments flottants animés */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-green-400 text-white rounded-full p-3 shadow-lg"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Clock className="w-5 h-5" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-yellow-400 text-white rounded-full p-3 shadow-lg"
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <TrendingDown className="w-5 h-5" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de scroll */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
