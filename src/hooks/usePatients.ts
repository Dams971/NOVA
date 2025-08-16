import { useState, useEffect, useCallback } from 'react';
import { Patient, PatientFilters, CreatePatientRequest, UpdatePatientRequest, MedicalRecord } from '@/lib/models/patient';
import { PatientStatistics } from '@/lib/services/patient-service';

interface UsePatientResult {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  fetchPatients: (filters?: PatientFilters) => Promise<void>;
  createPatient: (data: CreatePatientRequest) => Promise<Patient | null>;
  updatePatient: (id: string, data: UpdatePatientRequest) => Promise<Patient | null>;
  deletePatient: (id: string) => Promise<boolean>;
  refreshPatients: () => Promise<void>;
}

interface UsePatientDetailResult {
  patient: Patient | null;
  loading: boolean;
  error: string | null;
  medicalHistory: MedicalRecord[];
  fetchPatient: (id: string) => Promise<void>;
  addMedicalRecord: (data: { type: string; title: string; description: string; practitionerId?: string }) => Promise<MedicalRecord | null>;
  refreshPatient: () => Promise<void>;
}

interface UsePatientStatisticsResult {
  statistics: PatientStatistics | null;
  loading: boolean;
  error: string | null;
  fetchStatistics: (cabinetId: string) => Promise<void>;
}

export function usePatients(initialFilters?: PatientFilters): UsePatientResult {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<PatientFilters>(initialFilters || {});

  const fetchPatients = useCallback(async (filters?: PatientFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = filters || currentFilters;
      setCurrentFilters(filtersToUse);

      const queryParams = new URLSearchParams();
      
      if (filtersToUse.cabinetId) queryParams.append('cabinetId', filtersToUse.cabinetId);
      if (filtersToUse.search) queryParams.append('search', filtersToUse.search);
      if (filtersToUse.isActive !== undefined) queryParams.append('isActive', filtersToUse.isActive.toString());
      if (filtersToUse.ageMin) queryParams.append('ageMin', filtersToUse.ageMin.toString());
      if (filtersToUse.ageMax) queryParams.append('ageMax', filtersToUse.ageMax.toString());
      if (filtersToUse.lastVisitFrom) queryParams.append('lastVisitFrom', filtersToUse.lastVisitFrom.toISOString());
      if (filtersToUse.lastVisitTo) queryParams.append('lastVisitTo', filtersToUse.lastVisitTo.toISOString());
      if (filtersToUse.limit) queryParams.append('limit', filtersToUse.limit.toString());
      if (filtersToUse.offset) queryParams.append('offset', filtersToUse.offset.toString());

      const response = await fetch(`/api/manager/patients?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setPatients(result.data.patients);
        setTotal(result.data.total);
        setHasMore(result.data.hasMore);
      } else {
        setError(result.error || 'Failed to fetch patients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const createPatient = useCallback(async (data: CreatePatientRequest): Promise<Patient | null> => {
    try {
      const response = await fetch('/api/manager/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the patients list
        await fetchPatients();
        return result.data;
      } else {
        setError(result.error || 'Failed to create patient');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [fetchPatients]);

  const updatePatient = useCallback(async (id: string, data: UpdatePatientRequest): Promise<Patient | null> => {
    try {
      const response = await fetch(`/api/manager/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Update the patient in the local state
        setPatients(prev => prev.map(p => p.id === id ? result.data : p));
        return result.data;
      } else {
        setError(result.error || 'Failed to update patient');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, []);

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/manager/patients/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove the patient from the local state
        setPatients(prev => prev.filter(p => p.id !== id));
        setTotal(prev => prev - 1);
        return true;
      } else {
        setError(result.error || 'Failed to delete patient');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    await fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (initialFilters) {
      fetchPatients(initialFilters);
    }
  }, [fetchPatients, initialFilters]);

  return {
    patients,
    loading,
    error,
    total,
    hasMore,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    refreshPatients,
  };
}

export function usePatientDetail(patientId?: string): UsePatientDetailResult {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);

  const fetchPatient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/manager/patients/${id}`);
      const result = await response.json();

      if (result.success) {
        setPatient(result.data);
        setMedicalHistory(result.data.medicalHistory || []);
      } else {
        setError(result.error || 'Failed to fetch patient');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMedicalRecord = useCallback(async (data: { 
    type: string; 
    title: string; 
    description: string; 
    practitionerId?: string 
  }): Promise<MedicalRecord | null> => {
    if (!patient) return null;

    try {
      const response = await fetch(`/api/manager/patients/${patient.id}/medical-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Add the new record to the medical history
        setMedicalHistory(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error || 'Failed to add medical record');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [patient]);

  const refreshPatient = useCallback(async () => {
    if (patient) {
      await fetchPatient(patient.id);
    }
  }, [patient, fetchPatient]);

  useEffect(() => {
    if (patientId) {
      fetchPatient(patientId);
    }
  }, [patientId, fetchPatient]);

  return {
    patient,
    loading,
    error,
    medicalHistory,
    fetchPatient,
    addMedicalRecord,
    refreshPatient,
  };
}

export function usePatientStatistics(): UsePatientStatisticsResult {
  const [statistics, setStatistics] = useState<PatientStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async (cabinetId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/manager/patients/statistics?cabinetId=${cabinetId}`);
      const result = await response.json();

      if (result.success) {
        setStatistics(result.data);
      } else {
        setError(result.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
}
