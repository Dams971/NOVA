import { NextResponse } from 'next/server';
import { MFAService, MFAError } from '@/lib/auth/mfa-service';
import { withAuth, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleDisableMFA(request: AuthenticatedRequest): Promise<NextResponse> {
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

    // Disable MFA
    await mfaService.disableMFA(user.userId, body.token);

    return NextResponse.json({
      success: true,
      message: 'MFA has been successfully disabled for your account'
    });

  } catch (_error) {
    console.error('MFA disable error:', error);

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

export const POST = withCORS(withAuth(handleDisableMFA));