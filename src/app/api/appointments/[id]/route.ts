import { NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
import { withAuth } from '@/lib/middleware/auth';

interface Params {
  params: {
    id: string;
  };
}

async function handleGetAppointment(request: NextRequest, { params }: Params) {
  try {
    const appointment = await db.findAppointmentById(params.id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (_error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

async function handleUpdateAppointment(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    
    // Remove immutable fields
    delete body.id;
    delete body.created_at;
    
    // Convert scheduled_at to Date if it's a string
    if (body.scheduled_at && typeof body.scheduled_at === 'string') {
      body.scheduled_at = new Date(body.scheduled_at);
    }
    
    const updatedAppointment = await db.updateAppointment(params.id, body);
    
    if (!updatedAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedAppointment
    });
  } catch (_error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

async function handleCancelAppointment(request: NextRequest, { params }: Params) {
  try {
    const updatedAppointment = await db.updateAppointment(params.id, {
      status: 'cancelled',
      updated_at: new Date()
    });
    
    if (!updatedAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment
    });
  } catch (_error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetAppointment);
export const PUT = withAuth(handleUpdateAppointment);
export const DELETE = withAuth(handleCancelAppointment);