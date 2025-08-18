'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Play, Shield, Award, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { MedicalSkipLinks } from '@/components/ui/accessibility';

export default function Hero() {
  const handleVideoClick = () => {
    // Could open a modal or redirect to video page
    console.warn('Voir la vidéo cliqué');
  };

  // Statistiques essentielles avec crédibilité médicale
  const essentialStats = [
    { icon: Users, value: '25+', unit: 'cabinets', label: 'Dans le monde', description: 'Réseau international certifié' },
    { icon: Clock, value: '24/7', unit: '', label: 'Service disponible', description: 'Assistance médicale continue' },
    { icon: Star, value: '98%', unit: '', label: 'Satisfaction', description: 'Taux de satisfaction patients' },
  ];

  // Indicateurs de confiance médicale
  const trustIndicators = [
    { icon: Shield, text: 'Certifié ISO 9001', description: 'Qualité certifiée internationale' },
    { icon: Award, text: 'Agréé CNAM', description: 'Conventionné Sécurité Sociale' },
    { icon: Users, text: '50k+ patients', description: 'Communauté de patients satisfaits' },
  ];

  return (
    <>
      {/* Medical Skip Links for Accessibility */}
      <MedicalSkipLinks />
      
      <section 
        id="main-content"
        className="relative min-h-screen bg-gradient-to-br from-trust-primary via-primary-400 to-trust-primary overflow-hidden"
        aria-labelledby="hero-title"
        aria-describedby="hero-description"
        role="main"
      >

      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
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
                id="hero-title"
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                L'excellence{' '}
                <span className="relative">
                  dentaire
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-secondary-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    aria-hidden="true"
                  />
                </span>
                , partout dans le monde
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                id="hero-description"
                className="text-xl md:text-2xl text-white/90 mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Des soins dentaires d'exception avec{' '}
                <span className="font-semibold text-secondary-200">des standards internationaux</span>{' '}
                et un service disponible{' '}
                <span className="font-semibold text-secondary-200">24h/24, 7j/7</span>.
              </motion.p>

              {/* Indicateurs de confiance médicale */}
              <motion.div
                className="flex flex-wrap gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                role="group"
                aria-label="Certifications et agréments médicaux"
              >
                {trustIndicators.map((indicator, index) => (
                  <motion.div
                    key={indicator.text}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-medical-medium px-3 py-2"
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    title={indicator.description}
                  >
                    <indicator.icon 
                      className="w-4 h-4 text-secondary-200" 
                      aria-hidden="true" 
                    />
                    <span className="text-sm font-medium text-white">
                      {indicator.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Statistiques */}
              <motion.div
                className="grid grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                role="group"
                aria-label="Statistiques du réseau Nova"
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
                    <div 
                      className="medical-card bg-white/10 backdrop-blur-sm rounded-medical-large p-4 mb-2 border border-white/20 hover:border-secondary-300 transition-colors"
                      role="img"
                      aria-label={`${stat.value}${stat.unit} ${stat.label} - ${stat.description}`}
                    >
                      <stat.icon 
                        className="w-6 h-6 mx-auto mb-2 text-secondary-200" 
                        aria-hidden="true" 
                      />
                      <div className="text-2xl font-bold font-heading text-white">
                        {stat.value}
                        <span className="text-lg">{stat.unit}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{stat.label}</p>
                      <p className="text-xs text-white/70 mt-1">{stat.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Boutons CTA */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                role="group"
                aria-label="Actions principales"
              >
                <Link href="/rdv" className="group">
                  <motion.button
                    className="medical-button-large bg-white text-trust-primary hover:bg-neutral-50 hover:shadow-medical-elevated group medical-focus w-full sm:w-auto"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Prendre rendez-vous médical avec l'assistant IA Nova - Service gratuit et sécurisé"
                  >
                    <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                    <span>Prendre rendez-vous</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </motion.button>
                </Link>

                <Link href="/urgences" className="group">
                  <motion.button
                    className="medical-button-large border-2 border-white text-white hover:bg-white hover:text-trust-primary hover:shadow-medical-elevated emergency-focus w-full sm:w-auto"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Accès urgence dentaire - Prise en charge immédiate 24h/24"
                  >
                    <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
                    <span>Urgence dentaire</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Lien vidéo */}
              <motion.button
                onClick={handleVideoClick}
                className="flex items-center space-x-2 mt-6 text-white/80 hover:text-white transition-colors group medical-focus rounded-medical-medium p-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                whileHover={{ x: 5 }}
                aria-label="Découvrir le réseau Nova en vidéo de présentation, durée 2 minutes - Nouvelle fenêtre"
              >
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-medical-round flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">Découvrir le réseau Nova (2 min)</span>
              </motion.button>
              
              {/* Lien vers les cabinets */}
              <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <Link 
                  href="/cabinets"
                  className="text-white/80 hover:text-white text-sm underline underline-offset-4 hover:underline-offset-2 transition-all medical-focus rounded-medical-small p-1"
                  aria-label="Trouver un cabinet Nova près de chez vous"
                >
                  Trouver un cabinet Nova près de chez vous
                </Link>
              </motion.div>
            </div>

            {/* Illustration médicale côté droit */}
            <div className="relative" role="img" aria-label="Interface de prise de rendez-vous médical Nova">
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {/* Interface médicale */}
                <div className="medical-card bg-white/10 backdrop-blur-sm border border-white/20 p-8 text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-white rounded-medical-round flex items-center justify-center mx-auto mb-6 shadow-medical-elevated">
                    <Calendar className="w-12 h-12 text-trust-primary" aria-hidden="true" />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-4">
                    Prise de RDV Médicale
                  </h2>

                  <p className="text-white/90 text-sm mb-6 leading-relaxed">
                    Interface sécurisée et conforme RGPD pour vos rendez-vous dentaires
                  </p>
                  
                  {/* Indicateurs de sécurité */}
                  <div className="flex justify-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-secondary-200">
                      <Shield className="w-3 h-3" aria-hidden="true" />
                      <span>Sécurisé</span>
                    </span>
                    <span className="flex items-center gap-1 text-secondary-200">
                      <Award className="w-3 h-3" aria-hidden="true" />
                      <span>Certifié</span>
                    </span>
                  </div>
                </div>

                {/* Éléments flottants médicaux */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-status-healthy text-white rounded-medical-round p-3 shadow-medical-success"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                  role="presentation"
                >
                  <Clock className="w-5 h-5" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-secondary-400 text-white rounded-medical-round p-3 shadow-medical-info"
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                  role="presentation"
                >
                  <Shield className="w-5 h-5" />
                </motion.div>

                {/* Badge de disponibilité */}
                <motion.div
                  className="absolute top-4 left-4 bg-status-healthy text-white px-3 py-1 rounded-medical-medium text-xs font-medium shadow-medical-success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  role="status"
                  aria-label="Service disponible"
                >
                  ● Disponible 24/7
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de scroll amélioré */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <button
          onClick={() => {
            const nextSection = document.querySelector('#testimonials, #services, section:nth-of-type(2)')
            nextSection?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="medical-focus p-2 rounded-medical-medium"
          aria-label="Faire défiler vers la section suivante"
        >
          <motion.div
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center hover:border-white/80 transition-colors"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              aria-hidden="true"
            />
          </motion.div>
        </button>
      </motion.div>
    </section>
    </>
  );
}
