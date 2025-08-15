import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
import { withAuth } from '@/lib/middleware/auth';
import { v4 as uuidv4 } from 'uuid';

async function handleGetAppointments(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetId = searchParams.get('cabinetId');
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let appointments;
    if (cabinetId) {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      appointments = await db.findAppointmentsByCabinet(cabinetId, start, end);
    } else if (patientId) {
      appointments = await db.findAppointmentsByPatient(patientId);
    } else {
      return NextResponse.json(
        { error: 'cabinetId or patientId parameter is required' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: appointments
    });
  } catch (_error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

async function handleCreateAppointment(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['cabinet_id', 'patient_id', 'service_id', 'scheduled_at'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Set defaults
    const appointmentData = {
      id: uuidv4(),
      ...body,
      duration: body.duration || 30,
      status: body.status || 'scheduled',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Convert scheduled_at to Date if it's a string
    if (typeof appointmentData.scheduled_at === 'string') {
      appointmentData.scheduled_at = new Date(appointmentData.scheduled_at);
    }
    
    const appointment = await db.createAppointment(appointmentData);
    
    return NextResponse.json({
      success: true,
      data: appointment
    }, { status: 201 });
  } catch (_error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetAppointments);
export const POST = withAuth(handleCreateAppointment);