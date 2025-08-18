import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RegisterUserRequest, AuthenticationError } from '@/lib/auth/auth-service';
import { withCORS } from '@/lib/middleware/auth';

async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body: RegisterUserRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Default role for self-registration is 'patient' (converted to 'staff' for compatibility)
    if (!body.role) {
      body.role = 'staff'; // Using 'staff' as it's the lowest privilege level
    }

    // Validate role if provided
    const validRoles = ['super_admin', 'admin', 'manager', 'staff'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role specified', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    const authService = AuthService.getInstance();
    await authService.registerUser(body);

    // Auto-login after registration
    const loginResponse = await authService.login({
      email: body.email,
      password: body.password
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      ...loginResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const POST = withCORS(handleRegister);