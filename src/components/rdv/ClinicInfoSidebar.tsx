'use client';

import { motion } from 'framer-motion';
import { Info, MapPin, Clock, Phone } from 'lucide-react';

interface ClinicInfoSidebarProps {
  onAskForMoreInfo: () => void;
  disabled: boolean;
}

export default function ClinicInfoSidebar({ onAskForMoreInfo, disabled }: ClinicInfoSidebarProps) {
  return (
    <motion.div
      className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-nova-blue mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Cabinet Nova</h2>
          <address className="space-y-2 text-sm text-gray-600 not-italic">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-nova-blue" aria-hidden="true" />
              <span>Cité 109, Daboussy El Achour</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-nova-blue" aria-hidden="true" />
              <span>Lun-Ven 8h-18h, Sam 8h-13h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-nova-blue" aria-hidden="true" />
              <span>+213[567]XXXXXXXX</span>
            </div>
          </address>
          <button
            onClick={onAskForMoreInfo}
            className="mt-3 text-sm font-medium text-nova-blue hover:underline focus:outline-none focus:ring-2 focus:ring-nova-blue focus:ring-offset-1 rounded"
            disabled={disabled}
            aria-label="Demander plus d'informations sur le cabinet"
          >
            Plus d'informations →
          </button>
        </div>
      </div>
    </motion.div>
  );
}