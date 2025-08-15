export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/server/email/ionos-email.service';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }
  
  try {
    const emailService = getEmailService();
    const result = await emailService.verifyConnection();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to verify email connection' },
      { status: 500 }
    );
  }
}