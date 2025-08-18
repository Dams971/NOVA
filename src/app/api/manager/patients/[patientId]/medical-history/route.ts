import { NextRequest, NextResponse } from 'next/server';
import { UserContext } from '@/lib/services/cabinet-access-control';
import { PatientService, CreateMedicalRecordRequest } from '@/lib/services/patient-service';

// Mock user context - in real implementation, this would come from JWT token
const _getMockUserContext = (): UserContext => ({
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
    const result = await patientService.getMedicalHistory(patientId);

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
    console.error('Error fetching medical history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const patientService = PatientService.getInstance();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['type', 'title', 'description'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate type
    const validTypes = ['consultation', 'treatment', 'note', 'allergy', 'medication'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    const createRequest: CreateMedicalRecordRequest = {
      patientId,
      type: body.type,
      title: body.title,
      description: body.description,
      practitionerId: body.practitionerId,
      attachments: body.attachments || []
    };

    const result = await patientService.addMedicalRecord(createRequest);

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
    console.error('Error creating medical record:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
