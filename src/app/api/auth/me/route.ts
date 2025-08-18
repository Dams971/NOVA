import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // User is already authenticated and available in request.user
    return NextResponse.json({
      success: true,
      user: request.auth?.user
    });
  } catch (error) {
    console.error('Get current user API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
