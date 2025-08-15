import { NextRequest, NextResponse } from 'next/server';
import { AuthService, LoginRequest, AuthenticationError } from '@/lib/auth/auth-service';
import { withCORS } from '@/lib/middleware/auth';

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body: LoginRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const authService = AuthService.getInstance();
    const loginResponse = await authService.login(body);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      ...loginResponse
    }, { status: 200 });

  } catch (_error) {
    console.error('Login error:', error);

    if (error instanceof AuthenticationError) {
      const statusCode = error.code === 'INVALID_CREDENTIALS' ? 401 : 400;
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

export const POST = withCORS(handleLogin);