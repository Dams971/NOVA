import { 
  Patient, 
  CreatePatientRequest, 
  UpdatePatientRequest, 
  PatientFilters,
  MedicalRecord,
  createPatient 
} from '@/lib/models/patient';
import { CabinetAccessControl, UserContext } from './cabinet-access-control';

export interface PatientServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateMedicalRecordRequest {
  patientId: string;
  type: 'consultation' | 'treatment' | 'note' | 'allergy' | 'medication';
  title: string;
  description: string;
  practitionerId?: string;
  attachments?: string[];
}

export interface UpdateMedicalRecordRequest {
  title?: string;
  description?: string;
  attachments?: string[];
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  hasMore: boolean;
}

export interface PatientStatistics {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  averageAge: number;
  genderDistribution: { male: number; female: number; other: number };
  appointmentHistory: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowRate: number;
  };
}

export class PatientService {
  private static instance: PatientService;
  private patients: Map<string, Patient> = new Map();
  private accessControl: CabinetAccessControl;

  private constructor() {
    this.accessControl = CabinetAccessControl.getInstance();
    this.initializeMockData();
  }

  static getInstance(): PatientService {
    if (!PatientService.instance) {
      PatientService.instance = new PatientService();
    }
    return PatientService.instance;
  }

  private initializeMockData(): void {
    const mockPatients: Patient[] = [
      {
        id: 'patient-1',
        cabinetId: 'cabinet-1',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'female',
        address: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          name: 'Jean Dubois',
          phone: '+33123456790',
          relationship: 'Époux'
        },
        medicalHistory: [
          {
            id: 'record-1',
            date: new Date('2024-01-15'),
            type: 'consultation',
            title: 'Consultation de routine',
            description: 'Examen dentaire complet. Aucun problème détecté.',
            practitionerId: 'practitioner-1',
            createdAt: new Date('2024-01-15')
          },
          {
            id: 'record-2',
            date: new Date('2024-02-20'),
            type: 'treatment',
            title: 'Détartrage',
            description: 'Détartrage complet et polissage des dents.',
            practitionerId: 'practitioner-1',
            createdAt: new Date('2024-02-20')
          }
        ],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        },
        isActive: true,
        lastVisit: new Date('2024-02-20'),
        totalVisits: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: 'patient-2',
        cabinetId: 'cabinet-1',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@email.com',
        phone: '+33987654321',
        dateOfBirth: new Date('1978-11-22'),
        gender: 'male',
        address: {
          street: '456 Avenue des Champs',
          city: 'Lyon',
          postalCode: '69001',
          country: 'France'
        },
        medicalHistory: [
          {
            id: 'record-3',
            date: new Date('2024-01-10'),
            type: 'allergy',
            title: 'Allergie à la pénicilline',
            description: 'Patient allergique à la pénicilline. Utiliser des alternatives.',
            createdAt: new Date('2024-01-10')
          }
        ],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'sms',
          reminderEnabled: true,
          reminderHours: [48, 24]
        },
        isActive: true,
        lastVisit: new Date('2024-01-10'),
        totalVisits: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: 'patient-3',
        cabinetId: 'cabinet-2',
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie.leroy@email.com',
        phone: '+33456789123',
        dateOfBirth: new Date('1992-07-08'),
        gender: 'female',
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: false,
          reminderHours: []
        },
        isActive: true,
        totalVisits: 1,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ];

    mockPatients.forEach(patient => {
      this.patients.set(patient.id, patient);
    });
  }

  // Basic CRUD operations
  async getPatients(filters: PatientFilters): Promise<PatientServiceResult<PatientSearchResult>> {
    try {
      let patients = Array.from(this.patients.values());

      // Apply filters
      if (filters.cabinetId) {
        patients = patients.filter(p => p.cabinetId === filters.cabinetId);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        patients = patients.filter(p => 
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          p.phone.includes(filters.search!)
        );
      }
      if (filters.isActive !== undefined) {
        patients = patients.filter(p => p.isActive === filters.isActive);
      }
      if (filters.ageMin || filters.ageMax) {
        const now = new Date();
        patients = patients.filter(p => {
          const age = now.getFullYear() - p.dateOfBirth.getFullYear();
          return (!filters.ageMin || age >= filters.ageMin) && 
                 (!filters.ageMax || age <= filters.ageMax);
        });
      }
      if (filters.lastVisitFrom || filters.lastVisitTo) {
        patients = patients.filter(p => {
          if (!p.lastVisit) return false;
          return (!filters.lastVisitFrom || p.lastVisit >= filters.lastVisitFrom) &&
                 (!filters.lastVisitTo || p.lastVisit <= filters.lastVisitTo);
        });
      }

      // Sort by last name, first name
      patients.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });

      const total = patients.length;
      
      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedPatients = patients.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          patients: paginatedPatients,
          total,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch patients' };
    }
  }

  async getPatientById(id: string): Promise<PatientServiceResult<Patient>> {
    try {
      const patient = this.patients.get(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }
      return { success: true, data: patient };
    } catch (error) {
      return { success: false, error: 'Failed to fetch patient' };
    }
  }

  async createPatient(data: CreatePatientRequest): Promise<PatientServiceResult<Patient>> {
    try {
      // Validate email uniqueness within cabinet
      const existingPatients = Array.from(this.patients.values());
      if (data.email) {
        const emailExists = existingPatients.some(p => 
          p.cabinetId === data.cabinetId && p.email === data.email && p.isActive
        );
        if (emailExists) {
          return { success: false, error: 'Email already exists in this cabinet' };
        }
      }

      // Validate phone uniqueness within cabinet
      if (data.phone) {
        const phoneExists = existingPatients.some(p => 
          p.cabinetId === data.cabinetId && p.phone === data.phone && p.isActive
        );
        if (phoneExists) {
          return { success: false, error: 'Phone number already exists in this cabinet' };
        }
      }

      const patient = createPatient(data);
      this.patients.set(patient.id, patient);

      return { success: true, data: patient };
    } catch (error) {
      return { success: false, error: 'Failed to create patient' };
    }
  }

  async updatePatient(id: string, data: UpdatePatientRequest): Promise<PatientServiceResult<Patient>> {
    try {
      const patient = this.patients.get(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Validate email uniqueness if changing email
      if (data.email && data.email !== patient.email) {
        const existingPatients = Array.from(this.patients.values());
        const emailExists = existingPatients.some(p => 
          p.cabinetId === patient.cabinetId && p.email === data.email && p.isActive && p.id !== id
        );
        if (emailExists) {
          return { success: false, error: 'Email already exists in this cabinet' };
        }
      }

      // Validate phone uniqueness if changing phone
      if (data.phone && data.phone !== patient.phone) {
        const existingPatients = Array.from(this.patients.values());
        const phoneExists = existingPatients.some(p => 
          p.cabinetId === patient.cabinetId && p.phone === data.phone && p.isActive && p.id !== id
        );
        if (phoneExists) {
          return { success: false, error: 'Phone number already exists in this cabinet' };
        }
      }

      const updatedPatient: Patient = {
        ...patient,
        ...data,
        updatedAt: new Date()
      };

      this.patients.set(id, updatedPatient);
      return { success: true, data: updatedPatient };
    } catch (error) {
      return { success: false, error: 'Failed to update patient' };
    }
  }

  async deletePatient(id: string): Promise<PatientServiceResult<boolean>> {
    try {
      const patient = this.patients.get(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Soft delete - mark as inactive
      const updatedPatient: Patient = {
        ...patient,
        isActive: false,
        updatedAt: new Date()
      };

      this.patients.set(id, updatedPatient);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete patient' };
    }
  }

  // Medical History Management
  async addMedicalRecord(data: CreateMedicalRecordRequest): Promise<PatientServiceResult<MedicalRecord>> {
    try {
      const patient = this.patients.get(data.patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      const medicalRecord: MedicalRecord = {
        id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(),
        type: data.type,
        title: data.title,
        description: data.description,
        practitionerId: data.practitionerId,
        attachments: data.attachments || [],
        createdAt: new Date()
      };

      const updatedPatient: Patient = {
        ...patient,
        medicalHistory: [...patient.medicalHistory, medicalRecord],
        updatedAt: new Date()
      };

      this.patients.set(data.patientId, updatedPatient);
      return { success: true, data: medicalRecord };
    } catch (error) {
      return { success: false, error: 'Failed to add medical record' };
    }
  }

  async updateMedicalRecord(
    patientId: string,
    recordId: string,
    data: UpdateMedicalRecordRequest
  ): Promise<PatientServiceResult<MedicalRecord>> {
    try {
      const patient = this.patients.get(patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      const recordIndex = patient.medicalHistory.findIndex(r => r.id === recordId);
      if (recordIndex === -1) {
        return { success: false, error: 'Medical record not found' };
      }

      const updatedRecord: MedicalRecord = {
        ...patient.medicalHistory[recordIndex],
        ...data
      };

      const updatedMedicalHistory = [...patient.medicalHistory];
      updatedMedicalHistory[recordIndex] = updatedRecord;

      const updatedPatient: Patient = {
        ...patient,
        medicalHistory: updatedMedicalHistory,
        updatedAt: new Date()
      };

      this.patients.set(patientId, updatedPatient);
      return { success: true, data: updatedRecord };
    } catch (error) {
      return { success: false, error: 'Failed to update medical record' };
    }
  }

  async deleteMedicalRecord(patientId: string, recordId: string): Promise<PatientServiceResult<boolean>> {
    try {
      const patient = this.patients.get(patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      const updatedMedicalHistory = patient.medicalHistory.filter(r => r.id !== recordId);

      if (updatedMedicalHistory.length === patient.medicalHistory.length) {
        return { success: false, error: 'Medical record not found' };
      }

      const updatedPatient: Patient = {
        ...patient,
        medicalHistory: updatedMedicalHistory,
        updatedAt: new Date()
      };

      this.patients.set(patientId, updatedPatient);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete medical record' };
    }
  }

  async getMedicalHistory(patientId: string): Promise<PatientServiceResult<MedicalRecord[]>> {
    try {
      const patient = this.patients.get(patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Sort medical history by date (newest first)
      const sortedHistory = [...patient.medicalHistory].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      return { success: true, data: sortedHistory };
    } catch (error) {
      return { success: false, error: 'Failed to fetch medical history' };
    }
  }

  // Statistics and Analytics
  async getPatientStatistics(cabinetId: string): Promise<PatientServiceResult<PatientStatistics>> {
    try {
      const cabinetPatients = Array.from(this.patients.values())
        .filter(p => p.cabinetId === cabinetId);

      const activePatients = cabinetPatients.filter(p => p.isActive);
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newPatientsThisMonth = cabinetPatients.filter(p =>
        p.createdAt >= thisMonth && p.isActive
      ).length;

      const ages = activePatients.map(p =>
        now.getFullYear() - p.dateOfBirth.getFullYear()
      );
      const averageAge = ages.length > 0 ?
        Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

      const genderDistribution = activePatients.reduce(
        (acc, p) => {
          if (p.gender === 'male') acc.male++;
          else if (p.gender === 'female') acc.female++;
          else acc.other++;
          return acc;
        },
        { male: 0, female: 0, other: 0 }
      );

      const totalAppointments = activePatients.reduce((sum, p) => sum + p.totalVisits, 0);

      const statistics: PatientStatistics = {
        totalPatients: cabinetPatients.length,
        activePatients: activePatients.length,
        newPatientsThisMonth,
        averageAge,
        genderDistribution,
        appointmentHistory: {
          totalAppointments,
          completedAppointments: Math.round(totalAppointments * 0.85), // Mock data
          cancelledAppointments: Math.round(totalAppointments * 0.10), // Mock data
          noShowRate: 0.05 // Mock data - 5%
        }
      };

      return { success: true, data: statistics };
    } catch (error) {
      return { success: false, error: 'Failed to fetch patient statistics' };
    }
  }

  // Secure methods with access control
  async getPatientsSecure(
    userContext: UserContext,
    filters: PatientFilters
  ): Promise<PatientServiceResult<PatientSearchResult>> {
    try {
      // Validate read permission
      const cabinetId = filters.cabinetId || (userContext.assignedCabinets.length === 1 ? userContext.assignedCabinets[0] : '');
      if (cabinetId) {
        const validation = this.accessControl.validateAppointmentOperation(userContext, cabinetId, 'read');
        if (!validation.allowed) {
          this.accessControl.logAccess(userContext, 'patients', 'read', cabinetId, false);
          return { success: false, error: validation.reason || 'Access denied' };
        }
      }

      // Sanitize filters to ensure cabinet isolation
      const sanitizedFilters = this.accessControl.sanitizeAppointmentFilters(userContext, filters);

      // Log access
      this.accessControl.logAccess(userContext, 'patients', 'read', sanitizedFilters.cabinetId);

      // Get patients with sanitized filters
      const result = await this.getPatients(sanitizedFilters);

      if (result.success && result.data) {
        // Additional filtering for non-admin users
        const filteredPatients = this.accessControl.filterAppointmentsByCabinet(userContext, result.data.patients);
        return {
          success: true,
          data: {
            ...result.data,
            patients: filteredPatients
          }
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async createPatientSecure(
    userContext: UserContext,
    data: CreatePatientRequest
  ): Promise<PatientServiceResult<Patient>> {
    try {
      // Validate create permission for the cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, data.cabinetId, 'create');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'patients', 'create', data.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'patients', 'create', data.cabinetId);

      // Create patient using the standard method
      return await this.createPatient(data);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async updatePatientSecure(
    userContext: UserContext,
    id: string,
    data: UpdatePatientRequest
  ): Promise<PatientServiceResult<Patient>> {
    try {
      // Get the patient first to check cabinet access
      const patient = this.patients.get(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Validate update permission for the patient's cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, patient.cabinetId, 'update');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'patients', 'update', patient.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'patients', 'update', patient.cabinetId);

      // Update patient using the standard method
      return await this.updatePatient(id, data);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async deletePatientSecure(
    userContext: UserContext,
    id: string
  ): Promise<PatientServiceResult<boolean>> {
    try {
      // Get the patient first to check cabinet access
      const patient = this.patients.get(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Validate delete permission for the patient's cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, patient.cabinetId, 'delete');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'patients', 'delete', patient.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'patients', 'delete', patient.cabinetId);

      // Delete patient using the standard method
      return await this.deletePatient(id);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }
}
