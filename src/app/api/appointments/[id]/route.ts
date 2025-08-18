import { NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function handleGetAppointment(request: AuthenticatedRequest, { params }: Params) {
  try {
    const { id } = await params;
    const appointment = await db.findAppointmentById(id);
    
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
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

async function handleUpdateAppointment(request: AuthenticatedRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Remove immutable fields
    delete body.id;
    delete body.created_at;
    
    // Convert scheduled_at to Date if it's a string
    if (body.scheduled_at && typeof body.scheduled_at === 'string') {
      body.scheduled_at = new Date(body.scheduled_at);
    }
    
    const updatedAppointment = await db.updateAppointment(id, body);
    
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
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

async function handleCancelAppointment(request: AuthenticatedRequest, { params }: Params) {
  try {
    const { id } = await params;
    const updatedAppointment = await db.updateAppointment(id, {
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
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { error: 'Appointment ID is required' },
      { status: 400 }
    );
  }
  return handleGetAppointment(request, { params: Promise.resolve({ id }) });
});

export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { error: 'Appointment ID is required' },
      { status: 400 }
    );
  }
  return handleUpdateAppointment(request, { params: Promise.resolve({ id }) });
});

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { error: 'Appointment ID is required' },
      { status: 400 }
    );
  }
  return handleCancelAppointment(request, { params: Promise.resolve({ id }) });
});