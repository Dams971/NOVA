import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export interface GetSlotsRequest {
  date: string
  duration_minutes?: number
}

export interface TimeSlot {
  start_iso: string
  end_iso: string
  available: boolean
  display_time: string
  display_date?: string
}

export interface GetSlotsResponse {
  success: boolean
  message: string
  data?: {
    slots: TimeSlot[]
    timezone: string
    clinic_address: string
    date: string
    duration_minutes: number
  }
  error?: string
}

export async function POST(): Promise<NextResponse<GetSlotsResponse>> {
  try {
    const body = await request.json()
    const { date, duration_minutes = 30 }: GetSlotsRequest = body

    // Validate date
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Date is required in YYYY-MM-DD format',
          error: 'MISSING_DATE'
        },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid date format. Use YYYY-MM-DD',
          error: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      )
    }

    // Check if date is valid
    const requestedDate = new Date(date + 'T00:00:00Z')
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid date',
          error: 'INVALID_DATE'
        },
        { status: 400 }
      )
    }

    // Check if date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (requestedDate < today) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot book appointments for past dates',
          error: 'PAST_DATE'
        },
        { status: 400 }
      )
    }

    // Check if date is not too far in the future (e.g., 6 months)
    const maxFutureDate = new Date()
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6)
    
    if (requestedDate > maxFutureDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot book appointments more than 6 months in advance',
          error: 'TOO_FAR_FUTURE'
        },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration_minutes && (duration_minutes < 15 || duration_minutes > 120)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Duration must be between 15 and 120 minutes',
          error: 'INVALID_DURATION'
        },
        { status: 400 }
      )
    }

    // Check if it's a weekend (Friday is the weekend in Algeria)
    const dayOfWeek = requestedDate.getDay()
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday and Saturday
      return NextResponse.json({
        success: true,
        message: 'No appointments available on weekends',
        data: {
          slots: [],
          timezone: 'Africa/Algiers',
          clinic_address: 'Cité 109, Daboussy El Achour, Alger',
          date,
          duration_minutes
        }
      })
    }

    // Generate slots using RPC function
    const { data: slotsData, error: slotsError } = await supabase
      .rpc('generate_slots', {
        target_date: date,
        duration_minutes
      })

    if (slotsError) {
      console.error('Slots generation error:', slotsError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to generate appointment slots',
          error: slotsError.message
        },
        { status: 500 }
      )
    }

    if (!slotsData || !Array.isArray(slotsData)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No slots data received',
          error: 'NO_SLOTS_DATA'
        },
        { status: 500 }
      )
    }

    // Format slots for frontend consumption
    const formattedSlots: TimeSlot[] = slotsData.map((slot: any) => {
      const startTime = new Date(slot.start_time)
      const endTime = new Date(slot.end_time)
      
      return {
        start_iso: startTime.toISOString(),
        end_iso: endTime.toISOString(),
        available: slot.available,
        display_time: startTime.toLocaleTimeString('fr-FR', {
          timeZone: 'Africa/Algiers',
          hour: '2-digit',
          minute: '2-digit'
        }),
        display_date: startTime.toLocaleDateString('fr-FR', {
          timeZone: 'Africa/Algiers',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    })

    // Filter out any invalid slots
    const validSlots = formattedSlots.filter(slot => 
      slot.start_iso && slot.end_iso && slot.display_time
    )

    return NextResponse.json({
      success: true,
      message: `Found ${validSlots.filter(s => s.available).length} available slots`,
      data: {
        slots: validSlots,
        timezone: 'Africa/Algiers',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
        date,
        duration_minutes
      }
    })

  } catch (_error) {
    console.error('Get slots error:', error)
    
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

export async function GET(): Promise<NextResponse<GetSlotsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const duration_minutes = parseInt(searchParams.get('duration_minutes') || '30')

    if (!date) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Date parameter is required in YYYY-MM-DD format',
          error: 'MISSING_DATE_PARAM'
        },
        { status: 400 }
      )
    }

    // Use the same logic as POST by creating a mock request body
    const mockRequest = {
      json: async () => ({ date, duration_minutes })
    } as NextRequest

    // Call the POST handler with the mock request
    return await POST(mockRequest)

  } catch (_error) {
    console.error('Get slots (GET) error:', error)
    
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

// Additional utility endpoint to check specific slot availability
export async function PUT(): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { start_time, end_time } = body

    if (!start_time || !end_time) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'start_time and end_time are required',
          error: 'MISSING_TIME_PARAMS'
        },
        { status: 400 }
      )
    }

    // Check specific slot availability
    const { data: isAvailable, error } = await supabase
      .rpc('check_slot_availability', {
        start_time,
        end_time
      })

    if (error) {
      console.error('Slot availability check error:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to check slot availability',
          error: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isAvailable ? 'Slot is available' : 'Slot is not available',
      data: {
        available: isAvailable,
        start_time,
        end_time,
        timezone: 'Africa/Algiers'
      }
    })

  } catch (_error) {
    console.error('Check slot availability error:', error)
    
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