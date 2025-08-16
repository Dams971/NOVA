'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function AIStatsSidebar() {
  return (
    <motion.div
      className="bg-gradient-to-br from-nova-blue to-nova-blue-light rounded-2xl p-6 text-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <h2 className="text-lg font-heading font-semibold mb-4">Assistant IA</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold font-heading">Claude</div>
          <div className="text-sm text-white/80">3.5 Sonnet</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-heading">24/7</div>
          <div className="text-sm text-white/80">Disponible</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-heading">99%</div>
          <div className="text-sm text-white/80">Précision</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-heading">&lt;3s</div>
          <div className="text-sm text-white/80">Réponse</div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <div className="flex items-center space-x-2 text-sm">
          <Bot className="w-4 h-4" aria-hidden="true" />
          <span>Spécialisé en RDV dentaires</span>
        </div>
      </div>
    </motion.div>
  );
}