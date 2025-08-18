import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { IONOSEmailService } from '@/services/ionos-email.service'

export interface CreateAppointmentRequest {
  patient_name: string
  patient_phone_e164: string
  patient_email?: string | null
  reason?: string | null
  start_at: string
  end_at: string
  duration_minutes?: number
  send_confirmation_email?: boolean
}

export interface AppointmentData {
  id: string
  user_id: string
  patient_name: string
  patient_phone_e164: string
  patient_email?: string | null
  reason?: string | null
  start_at: string
  end_at: string
  status: string
  clinic_address: string
  created_at?: string
  updated_at?: string
  duration_minutes?: number
  start_at_local?: string
  end_at_local?: string
}

export interface CreateAppointmentResponse {
  success: boolean
  message: string
  data?: {
    appointment: AppointmentData
    email_sent?: boolean
  }
  error?: string
}

export async function POST(request: Request): Promise<NextResponse<CreateAppointmentResponse>> {
  try {
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      patient_name,
      patient_phone_e164,
      patient_email,
      reason,
      start_at,
      end_at,
      duration_minutes = 30,
      send_confirmation_email = true
    }: CreateAppointmentRequest = body

    // Validate required fields
    if (!patient_name || !patient_phone_e164 || !start_at || !end_at) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: patient_name, patient_phone_e164, start_at, end_at',
          error: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      )
    }

    // Validate Algerian phone number format
    const phoneRegex = /^\+213[567]\d{8}$/
    if (!phoneRegex.test(patient_phone_e164)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Algerian phone number. Must be +213 followed by 9 digits starting with 5, 6, or 7.',
          error: 'INVALID_PHONE_FORMAT'
        },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (patient_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(patient_email)) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid email format',
            error: 'INVALID_EMAIL_FORMAT'
          },
          { status: 400 }
        )
      }
    }

    // Validate appointment times
    const startTime = new Date(start_at)
    const endTime = new Date(end_at)
    const now = new Date()

    if (startTime <= now) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Appointment time must be in the future',
          error: 'PAST_APPOINTMENT_TIME'
        },
        { status: 400 }
      )
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'End time must be after start time',
          error: 'INVALID_TIME_RANGE'
        },
        { status: 400 }
      )
    }

    // Check for working hours (8 AM - 6 PM Algeria time)
    const startHour = startTime.getUTCHours() + 1 // Algeria is UTC+1
    if (startHour < 8 || startHour >= 18) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Appointments are only available between 8:00 AM and 6:00 PM (Algeria time)',
          error: 'OUTSIDE_WORKING_HOURS'
        },
        { status: 400 }
      )
    }

    // Skip lunch hour (12 PM - 1 PM)
    if (startHour === 12) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lunch break: appointments not available between 12:00 PM and 1:00 PM',
          error: 'LUNCH_BREAK'
        },
        { status: 400 }
      )
    }

    // Check if slot is available using RPC function
    const { data: availabilityCheck, error: availabilityError } = await supabase
      .rpc('check_slot_availability', {
        start_time: start_at,
        end_time: end_at
      })

    if (availabilityError) {
      console.error('Availability check error:', availabilityError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to check slot availability',
          error: 'AVAILABILITY_CHECK_FAILED'
        },
        { status: 500 }
      )
    }

    if (!availabilityCheck) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'The selected time slot is not available',
          error: 'SLOT_NOT_AVAILABLE'
        },
        { status: 409 }
      )
    }

    // Check for duplicate appointments (same patient, same day)
    const appointmentDate = startTime.toISOString().split('T')[0]
    const { data: existingAppointments, error: duplicateCheckError } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', user.id)
      .eq('patient_phone_e164', patient_phone_e164)
      .gte('start_at', `${appointmentDate}T00:00:00Z`)
      .lt('start_at', `${appointmentDate}T23:59:59Z`)
      .neq('status', 'CANCELLED')

    if (duplicateCheckError) {
      console.error('Duplicate check error:', duplicateCheckError)
    } else if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'A patient can only have one appointment per day',
          error: 'DUPLICATE_APPOINTMENT'
        },
        { status: 409 }
      )
    }

    // Create the appointment
    const appointmentData = {
      user_id: user.id,
      patient_name: patient_name.trim(),
      patient_phone_e164,
      patient_email: patient_email?.trim() || null,
      reason: reason?.trim() || null,
      start_at,
      end_at,
      status: 'PENDING' as const,
      clinic_address: 'Cité 109, Daboussy El Achour, Alger'
    }

    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()

    if (createError) {
      console.error('Appointment creation error:', createError)
      
      // Handle specific database errors
      if (createError.message.includes('overlapping')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'The selected time slot is no longer available',
            error: 'SLOT_CONFLICT'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create appointment',
          error: createError.message
        },
        { status: 500 }
      )
    }

    let emailSent = false

    // Send confirmation email if requested and email is provided
    if (send_confirmation_email && patient_email) {
      try {
        const emailService = new IONOSEmailService()
        const appointmentWithDuration = {
          ...appointment,
          duration_minutes
        }
        
        await emailService.sendAppointmentSummary(
          patient_email,
          appointmentWithDuration,
          user.id
        )
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Format response with Algeria timezone
    const responseAppointment = {
      ...appointment,
      duration_minutes,
      start_at_local: new Date(appointment.start_at).toLocaleString('fr-FR', {
        timeZone: 'Africa/Algiers'
      }),
      end_at_local: new Date(appointment.end_at).toLocaleString('fr-FR', {
        timeZone: 'Africa/Algiers'
      })
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Appointment created successfully and confirmation email sent'
        : 'Appointment created successfully',
      data: {
        appointment: responseAppointment,
        email_sent: emailSent
      }
    })

  } catch (error) {
    console.error('Create appointment error:', error)
    
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
      message: 'Method not allowed. Use POST to create appointments.',
      error: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}