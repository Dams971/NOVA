/**
 * NOVA In-Memory Database
 * Fallback database for development when PostgreSQL is unavailable
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'cabinet_admin' | 'practitioner' | 'secretary' | 'patient';
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Cabinet {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: any;
  settings?: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Patient {
  id: string;
  user_id: string;
  cabinet_id: string;
  date_of_birth?: string;
  gender?: string;
  medical_notes?: string;
  allergies?: string;
  created_at: Date;
  updated_at: Date;
}

interface Appointment {
  id: string;
  cabinet_id: string;
  patient_id: string;
  practitioner_id: string;
  service_id: string;
  scheduled_at: Date;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  title?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface Service {
  id: string;
  cabinet_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

class InMemoryDatabase {
  private static instance: InMemoryDatabase;
  
  // Data stores
  private users: Map<string, User> = new Map();
  private cabinets: Map<string, Cabinet> = new Map();
  private patients: Map<string, Patient> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private services: Map<string, Service> = new Map();
  private sessions: Map<string, Session> = new Map();
  
  private constructor() {
    this.initializeTestData();
  }
  
  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }
  
  private async initializeTestData() {
    console.warn('🔄 Initializing in-memory database with test data...');
    
    // Create test cabinet
    const cabinetId = 'cabinet-1';
    this.cabinets.set(cabinetId, {
      id: cabinetId,
      name: 'Cabinet Dentaire Centre-Ville',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postal_code: '75001',
      phone: '+33 1 42 86 83 00',
      email: 'contact@cabinet-dentaire-cv.fr',
      website: 'https://cabinet-dentaire-cv.fr',
      business_hours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '13:00' }
      },
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Create test users with hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Admin user
    const adminId = 'user-admin-1';
    this.users.set(adminId, {
      id: adminId,
      email: 'admin@cabinet-dentaire-cv.fr',
      password_hash: hashedPassword,
      role: 'cabinet_admin',
      first_name: 'Marie',
      last_name: 'Dubois',
      phone: '+33 6 12 34 56 78',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Practitioner user
    const practitionerId = 'user-practitioner-1';
    this.users.set(practitionerId, {
      id: practitionerId,
      email: 'dr.martin@cabinet-dentaire-cv.fr',
      password_hash: hashedPassword,
      role: 'practitioner',
      first_name: 'Pierre',
      last_name: 'Martin',
      phone: '+33 6 23 45 67 89',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Patient user
    const patientUserId = 'user-patient-1';
    this.users.set(patientUserId, {
      id: patientUserId,
      email: 'patient.test@example.com',
      password_hash: hashedPassword,
      role: 'patient',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '+33 6 45 67 89 01',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Create patient record
    const patientId = 'patient-1';
    this.patients.set(patientId, {
      id: patientId,
      user_id: patientUserId,
      cabinet_id: cabinetId,
      date_of_birth: '1985-03-15',
      gender: 'M',
      medical_notes: 'Aucune allergie connue',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Create services
    const services = [
      { id: 'service-1', name: 'Consultation de contrôle', duration: 30, price: 80, color: '#22c55e' },
      { id: 'service-2', name: 'Détartrage', duration: 45, price: 120, color: '#3b82f6' },
      { id: 'service-3', name: 'Urgence dentaire', duration: 30, price: 120, color: '#ef4444' },
      { id: 'service-4', name: 'Plombage', duration: 60, price: 150, color: '#f59e0b' },
      { id: 'service-5', name: 'Consultation orthodontie', duration: 45, price: 100, color: '#8b5cf6' }
    ];
    
    services.forEach(service => {
      this.services.set(service.id, {
        ...service,
        cabinet_id: cabinetId,
        description: `${service.name} - Service dentaire professionnel`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    });
    
    // Create sample appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    this.appointments.set('appointment-1', {
      id: 'appointment-1',
      cabinet_id: cabinetId,
      patient_id: patientId,
      practitioner_id: practitionerId,
      service_id: 'service-1',
      scheduled_at: tomorrow,
      duration: 30,
      status: 'confirmed',
      title: 'Consultation de contrôle - Jean Dupont',
      notes: 'Contrôle annuel',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.warn('✅ In-memory database initialized with test data');
    console.warn(`   - ${this.users.size} users`);
    console.warn(`   - ${this.cabinets.size} cabinets`);
    console.warn(`   - ${this.patients.size} patients`);
    console.warn(`   - ${this.services.size} services`);
    console.warn(`   - ${this.appointments.size} appointments`);
  }
  
  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
  
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  async createUser(data: Partial<User>): Promise<User> {
    const user: User = {
      id: data.id || uuidv4(),
      email: data.email!,
      password_hash: data.password_hash!,
      role: data.role || 'patient',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      phone: data.phone,
      is_active: data.is_active !== false,
      email_verified: data.email_verified || false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updated = {
      ...user,
      ...data,
      id: user.id, // Prevent ID change
      updated_at: new Date()
    };
    
    this.users.set(id, updated);
    return updated;
  }
  
  // Session operations
  async createSession(userId: string, token: string, expiresIn: number = 3600): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + expiresIn * 1000),
      created_at: new Date()
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
  
  async findSessionByToken(token: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.expires_at > new Date()) {
        return session;
      }
    }
    return null;
  }
  
  async deleteSession(token: string): Promise<boolean> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(id);
        return true;
      }
    }
    return false;
  }
  
  // Cabinet operations
  async findCabinetById(id: string): Promise<Cabinet | null> {
    return this.cabinets.get(id) || null;
  }
  
  async getAllCabinets(): Promise<Cabinet[]> {
    return Array.from(this.cabinets.values());
  }
  
  // Patient operations
  async findPatientById(id: string): Promise<Patient | null> {
    return this.patients.get(id) || null;
  }
  
  async findPatientsByUserId(userId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(p => p.user_id === userId);
  }
  
  async findPatientsByCabinet(cabinetId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(p => p.cabinet_id === cabinetId);
  }
  
  async createPatient(data: Partial<Patient>): Promise<Patient> {
    const patient: Patient = {
      id: data.id || uuidv4(),
      user_id: data.user_id!,
      cabinet_id: data.cabinet_id!,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      medical_notes: data.medical_notes,
      allergies: data.allergies,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.patients.set(patient.id, patient);
    return patient;
  }
  
  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient | null> {
    const patient = this.patients.get(id);
    if (!patient) return null;
    
    const updated = {
      ...patient,
      ...data,
      id: patient.id,
      updated_at: new Date()
    };
    
    this.patients.set(id, updated);
    return updated;
  }
  
  async deletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }
  
  // Appointment operations
  async findAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }
  
  async findAppointmentsByCabinet(cabinetId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let appointments = Array.from(this.appointments.values()).filter(a => a.cabinet_id === cabinetId);
    
    if (startDate) {
      appointments = appointments.filter(a => a.scheduled_at >= startDate);
    }
    
    if (endDate) {
      appointments = appointments.filter(a => a.scheduled_at <= endDate);
    }
    
    return appointments.sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime());
  }
  
  async findAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(a => a.patient_id === patientId)
      .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime());
  }
  
  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const appointment: Appointment = {
      id: data.id || uuidv4(),
      cabinet_id: data.cabinet_id!,
      patient_id: data.patient_id!,
      practitioner_id: data.practitioner_id!,
      service_id: data.service_id!,
      scheduled_at: data.scheduled_at!,
      duration: data.duration || 30,
      status: data.status || 'scheduled',
      title: data.title,
      notes: data.notes,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.appointments.set(appointment.id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    const appointment = this.appointments.get(id);
    if (!appointment) return null;
    
    const updated = {
      ...appointment,
      ...data,
      id: appointment.id,
      updated_at: new Date()
    };
    
    this.appointments.set(id, updated);
    return updated;
  }
  
  // Service operations
  async findServiceById(id: string): Promise<Service | null> {
    return this.services.get(id) || null;
  }
  
  async findServicesByCabinet(cabinetId: string): Promise<Service[]> {
    return Array.from(this.services.values()).filter(s => s.cabinet_id === cabinetId);
  }
  
  // Statistics
  async getStats(): Promise<any> {
    return {
      users: this.users.size,
      cabinets: this.cabinets.size,
      patients: this.patients.size,
      appointments: this.appointments.size,
      services: this.services.size,
      sessions: this.sessions.size
    };
  }
  
  // Test connection
  async testConnection(): Promise<boolean> {
    return true; // Always returns true for in-memory database
  }
}

export const memoryDb = InMemoryDatabase.getInstance();
export default memoryDb;