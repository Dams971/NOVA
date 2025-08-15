'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MessageCircle,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Patient } from '@/lib/models/patient';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  onPatientEdit: (patient: Patient) => void;
  onPatientDelete: (patientId: string) => void;
  onLoadMore: () => void;
}

interface PatientCardProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PatientCard({ patient, isSelected, onSelect, onEdit, onDelete }: PatientCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getLastVisitText = (lastVisit?: Date) => {
    if (!lastVisit) return 'Aucune visite';
    
    const now = new Date();
    const diffTime = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  };

  const getStatusColor = () => {
    if (!patient.isActive) return 'bg-gray-100 text-gray-600';
    if (patient.nextAppointment) return 'bg-green-100 text-green-600';
    if (patient.lastVisit) {
      const daysSinceLastVisit = Math.floor((new Date().getTime() - patient.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit > 365) return 'bg-orange-100 text-orange-600';
    }
    return 'bg-blue-100 text-blue-600';
  };

  const getStatusText = () => {
    if (!patient.isActive) return 'Inactif';
    if (patient.nextAppointment) return 'RDV programmé';
    if (patient.lastVisit) {
      const daysSinceLastVisit = Math.floor((new Date().getTime() - patient.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit > 365) return 'À recontacter';
    }
    return 'Actif';
  };

  return (
    <div
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>

            <div className="space-y-1">
              {patient.email && (
                <div className="flex items-center text-xs text-gray-500">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              
              {patient.phone && (
                <div className="flex items-center text-xs text-gray-500">
                  <Phone className="h-3 w-3 mr-1" />
                  <span>{patient.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{getAge(patient.dateOfBirth)} ans</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{getLastVisitText(patient.lastVisit)}</span>
                </div>
              </div>

              {/* Medical History Indicators */}
              {patient.medicalHistory.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  {patient.medicalHistory.some(r => r.type === 'allergy') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Allergies
                    </span>
                  )}
                  
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <FileText className="h-3 w-3 mr-1" />
                    {patient.medicalHistory.length} entrées
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Actions du patient"
            aria-label={`Ouvrir le menu d'actions pour ${patient.firstName} ${patient.lastName}`}
            aria-expanded={showMenu ? 'true' : 'false'}
            aria-haspopup="menu"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1" role="menu" aria-labelledby="patient-menu-button">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex={-1}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // This would open communication modal
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex={-1}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter
                </button>

                <hr className="my-1" />
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  role="menuitem"
                  tabIndex={-1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientList({
  patients,
  loading,
  error,
  hasMore,
  selectedPatient,
  onPatientSelect,
  onPatientEdit,
  onPatientDelete,
  onLoadMore
}: PatientListProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun patient trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter votre premier patient.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            isSelected={selectedPatient?.id === patient.id}
            onSelect={() => onPatientSelect(patient)}
            onEdit={() => onPatientEdit(patient)}
            onDelete={() => onPatientDelete(patient.id)}
          />
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-b border-gray-200">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
