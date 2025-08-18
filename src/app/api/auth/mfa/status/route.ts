import { NextResponse } from 'next/server';
import { MFAService } from '@/lib/auth/mfa-service';
import { withAuth, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleMFAStatus(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const user = request.auth!.user;
    const mfaService = MFAService.getInstance();

    // Get MFA status
    const mfaStatus = await mfaService.getMFAStatus(user.userId);
    const requiresMFA = mfaService.requiresMFA(user.role);

    return NextResponse.json({
      success: true,
      mfaStatus: {
        ...mfaStatus,
        isRequired: requiresMFA,
        userRole: user.role
      }
    });

  } catch (error) {
    console.error('MFA status error:', error);

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const GET = withCORS(withAuth(handleMFAStatus));