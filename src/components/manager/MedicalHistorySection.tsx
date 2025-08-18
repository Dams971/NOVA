'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plus, 
  FileText, 
  Stethoscope, 
  Pill, 
  AlertTriangle, 
  Activity,
  Calendar,
  User,
  Paperclip,
  Edit,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { Patient, MedicalRecord } from '@/lib/models/patient';

interface MedicalHistorySectionProps {
  patient: Patient;
  onMedicalRecordAdd: () => void;
}

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onEdit: () => void;
  onDelete: () => void;
}

function MedicalRecordCard({ record, onEdit, onDelete }: MedicalRecordCardProps) {
  const getTypeIcon = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-5 w-5 text-blue-500" />;
      case 'treatment':
        return <Activity className="h-5 w-5 text-green-500" />;
      case 'medication':
        return <Pill className="h-5 w-5 text-purple-500" />;
      case 'allergy':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'note':
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'treatment': return 'Traitement';
      case 'medication': return 'Médicament';
      case 'allergy': return 'Allergie';
      case 'note': return 'Note';
      default: return 'Autre';
    }
  };

  const getTypeColor = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'treatment': return 'bg-green-100 text-green-800';
      case 'medication': return 'bg-purple-100 text-purple-800';
      case 'allergy': return 'bg-red-100 text-red-800';
      case 'note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getTypeIcon(record.type)}
          <div>
            <h4 className="text-sm font-medium text-gray-900">{record.title}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                {getTypeLabel(record.type)}
              </span>
              <span className="text-xs text-gray-500">
                {format(record.date, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{record.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {record.practitionerId && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>Dr. {record.practitionerId}</span>
            </div>
          )}
          
          {record.attachments && record.attachments.length > 0 && (
            <div className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              <span>{record.attachments.length} pièce(s) jointe(s)</span>
            </div>
          )}
        </div>

        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Ajouté le {format(record.createdAt, 'dd/MM/yyyy', { locale: fr })}</span>
        </div>
      </div>
    </div>
  );
}

export default function MedicalHistorySection({ patient, onMedicalRecordAdd }: MedicalHistorySectionProps) {
  const [filterType, setFilterType] = useState<MedicalRecord['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');

  const filteredRecords = patient.medicalHistory
    .filter(record => filterType === 'all' || record.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.getTime() - a.date.getTime();
      } else {
        return a.type.localeCompare(b.type);
      }
    });

  const getRecordCounts = () => {
    const counts = patient.medicalHistory.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      all: patient.medicalHistory.length,
      consultation: counts.consultation || 0,
      treatment: counts.treatment || 0,
      medication: counts.medication || 0,
      allergy: counts.allergy || 0,
      note: counts.note || 0
    };
  };

  const counts = getRecordCounts();

  const filterOptions = [
    { value: 'all', label: 'Tout', count: counts.all, icon: FileText },
    { value: 'consultation', label: 'Consultations', count: counts.consultation, icon: Stethoscope },
    { value: 'treatment', label: 'Traitements', count: counts.treatment, icon: Activity },
    { value: 'medication', label: 'Médicaments', count: counts.medication, icon: Pill },
    { value: 'allergy', label: 'Allergies', count: counts.allergy, icon: AlertTriangle },
    { value: 'note', label: 'Notes', count: counts.note, icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Historique médical</h3>
        <button
          onClick={onMedicalRecordAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une entrée
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Filtres</h4>
          <label htmlFor="sortBy" className="sr-only">Trier par</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'type')}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            aria-label="Trier les entrées médicales par"
          >
            <option value="date">Trier par date</option>
            <option value="type">Trier par type</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilterType(option.value as 'all' | 'consultation' | 'prescription' | 'exam' | 'vaccination')}
                className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors ${
                  filterType === option.value
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div>{option.label}</div>
                  <div className="text-xs opacity-75">({option.count})</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medical Records */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterType === 'all' ? 'Aucun historique médical' : `Aucun ${filterOptions.find(o => o.value === filterType)?.label.toLowerCase()}`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all' 
              ? 'Commencez par ajouter la première entrée médicale pour ce patient.'
              : 'Aucune entrée de ce type n\'a été trouvée.'
            }
          </p>
          {filterType === 'all' && (
            <button
              type="button"
              onClick={onMedicalRecordAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une entrée
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              onEdit={() => {
                // This would open an edit form
                console.warn('Edit record:', record.id);
              }}
              onDelete={() => {
                // This would show a confirmation dialog
                console.warn('Delete record:', record.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {patient.medicalHistory.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé</h4>
          <p className="text-sm text-blue-700">
            Ce patient a un total de <strong>{patient.medicalHistory.length}</strong> entrées dans son historique médical, 
            incluant {counts.consultation} consultation(s), {counts.treatment} traitement(s), 
            {counts.medication} médicament(s) et {counts.allergy} allergie(s).
          </p>
        </div>
      )}
    </div>
  );
}
