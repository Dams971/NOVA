import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patient-service';
import { CreatePatientRequest, PatientFilters } from '@/lib/models/patient';
import { UserContext } from '@/lib/services/cabinet-access-control';

// Mock user context - in real implementation, this would come from JWT token
const getMockUserContext = (): UserContext => ({
  userId: 'manager-user-1',
  role: 'manager',
  assignedCabinets: ['cabinet-1', 'cabinet-2'],
  permissions: ['read', 'create', 'update', 'delete']
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientService = PatientService.getInstance();
    const userContext = getMockUserContext();

    // Parse query parameters
    const filters: PatientFilters = {
      cabinetId: searchParams.get('cabinetId') || undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      ageMin: searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined,
      ageMax: searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined,
      lastVisitFrom: searchParams.get('lastVisitFrom') ? new Date(searchParams.get('lastVisitFrom')!) : undefined,
      lastVisitTo: searchParams.get('lastVisitTo') ? new Date(searchParams.get('lastVisitTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Use secure method with access control
    const result = await patientService.getPatientsSecure(userContext, filters);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const patientService = PatientService.getInstance();
    const userContext = getMockUserContext();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['cabinetId', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Parse date of birth
    const createRequest: CreatePatientRequest = {
      ...body,
      dateOfBirth: new Date(body.dateOfBirth)
    };

    // Use secure method with access control
    const result = await patientService.createPatientSecure(userContext, createRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
