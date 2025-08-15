'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, User, Stethoscope, FileText, DollarSign, Search, Plus, Repeat } from 'lucide-react';
import { 
  Appointment, 
  CreateAppointmentRequest, 
  UpdateAppointmentRequest, 
  AppointmentStatus, 
  ServiceType 
} from '@/lib/models/appointment';
import { Patient } from '@/lib/models/patient';
import { AppointmentService } from '@/lib/services/appointment-service';

interface AppointmentFormProps {
  appointment?: Appointment;
  cabinetId: string;
  initialDate?: Date;
  initialTime?: string;
  onSave: (appointment: Appointment) => void;
  onCancel: () => void;
}

interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every X days/weeks/months
  endDate?: string;
  occurrences?: number;
  weekDays?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
}

interface FormData {
  patientId: string;
  practitionerId: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  notes: string;
  price: number;
  recurring: RecurringConfig;
}

export default function AppointmentForm({
  appointment,
  cabinetId,
  initialDate,
  initialTime,
  onSave,
  onCancel
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    practitionerId: '',
    serviceType: ServiceType.CONSULTATION,
    title: '',
    description: '',
    scheduledAt: '',
    duration: 30,
    status: AppointmentStatus.SCHEDULED,
    notes: '',
    price: 0,
    recurring: {
      enabled: false,
      frequency: 'weekly',
      interval: 1,
      endDate: '',
      occurrences: 1,
      weekDays: []
    }
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  const appointmentService = AppointmentService.getInstance();

  const serviceTypeOptions = [
    { value: ServiceType.CONSULTATION, label: 'Consultation', duration: 30, price: 50 },
    { value: ServiceType.CLEANING, label: 'Nettoyage', duration: 45, price: 80 },
    { value: ServiceType.FILLING, label: 'Plombage', duration: 60, price: 120 },
    { value: ServiceType.ROOT_CANAL, label: 'Traitement de canal', duration: 90, price: 300 },
    { value: ServiceType.EXTRACTION, label: 'Extraction', duration: 45, price: 150 },
    { value: ServiceType.CROWN, label: 'Couronne', duration: 120, price: 800 },
    { value: ServiceType.IMPLANT, label: 'Implant', duration: 180, price: 1500 },
    { value: ServiceType.ORTHODONTICS, label: 'Orthodontie', duration: 60, price: 200 },
    { value: ServiceType.EMERGENCY, label: 'Urgence', duration: 30, price: 100 }
  ];

  const statusOptions = [
    { value: AppointmentStatus.SCHEDULED, label: 'Programmé' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmé' },
    { value: AppointmentStatus.IN_PROGRESS, label: 'En cours' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELLED, label: 'Annulé' },
    { value: AppointmentStatus.NO_SHOW, label: 'Absent' }
  ];

  useEffect(() => {
    loadPatients();
    initializeForm();
  }, [appointment, initialDate, initialTime]);

  const loadPatients = async () => {
    // Mock patients - in real implementation, this would fetch from API
    const mockPatients: Patient[] = [
      {
        id: 'patient-1',
        cabinetId,
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-03-15'),
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        },
        isActive: true,
        totalVisits: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'patient-2',
        cabinetId,
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@email.com',
        phone: '+33123456790',
        dateOfBirth: new Date('1978-07-22'),
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'sms',
          reminderEnabled: true,
          reminderHours: [24]
        },
        isActive: true,
        totalVisits: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setPatients(mockPatients);
  };

  const initializeForm = () => {
    if (appointment) {
      // Edit mode
      setFormData({
        patientId: appointment.patientId,
        practitionerId: appointment.practitionerId || '',
        serviceType: appointment.serviceType,
        title: appointment.title,
        description: appointment.description || '',
        scheduledAt: format(appointment.scheduledAt, "yyyy-MM-dd'T'HH:mm"),
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes || '',
        price: appointment.price || 0
      });
    } else {
      // Create mode
      let scheduledAt = '';
      if (initialDate && initialTime) {
        const [hours, minutes] = initialTime.split(':');
        const date = new Date(initialDate);
        date.setHours(parseInt(hours), parseInt(minutes));
        scheduledAt = format(date, "yyyy-MM-dd'T'HH:mm");
      }

      setFormData(prev => ({
        ...prev,
        scheduledAt
      }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Auto-update title when patient or service changes
    if (field === 'patientId' || field === 'serviceType') {
      updateTitle(
        field === 'patientId' ? value as string : formData.patientId,
        field === 'serviceType' ? value as ServiceType : formData.serviceType
      );
    }

    // Auto-update duration and price when service type changes
    if (field === 'serviceType') {
      const serviceOption = serviceTypeOptions.find(option => option.value === value);
      if (serviceOption) {
        setFormData(prev => ({
          ...prev,
          duration: serviceOption.duration,
          price: serviceOption.price
        }));
      }
    }
  };

  const handleRecurringChange = (field: keyof RecurringConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [field]: value
      }
    }));
  };

  const handlePatientSearch = (searchTerm: string) => {
    setPatientSearch(searchTerm);

    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }

    setShowPatientDropdown(true);
  };

  const selectPatient = (patient: Patient) => {
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);

    // Update title
    updateTitle(patient.id, formData.serviceType);
  };

  const generateRecurringAppointments = (startDate: Date, data: FormData): CreateAppointmentRequest[] => {
    const appointments: CreateAppointmentRequest[] = [];
    const { recurring } = data;

    let currentDate = new Date(startDate);
    const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
    const maxOccurrences = recurring.occurrences || 1;

    for (let i = 0; i < maxOccurrences; i++) {
      // Check if we've reached the end date
      if (endDate && currentDate > endDate) {
        break;
      }

      appointments.push({
        cabinetId,
        patientId: data.patientId,
        practitionerId: data.practitionerId || undefined,
        serviceType: data.serviceType,
        title: `${data.title} (${i + 1}/${maxOccurrences})`,
        description: data.description || undefined,
        scheduledAt: new Date(currentDate),
        duration: data.duration,
        notes: data.notes || undefined,
        price: data.price || undefined
      });

      // Calculate next occurrence
      switch (recurring.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurring.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurring.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurring.interval);
          break;
      }
    }

    return appointments;
  };

  const updateTitle = (patientId: string, serviceType: ServiceType) => {
    const patient = patients.find(p => p.id === patientId);
    const service = serviceTypeOptions.find(s => s.value === serviceType);
    
    if (patient && service) {
      const title = `${service.label} - ${patient.firstName} ${patient.lastName}`;
      setFormData(prev => ({
        ...prev,
        title
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'Veuillez sélectionner un patient';
    }

    if (!formData.serviceType) {
      newErrors.serviceType = 'Veuillez sélectionner un type de service';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'La date et l\'heure sont requises';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'La durée doit être supérieure à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(formData.scheduledAt);

      if (appointment) {
        // Update existing appointment
        const updateData: UpdateAppointmentRequest = {
          patientId: formData.patientId,
          practitionerId: formData.practitionerId || undefined,
          serviceType: formData.serviceType,
          title: formData.title,
          description: formData.description || undefined,
          scheduledAt,
          duration: formData.duration,
          status: formData.status,
          notes: formData.notes || undefined,
          price: formData.price || undefined
        };

        const result = await appointmentService.updateAppointment(appointment.id, updateData);
        if (result.success && result.data) {
          onSave(result.data);
        } else {
          setErrors({ general: result.error || 'Erreur lors de la mise à jour' });
        }
      } else {
        // Create new appointment(s)
        if (formData.recurring.enabled) {
          // Create recurring appointments
          const appointments = generateRecurringAppointments(scheduledAt, formData);
          let createdCount = 0;
          let lastCreated: Appointment | null = null;

          for (const appointmentData of appointments) {
            const result = await appointmentService.createAppointment(appointmentData);
            if (result.success && result.data) {
              createdCount++;
              lastCreated = result.data;
            } else {
              // If any appointment fails, show error but continue
              console.error('Failed to create recurring appointment:', result.error);
            }
          }

          if (createdCount > 0) {
            // Return the first created appointment
            onSave(lastCreated!);
          } else {
            setErrors({ general: 'Erreur lors de la création des rendez-vous récurrents' });
          }
        } else {
          // Create single appointment
          const createData: CreateAppointmentRequest = {
            cabinetId,
            patientId: formData.patientId,
            practitionerId: formData.practitionerId || undefined,
            serviceType: formData.serviceType,
            title: formData.title,
            description: formData.description || undefined,
            scheduledAt,
            duration: formData.duration,
            notes: formData.notes || undefined,
            price: formData.price || undefined
          };

          const result = await appointmentService.createAppointment(createData);
          if (result.success && result.data) {
            onSave(result.data);
          } else {
            setErrors({ general: result.error || 'Erreur lors de la création' });
          }
        }
      }
    } catch (error) {
      setErrors({ general: 'Une erreur inattendue s\'est produite' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            title="Fermer"
            aria-label="Fermer le formulaire de rendez-vous"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Enhanced Patient Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Patient *
            </label>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Rechercher un patient par nom, téléphone ou email..."
                className={`w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patientId ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

              {showPatientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                        <div className="text-sm text-gray-500">{patient.phone} • {patient.email}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      Aucun patient trouvé
                      <button
                        type="button"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        onClick={() => {/* TODO: Open new patient form */}}
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        Créer un nouveau patient
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="h-4 w-4 inline mr-1" />
              Type de service *
            </label>
            <select
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => handleInputChange('serviceType', e.target.value as ServiceType)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.serviceType ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
            >
              {serviceTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.duration} min - {option.price}€)
                </option>
              ))}
            </select>
            {errors.serviceType && (
              <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Titre du rendez-vous"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date et heure *
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.scheduledAt ? 'border-red-300' : 'border-gray-300'
                }`}
                aria-describedby={errors.scheduledAt ? 'scheduledAt-error' : undefined}
              />
              {errors.scheduledAt && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduledAt}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Durée (minutes) *
              </label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                min="15"
                max="300"
                step="15"
                aria-describedby={errors.duration ? 'duration-error' : undefined}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duration ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Status (only for editing) */}
          {appointment && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring Appointments (only for new appointments) */}
          {!appointment && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Repeat className="h-4 w-4 mr-2" />
                  Rendez-vous récurrents
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecurringOptions(!showRecurringOptions)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showRecurringOptions ? 'Masquer' : 'Configurer'}
                </button>
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="recurring-enabled"
                  checked={formData.recurring.enabled}
                  onChange={(e) => handleRecurringChange('enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="recurring-enabled" className="ml-2 text-sm text-gray-700">
                  Créer une série de rendez-vous récurrents
                </label>
              </div>

              {formData.recurring.enabled && showRecurringOptions && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                        Fréquence
                      </label>
                      <select
                        id="frequency"
                        value={formData.recurring.frequency}
                        onChange={(e) => handleRecurringChange('frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalle
                      </label>
                      <input
                        type="number"
                        value={formData.recurring.interval}
                        onChange={(e) => handleRecurringChange('interval', parseInt(e.target.value) || 1)}
                        min="1"
                        max="12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tous les {formData.recurring.interval} {
                          formData.recurring.frequency === 'daily' ? 'jour(s)' :
                          formData.recurring.frequency === 'weekly' ? 'semaine(s)' : 'mois'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre d'occurrences
                      </label>
                      <input
                        type="number"
                        value={formData.recurring.occurrences}
                        onChange={(e) => handleRecurringChange('occurrences', parseInt(e.target.value) || 1)}
                        min="1"
                        max="52"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin (optionnel)
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={formData.recurring.endDate}
                        onChange={(e) => handleRecurringChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Prix (€)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description du rendez-vous..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes internes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (appointment ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}