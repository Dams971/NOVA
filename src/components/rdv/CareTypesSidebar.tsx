'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { careTypes, CareType } from './types';

interface CareTypesSidebarProps {
  selectedCareType: string;
  onSelectCareType: (careId: string, careLabel: string) => void;
  disabled: boolean;
}

export default function CareTypesSidebar({ 
  selectedCareType, 
  onSelectCareType, 
  disabled 
}: CareTypesSidebarProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
        Types de soins
      </h2>
      <div className="space-y-2" role="radiogroup" aria-label="Types de soins disponibles">
        {careTypes.slice(0, 6).map((care: CareType) => (
          <button
            key={care.id}
            onClick={() => onSelectCareType(care.id, care.label)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedCareType === care.id
                ? 'bg-nova-blue text-white shadow-md focus:ring-nova-blue'
                : 'bg-gray-50 hover:bg-gray-100 focus:ring-gray-300'
            }`}
            disabled={disabled}
            role="radio"
            aria-checked={selectedCareType === care.id}
            aria-label={`${care.label}, durée ${care.duration} minutes, prix ${care.price.toLocaleString()} DA`}
          >
            <span className="flex items-center space-x-3">
              <span className="text-xl" aria-hidden="true">{care.icon}</span>
              <div className="text-left">
                <div className={`font-medium ${
                  selectedCareType === care.id ? 'text-white' : 'text-gray-700'
                }`}>
                  {care.label}
                </div>
                <div className={`text-xs ${
                  selectedCareType === care.id ? 'text-white/80' : 'text-gray-500'
                }`}>
                  {care.duration}min • {care.price.toLocaleString()} DA
                </div>
              </div>
            </span>
            <ChevronRight className={`w-4 h-4 transition-colors ${
              selectedCareType === care.id 
                ? 'text-white' 
                : 'text-gray-400 group-hover:text-gray-600'
            }`} aria-hidden="true" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}