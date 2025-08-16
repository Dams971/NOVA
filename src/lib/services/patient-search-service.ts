import { Patient, PatientFilters, MedicalRecord } from '@/lib/models/patient';
import { PatientService, PatientSearchResult } from './patient-service';

export interface AdvancedSearchFilters extends PatientFilters {
  medicalHistorySearch?: string;
  hasAllergies?: boolean;
  hasMedications?: boolean;
  visitCountMin?: number;
  visitCountMax?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: 'name' | 'age' | 'lastVisit' | 'totalVisits' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  type: 'patient' | 'medical_record' | 'medication' | 'allergy';
  value: string;
  label: string;
  count: number;
}

export interface PatientAnalytics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsThisMonth: number;
  newPatientsThisYear: number;
  averageAge: number;
  ageDistribution: {
    '0-18': number;
    '19-35': number;
    '36-50': number;
    '51-65': number;
    '65+': number;
  };
  genderDistribution: {
    male: number;
    female: number;
    other: number;
    unspecified: number;
  };
  communicationPreferences: {
    email: number;
    sms: number;
    phone: number;
  };
  visitStatistics: {
    averageVisits: number;
    totalVisits: number;
    patientsWithNoVisits: number;
    mostActivePatients: Patient[];
  };
  medicalStatistics: {
    totalMedicalRecords: number;
    patientsWithAllergies: number;
    patientsWithMedications: number;
    commonAllergies: Array<{ name: string; count: number }>;
    commonMedications: Array<{ name: string; count: number }>;
  };
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  includeHeaders: boolean;
  includeMedicalHistory: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PatientSearchServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PatientSearchService {
  private static instance: PatientSearchService;
  private patientService: PatientService;

  private constructor() {
    this.patientService = PatientService.getInstance();
  }

  static getInstance(): PatientSearchService {
    if (!PatientSearchService.instance) {
      PatientSearchService.instance = new PatientSearchService();
    }
    return PatientSearchService.instance;
  }

  async advancedSearch(filters: AdvancedSearchFilters): Promise<PatientSearchServiceResult<PatientSearchResult>> {
    try {
      // Get base results from patient service
      const baseResult = await this.patientService.getPatients(filters);
      
      if (!baseResult.success || !baseResult.data) {
        return baseResult;
      }

      let patients = baseResult.data.patients;

      // Apply advanced filters
      if (filters.medicalHistorySearch) {
        const searchTerm = filters.medicalHistorySearch.toLowerCase();
        patients = patients.filter(patient => 
          patient.medicalHistory.some(record => 
            record.title.toLowerCase().includes(searchTerm) ||
            record.description.toLowerCase().includes(searchTerm)
          )
        );
      }

      if (filters.hasAllergies !== undefined) {
        patients = patients.filter(patient => {
          const hasAllergies = patient.medicalHistory.some(record => record.type === 'allergy');
          return filters.hasAllergies ? hasAllergies : !hasAllergies;
        });
      }

      if (filters.hasMedications !== undefined) {
        patients = patients.filter(patient => {
          const hasMedications = patient.medicalHistory.some(record => record.type === 'medication');
          return filters.hasMedications ? hasMedications : !hasMedications;
        });
      }

      if (filters.visitCountMin !== undefined) {
        patients = patients.filter(patient => patient.totalVisits >= filters.visitCountMin!);
      }

      if (filters.visitCountMax !== undefined) {
        patients = patients.filter(patient => patient.totalVisits <= filters.visitCountMax!);
      }

      if (filters.createdFrom) {
        patients = patients.filter(patient => patient.createdAt >= filters.createdFrom!);
      }

      if (filters.createdTo) {
        patients = patients.filter(patient => patient.createdAt <= filters.createdTo!);
      }

      // Apply sorting
      if (filters.sortBy) {
        patients = this.sortPatients(patients, filters.sortBy, filters.sortOrder || 'asc');
      }

      return {
        success: true,
        data: {
          patients,
          total: patients.length,
          hasMore: false // Advanced search returns all results
        }
      };
    } catch (_error) {
      return { success: false, error: 'Failed to perform advanced search' };
    }
  }

  private sortPatients(patients: Patient[], sortBy: string, sortOrder: 'asc' | 'desc'): Patient[] {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return [...patients].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
          const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB) * multiplier;

        case 'age':
          const ageA = new Date().getFullYear() - a.dateOfBirth.getFullYear();
          const ageB = new Date().getFullYear() - b.dateOfBirth.getFullYear();
          return (ageA - ageB) * multiplier;

        case 'lastVisit':
          const lastVisitA = a.lastVisit?.getTime() || 0;
          const lastVisitB = b.lastVisit?.getTime() || 0;
          return (lastVisitA - lastVisitB) * multiplier;

        case 'totalVisits':
          return (a.totalVisits - b.totalVisits) * multiplier;

        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier;

        default:
          return 0;
      }
    });
  }

  async getSearchSuggestions(cabinetId: string, query: string): Promise<PatientSearchServiceResult<SearchSuggestion[]>> {
    try {
      const result = await this.patientService.getPatients({ cabinetId, limit: 1000 });
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Failed to fetch patients for suggestions' };
      }

      const patients = result.data.patients;
      const suggestions: SearchSuggestion[] = [];
      const queryLower = query.toLowerCase();

      // Patient name suggestions
      const patientNames = new Set<string>();
      patients.forEach(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`;
        if (fullName.toLowerCase().includes(queryLower)) {
          patientNames.add(fullName);
        }
      });

      patientNames.forEach(name => {
        suggestions.push({
          type: 'patient',
          value: name,
          label: name,
          count: 1
        });
      });

      // Medical record suggestions
      const medicalTerms = new Map<string, number>();
      patients.forEach(patient => {
        patient.medicalHistory.forEach(record => {
          if (record.title.toLowerCase().includes(queryLower)) {
            medicalTerms.set(record.title, (medicalTerms.get(record.title) || 0) + 1);
          }
          if (record.description.toLowerCase().includes(queryLower)) {
            const words = record.description.toLowerCase().split(' ');
            words.forEach(word => {
              if (word.includes(queryLower) && word.length > 3) {
                medicalTerms.set(word, (medicalTerms.get(word) || 0) + 1);
              }
            });
          }
        });
      });

      medicalTerms.forEach((count, term) => {
        suggestions.push({
          type: 'medical_record',
          value: term,
          label: `Historique médical: ${term}`,
          count
        });
      });

      // Sort by relevance (count) and limit results
      return {
        success: true,
        data: suggestions
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      };
    } catch (_error) {
      return { success: false, error: 'Failed to generate search suggestions' };
    }
  }

  async getPatientAnalytics(cabinetId: string): Promise<PatientSearchServiceResult<PatientAnalytics>> {
    try {
      const result = await this.patientService.getPatients({ cabinetId, limit: 10000 });
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Failed to fetch patients for analytics' };
      }

      const patients = result.data.patients;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      // Basic statistics
      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.isActive).length;
      const inactivePatients = totalPatients - activePatients;
      const newPatientsThisMonth = patients.filter(p => p.createdAt >= thisMonth).length;
      const newPatientsThisYear = patients.filter(p => p.createdAt >= thisYear).length;

      // Age statistics
      const ages = patients.map(p => now.getFullYear() - p.dateOfBirth.getFullYear());
      const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

      const ageDistribution = {
        '0-18': ages.filter(age => age <= 18).length,
        '19-35': ages.filter(age => age >= 19 && age <= 35).length,
        '36-50': ages.filter(age => age >= 36 && age <= 50).length,
        '51-65': ages.filter(age => age >= 51 && age <= 65).length,
        '65+': ages.filter(age => age > 65).length
      };

      // Gender distribution
      const genderDistribution = patients.reduce(
        (acc, p) => {
          if (p.gender === 'male') acc.male++;
          else if (p.gender === 'female') acc.female++;
          else if (p.gender === 'other') acc.other++;
          else acc.unspecified++;
          return acc;
        },
        { male: 0, female: 0, other: 0, unspecified: 0 }
      );

      // Communication preferences
      const communicationPreferences = patients.reduce(
        (acc, p) => {
          acc[p.preferences.communicationMethod]++;
          return acc;
        },
        { email: 0, sms: 0, phone: 0 }
      );

      // Visit statistics
      const totalVisits = patients.reduce((sum, p) => sum + p.totalVisits, 0);
      const averageVisits = totalPatients > 0 ? Math.round(totalVisits / totalPatients * 10) / 10 : 0;
      const patientsWithNoVisits = patients.filter(p => p.totalVisits === 0).length;
      const mostActivePatients = patients
        .filter(p => p.totalVisits > 0)
        .sort((a, b) => b.totalVisits - a.totalVisits)
        .slice(0, 5);

      // Medical statistics
      const allMedicalRecords = patients.flatMap(p => p.medicalHistory);
      const totalMedicalRecords = allMedicalRecords.length;
      const patientsWithAllergies = patients.filter(p => 
        p.medicalHistory.some(r => r.type === 'allergy')
      ).length;
      const patientsWithMedications = patients.filter(p => 
        p.medicalHistory.some(r => r.type === 'medication')
      ).length;

      // Common allergies and medications
      const allergyCount = new Map<string, number>();
      const medicationCount = new Map<string, number>();

      allMedicalRecords.forEach(record => {
        if (record.type === 'allergy') {
          allergyCount.set(record.title, (allergyCount.get(record.title) || 0) + 1);
        } else if (record.type === 'medication') {
          medicationCount.set(record.title, (medicationCount.get(record.title) || 0) + 1);
        }
      });

      const commonAllergies = Array.from(allergyCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const commonMedications = Array.from(medicationCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const analytics: PatientAnalytics = {
        totalPatients,
        activePatients,
        inactivePatients,
        newPatientsThisMonth,
        newPatientsThisYear,
        averageAge,
        ageDistribution,
        genderDistribution,
        communicationPreferences,
        visitStatistics: {
          averageVisits,
          totalVisits,
          patientsWithNoVisits,
          mostActivePatients
        },
        medicalStatistics: {
          totalMedicalRecords,
          patientsWithAllergies,
          patientsWithMedications,
          commonAllergies,
          commonMedications
        }
      };

      return { success: true, data: analytics };
    } catch (_error) {
      return { success: false, error: 'Failed to generate patient analytics' };
    }
  }

  async exportPatients(
    cabinetId: string, 
    filters: AdvancedSearchFilters, 
    options: ExportOptions
  ): Promise<PatientSearchServiceResult<string>> {
    try {
      const searchResult = await this.advancedSearch({ ...filters, cabinetId });
      
      if (!searchResult.success || !searchResult.data) {
        return { success: false, error: 'Failed to fetch patients for export' };
      }

      const patients = searchResult.data.patients;

      switch (options.format) {
        case 'csv':
          return this.exportToCSV(patients, options);
        case 'excel':
          return this.exportToExcel(patients, options);
        case 'pdf':
          return this.exportToPDF(patients, options);
        default:
          return { success: false, error: 'Unsupported export format' };
      }
    } catch (_error) {
      return { success: false, error: 'Failed to export patients' };
    }
  }

  private async exportToCSV(patients: Patient[], options: ExportOptions): Promise<PatientSearchServiceResult<string>> {
    try {
      const headers = options.fields.join(',');
      const rows = patients.map(patient => {
        return options.fields.map(field => {
          switch (field) {
            case 'firstName': return patient.firstName;
            case 'lastName': return patient.lastName;
            case 'email': return patient.email || '';
            case 'phone': return patient.phone || '';
            case 'dateOfBirth': return patient.dateOfBirth.toISOString().split('T')[0];
            case 'gender': return patient.gender || '';
            case 'totalVisits': return patient.totalVisits.toString();
            case 'lastVisit': return patient.lastVisit?.toISOString().split('T')[0] || '';
            case 'createdAt': return patient.createdAt.toISOString().split('T')[0];
            default: return '';
          }
        }).join(',');
      });

      const csvContent = options.includeHeaders 
        ? [headers, ...rows].join('\n')
        : rows.join('\n');

      return { success: true, data: csvContent };
    } catch (_error) {
      return { success: false, error: 'Failed to generate CSV export' };
    }
  }

  private async exportToExcel(patients: Patient[], options: ExportOptions): Promise<PatientSearchServiceResult<string>> {
    // This would implement Excel export using a library like xlsx
    return { success: false, error: 'Excel export not implemented yet' };
  }

  private async exportToPDF(patients: Patient[], options: ExportOptions): Promise<PatientSearchServiceResult<string>> {
    // This would implement PDF export using a library like jsPDF
    return { success: false, error: 'PDF export not implemented yet' };
  }
}
