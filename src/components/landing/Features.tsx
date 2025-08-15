'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { 
  PhoneOff, 
  Clock, 
  Users, 
  MessageCircle, 
  Calendar, 
  Bell, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';

// Hook pour animer les compteurs
function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * (end - start) + start));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isActive, end, duration, start]);

  return { count, setIsActive };
}

export default function Features() {
  const problemsRef = useRef(null);
  const solutionRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);

  const problemsInView = useInView(problemsRef, { once: true, margin: '-100px' });
  const solutionInView = useInView(solutionRef, { once: true, margin: '-100px' });
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });

  // Statistiques animées
  const { count: rdvTime, setIsActive: setRdvActive } = useCountUp(60);
  const { count: noShowReduction, setIsActive: setNoShowActive } = useCountUp(67);
  const { count: satisfaction, setIsActive: setSatisfactionActive } = useCountUp(94);

  useEffect(() => {
    if (statsInView) {
      setRdvActive(true);
      setNoShowActive(true);
      setSatisfactionActive(true);
    }
  }, [statsInView, setRdvActive, setNoShowActive, setSatisfactionActive]);

  const problems = [
    {
      icon: PhoneOff,
      title: 'Appels manqués constants',
      description: 'Vos patients appellent en dehors des heures d\'ouverture et abandonnent.',
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      icon: Clock,
      title: 'Temps perdu en gestion',
      description: 'Votre équipe passe des heures à gérer les rendez-vous au lieu de soigner.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Users,
      title: 'No-show récurrents',
      description: 'Les patients oublient leurs RDV, créant des créneaux vides coûteux.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const features = [
    {
      icon: MessageCircle,
      title: 'Chatbot IA Conversationnel',
      description: 'Interface naturelle qui comprend les demandes patients et gère les RDV 24/7.',
      image: '/api/placeholder/400/300',
      reverse: false
    },
    {
      icon: Calendar,
      title: 'Calendrier Intelligent',
      description: 'Synchronisation automatique avec votre agenda, optimisation des créneaux.',
      image: '/api/placeholder/400/300',
      reverse: true
    },
    {
      icon: Bell,
      title: 'Rappels Automatisés',
      description: 'SMS et emails personnalisés pour réduire drastiquement les no-show.',
      image: '/api/placeholder/400/300',
      reverse: false
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Suivi en temps réel de vos performances et insights pour optimiser votre cabinet.',
      image: '/api/placeholder/400/300',
      reverse: true
    }
  ];

  return (
    <div className="bg-white">
      {/* Section Problèmes */}
      <section ref={problemsRef} className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={problemsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Les défis quotidiens de votre cabinet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous comprenons les difficultés que vous rencontrez. 
              C'est pourquoi nous avons créé Nova.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={problemsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-16 h-16 ${problem.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                  <problem.icon className={`w-8 h-8 ${problem.color}`} />
                </div>
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  {problem.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Solution */}
      <section ref={solutionRef} className="section-padding bg-nova-blue text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={solutionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Solution Nova</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                Une IA qui révolutionne votre gestion
              </h2>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Nova transforme chaque interaction patient en opportunité. 
                Automatisation intelligente, disponibilité 24/7, et réduction drastique des no-show.
              </p>

              <div className="space-y-4">
                {[
                  'Prise de RDV automatisée en moins de 60 secondes',
                  'Réduction des no-show de 67% en moyenne',
                  'Disponibilité 24h/24, 7j/7 pour vos patients',
                  'Intégration parfaite avec votre agenda existant'
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={solutionInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={solutionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Mockup dashboard */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Dashboard Nova</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-nova-blue/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-nova-blue">127</div>
                    <div className="text-sm text-gray-600">RDV ce mois</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-gray-600">Taux présence</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-nova-blue rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Marie Dupont</div>
                        <div className="text-sm text-gray-600">Détartrage - 14h30</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-nova-blue rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Jean Martin</div>
                        <div className="text-sm text-gray-600">Consultation - 16h00</div>
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section ref={statsRef} className="section-padding bg-beige-warm">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Des résultats qui parlent d'eux-mêmes
            </h2>
            <p className="text-xl text-gray-600">
              Nos cabinets partenaires constatent des améliorations immédiates
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="text-center bg-white rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-heading font-bold text-nova-blue mb-2">
                {rdvTime}s
              </div>
              <div className="text-gray-600 font-medium">Temps moyen de prise de RDV</div>
            </motion.div>

            <motion.div
              className="text-center bg-white rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-4xl md:text-5xl font-heading font-bold text-green-600 mb-2">
                -{noShowReduction}%
              </div>
              <div className="text-gray-600 font-medium">Réduction des no-show</div>
            </motion.div>

            <motion.div
              className="text-center bg-white rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="text-4xl md:text-5xl font-heading font-bold text-yellow-600 mb-2">
                {satisfaction}%
              </div>
              <div className="text-gray-600 font-medium">Satisfaction patients</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités détaillées */}
      <section ref={featuresRef} className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Fonctionnalités qui transforment votre cabinet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment Nova révolutionne chaque aspect de la gestion de vos rendez-vous
            </p>
          </motion.div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  feature.reverse ? 'lg:grid-flow-col-dense' : ''
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <div className={feature.reverse ? 'lg:col-start-2' : ''}>
                  <div className="inline-flex items-center space-x-2 bg-nova-blue/10 rounded-full px-4 py-2 mb-6">
                    <feature.icon className="w-4 h-4 text-nova-blue" />
                    <span className="text-sm font-medium text-nova-blue">Fonctionnalité</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  <motion.button
                    className="inline-flex items-center space-x-2 text-nova-blue font-semibold hover:text-nova-blue-dark transition-colors group"
                    whileHover={{ x: 5 }}
                  >
                    <span>En savoir plus</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>

                <div className={`relative ${feature.reverse ? 'lg:col-start-1' : ''}`}>
                  {/* Mockup spécifique à chaque fonctionnalité */}
                  {index === 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 shadow-lg">
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <MessageCircle className="w-5 h-5 text-nova-blue" />
                          <span className="font-semibold text-nova-blue">Chat Nova</span>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
                        </div>
                        <div className="space-y-3">
                          <div className="bg-gray-100 rounded-lg p-3 text-sm">
                            👋 Bonjour ! Comment puis-je vous aider aujourd'hui ?
                          </div>
                          <div className="bg-nova-blue text-white rounded-lg p-3 text-sm ml-8">
                            J'aimerais prendre RDV pour un détartrage
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3 text-sm">
                            Parfait ! Quand seriez-vous disponible ? 📅
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        ⚡ Réponse instantanée • 🧠 IA conversationnelle
                      </div>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Calendrier Intelligent</h4>
                        <Calendar className="w-5 h-5 text-nova-blue" />
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-4">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                          <div key={i} className="text-center text-xs font-medium text-gray-500 p-2">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: 35 }, (_, i) => (
                          <div
                            key={i}
                            className={`aspect-square flex items-center justify-center text-xs rounded ${
                              i === 15 ? 'bg-nova-blue text-white' :
                              i === 22 ? 'bg-green-100 text-green-700' :
                              i === 8 ? 'bg-yellow-100 text-yellow-700' :
                              'hover:bg-gray-100'
                            }`}
                          >
                            {i > 6 && i < 28 ? i - 6 : ''}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        🟦 Disponible • 🟩 Réservé • 🟨 Rappel envoyé
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border">
                      <div className="flex items-center space-x-2 mb-4">
                        <Bell className="w-5 h-5 text-nova-blue" />
                        <h4 className="font-semibold text-gray-900">Rappels Automatiques</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            📧
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Email J-3</div>
                            <div className="text-xs text-gray-600">Rappel de confirmation</div>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            📱
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">SMS J-1</div>
                            <div className="text-xs text-gray-600">Rappel final</div>
                          </div>
                          <Clock className="w-4 h-4 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 3 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border">
                      <div className="flex items-center space-x-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-nova-blue" />
                        <h4 className="font-semibold text-gray-900">Analytics Dashboard</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-nova-blue/10 rounded-lg">
                          <div className="text-lg font-bold text-nova-blue">156</div>
                          <div className="text-xs text-gray-600">RDV ce mois</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">+23%</div>
                          <div className="text-xs text-gray-600">vs mois dernier</div>
                        </div>
                      </div>
                      <div className="h-20 bg-gradient-to-r from-nova-blue/20 to-nova-blue/5 rounded-lg flex items-end justify-between p-2">
                        {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                          <div
                            key={i}
                            className="bg-nova-blue rounded-sm w-3"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
