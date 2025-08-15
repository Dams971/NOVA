import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from '@/lib/services/patient-service';
import { CreatePatientRequest, UpdatePatientRequest, Gender } from '@/lib/models/patient';

describe('PatientService', () => {
  let patientService: PatientService;

  beforeEach(() => {
    patientService = PatientService.getInstance();
  });

  describe('getPatients', () => {
    it('should return all patients for a cabinet', async () => {
      const result = await patientService.getPatients({ cabinetId: 'cabinet-1' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.patients).toBeInstanceOf(Array);
      expect(result.data!.patients.length).toBeGreaterThan(0);
      expect(result.data!.patients.every(p => p.cabinetId === 'cabinet-1')).toBe(true);
    });

    it('should filter patients by search term', async () => {
      const result = await patientService.getPatients({ 
        cabinetId: 'cabinet-1', 
        search: 'Marie' 
      });
      
      expect(result.success).toBe(true);
      expect(result.data!.patients.length).toBeGreaterThan(0);
      expect(result.data!.patients.some(p => 
        p.firstName.includes('Marie') || p.lastName.includes('Marie')
      )).toBe(true);
    });

    it('should filter patients by active status', async () => {
      const result = await patientService.getPatients({ 
        cabinetId: 'cabinet-1', 
        isActive: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.data!.patients.every(p => p.isActive)).toBe(true);
    });

    it('should filter patients by age range', async () => {
      const result = await patientService.getPatients({ 
        cabinetId: 'cabinet-1', 
        ageMin: 30,
        ageMax: 50
      });
      
      expect(result.success).toBe(true);
      const now = new Date();
      result.data!.patients.forEach(patient => {
        const age = now.getFullYear() - patient.dateOfBirth.getFullYear();
        expect(age).toBeGreaterThanOrEqual(30);
        expect(age).toBeLessThanOrEqual(50);
      });
    });

    it('should apply pagination', async () => {
      const result = await patientService.getPatients({ 
        cabinetId: 'cabinet-1', 
        limit: 1,
        offset: 0
      });
      
      expect(result.success).toBe(true);
      expect(result.data!.patients.length).toBe(1);
      expect(result.data!.hasMore).toBe(true);
    });
  });

  describe('getPatientById', () => {
    it('should return a patient by ID', async () => {
      const result = await patientService.getPatientById('patient-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('patient-1');
    });

    it('should return error for non-existent patient', async () => {
      const result = await patientService.getPatientById('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient not found');
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const patientData: CreatePatientRequest = {
        cabinetId: 'cabinet-1',
        firstName: 'Test',
        lastName: 'Patient',
        email: 'test@example.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as Gender,
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24]
        }
      };

      const result = await patientService.createPatient(patientData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.firstName).toBe('Test');
      expect(result.data!.lastName).toBe('Patient');
      expect(result.data!.email).toBe('test@example.com');
      expect(result.data!.isActive).toBe(true);
      expect(result.data!.totalVisits).toBe(0);
    });

    it('should prevent duplicate email in same cabinet', async () => {
      const patientData: CreatePatientRequest = {
        cabinetId: 'cabinet-1',
        firstName: 'Duplicate',
        lastName: 'Email',
        email: 'marie.dubois@email.com', // Existing email
        phone: '+33999999999',
        dateOfBirth: new Date('1990-01-01'),
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24]
        }
      };

      const result = await patientService.createPatient(patientData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists in this cabinet');
    });

    it('should prevent duplicate phone in same cabinet', async () => {
      const patientData: CreatePatientRequest = {
        cabinetId: 'cabinet-1',
        firstName: 'Duplicate',
        lastName: 'Phone',
        email: 'unique@example.com',
        phone: '+33123456789', // Existing phone
        dateOfBirth: new Date('1990-01-01'),
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24]
        }
      };

      const result = await patientService.createPatient(patientData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number already exists in this cabinet');
    });
  });

  describe('updatePatient', () => {
    it('should update patient information', async () => {
      const updateData: UpdatePatientRequest = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const result = await patientService.updatePatient('patient-1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data!.firstName).toBe('Updated');
      expect(result.data!.lastName).toBe('Name');
      expect(result.data!.email).toBe('updated@example.com');
    });

    it('should return error for non-existent patient', async () => {
      const result = await patientService.updatePatient('non-existent', { firstName: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient not found');
    });

    it('should prevent duplicate email when updating', async () => {
      const result = await patientService.updatePatient('patient-2', { 
        email: 'marie.dubois@email.com' // Existing email from patient-1
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists in this cabinet');
    });
  });

  describe('deletePatient', () => {
    it('should soft delete a patient', async () => {
      const result = await patientService.deletePatient('patient-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      // Verify patient is marked as inactive
      const patientResult = await patientService.getPatientById('patient-1');
      expect(patientResult.success).toBe(true);
      expect(patientResult.data!.isActive).toBe(false);
    });

    it('should return error for non-existent patient', async () => {
      const result = await patientService.deletePatient('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient not found');
    });
  });

  describe('Medical History Management', () => {
    it('should add medical record to patient', async () => {
      const recordData = {
        patientId: 'patient-1',
        type: 'consultation' as const,
        title: 'Test Consultation',
        description: 'Test description',
        practitionerId: 'practitioner-1'
      };

      const result = await patientService.addMedicalRecord(recordData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe('Test Consultation');
      expect(result.data!.type).toBe('consultation');
    });

    it('should update medical record', async () => {
      // First add a record
      const addResult = await patientService.addMedicalRecord({
        patientId: 'patient-1',
        type: 'note',
        title: 'Original Title',
        description: 'Original description'
      });

      expect(addResult.success).toBe(true);
      const recordId = addResult.data!.id;

      // Then update it
      const updateResult = await patientService.updateMedicalRecord(
        'patient-1',
        recordId,
        { title: 'Updated Title', description: 'Updated description' }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.data!.title).toBe('Updated Title');
      expect(updateResult.data!.description).toBe('Updated description');
    });

    it('should delete medical record', async () => {
      // First add a record
      const addResult = await patientService.addMedicalRecord({
        patientId: 'patient-1',
        type: 'note',
        title: 'To Delete',
        description: 'This will be deleted'
      });

      expect(addResult.success).toBe(true);
      const recordId = addResult.data!.id;

      // Then delete it
      const deleteResult = await patientService.deleteMedicalRecord('patient-1', recordId);
      
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);
    });

    it('should get medical history sorted by date', async () => {
      const result = await patientService.getMedicalHistory('patient-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      
      // Check if sorted by date (newest first)
      if (result.data!.length > 1) {
        for (let i = 1; i < result.data!.length; i++) {
          expect(result.data![i-1].date.getTime()).toBeGreaterThanOrEqual(
            result.data![i].date.getTime()
          );
        }
      }
    });
  });

  describe('Patient Statistics', () => {
    it('should generate patient statistics for cabinet', async () => {
      const result = await patientService.getPatientStatistics('cabinet-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalPatients).toBeGreaterThan(0);
      expect(result.data!.activePatients).toBeGreaterThanOrEqual(0);
      expect(result.data!.averageAge).toBeGreaterThan(0);
      expect(result.data!.genderDistribution).toBeDefined();
      expect(result.data!.appointmentHistory).toBeDefined();
    });

    it('should handle empty cabinet statistics', async () => {
      const result = await patientService.getPatientStatistics('empty-cabinet');
      
      expect(result.success).toBe(true);
      expect(result.data!.totalPatients).toBe(0);
      expect(result.data!.activePatients).toBe(0);
      expect(result.data!.averageAge).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error by passing invalid data
      const result = await patientService.createPatient({} as CreatePatientRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
