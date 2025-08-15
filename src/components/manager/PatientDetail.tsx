'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  X, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  FileText,
  Plus,
  MessageCircle,
  Clock,
  Stethoscope,
  Pill,
  Activity
} from 'lucide-react';
import { Patient, MedicalRecord } from '@/lib/models/patient';
import { PatientService } from '@/lib/services/patient-service';
import { PatientCommunicationService, CommunicationHistory } from '@/lib/services/patient-communication-service';
import MedicalHistorySection from './MedicalHistorySection';
import CommunicationHistorySection from './CommunicationHistorySection';

interface PatientDetailProps {
  patient: Patient;
  onEdit: () => void;
  onClose: () => void;
}

type TabType = 'overview' | 'medical' | 'communication' | 'appointments';

export default function PatientDetail({ patient, onEdit, onClose }: PatientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const patientService = PatientService.getInstance();
  const communicationService = PatientCommunicationService.getInstance();

  useEffect(() => {
    if (activeTab === 'communication') {
      loadCommunicationHistory();
    }
  }, [activeTab, patient.id]);

  const loadCommunicationHistory = async () => {
    setLoading(true);
    try {
      const result = await communicationService.getCommunicationHistory(patient.id);
      if (result.success && result.data) {
        setCommunicationHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to load communication history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male': return 'Homme';
      case 'female': return 'Femme';
      case 'other': return 'Autre';
      default: return 'Non spécifié';
    }
  };

  const getMedicalSummary = () => {
    const allergies = patient.medicalHistory.filter(r => r.type === 'allergy');
    const medications = patient.medicalHistory.filter(r => r.type === 'medication');
    const treatments = patient.medicalHistory.filter(r => r.type === 'treatment');
    const consultations = patient.medicalHistory.filter(r => r.type === 'consultation');

    return { allergies, medications, treatments, consultations };
  };

  const medicalSummary = getMedicalSummary();

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'medical', label: 'Historique médical', icon: Stethoscope },
    { id: 'communication', label: 'Communications', icon: MessageCircle },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-gray-500">
              {getAge(patient.dateOfBirth)} ans • {getGenderText(patient.gender)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            title="Fermer"
            aria-label="Fermer les détails du patient"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.email}</p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </div>
                )}
                
                {patient.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
                      <p className="text-xs text-gray-500">Téléphone</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(patient.dateOfBirth, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-xs text-gray-500">Date de naissance</p>
                  </div>
                </div>

                {patient.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.address.street}
                      </p>
                      <p className="text-sm text-gray-600">
                        {patient.address.postalCode} {patient.address.city}
                      </p>
                      <p className="text-xs text-gray-500">Adresse</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact d'urgence</h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{patient.emergencyContact.name}</p>
                  <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
                  <p className="text-xs text-gray-500">{patient.emergencyContact.relationship}</p>
                </div>
              </div>
            )}

            {/* Medical Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé médical</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{patient.totalVisits}</div>
                  <div className="text-xs text-gray-500">Visites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{medicalSummary.consultations.length}</div>
                  <div className="text-xs text-gray-500">Consultations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{medicalSummary.treatments.length}</div>
                  <div className="text-xs text-gray-500">Traitements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{medicalSummary.allergies.length}</div>
                  <div className="text-xs text-gray-500">Allergies</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-3">
                {patient.lastVisit && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dernière visite</p>
                      <p className="text-xs text-gray-500">
                        {format(patient.lastVisit, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                
                {patient.nextAppointment && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Prochain rendez-vous</p>
                      <p className="text-xs text-gray-500">
                        {format(patient.nextAppointment, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Patient depuis</p>
                    <p className="text-xs text-gray-500">
                      {format(patient.createdAt, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <MedicalHistorySection
            patient={patient}
            onMedicalRecordAdd={() => {
              // This would open a form to add medical records
              console.log('Add medical record');
            }}
          />
        )}

        {activeTab === 'communication' && (
          <CommunicationHistorySection
            patient={patient}
            communicationHistory={communicationHistory}
            loading={loading}
            onSendMessage={() => {
              // This would open a message composition modal
              console.log('Send message');
            }}
          />
        )}

        {activeTab === 'appointments' && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des rendez-vous</h3>
            <p className="text-gray-500">Cette section sera implémentée prochainement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
