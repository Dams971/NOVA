import { describe, it, expect, beforeEach } from 'vitest';
import { PatientService } from '@/lib/services/patient-service';
import { PatientSearchService } from '@/lib/services/patient-search-service';
import { PatientCommunicationService } from '@/lib/services/patient-communication-service';
import { CreatePatientRequest, Gender } from '@/lib/models/patient';

describe('Patient Management Integration', () => {
  let patientService: PatientService;
  let searchService: PatientSearchService;
  let communicationService: PatientCommunicationService;

  beforeEach(() => {
    patientService = PatientService.getInstance();
    searchService = PatientSearchService.getInstance();
    communicationService = PatientCommunicationService.getInstance();
  });

  describe('Complete Patient Lifecycle', () => {
    it('should handle complete patient management workflow', async () => {
      const cabinetId = 'test-cabinet';

      // 1. Create a new patient
      const patientData: CreatePatientRequest = {
        cabinetId,
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'female' as Gender,
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        }
      };

      const createResult = await patientService.createPatient(patientData);
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      
      const patientId = createResult.data!.id;

      // 2. Verify patient can be retrieved
      const getResult = await patientService.getPatientById(patientId);
      expect(getResult.success).toBe(true);
      expect(getResult.data!.firstName).toBe('Integration');
      expect(getResult.data!.lastName).toBe('Test');

      // 3. Add medical history
      const medicalRecordResult = await patientService.addMedicalRecord({
        patientId,
        type: 'allergy',
        title: 'Allergie aux arachides',
        description: 'Réaction allergique sévère aux arachides'
      });
      expect(medicalRecordResult.success).toBe(true);

      // 4. Update patient information
      const updateResult = await patientService.updatePatient(patientId, {
        firstName: 'Updated Integration',
        phone: '+33987654321'
      });
      expect(updateResult.success).toBe(true);
      expect(updateResult.data!.firstName).toBe('Updated Integration');
      expect(updateResult.data!.phone).toBe('+33987654321');

      // 5. Search for the patient
      const searchResult = await patientService.getPatients({
        cabinetId,
        search: 'Integration'
      });
      expect(searchResult.success).toBe(true);
      expect(searchResult.data!.patients).toHaveLength(1);
      expect(searchResult.data!.patients[0].id).toBe(patientId);

      // 6. Advanced search with medical history
      const advancedSearchResult = await searchService.advancedSearch({
        cabinetId,
        medicalHistorySearch: 'arachides'
      });
      expect(advancedSearchResult.success).toBe(true);
      expect(advancedSearchResult.data!.patients).toHaveLength(1);
      expect(advancedSearchResult.data!.patients[0].id).toBe(patientId);

      // 7. Send communication
      const messageResult = await communicationService.sendMessage({
        patientId,
        type: 'email',
        subject: 'Test Message',
        content: 'This is a test message for integration testing.'
      });
      expect(messageResult.success).toBe(true);

      // 8. Get communication history
      const commHistoryResult = await communicationService.getCommunicationHistory(patientId);
      expect(commHistoryResult.success).toBe(true);
      expect(commHistoryResult.data!.messages).toHaveLength(1);
      expect(commHistoryResult.data!.messages[0].subject).toBe('Test Message');

      // 9. Soft delete patient
      const deleteResult = await patientService.deletePatient(patientId);
      expect(deleteResult.success).toBe(true);

      // 10. Verify patient is marked as inactive
      const deletedPatientResult = await patientService.getPatientById(patientId);
      expect(deletedPatientResult.success).toBe(true);
      expect(deletedPatientResult.data!.isActive).toBe(false);
    });
  });

  describe('Search and Analytics Integration', () => {
    it('should provide comprehensive analytics for patient data', async () => {
      const cabinetId = 'analytics-cabinet';

      // Create multiple patients with different characteristics
      const patients = [
        {
          firstName: 'Alice',
          lastName: 'Young',
          dateOfBirth: new Date('2000-01-01'),
          gender: 'female' as Gender,
          communicationMethod: 'email' as const
        },
        {
          firstName: 'Bob',
          lastName: 'Middle',
          dateOfBirth: new Date('1980-01-01'),
          gender: 'male' as Gender,
          communicationMethod: 'sms' as const
        },
        {
          firstName: 'Charlie',
          lastName: 'Senior',
          dateOfBirth: new Date('1950-01-01'),
          gender: 'male' as Gender,
          communicationMethod: 'phone' as const
        }
      ];

      const createdPatients = [];
      for (const patientData of patients) {
        const result = await patientService.createPatient({
          cabinetId,
          ...patientData,
          email: `${patientData.firstName.toLowerCase()}@test.com`,
          phone: '+33123456789',
          preferences: {
            preferredLanguage: 'fr',
            communicationMethod: patientData.communicationMethod,
            reminderEnabled: true,
            reminderHours: [24]
          }
        });
        expect(result.success).toBe(true);
        createdPatients.push(result.data!);
      }

      // Add medical records to some patients
      await patientService.addMedicalRecord({
        patientId: createdPatients[0].id,
        type: 'allergy',
        title: 'Allergie au pollen',
        description: 'Rhinite allergique saisonnière'
      });

      await patientService.addMedicalRecord({
        patientId: createdPatients[1].id,
        type: 'medication',
        title: 'Aspirine',
        description: 'Prise quotidienne d\'aspirine'
      });

      // Get analytics
      const analyticsResult = await searchService.getPatientAnalytics(cabinetId);
      expect(analyticsResult.success).toBe(true);
      
      const analytics = analyticsResult.data!;
      expect(analytics.totalPatients).toBe(3);
      expect(analytics.activePatients).toBe(3);
      expect(analytics.averageAge).toBeGreaterThan(0);

      // Check age distribution
      expect(analytics.ageDistribution['19-35']).toBe(1); // Alice
      expect(analytics.ageDistribution['36-50']).toBe(1); // Bob
      expect(analytics.ageDistribution['65+']).toBe(1); // Charlie

      // Check gender distribution
      expect(analytics.genderDistribution.female).toBe(1);
      expect(analytics.genderDistribution.male).toBe(2);

      // Check communication preferences
      expect(analytics.communicationPreferences.email).toBe(1);
      expect(analytics.communicationPreferences.sms).toBe(1);
      expect(analytics.communicationPreferences.phone).toBe(1);

      // Check medical statistics
      expect(analytics.medicalStatistics.patientsWithAllergies).toBe(1);
      expect(analytics.medicalStatistics.patientsWithMedications).toBe(1);
    });
  });

  describe('Advanced Search Scenarios', () => {
    it('should handle complex search combinations', async () => {
      const cabinetId = 'search-cabinet';

      // Create patients with specific characteristics for testing
      const testPatients = [
        {
          firstName: 'Senior',
          lastName: 'WithAllergy',
          dateOfBirth: new Date('1940-01-01'),
          hasAllergy: true,
          visitCount: 10
        },
        {
          firstName: 'Young',
          lastName: 'Healthy',
          dateOfBirth: new Date('2000-01-01'),
          hasAllergy: false,
          visitCount: 2
        },
        {
          firstName: 'Middle',
          lastName: 'WithMedication',
          dateOfBirth: new Date('1975-01-01'),
          hasAllergy: false,
          visitCount: 5
        }
      ];

      const createdPatients = [];
      for (const patientData of testPatients) {
        const result = await patientService.createPatient({
          cabinetId,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: `${patientData.firstName.toLowerCase()}@test.com`,
          phone: '+33123456789',
          dateOfBirth: patientData.dateOfBirth,
          preferences: {
            preferredLanguage: 'fr',
            communicationMethod: 'email',
            reminderEnabled: true,
            reminderHours: [24]
          }
        });
        expect(result.success).toBe(true);
        
        const patient = result.data!;
        // Update visit count
        await patientService.updatePatient(patient.id, {
          totalVisits: patientData.visitCount
        });

        if (patientData.hasAllergy) {
          await patientService.addMedicalRecord({
            patientId: patient.id,
            type: 'allergy',
            title: 'Test Allergy',
            description: 'Test allergy description'
          });
        }

        createdPatients.push(patient);
      }

      // Test 1: Search for patients with allergies
      const allergySearchResult = await searchService.advancedSearch({
        cabinetId,
        hasAllergies: true
      });
      expect(allergySearchResult.success).toBe(true);
      expect(allergySearchResult.data!.patients).toHaveLength(1);
      expect(allergySearchResult.data!.patients[0].firstName).toBe('Senior');

      // Test 2: Search for patients without allergies
      const noAllergySearchResult = await searchService.advancedSearch({
        cabinetId,
        hasAllergies: false
      });
      expect(noAllergySearchResult.success).toBe(true);
      expect(noAllergySearchResult.data!.patients).toHaveLength(2);

      // Test 3: Search by visit count range
      const visitSearchResult = await searchService.advancedSearch({
        cabinetId,
        visitCountMin: 5,
        visitCountMax: 10
      });
      expect(visitSearchResult.success).toBe(true);
      expect(visitSearchResult.data!.patients).toHaveLength(2); // Senior and Middle

      // Test 4: Combined search (seniors with high visit count)
      const combinedSearchResult = await searchService.advancedSearch({
        cabinetId,
        ageMin: 60,
        visitCountMin: 8
      });
      expect(combinedSearchResult.success).toBe(true);
      expect(combinedSearchResult.data!.patients).toHaveLength(1);
      expect(combinedSearchResult.data!.patients[0].firstName).toBe('Senior');

      // Test 5: Sort by age descending
      const sortedSearchResult = await searchService.advancedSearch({
        cabinetId,
        sortBy: 'age',
        sortOrder: 'desc'
      });
      expect(sortedSearchResult.success).toBe(true);
      expect(sortedSearchResult.data!.patients[0].firstName).toBe('Senior'); // Oldest first
      expect(sortedSearchResult.data!.patients[2].firstName).toBe('Young'); // Youngest last
    });
  });

  describe('Communication Integration', () => {
    it('should handle templated communications', async () => {
      const cabinetId = 'comm-cabinet';

      // Create a patient
      const patientResult = await patientService.createPatient({
        cabinetId,
        firstName: 'Communication',
        lastName: 'Test',
        email: 'comm@test.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1990-01-01'),
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24]
        }
      });
      expect(patientResult.success).toBe(true);
      const patient = patientResult.data!;

      // Send templated message
      const templateResult = await communicationService.sendTemplatedMessage(
        patient.id,
        'template-1', // Appointment reminder template
        {
          patientName: `${patient.firstName} ${patient.lastName}`,
          appointmentDate: '15 juillet 2024',
          appointmentTime: '14:30',
          cabinetName: 'Cabinet Test',
          cabinetPhone: '+33123456789'
        },
        'appointment-123'
      );
      expect(templateResult.success).toBe(true);
      expect(templateResult.data).toHaveLength(2); // Email and SMS

      // Verify messages were created
      const historyResult = await communicationService.getCommunicationHistory(patient.id);
      expect(historyResult.success).toBe(true);
      expect(historyResult.data!.messages.length).toBeGreaterThanOrEqual(2);

      // Check that template variables were replaced
      const emailMessage = historyResult.data!.messages.find(m => m.type === 'email');
      expect(emailMessage).toBeDefined();
      expect(emailMessage!.content).toContain('Communication Test');
      expect(emailMessage!.content).toContain('15 juillet 2024');
      expect(emailMessage!.content).toContain('14:30');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate patient creation attempts', async () => {
      const cabinetId = 'duplicate-cabinet';
      
      const patientData: CreatePatientRequest = {
        cabinetId,
        firstName: 'Duplicate',
        lastName: 'Test',
        email: 'duplicate@test.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1990-01-01'),
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24]
        }
      };

      // Create first patient
      const firstResult = await patientService.createPatient(patientData);
      expect(firstResult.success).toBe(true);

      // Try to create duplicate with same email
      const duplicateResult = await patientService.createPatient(patientData);
      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toContain('Email already exists');
    });

    it('should handle medical record operations on non-existent patients', async () => {
      const result = await patientService.addMedicalRecord({
        patientId: 'non-existent-patient',
        type: 'note',
        title: 'Test Note',
        description: 'This should fail'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient not found');
    });

    it('should handle empty search results gracefully', async () => {
      const searchResult = await searchService.advancedSearch({
        cabinetId: 'empty-cabinet',
        search: 'NonExistentPatient'
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.data!.patients).toHaveLength(0);
      expect(searchResult.data!.total).toBe(0);
    });
  });
});
