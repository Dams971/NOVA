'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Bot } from 'lucide-react';

interface RDVHeroSectionProps {
  isAuthenticated: boolean;
  userFirstName?: string;
}

export default function RDVHeroSection({ isAuthenticated: _isAuthenticated, userFirstName }: RDVHeroSectionProps) {
  return (
    <section 
      className="relative overflow-hidden"
      role="banner"
      aria-label="Section d'en-tête de l'assistant IA"
    >
      {/* Éléments décoratifs animés */}
      <div className="absolute inset-0" aria-hidden="true">
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

      {/* Header Content */}
      <div className="relative z-10 pt-32 pb-12">
        <div className="container-custom">
          <motion.div
            className="text-center text-white mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Assistant disponible 24/7</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
              Assistant IA{' '}
              <span className="relative">
                Nova
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Prenez rendez-vous en <span className="font-semibold text-yellow-400">langage naturel</span> avec notre IA spécialisée
            </p>

            {/* Trust indicators */}
            <div className="flex justify-center space-x-8 mt-8">
              <div className="flex items-center space-x-2 text-white/80">
                <Shield className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">100% Sécurisé</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Zap className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Instantané</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Bot className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">IA Avancée</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}