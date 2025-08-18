import { NextRequest, NextResponse } from 'next/server';
import { AuthService, MFALoginRequest, AuthenticationError } from '@/lib/auth/auth-service';
import { withCORS } from '@/lib/middleware/auth';

async function handleMFAVerify(request: NextRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body: MFALoginRequest = await request.json();

    // Validate required fields
    if (!body.tempToken || !body.mfaToken) {
      return NextResponse.json(
        { error: 'Missing required fields: tempToken, mfaToken', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const authService = AuthService.getInstance();
    const loginResponse = await authService.loginWithMFA(body);

    return NextResponse.json({
      success: true,
      message: 'MFA verification successful',
      ...loginResponse
    });

  } catch (error) {
    console.error('MFA verification error:', error);

    if (error instanceof AuthenticationError) {
      const statusCode = error.code === 'INVALID_MFA_TOKEN' ? 401 : 400;
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

export const POST = withCORS(handleMFAVerify);