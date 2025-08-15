'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Calendar, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Shield, 
  Clock,
  Users,
  Star
} from 'lucide-react';

export default function CallToAction() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const handleBookAppointmentClick = () => {
    console.log('Prendre rendez-vous cliqué');
    // Logique pour rediriger vers la prise de RDV
  };

  const handleCallClick = () => {
    console.log('Appeler maintenant cliqué');
    // Logique pour appeler le cabinet
    window.location.href = 'tel:+33123456789';
  };

  // Simplifié à 3 points maximum (best practices)
  const benefits = [
    {
      icon: Clock,
      text: "Rendez-vous en moins de 48h"
    },
    {
      icon: Shield,
      text: "Standards internationaux"
    },
    {
      icon: Star,
      text: "98% de satisfaction"
    }
  ];

  const guarantees = [
    "✅ Sans engagement de durée",
    "✅ 2 mois gratuits pour tester",
    "✅ Migration de vos données incluse",
    "✅ Annulation possible à tout moment"
  ];

  return (
    <section ref={sectionRef} className="section-padding bg-gradient-to-br from-nova-blue via-nova-blue-light to-nova-blue-dark text-white relative overflow-hidden">
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

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge d'urgence */}
          <motion.div
            className="inline-flex items-center space-x-2 bg-yellow-400 text-gray-900 rounded-full px-6 py-3 mb-8 font-semibold"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Zap className="w-5 h-5" />
            <span>Expansion mondiale - Nouveaux cabinets</span>
          </motion.div>

          {/* Titre principal */}
          <motion.h2
            className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Prêt à prendre soin de votre sourire ?
          </motion.h2>

          {/* Sous-titre */}
          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Rejoignez les 50 000+ patients dans 12 pays qui font confiance au réseau Nova international
          </motion.p>

          {/* Boutons CTA principaux */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              onClick={handleBookAppointmentClick}
              className="btn-primary bg-white text-nova-blue hover:bg-gray-50 text-lg px-10 py-5 group shadow-2xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="w-6 h-6 mr-3" />
              Prendre rendez-vous
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              onClick={handleCallClick}
              className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-nova-blue text-lg px-10 py-5 group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-6 h-6 mr-3" />
              Appeler maintenant
            </motion.button>
          </motion.div>

          {/* Garanties */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h3 className="text-xl font-heading font-semibold mb-6">
              Sans engagement, 2 mois gratuits
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              {guarantees.map((guarantee, index) => (
                <motion.div
                  key={guarantee}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                >
                  <span className="text-white/90">{guarantee}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Avantages */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-white/90 font-medium">{benefit.text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Urgence et social proof */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <p className="text-white/80 mb-4">
              🔥 <strong>Dernière chance :</strong> Seulement 50 places disponibles ce mois-ci
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-white/70">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>500+ cabinets conquis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>4.9/5 satisfaction</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Certifié RGPD</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section contact rapide */}
        <motion.div
          className="mt-16 pt-12 border-t border-white/20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <h3 className="text-xl font-heading font-semibold mb-6">
            Une question ? Parlons-en directement
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+33123456789"
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
            >
              <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">01 23 45 67 89</span>
            </a>
            <div className="hidden sm:block w-px h-6 bg-white/30" />
            <a
              href="mailto:contact@nova-dental.fr"
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">✉️</span>
              <span className="font-medium">contact@nova-dental.fr</span>
            </a>
          </div>
          <p className="text-white/60 text-sm mt-4">
            Réponse garantie sous 2h en journée • Équipe francophone dédiée
          </p>
        </motion.div>
      </div>
    </section>
  );
}
