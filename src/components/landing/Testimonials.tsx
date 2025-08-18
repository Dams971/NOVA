'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote, MapPin } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  title: string;
  cabinet: string;
  location: string;
  image: string;
  rating: number;
  quote: string;
  results: {
    rdvIncrease: string;
    noShowReduction: string;
    timeSaved: string;
  };
}

export default function Testimonials() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Données mockées de témoignages de dentistes
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Dr. Marie Dubois",
      title: "Chirurgien-dentiste",
      cabinet: "Cabinet Dentaire Dubois",
      location: "Paris 16ème",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Nova a révolutionné notre cabinet ! Nos patients adorent la simplicité de prise de RDV et nous avons divisé par 3 nos no-show. L'IA comprend parfaitement les demandes et optimise notre planning automatiquement.",
      results: {
        rdvIncrease: "+45%",
        noShowReduction: "-67%",
        timeSaved: "8h/semaine"
      }
    },
    {
      id: 2,
      name: "Dr. Jean-Pierre Martin",
      title: "Orthodontiste",
      cabinet: "Centre d'Orthodontie Martin",
      location: "Lyon 6ème",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Incroyable ! Nova gère nos RDV 24h/24 avec une précision remarquable. Nos patients peuvent prendre RDV même le weekend et les rappels automatiques ont éliminé presque tous nos oublis.",
      results: {
        rdvIncrease: "+38%",
        noShowReduction: "-72%",
        timeSaved: "6h/semaine"
      }
    },
    {
      id: 3,
      name: "Dr. Sophie Leroy",
      title: "Parodontiste",
      cabinet: "Clinique Dentaire Leroy",
      location: "Marseille 8ème",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "L'intégration avec notre système existant s'est faite en douceur. Nova comprend les spécificités de nos traitements parodontaux et propose automatiquement les bons créneaux selon la durée nécessaire.",
      results: {
        rdvIncrease: "+52%",
        noShowReduction: "-58%",
        timeSaved: "10h/semaine"
      }
    },
    {
      id: 4,
      name: "Dr. Thomas Rousseau",
      title: "Implantologue",
      cabinet: "Cabinet d'Implantologie Rousseau",
      location: "Toulouse Centre",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Nova a transformé notre relation patient. L'IA pose les bonnes questions, explique les procédures et rassure nos patients avant même leur arrivée. Notre taux de satisfaction a explosé !",
      results: {
        rdvIncrease: "+41%",
        noShowReduction: "-63%",
        timeSaved: "7h/semaine"
      }
    }
  ];

  // Auto-play du carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section ref={sectionRef} className="section-padding bg-beige-warm">
      <div className="container-custom">
        {/* En-tête de section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Ils ont transformé leur cabinet avec Nova
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez comment nos dentistes partenaires ont révolutionné leur gestion des rendez-vous
          </p>
        </motion.div>

        {/* Carousel principal */}
        <motion.div
          className="relative max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="p-8 md:p-12"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div className="grid lg:grid-cols-3 gap-8 items-center">
                  {/* Photo et informations du dentiste */}
                  <div className="text-center lg:text-left">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 mx-auto lg:mx-0 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-nova-blue to-nova-blue-light flex items-center justify-center text-white text-2xl font-bold">
                          {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2">
                        <Quote className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-heading font-bold text-gray-900 mb-1">
                      {testimonials[currentIndex].name}
                    </h3>
                    <p className="text-nova-blue font-medium mb-2">
                      {testimonials[currentIndex].title}
                    </p>
                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{testimonials[currentIndex].location}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex justify-center lg:justify-start space-x-1 mb-4">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 font-medium">
                      {testimonials[currentIndex].cabinet}
                    </p>
                  </div>

                  {/* Témoignage */}
                  <div className="lg:col-span-2">
                    <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 italic">
                      "{testimonials[currentIndex].quote}"
                    </blockquote>

                    {/* Résultats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-nova-blue/10 rounded-lg">
                        <div className="text-2xl font-bold text-nova-blue mb-1">
                          {testimonials[currentIndex].results.rdvIncrease}
                        </div>
                        <div className="text-sm text-gray-600">RDV en plus</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {testimonials[currentIndex].results.noShowReduction}
                        </div>
                        <div className="text-sm text-gray-600">No-show</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                          {testimonials[currentIndex].results.timeSaved}
                        </div>
                        <div className="text-sm text-gray-600">Temps gagné</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Boutons de navigation */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors group"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-nova-blue transition-colors" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors group"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-nova-blue transition-colors" />
            </button>
          </div>

          {/* Indicateurs de pagination */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-nova-blue w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Statistiques globales */}
        <motion.div
          className="mt-16 grid md:grid-cols-4 gap-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div>
            <div className="text-3xl font-heading font-bold text-nova-blue mb-2">500+</div>
            <div className="text-gray-600">Cabinets partenaires</div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-green-600 mb-2">-65%</div>
            <div className="text-gray-600">No-show moyen</div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-yellow-600 mb-2">24/7</div>
            <div className="text-gray-600">Disponibilité</div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-purple-600 mb-2">98%</div>
            <div className="text-gray-600">Satisfaction</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
