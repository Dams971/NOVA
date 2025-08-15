import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RefreshTokenRequest, AuthenticationError } from '@/lib/auth/auth-service';
import { withCORS } from '@/lib/middleware/auth';

async function handleRefresh(request: NextRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body: RefreshTokenRequest = await request.json();

    // Validate required fields
    if (!body.refreshToken) {
      return NextResponse.json(
        { error: 'Missing required field: refreshToken', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const authService = AuthService.getInstance();
    const refreshResponse = await authService.refreshToken(body);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      ...refreshResponse
    }, { status: 200 });

  } catch (error) {
    console.error('Token refresh error:', error);

    if (error instanceof AuthenticationError) {
      const statusCode = error.code === 'INVALID_REFRESH_TOKEN' ? 401 : 400;
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

export const POST = withCORS(handleRefresh);