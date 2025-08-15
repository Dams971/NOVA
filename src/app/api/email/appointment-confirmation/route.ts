export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailService } from '@/server/email/ionos-email.service';

const appointmentEmailSchema = z.object({
  data: z.object({
    patient_name: z.string(),
    patient_email: z.string().email(),
    patient_phone: z.string(),
    appointment_date: z.string(),
    appointment_time: z.string(),
    care_type: z.string().optional(),
    reason: z.string().optional(),
    appointment_id: z.string(),
    clinic_address: z.string().default('Cité 109, Daboussy El Achour, Alger'),
    clinic_phone: z.string().optional(),
    clinic_email: z.string().optional(),
  }),
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = appointmentEmailSchema.parse(body);
    
    const emailService = getEmailService();
    const success = await emailService.sendAppointmentConfirmation(
      validated.data,
      validated.userId
    );
    
    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error('Appointment email error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}