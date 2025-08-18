import { NextRequest, NextResponse } from 'next/server';
import { UpdatePatientRequest } from '@/lib/models/patient';
import { UserContext } from '@/lib/services/cabinet-access-control';
import { PatientService } from '@/lib/services/patient-service';

// Mock user context - in real implementation, this would come from JWT token
const getMockUserContext = (): UserContext => ({
  userId: 'manager-user-1',
  role: 'manager',
  assignedCabinets: ['cabinet-1', 'cabinet-2'],
  permissions: ['read', 'create', 'update', 'delete']
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const patientService = PatientService.getInstance();
    const result = await patientService.getPatientById(patientId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const patientService = PatientService.getInstance();
    const userContext = getMockUserContext();
    const body = await request.json();

    // Parse date of birth if provided
    const updateRequest: UpdatePatientRequest = {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined
    };

    // Use secure method with access control
    const result = await patientService.updatePatientSecure(userContext, patientId, updateRequest);

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
  } catch (_error) {
    console.error('Error updating patient:', _error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const patientService = PatientService.getInstance();
    const userContext = getMockUserContext();

    // Use secure method with access control
    const result = await patientService.deletePatientSecure(userContext, patientId);

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
  } catch (_error) {
    console.error('Error deleting patient:', _error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
