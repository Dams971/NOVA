import { NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
// import { withAuth } from '@/lib/middleware/auth'; // Temporarily disabled

interface Params {
  params: {
    id: string;
  };
}

async function handleGetPatient(request: NextRequest, { params }: Params) {
  try {
    const patient = await db.findPatientById(params.id);
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: patient
    });
  } catch (_error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

async function handleUpdatePatient(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    
    // Remove immutable fields
    delete body.id;
    delete body.created_at;
    
    const updatedPatient = await db.updatePatient(params.id, body);
    
    if (!updatedPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPatient
    });
  } catch (_error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

async function handleDeletePatient(request: NextRequest, { params }: Params) {
  try {
    const deleted = await db.deletePatient(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (_error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetPatient);
export const PUT = withAuth(handleUpdatePatient);
export const DELETE = withAuth(handleDeletePatient);