import { NextResponse } from 'next/server';
import { MFAService, MFAError } from '@/lib/auth/mfa-service';
import { withAuth, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleSetupMFA(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const user = request.auth!.user;
    const mfaService = MFAService.getInstance();

    // Check if user requires MFA
    if (!mfaService.requiresMFA(user.role)) {
      return NextResponse.json(
        { error: 'MFA is not required for this user role', code: 'MFA_NOT_REQUIRED' },
        { status: 400 }
      );
    }

    // Setup MFA
    const mfaSetup = await mfaService.setupMFA(user.userId, user.email);

    return NextResponse.json({
      success: true,
      message: 'MFA setup initiated',
      qrCodeDataUrl: mfaSetup.qrCodeDataUrl,
      backupCodes: mfaSetup.backupCodes,
      instructions: 'Scan the QR code with your authenticator app and verify with a token to enable MFA'
    });

  } catch (error) {
    console.error('MFA setup error:', error);

    if (error instanceof MFAError) {
      const statusCode = error.code === 'MFA_ALREADY_ENABLED' ? 400 : 500;
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

export const POST = withCORS(withAuth(handleSetupMFA));