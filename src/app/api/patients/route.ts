import { NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
// import { withAuth } from '@/lib/middleware/auth'; // Temporarily disabled

async function handleGetPatients(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetId = searchParams.get('cabinetId');
    const userId = searchParams.get('userId');
    
    let patients;
    if (cabinetId) {
      patients = await db.findPatientsByCabinet(cabinetId);
    } else if (userId) {
      patients = await db.findPatientsByUserId(userId);
    } else {
      return NextResponse.json(
        { error: 'cabinetId or userId parameter is required' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: patients
    });
  } catch (_error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

async function handleCreatePatient(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['user_id', 'cabinet_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const patient = await db.createPatient(body);
    
    return NextResponse.json({
      success: true,
      data: patient
    }, { status: 201 });
  } catch (_error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetPatients);
export const POST = withAuth(handleCreatePatient);