import { NextRequest, NextResponse } from 'next/server';
import { MFAService, MFAError } from '@/lib/auth/mfa-service';
import { withAuth, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleRegenerateBackupCodes(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { error: 'Missing required field: token', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const user = request.auth!.user;
    const mfaService = MFAService.getInstance();

    // Regenerate backup codes
    const newBackupCodes = await mfaService.regenerateBackupCodes(user.userId, body.token);

    return NextResponse.json({
      success: true,
      message: 'New backup codes generated successfully',
      backupCodes: newBackupCodes,
      warning: 'Please save these backup codes in a secure location. They will not be shown again.'
    });

  } catch (error) {
    console.error('Backup codes regeneration error:', error);

    if (error instanceof MFAError) {
      const statusCode = error.code === 'INVALID_MFA_TOKEN' ? 400 : 500;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const POST = withCORS(withAuth(handleRegenerateBackupCodes));