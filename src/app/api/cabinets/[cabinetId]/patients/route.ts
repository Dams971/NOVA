import { NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { withCabinetPermission, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGetPatients(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    // Extract cabinet ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const cabinetId = pathParts[pathParts.indexOf('cabinets') + 1];

    // Mock patient data - in real implementation, this would come from cabinet-specific database
    const patients = [
      {
        id: 'patient-1',
        cabinetId,
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        dateOfBirth: '1985-03-15',
        gender: 'F',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-07-10'),
      },
      {
        id: 'patient-2',
        cabinetId,
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@email.com',
        phone: '+33 6 98 76 54 32',
        dateOfBirth: '1978-11-22',
        gender: 'M',
        isActive: true,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-07-15'),
      },
    ];

    // Get query parameters for filtering
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let filteredPatients = patients;

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = patients.filter(patient =>
        patient.firstName.toLowerCase().includes(searchLower) ||
        patient.lastName.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const paginatedPatients = filteredPatients.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      patients: paginatedPatients,
      total: filteredPatients.length,
      cabinetId,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < filteredPatients.length,
      },
    });

  } catch (_error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function handleCreatePatient(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    // Extract cabinet ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const cabinetId = pathParts[pathParts.indexOf('cabinets') + 1];

    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Mock patient creation - in real implementation, this would create in cabinet database
    const newPatient = {
      id: `patient-${Date.now()}`,
      cabinetId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || null,
      address: body.address || {},
      emergencyContact: body.emergencyContact || {},
      medicalNotes: body.medicalNotes || '',
      preferences: body.preferences || {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: 'Patient created successfully',
      patient: newPatient,
    }, { status: 201 });

  } catch (_error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Helper function to extract cabinet ID from request
const getCabinetId = (req: AuthenticatedRequest): string => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.indexOf('cabinets') + 1];
};

export const GET = withCORS(withCabinetPermission('patient', 'read', getCabinetId)(handleGetPatients));
export const POST = withCORS(withCabinetPermission('patient', 'create', getCabinetId)(handleCreatePatient));