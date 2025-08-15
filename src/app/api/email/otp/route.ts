export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailService } from '@/server/email/ionos-email.service';

const otpEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST() {
  try {
    const body = await request.json();
    const validated = otpEmailSchema.parse(body);
    
    const emailService = getEmailService();
    const success = await emailService.sendOtpEmail(
      validated.email,
      validated.otp
    );
    
    return NextResponse.json({ ok: success });
  } catch (_error) {
    console.error('OTP email error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}