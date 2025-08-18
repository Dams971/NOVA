import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, withCORS } from '@/lib/middleware/auth';

async function handleValidate(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    // If we reach here, the token is valid (middleware validated it)
    const user = request.auth?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        assignedCabinets: user.assignedCabinets
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Token validation error:', error);

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const GET = withCORS(withAuth(handleValidate));