import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/manager/patients/route';
import { GET as GetPatient, PUT, DELETE } from '@/app/api/manager/patients/[patientId]/route';
import { PatientService } from '@/lib/services/patient-service';

// Mock the PatientService
jest.mock('@/lib/services/patient-service');

const mockPatientService = {
  getInstance: jest.fn(),
  getPatientsSecure: jest.fn(),
  createPatientSecure: jest.fn(),
  getPatientById: jest.fn(),
  updatePatientSecure: jest.fn(),
  deletePatientSecure: jest.fn(),
};

(PatientService.getInstance as jest.Mock).mockReturnValue(mockPatientService);

describe('/api/manager/patients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/manager/patients', () => {
    test('should return patients successfully', async () => {
      const mockPatients = {
        patients: [
          {
            id: 'patient-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            cabinetId: 'cabinet-1'
          }
        ],
        total: 1,
        hasMore: false
      };

      mockPatientService.getPatientsSecure.mockResolvedValue({
        success: true,
        data: mockPatients
      });

      const url = new URL('http://localhost:3000/api/manager/patients?cabinetId=cabinet-1&search=John');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patients).toHaveLength(1);
      expect(data.data.patients[0].firstName).toBe('John');
    });

    test('should handle service error', async () => {
      mockPatientService.getPatientsSecure.mockResolvedValue({
        success: false,
        error: 'Access denied'
      });

      const url = new URL('http://localhost:3000/api/manager/patients?cabinetId=cabinet-1');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });

    test('should handle internal server error', async () => {
      mockPatientService.getPatientsSecure.mockRejectedValue(new Error('Database error'));

      const url = new URL('http://localhost:3000/api/manager/patients?cabinetId=cabinet-1');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/manager/patients', () => {
    test('should create patient successfully', async () => {
      const mockPatient = {
        id: 'new-patient-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+33123456789',
        cabinetId: 'cabinet-1'
      };

      mockPatientService.createPatientSecure.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      const requestBody = {
        cabinetId: 'cabinet-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+33123456789',
        dateOfBirth: '1990-01-01'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/patients', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.firstName).toBe('Jane');
    });

    test('should validate required fields', async () => {
      const requestBody = {
        cabinetId: 'cabinet-1',
        firstName: 'Jane'
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/manager/patients', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required field');
    });

    test('should handle creation error', async () => {
      mockPatientService.createPatientSecure.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      });

      const requestBody = {
        cabinetId: 'cabinet-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+33123456789',
        dateOfBirth: '1990-01-01'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/patients', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email already exists');
    });
  });

  describe('GET /api/manager/patients/[patientId]', () => {
    test('should return patient by ID', async () => {
      const mockPatient = {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        cabinetId: 'cabinet-1'
      };

      mockPatientService.getPatientById.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      const request = new NextRequest('http://localhost:3000/api/manager/patients/patient-1');
      const params = { patientId: 'patient-1' };

      const response = await GetPatient(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('patient-1');
    });

    test('should handle patient not found', async () => {
      mockPatientService.getPatientById.mockResolvedValue({
        success: false,
        error: 'Patient not found'
      });

      const request = new NextRequest('http://localhost:3000/api/manager/patients/nonexistent');
      const params = { patientId: 'nonexistent' };

      const response = await GetPatient(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Patient not found');
    });
  });

  describe('PUT /api/manager/patients/[patientId]', () => {
    test('should update patient successfully', async () => {
      const mockUpdatedPatient = {
        id: 'patient-1',
        firstName: 'John Updated',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        cabinetId: 'cabinet-1'
      };

      mockPatientService.updatePatientSecure.mockResolvedValue({
        success: true,
        data: mockUpdatedPatient
      });

      const requestBody = {
        firstName: 'John Updated'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/patients/patient-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const params = { patientId: 'patient-1' };

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.firstName).toBe('John Updated');
    });

    test('should handle update error', async () => {
      mockPatientService.updatePatientSecure.mockResolvedValue({
        success: false,
        error: 'Access denied'
      });

      const requestBody = {
        firstName: 'John Updated'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/patients/patient-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const params = { patientId: 'patient-1' };

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });
  });

  describe('DELETE /api/manager/patients/[patientId]', () => {
    test('should delete patient successfully', async () => {
      mockPatientService.deletePatientSecure.mockResolvedValue({
        success: true,
        data: true
      });

      const request = new NextRequest('http://localhost:3000/api/manager/patients/patient-1', {
        method: 'DELETE'
      });
      const params = { patientId: 'patient-1' };

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBe(true);
    });

    test('should handle delete error', async () => {
      mockPatientService.deletePatientSecure.mockResolvedValue({
        success: false,
        error: 'Patient not found'
      });

      const request = new NextRequest('http://localhost:3000/api/manager/patients/nonexistent', {
        method: 'DELETE'
      });
      const params = { patientId: 'nonexistent' };

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Patient not found');
    });
  });
});
