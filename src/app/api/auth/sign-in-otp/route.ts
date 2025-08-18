import { NextResponse } from 'next/server'
import { IONOSEmailService } from '@/services/ionos-email.service'
import { SupabaseAuthService } from '@/services/supabase-auth.service'

export interface SignInOTPRequest {
  email: string
  shouldCreateUser?: boolean
}

export interface SignInOTPResponse {
  success: boolean
  message: string
  data?: {
    user?: any
    session?: any
  }
  error?: string
}

export async function POST(request: Request): Promise<NextResponse<SignInOTPResponse>> {
  try {
    const body = await request.json()
    const { email, shouldCreateUser = true }: SignInOTPRequest = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email address is required',
          error: 'INVALID_EMAIL'
        },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email format',
          error: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      )
    }

    const authService = new SupabaseAuthService()

    // Check if user exists
    const userExists = await authService.checkUserExists(email)
    
    // If user doesn't exist and we shouldn't create one, return error
    if (!userExists && !shouldCreateUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found. Please sign up first.',
          error: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Send OTP
    const result = await authService.signInWithOtp(email, shouldCreateUser)

    if (result.error) {
      // Handle specific Supabase errors
      let errorMessage = 'Failed to send verification email'
      let statusCode = 500

      switch (result.error.message) {
        case 'Invalid email':
          errorMessage = 'Invalid email address'
          statusCode = 400
          break
        case 'Email rate limit exceeded':
          errorMessage = 'Too many email requests. Please wait before trying again.'
          statusCode = 429
          break
        case 'User not found':
          errorMessage = 'User not found. Please sign up first.'
          statusCode = 404
          break
        default:
          errorMessage = result.error.message
          break
      }

      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          error: result.error.message
        },
        { status: statusCode }
      )
    }

    // Try to send custom notification email (non-blocking)
    try {
      const emailService = new IONOSEmailService()
      await emailService.sendOTPVerification(email)
    } catch (emailError) {
      // Log but don't fail the request
      console.warn('Failed to send custom OTP notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: userExists 
        ? 'Verification email sent successfully' 
        : 'Account created successfully. Please check your email for verification.',
      data: {
        user: result.user,
        session: result.session
      }
    })

  } catch (error) {
    console.error('Sign-in OTP error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}