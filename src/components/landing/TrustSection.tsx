'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import React from 'react';

const testimonials = [
  {
    id: '1',
    name: 'Marie L.',
    location: 'Paris, France',
    rating: 5,
    text: 'Excellent service, équipe très professionnelle. Je recommande vivement !',
    treatment: 'Implant dentaire'
  },
  {
    id: '2',
    name: 'James R.',
    location: 'London, UK',
    rating: 5,
    text: 'Outstanding care and modern facilities. Best dental experience I\'ve had.',
    treatment: 'Orthodontics'
  },
  {
    id: '3',
    name: 'Sarah M.',
    location: 'New York, USA',
    rating: 5,
    text: 'Professional staff, painless procedures. Nova exceeded my expectations.',
    treatment: 'Teeth whitening'
  }
];

export default function TrustSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* En-tête simple */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Plus de 50 000 patients dans le monde choisissent Nova pour leur santé dentaire
          </p>
        </motion.div>

        {/* Témoignages - 3 maximum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              {/* Quote icon */}
              <div className="flex items-center justify-between mb-4">
                <Quote className="w-8 h-8 text-nova-blue opacity-20" />
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              {/* Témoignage */}
              <p className="text-gray-700 mb-4 italic">
                "{testimonial.text}"
              </p>

              {/* Auteur */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-nova-blue font-medium">{testimonial.treatment}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Statistiques de confiance - 3 maximum */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-nova-blue mb-2">50K+</div>
            <p className="text-gray-600">Patients satisfaits</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-nova-blue mb-2">98%</div>
            <p className="text-gray-600">Taux de satisfaction</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-nova-blue mb-2">12</div>
            <p className="text-gray-600">Pays de présence</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
