import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatients, usePatientDetail, usePatientStatistics } from '@/hooks/usePatients';
import { PatientFilters, CreatePatientRequest, UpdatePatientRequest } from '@/lib/models/patient';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('usePatients Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('usePatients', () => {
    test('should fetch patients successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          patients: [
            {
              id: 'patient-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phone: '+33123456789',
              cabinetId: 'cabinet-1',
              isActive: true
            }
          ],
          total: 1,
          hasMore: false
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePatients());

      const filters: PatientFilters = { cabinetId: 'cabinet-1' };

      await act(async () => {
        await result.current.fetchPatients(filters);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.patients).toHaveLength(1);
      expect(result.current.patients[0].firstName).toBe('John');
      expect(result.current.total).toBe(1);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle fetch error', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Failed to fetch patients'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatients({ cabinetId: 'cabinet-1' });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch patients');
      expect(result.current.patients).toHaveLength(0);
    });

    test('should create patient successfully', async () => {
      const mockCreateResponse = {
        success: true,
        data: {
          id: 'new-patient-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+33987654321',
          cabinetId: 'cabinet-1',
          isActive: true
        }
      };

      const mockFetchResponse = {
        success: true,
        data: {
          patients: [mockCreateResponse.data],
          total: 1,
          hasMore: false
        }
      };

      // Mock create request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse,
      } as Response);

      // Mock fetch patients after create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFetchResponse,
      } as Response);

      const { result } = renderHook(() => usePatients());

      const createRequest: CreatePatientRequest = {
        cabinetId: 'cabinet-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+33987654321',
        dateOfBirth: new Date('1985-05-15')
      };

      let createdPatient;
      await act(async () => {
        createdPatient = await result.current.createPatient(createRequest);
      });

      expect(createdPatient).toBeDefined();
      expect(createdPatient?.firstName).toBe('Jane');
      expect(mockFetch).toHaveBeenCalledWith('/api/manager/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest),
      });
    });

    test('should update patient successfully', async () => {
      const mockUpdateResponse = {
        success: true,
        data: {
          id: 'patient-1',
          firstName: 'John Updated',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+33123456789',
          cabinetId: 'cabinet-1',
          isActive: true
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateResponse,
      } as Response);

      const { result } = renderHook(() => usePatients());

      // Set initial patients
      act(() => {
        result.current.patients.push({
          id: 'patient-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+33123456789',
          cabinetId: 'cabinet-1',
          isActive: true
        } as any);
      });

      const updateRequest: UpdatePatientRequest = {
        firstName: 'John Updated'
      };

      let updatedPatient;
      await act(async () => {
        updatedPatient = await result.current.updatePatient('patient-1', updateRequest);
      });

      expect(updatedPatient).toBeDefined();
      expect(updatedPatient?.firstName).toBe('John Updated');
      expect(mockFetch).toHaveBeenCalledWith('/api/manager/patients/patient-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });
    });

    test('should delete patient successfully', async () => {
      const mockDeleteResponse = {
        success: true,
        data: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeleteResponse,
      } as Response);

      const { result } = renderHook(() => usePatients());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deletePatient('patient-1');
      });

      expect(deleteResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/manager/patients/patient-1', {
        method: 'DELETE',
      });
    });
  });

  describe('usePatientDetail', () => {
    test('should fetch patient detail successfully', async () => {
      const mockPatient = {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        cabinetId: 'cabinet-1',
        medicalHistory: [
          {
            id: 'record-1',
            date: new Date('2024-01-15'),
            type: 'consultation',
            title: 'Routine Check-up',
            description: 'Regular dental examination'
          }
        ],
        isActive: true
      };

      const mockResponse = {
        success: true,
        data: mockPatient
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePatientDetail());

      await act(async () => {
        await result.current.fetchPatient('patient-1');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.patient).toBeDefined();
      expect(result.current.patient?.firstName).toBe('John');
      expect(result.current.medicalHistory).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    test('should add medical record successfully', async () => {
      const mockRecord = {
        id: 'record-2',
        date: new Date(),
        type: 'treatment',
        title: 'Filling',
        description: 'Composite filling on tooth 14'
      };

      const mockResponse = {
        success: true,
        data: mockRecord
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePatientDetail());

      // Set initial patient
      act(() => {
        (result.current as any).patient = { id: 'patient-1' };
      });

      const recordData = {
        type: 'treatment',
        title: 'Filling',
        description: 'Composite filling on tooth 14'
      };

      let addedRecord;
      await act(async () => {
        addedRecord = await result.current.addMedicalRecord(recordData);
      });

      expect(addedRecord).toBeDefined();
      expect(addedRecord?.title).toBe('Filling');
      expect(mockFetch).toHaveBeenCalledWith('/api/manager/patients/patient-1/medical-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });
    });
  });

  describe('usePatientStatistics', () => {
    test('should fetch patient statistics successfully', async () => {
      const mockStatistics = {
        totalPatients: 150,
        activePatients: 140,
        newPatientsThisMonth: 12,
        averageAge: 35,
        genderDistribution: {
          male: 70,
          female: 75,
          other: 5
        },
        appointmentHistory: {
          totalAppointments: 450,
          completedAppointments: 380,
          cancelledAppointments: 45,
          noShowRate: 0.05
        }
      };

      const mockResponse = {
        success: true,
        data: mockStatistics
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePatientStatistics());

      await act(async () => {
        await result.current.fetchStatistics('cabinet-1');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statistics).toBeDefined();
      expect(result.current.statistics?.totalPatients).toBe(150);
      expect(result.current.statistics?.activePatients).toBe(140);
      expect(result.current.statistics?.genderDistribution.male).toBe(70);
      expect(result.current.error).toBeNull();
    });

    test('should handle statistics fetch error', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Failed to fetch statistics'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const { result } = renderHook(() => usePatientStatistics());

      await act(async () => {
        await result.current.fetchStatistics('cabinet-1');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch statistics');
      expect(result.current.statistics).toBeNull();
    });
  });
});
