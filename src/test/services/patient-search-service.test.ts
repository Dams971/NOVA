import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientSearchService, AdvancedSearchFilters } from '@/lib/services/patient-search-service';
import { PatientService } from '@/lib/services/patient-service';

// Mock the patient service
vi.mock('@/lib/services/patient-service');

const mockPatientService = {
  getPatients: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(PatientService.getInstance).mockReturnValue(mockPatientService as any);

describe('PatientSearchService', () => {
  let searchService: PatientSearchService;
  let mockPatients: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    searchService = PatientSearchService.getInstance();
    
    mockPatients = [
      {
        id: 'patient-1',
        cabinetId: 'cabinet-1',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie@example.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'female',
        isActive: true,
        totalVisits: 5,
        lastVisit: new Date('2024-02-20'),
        createdAt: new Date('2024-01-01'),
        medicalHistory: [
          {
            id: 'record-1',
            type: 'allergy',
            title: 'Allergie à la pénicilline',
            description: 'Patient allergique à la pénicilline',
            date: new Date('2024-01-15')
          },
          {
            id: 'record-2',
            type: 'medication',
            title: 'Paracétamol',
            description: 'Prise de paracétamol pour douleurs',
            date: new Date('2024-02-01')
          }
        ],
        preferences: {
          communicationMethod: 'email',
          preferredLanguage: 'fr',
          reminderEnabled: true,
          reminderHours: [24]
        }
      },
      {
        id: 'patient-2',
        cabinetId: 'cabinet-1',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre@example.com',
        phone: '+33987654321',
        dateOfBirth: new Date('1978-11-22'),
        gender: 'male',
        isActive: true,
        totalVisits: 3,
        lastVisit: new Date('2024-01-10'),
        createdAt: new Date('2024-01-01'),
        medicalHistory: [
          {
            id: 'record-3',
            type: 'consultation',
            title: 'Consultation de routine',
            description: 'Examen dentaire complet',
            date: new Date('2024-01-10')
          }
        ],
        preferences: {
          communicationMethod: 'sms',
          preferredLanguage: 'fr',
          reminderEnabled: true,
          reminderHours: [48, 24]
        }
      },
      {
        id: 'patient-3',
        cabinetId: 'cabinet-1',
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie@example.com',
        phone: '+33456789123',
        dateOfBirth: new Date('1992-07-08'),
        gender: 'female',
        isActive: false,
        totalVisits: 1,
        createdAt: new Date('2024-02-01'),
        medicalHistory: [],
        preferences: {
          communicationMethod: 'phone',
          preferredLanguage: 'fr',
          reminderEnabled: false,
          reminderHours: []
        }
      }
    ];

    mockPatientService.getPatients.mockResolvedValue({
      success: true,
      data: {
        patients: mockPatients,
        total: mockPatients.length,
        hasMore: false
      }
    });
  });

  describe('advancedSearch', () => {
    it('should perform basic search', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        search: 'Marie'
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPatientService.getPatients).toHaveBeenCalledWith(filters);
    });

    it('should filter by medical history search', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        medicalHistorySearch: 'pénicilline'
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(1);
      expect(result.data!.patients[0].id).toBe('patient-1');
    });

    it('should filter patients with allergies', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        hasAllergies: true
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(1);
      expect(result.data!.patients[0].id).toBe('patient-1');
    });

    it('should filter patients without allergies', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        hasAllergies: false
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(2);
      expect(result.data!.patients.map(p => p.id)).toEqual(['patient-2', 'patient-3']);
    });

    it('should filter patients with medications', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        hasMedications: true
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(1);
      expect(result.data!.patients[0].id).toBe('patient-1');
    });

    it('should filter by visit count range', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        visitCountMin: 3,
        visitCountMax: 5
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(2);
      expect(result.data!.patients.every(p => p.totalVisits >= 3 && p.totalVisits <= 5)).toBe(true);
    });

    it('should filter by creation date range', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        createdFrom: new Date('2024-01-15'),
        createdTo: new Date('2024-02-15')
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients).toHaveLength(1);
      expect(result.data!.patients[0].id).toBe('patient-3');
    });

    it('should sort patients by name ascending', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients[0].lastName).toBe('Dubois');
      expect(result.data!.patients[1].lastName).toBe('Leroy');
      expect(result.data!.patients[2].lastName).toBe('Martin');
    });

    it('should sort patients by age descending', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        sortBy: 'age',
        sortOrder: 'desc'
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      // Pierre (1978) should be first (oldest), Sophie (1992) should be last (youngest)
      expect(result.data!.patients[0].firstName).toBe('Pierre');
      expect(result.data!.patients[2].firstName).toBe('Sophie');
    });

    it('should sort patients by total visits', async () => {
      const filters: AdvancedSearchFilters = {
        cabinetId: 'cabinet-1',
        sortBy: 'totalVisits',
        sortOrder: 'desc'
      };

      const result = await searchService.advancedSearch(filters);
      
      expect(result.success).toBe(true);
      expect(result.data!.patients[0].totalVisits).toBe(5); // Marie
      expect(result.data!.patients[1].totalVisits).toBe(3); // Pierre
      expect(result.data!.patients[2].totalVisits).toBe(1); // Sophie
    });
  });

  describe('getSearchSuggestions', () => {
    it('should generate patient name suggestions', async () => {
      const result = await searchService.getSearchSuggestions('cabinet-1', 'Mar');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.some(s => s.type === 'patient' && s.value.includes('Marie'))).toBe(true);
      expect(result.data!.some(s => s.type === 'patient' && s.value.includes('Martin'))).toBe(true);
    });

    it('should generate medical record suggestions', async () => {
      const result = await searchService.getSearchSuggestions('cabinet-1', 'pénicilline');
      
      expect(result.success).toBe(true);
      expect(result.data!.some(s => s.type === 'medical_record')).toBe(true);
    });

    it('should limit suggestions to 10 results', async () => {
      const result = await searchService.getSearchSuggestions('cabinet-1', 'a');
      
      expect(result.success).toBe(true);
      expect(result.data!.length).toBeLessThanOrEqual(10);
    });

    it('should sort suggestions by relevance', async () => {
      const result = await searchService.getSearchSuggestions('cabinet-1', 'a');
      
      expect(result.success).toBe(true);
      if (result.data!.length > 1) {
        for (let i = 1; i < result.data!.length; i++) {
          expect(result.data![i-1].count).toBeGreaterThanOrEqual(result.data![i].count);
        }
      }
    });
  });

  describe('getPatientAnalytics', () => {
    it('should generate comprehensive patient analytics', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const analytics = result.data!;
      expect(analytics.totalPatients).toBe(3);
      expect(analytics.activePatients).toBe(2);
      expect(analytics.inactivePatients).toBe(1);
      expect(analytics.averageAge).toBeGreaterThan(0);
    });

    it('should calculate age distribution correctly', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      const ageDistribution = result.data!.ageDistribution;
      
      // Based on mock data: Marie (1985) = 39, Pierre (1978) = 46, Sophie (1992) = 32
      expect(ageDistribution['36-50']).toBe(2); // Marie and Pierre
      expect(ageDistribution['19-35']).toBe(1); // Sophie
    });

    it('should calculate gender distribution correctly', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      const genderDistribution = result.data!.genderDistribution;
      
      expect(genderDistribution.female).toBe(2); // Marie and Sophie
      expect(genderDistribution.male).toBe(1); // Pierre
    });

    it('should calculate communication preferences correctly', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      const commPrefs = result.data!.communicationPreferences;
      
      expect(commPrefs.email).toBe(1); // Marie
      expect(commPrefs.sms).toBe(1); // Pierre
      expect(commPrefs.phone).toBe(1); // Sophie
    });

    it('should calculate visit statistics correctly', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      const visitStats = result.data!.visitStatistics;
      
      expect(visitStats.totalVisits).toBe(9); // 5 + 3 + 1
      expect(visitStats.averageVisits).toBe(3); // 9/3
      expect(visitStats.patientsWithNoVisits).toBe(0);
      expect(visitStats.mostActivePatients).toHaveLength(3);
      expect(visitStats.mostActivePatients[0].totalVisits).toBe(5); // Marie first
    });

    it('should calculate medical statistics correctly', async () => {
      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(true);
      const medStats = result.data!.medicalStatistics;
      
      expect(medStats.totalMedicalRecords).toBe(3);
      expect(medStats.patientsWithAllergies).toBe(1); // Marie
      expect(medStats.patientsWithMedications).toBe(1); // Marie
      expect(medStats.commonAllergies).toHaveLength(1);
      expect(medStats.commonMedications).toHaveLength(1);
    });

    it('should handle empty cabinet analytics', async () => {
      mockPatientService.getPatients.mockResolvedValue({
        success: true,
        data: { patients: [], total: 0, hasMore: false }
      });

      const result = await searchService.getPatientAnalytics('empty-cabinet');
      
      expect(result.success).toBe(true);
      expect(result.data!.totalPatients).toBe(0);
      expect(result.data!.averageAge).toBe(0);
    });
  });

  describe('exportPatients', () => {
    it('should export patients to CSV format', async () => {
      const filters: AdvancedSearchFilters = { cabinetId: 'cabinet-1' };
      const options = {
        format: 'csv' as const,
        fields: ['firstName', 'lastName', 'email'],
        includeHeaders: true,
        includeMedicalHistory: false
      };

      const result = await searchService.exportPatients('cabinet-1', filters, options);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.includes('firstName,lastName,email')).toBe(true);
      expect(result.data!.includes('Marie,Dubois,marie@example.com')).toBe(true);
    });

    it('should handle unsupported export formats', async () => {
      const filters: AdvancedSearchFilters = { cabinetId: 'cabinet-1' };
      const options = {
        format: 'xml' as any,
        fields: ['firstName'],
        includeHeaders: true,
        includeMedicalHistory: false
      };

      const result = await searchService.exportPatients('cabinet-1', filters, options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported export format');
    });
  });

  describe('Error Handling', () => {
    it('should handle patient service errors', async () => {
      mockPatientService.getPatients.mockResolvedValue({
        success: false,
        error: 'Service error'
      });

      const result = await searchService.advancedSearch({ cabinetId: 'cabinet-1' });
      
      expect(result.success).toBe(false);
    });

    it('should handle analytics generation errors', async () => {
      mockPatientService.getPatients.mockRejectedValue(new Error('Network error'));

      const result = await searchService.getPatientAnalytics('cabinet-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch patients for analytics');
    });
  });
});
