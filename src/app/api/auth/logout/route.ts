import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      const authService = AuthService.getInstance();
      await authService.logout(token);
    }

    // Clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (_error) {
    console.error('Logout API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
