'use client';

import { X, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppointmentFormData, careTypes } from './types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AppointmentFormData;
  onSubmit: (data: unknown) => Promise<void>;
  loading: boolean;
}

export default function AppointmentFormModal({
  isOpen,
  onClose,
  formData,
  onSubmit,
  loading
}: AppointmentFormModalProps) {
  const [form, setForm] = useState(formData);
  
  const careTypeData = careTypes.find(c => c.id === form.appointment.careType);

  const handleSubmit = async () => {
    await onSubmit({
      patient: {
        ...form.patient,
        gdprConsent: {
          dataProcessing: { consent: form.patient.gdprConsent, date: new Date().toISOString() }
        }
      },
      appointment: form.appointment
    });
  };

  const isFormValid = form.patient.firstName && 
                     form.patient.lastName && 
                     form.patient.phoneE164 && 
                     form.patient.gdprConsent;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="form-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 id="form-title" className="text-xl font-heading font-semibold text-gray-900">
                Confirmer le RDV
              </h1>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Fermer le formulaire"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Résumé du RDV */}
              <div className="bg-nova-blue/10 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-2">Votre rendez-vous</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span>{new Date(`${form.appointment.date}T${form.appointment.time}`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>{form.appointment.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg" aria-hidden="true">{careTypeData?.icon}</span>
                    <span>{careTypeData?.label} ({careTypeData?.duration}min)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{careTypeData?.price.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>
              
              {/* Informations patient */}
              <fieldset className="space-y-3">
                <legend className="font-semibold text-gray-900">Vos informations</legend>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="sr-only">Prénom</label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Prénom"
                      value={form.patient.firstName}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        patient: { ...prev.patient, firstName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="sr-only">Nom</label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Nom"
                      value={form.patient.lastName}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        patient: { ...prev.patient, lastName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="sr-only">Téléphone</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Téléphone (+213XXXXXXXXX)"
                    value={form.patient.phoneE164}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      patient: { ...prev.patient, phoneE164: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
                    pattern="^\+213[567]\d{8}$"
                    required
                    aria-required="true"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="sr-only">Email (optionnel)</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email (optionnel)"
                    value={form.patient.email || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      patient: { ...prev.patient, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="reason" className="sr-only">Motif ou précisions (optionnel)</label>
                  <textarea
                    id="reason"
                    placeholder="Motif ou précisions (optionnel)"
                    value={form.appointment.reason || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      appointment: { ...prev.appointment, reason: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nova-blue resize-none"
                    rows={2}
                  />
                </div>
              </fieldset>
              
              {/* Consentement RGPD */}
              <label className="flex items-start space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.patient.gdprConsent}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    patient: { ...prev.patient, gdprConsent: e.target.checked }
                  }))}
                  className="mt-1 h-4 w-4 text-nova-blue focus:ring-nova-blue border-gray-300 rounded"
                  required
                  aria-required="true"
                />
                <span className="text-gray-600">
                  J'accepte le traitement de mes données personnelles pour la prise de rendez-vous (requis)
                </span>
              </label>
              
              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isFormValid}
                  className="flex-1 px-4 py-2 bg-nova-blue text-white rounded-lg hover:bg-nova-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-nova-blue focus:ring-offset-2"
                  aria-label={loading ? 'Création du rendez-vous en cours' : 'Confirmer le rendez-vous'}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Confirmer le RDV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}