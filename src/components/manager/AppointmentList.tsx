'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Edit
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentStatus, AppointmentFilters } from '@/lib/models/appointment';
import { Patient } from '@/lib/models/patient';
import { AppointmentService, CalendarEvent } from '@/lib/services/appointment-service';

interface AppointmentListProps {
  cabinetId: string;
  onAppointmentClick: (event: CalendarEvent) => void;
  onAppointmentAction: (appointmentId: string, action: 'confirm' | 'cancel' | 'complete' | 'no-show') => void;
  onDeleteAppointment: (appointmentId: string) => void;
}

interface AppointmentWithPatient extends Appointment {
  patient?: Patient;
}

export default function AppointmentList({
  cabinetId,
  onAppointmentClick,
  onAppointmentAction,
  onDeleteAppointment
}: AppointmentListProps) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const appointmentService = AppointmentService.getInstance();

  const getMockPatient = useCallback((patientId: string): Patient => {
    const mockPatients: Record<string, Patient> = {
      'patient-1': {
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
          reminderHours: [24]
        },
        isActive: true,
        totalVisits: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      'patient-2': {
        id: 'patient-2',
        cabinetId,
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@email.com',
        phone: '+33987654321',
        dateOfBirth: new Date('1970-08-22'),
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'sms',
          reminderEnabled: true,
          reminderHours: [48, 24]
        },
        isActive: true,
        totalVisits: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    return mockPatients[patientId] || {
      id: patientId,
      cabinetId,
      firstName: 'Patient',
      lastName: 'Inconnu',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      medicalHistory: [],
      preferences: {
        preferredLanguage: 'fr',
        communicationMethod: 'email',
        reminderEnabled: true,
        reminderHours: [24]
      },
      isActive: true,
      totalVisits: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, [cabinetId]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const filters: AppointmentFilters = {
        cabinetId
      };

      // Apply status filter
      if (statusFilter) {
        filters.status = statusFilter;
      }

      // Apply date filter
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filters.dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filters.dateTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          filters.dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }

      const result = await appointmentService.getAppointments(filters);
      if (result.success && result.data) {
        // Mock patient data - in real implementation, this would be fetched
        const appointmentsWithPatients = result.data.map(appointment => ({
          ...appointment,
          patient: getMockPatient(appointment.patientId)
        }));
        setAppointments(appointmentsWithPatients);
      }
    } catch (_error) {
      console.error('Error loading appointments:', _error);
    } finally {
      setLoading(false);
    }
  }, [cabinetId, statusFilter, dateFilter, appointmentService, getMockPatient]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const patientName = appointment.patient 
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase()
      : '';
    
    return (
      appointment.title.toLowerCase().includes(searchLower) ||
      patientName.includes(searchLower) ||
      appointment.serviceType.toLowerCase().includes(searchLower) ||
      (appointment.patient?.phone && appointment.patient.phone.includes(searchTerm))
    );
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig = {
      [AppointmentStatus.SCHEDULED]: { label: 'Programmé', color: 'bg-blue-100 text-blue-800' },
      [AppointmentStatus.CONFIRMED]: { label: 'Confirmé', color: 'bg-green-100 text-green-800' },
      [AppointmentStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      [AppointmentStatus.COMPLETED]: { label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
      [AppointmentStatus.CANCELLED]: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
      [AppointmentStatus.NO_SHOW]: { label: 'Absent', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleAppointmentClick = (appointment: AppointmentWithPatient) => {
    const calendarEvent: CalendarEvent = {
      id: appointment.id,
      title: appointment.title,
      start: appointment.scheduledAt,
      end: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000),
      status: appointment.status,
      patientName: appointment.patient 
        ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
        : 'Patient inconnu',
      serviceType: appointment.serviceType,
      practitionerId: appointment.practitionerId,
      backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6'
    };
    
    onAppointmentClick(calendarEvent);
  };

  const toggleMenu = (appointmentId: string) => {
    setOpenMenuId(openMenuId === appointmentId ? null : appointmentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value={AppointmentStatus.SCHEDULED}>Programmé</option>
              <option value={AppointmentStatus.CONFIRMED}>Confirmé</option>
              <option value={AppointmentStatus.IN_PROGRESS}>En cours</option>
              <option value={AppointmentStatus.COMPLETED}>Terminé</option>
              <option value={AppointmentStatus.CANCELLED}>Annulé</option>
              <option value={AppointmentStatus.NO_SHOW}>Absent</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Aujourd&apos;hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Tous</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous trouvé</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || dateFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Aucun rendez-vous programmé pour le moment.'}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleAppointmentClick(appointment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {appointment.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(appointment.status)}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(appointment.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {openMenuId === appointment.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[150px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(appointment);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </button>
                            
                            {appointment.status === AppointmentStatus.SCHEDULED && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentAction(appointment.id, 'confirm');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmer
                              </button>
                            )}
                            
                            {(appointment.status === AppointmentStatus.SCHEDULED || appointment.status === AppointmentStatus.CONFIRMED) && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAppointmentAction(appointment.id, 'complete');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-blue-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marquer terminé
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAppointmentAction(appointment.id, 'no-show');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-orange-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Marquer absent
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAppointmentAction(appointment.id, 'cancel');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Annuler
                                </button>
                              </>
                            )}
                            
                            <hr className="my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAppointment(appointment.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(appointment.scheduledAt, 'dd MMM yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {format(appointment.scheduledAt, 'HH:mm')} ({appointment.duration} min)
                    </div>
                    {appointment.patient && (
                      <>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {appointment.patient.phone}
                        </div>
                      </>
                    )}
                  </div>

                  {appointment.description && (
                    <p className="mt-2 text-sm text-gray-600">{appointment.description}</p>
                  )}

                  {appointment.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}