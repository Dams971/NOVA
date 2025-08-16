'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Cabinet {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const cabinets: Cabinet[] = [
  {
    id: '1',
    name: 'Nova Paris Châtelet',
    address: '15 Rue de Rivoli',
    city: 'Paris, France'
  },
  {
    id: '2', 
    name: 'Nova Lyon Part-Dieu',
    address: '25 Avenue Jean Jaurès',
    city: 'Lyon, France'
  }
];

const services: Service[] = [
  { id: '1', name: 'Consultation de contrôle', duration: 30, price: 80 },
  { id: '2', name: 'Détartrage', duration: 45, price: 120 },
  { id: '3', name: 'Soins caries', duration: 60, price: 150 },
  { id: '4', name: 'Urgence dentaire', duration: 30, price: 120 }
];

const timeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '09:30', available: false },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: false },
  { time: '11:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: false },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true }
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedCabinet, setSelectedCabinet] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleSubmit = async () => {
    console.log('Réservation:', {
      cabinet: selectedCabinet,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      patient: patientInfo
    });
    
    // TODO: Appel API pour créer le rendez-vous
    alert('Rendez-vous confirmé ! Vous recevrez un email de confirmation.');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedCabinet && selectedService;
      case 2: return selectedDate;
      case 3: return selectedTime;
      case 4: return patientInfo.firstName && patientInfo.lastName && patientInfo.email && patientInfo.phone;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prendre Rendez-vous</h1>
          <p className="text-gray-600">Réservez votre consultation en quelques étapes</p>
        </div>

        {/* Indicateur de progression */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Étape 1: Cabinet et Service */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                Choisissez votre cabinet et service
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-4">Cabinet</h3>
                  <div className="space-y-3">
                    {cabinets.map((cabinet) => (
                      <label key={cabinet.id} className="block">
                        <input
                          type="radio"
                          name="cabinet"
                          value={cabinet.id}
                          checked={selectedCabinet === cabinet.id}
                          onChange={(e) => setSelectedCabinet(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCabinet === cabinet.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <div className="font-medium">{cabinet.name}</div>
                          <div className="text-sm text-gray-600">{cabinet.address}</div>
                          <div className="text-sm text-gray-600">{cabinet.city}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Service</h3>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <label key={service.id} className="block">
                        <input
                          type="radio"
                          name="service"
                          value={service.id}
                          checked={selectedService === service.id}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedService === service.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600 flex justify-between">
                            <span>{service.duration} min</span>
                            <span>{service.price}€</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Date */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                Choisissez une date
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Étape 3: Heure */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-blue-600" />
                Choisissez un créneau
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-3 rounded-lg font-medium transition-colors ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white'
                        : slot.available
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 4: Informations patient */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Vos informations
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={patientInfo.firstName}
                    onChange={(e) => setPatientInfo({...patientInfo, firstName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    value={patientInfo.lastName}
                    onChange={(e) => setPatientInfo({...patientInfo, lastName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={patientInfo.email}
                    onChange={(e) => setPatientInfo({...patientInfo, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={patientInfo.phone}
                    onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-2">Notes (optionnel)</label>
                  <textarea
                    value={patientInfo.notes}
                    onChange={(e) => setPatientInfo({...patientInfo, notes: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Précisions sur votre demande..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : window.history.back()}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Retour
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Confirmer le RDV
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}