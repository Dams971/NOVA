/**
 * NOVA RDV v3 - Enhanced API Endpoint with Intelligent Slot-Filling
 * 
 * Features:
 * - Session state persistence for anti-repetition
 * - Smart field extraction with DialogManager
 * - Progressive slot-filling with AppointmentAssistantV2
 * - Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedDialogManager } from '../../../lib/chat/dialogManager';
import { getSharedAppointmentAssistant } from '../../../lib/llm/appointments-v2';
import { v4 as uuidv4 } from 'uuid';

// Enhanced logger for comprehensive tracking
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[RDV-API] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[RDV-API ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RDV-DEBUG] ${message}`, data || '');
    }
  }
};

// In-memory session storage (replace with Redis in production)
const sessionStore = new Map<string, any>();

// Session management utilities
function getSessionId(request: NextRequest): string {
  const sessionId = request.headers.get('x-session-id') || 
                   request.headers.get('x-chat-session') ||
                   uuidv4();
  return sessionId;
}

function generateTimeBasedSlots(date?: string): Array<{start_iso: string, end_iso: string, available: boolean}> {
  const baseDate = date ? new Date(date) : new Date();
  // Set to Algeria timezone
  baseDate.setHours(baseDate.getHours() + 1); // UTC+1 for Algeria
  
  const slots = [];
  
  // Generate slots from 9h to 18h (Algeria time)
  for (let hour = 9; hour < 18; hour++) {
    if (hour === 12) continue; // Lunch break
    
    for (let minute = 0; minute < 60; minute += 30) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);
      
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      
      slots.push({
        start_iso: start.toISOString(),
        end_iso: end.toISOString(),
        available: Math.random() > 0.3 // 70% availability simulation
      });
    }
  }
  
  return slots;
}

/**
 * POST /api/rdv - Enhanced RDV processing with intelligent slot-filling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, sessionId: clientSessionId, ...data } = body;
    
    // Get or generate session ID
    const sessionId = clientSessionId || getSessionId(request);
    
    logger.info(`RDV API - Action: ${action}, Session: ${sessionId}`);
    logger.debug('Request body', { action, message, sessionId, data });

    switch (action) {
      case 'ai':
      case 'chat':
        // Enhanced AI processing with DialogManager and AppointmentAssistantV2
        try {
          if (!message || typeof message !== 'string') {
            return NextResponse.json({
              success: false,
              error: 'Message required for AI processing'
            }, { status: 400 });
          }

          const dialogManager = getSharedDialogManager();
          
          // Process message with intelligent slot-filling
          const dialogResult = await dialogManager.processMessage(message, sessionId);
          
          logger.debug('Dialog processing result', {
            sessionId,
            shouldProceedToSlots: dialogResult.shouldProceedToSlots,
            validationErrors: dialogResult.validationErrors,
            response: dialogResult.response
          });

          // If ready for slots, generate available slots
          if (dialogResult.shouldProceedToSlots && dialogResult.response.action === 'FIND_SLOTS') {
            const slots = generateTimeBasedSlots();
            
            return NextResponse.json({
              success: true,
              sessionId,
              aiResponse: {
                ...dialogResult.response,
                action: 'FIND_SLOTS',
                available_slots: slots.filter(slot => slot.available),
                clarification_question: `Voici les créneaux disponibles pour ${dialogResult.response.patient?.name}. Quel créneau vous convient ?`
              },
              metadata: {
                sessionInfo: dialogManager.getSessionInfo(sessionId),
                hasValidationErrors: dialogResult.validationErrors.length > 0,
                validationErrors: dialogResult.validationErrors
              }
            });
          }

          // Return current state (need more info)
          return NextResponse.json({
            success: true,
            sessionId,
            aiResponse: dialogResult.response,
            metadata: {
              sessionInfo: dialogManager.getSessionInfo(sessionId),
              hasValidationErrors: dialogResult.validationErrors.length > 0,
              validationErrors: dialogResult.validationErrors
            }
          });

        } catch (aiError) {
          logger.error('AI processing error', aiError);
          
          return NextResponse.json({
            success: false,
            sessionId,
            aiResponse: {
              action: 'NEED_INFO',
              clinic_address: 'Cité 109, Daboussy El Achour, Alger',
              timezone: 'Africa/Algiers',
              status: 'NEED_INFO',
              clarification_question: 'Une erreur est survenue. Pouvez-vous reformuler votre demande ?',
              missing_fields: ['error_recovery']
            },
            error: 'AI processing failed'
          }, { status: 500 });
        }
      
      case 'create':
        // Enhanced appointment creation with validation
        try {
          const { patient, slot, reason, care_type } = data;
          
          // Validate required fields
          if (!patient?.name || !patient?.phone_e164) {
            return NextResponse.json({
              success: false,
              error: 'Patient name and phone required for appointment creation'
            }, { status: 400 });
          }

          if (!slot?.start_iso || !slot?.end_iso) {
            return NextResponse.json({
              success: false,
              error: 'Appointment slot (start_iso and end_iso) required'
            }, { status: 400 });
          }

          // Validate phone format
          const phoneRegex = /^\+213[567]\d{8}$/;
          if (!phoneRegex.test(patient.phone_e164)) {
            return NextResponse.json({
              success: false,
              error: 'Invalid Algerian phone format. Use +213XXXXXXXXX'
            }, { status: 400 });
          }

          // Create appointment
          const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const appointment = {
            id: appointmentId,
            patientId: patient.patient_id || `pat_${Date.now()}`,
            patientName: patient.name,
            patientPhone: patient.phone_e164,
            scheduledAt: slot.start_iso,
            endTime: slot.end_iso,
            reason: reason || 'Consultation générale',
            careType: care_type || 'consultation',
            status: 'scheduled',
            clinicAddress: 'Cité 109, Daboussy El Achour, Alger',
            timezone: 'Africa/Algiers',
            createdAt: new Date().toISOString()
          };

          // Store in session for tracking
          sessionStore.set(`appointment_${appointmentId}`, appointment);

          logger.info('Appointment created', { appointmentId, patient: patient.name });

          return NextResponse.json({
            success: true,
            appointment,
            message: `Rendez-vous confirmé pour ${patient.name} le ${new Date(slot.start_iso).toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}`
          });

        } catch (createError) {
          logger.error('Appointment creation error', createError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create appointment'
          }, { status: 500 });
        }
      
      case 'slots':
        // Enhanced slot generation with better validation
        try {
          const requestedDate = data.date || new Date().toISOString().split('T')[0];
          const slots = generateTimeBasedSlots(requestedDate);
          
          logger.debug('Generated slots', { date: requestedDate, totalSlots: slots.length });
          
          return NextResponse.json({
            success: true,
            slots: slots.filter(slot => slot.available), // Only return available slots
            allSlots: slots, // Include all for debugging
            date: requestedDate,
            timezone: 'Africa/Algiers',
            metadata: {
              totalSlots: slots.length,
              availableSlots: slots.filter(slot => slot.available).length
            }
          });

        } catch (slotsError) {
          logger.error('Slots generation error', slotsError);
          return NextResponse.json({
            success: false,
            error: 'Failed to generate time slots'
          }, { status: 500 });
        }
      
      case 'update':
        // Enhanced appointment update
        try {
          const { appointmentId, updates } = data;
          
          if (!appointmentId) {
            return NextResponse.json({
              success: false,
              error: 'Appointment ID required for update'
            }, { status: 400 });
          }

          const appointment = sessionStore.get(`appointment_${appointmentId}`);
          if (!appointment) {
            return NextResponse.json({
              success: false,
              error: 'Appointment not found'
            }, { status: 404 });
          }

          // Update appointment
          const updatedAppointment = { ...appointment, ...updates, updatedAt: new Date().toISOString() };
          sessionStore.set(`appointment_${appointmentId}`, updatedAppointment);

          logger.info('Appointment updated', { appointmentId, updates });

          return NextResponse.json({
            success: true,
            message: 'Rendez-vous mis à jour avec succès',
            appointment: updatedAppointment
          });

        } catch (updateError) {
          logger.error('Appointment update error', updateError);
          return NextResponse.json({
            success: false,
            error: 'Failed to update appointment'
          }, { status: 500 });
        }
      
      case 'cancel':
        // Enhanced appointment cancellation
        try {
          const { appointmentId, reason } = data;
          
          if (!appointmentId) {
            return NextResponse.json({
              success: false,
              error: 'Appointment ID required for cancellation'
            }, { status: 400 });
          }

          const appointment = sessionStore.get(`appointment_${appointmentId}`);
          if (!appointment) {
            return NextResponse.json({
              success: false,
              error: 'Appointment not found'
            }, { status: 404 });
          }

          // Cancel appointment
          appointment.status = 'cancelled';
          appointment.cancellationReason = reason || 'Cancelled by patient';
          appointment.cancelledAt = new Date().toISOString();
          sessionStore.set(`appointment_${appointmentId}`, appointment);

          logger.info('Appointment cancelled', { appointmentId, reason });

          return NextResponse.json({
            success: true,
            message: 'Rendez-vous annulé avec succès',
            appointment
          });

        } catch (cancelError) {
          logger.error('Appointment cancellation error', cancelError);
          return NextResponse.json({
            success: false,
            error: 'Failed to cancel appointment'
          }, { status: 500 });
        }
      
      case 'confirm':
        // Enhanced appointment confirmation
        try {
          const { appointmentId } = data;
          
          if (!appointmentId) {
            return NextResponse.json({
              success: false,
              error: 'Appointment ID required for confirmation'
            }, { status: 400 });
          }

          const appointment = sessionStore.get(`appointment_${appointmentId}`);
          if (!appointment) {
            return NextResponse.json({
              success: false,
              error: 'Appointment not found'
            }, { status: 404 });
          }

          // Confirm appointment
          appointment.status = 'confirmed';
          appointment.confirmedAt = new Date().toISOString();
          sessionStore.set(`appointment_${appointmentId}`, appointment);

          logger.info('Appointment confirmed', { appointmentId });

          return NextResponse.json({
            success: true,
            message: 'Rendez-vous confirmé avec succès',
            appointment
          });

        } catch (confirmError) {
          logger.error('Appointment confirmation error', confirmError);
          return NextResponse.json({
            success: false,
            error: 'Failed to confirm appointment'
          }, { status: 500 });
        }

      case 'session-info':
        // Debug endpoint to check session state
        try {
          const targetSessionId = data.sessionId || sessionId;
          const dialogManager = getSharedDialogManager();
          const sessionInfo = dialogManager.getSessionInfo(targetSessionId);
          
          return NextResponse.json({
            success: true,
            sessionId: targetSessionId,
            sessionInfo,
            activeSessionsCount: dialogManager.getActiveSessionsCount()
          });

        } catch (sessionError) {
          logger.error('Session info error', sessionError);
          return NextResponse.json({
            success: false,
            error: 'Failed to retrieve session info'
          }, { status: 500 });
        }
      
      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Action non reconnue', 
            validActions: ['ai', 'chat', 'create', 'slots', 'update', 'cancel', 'confirm', 'session-info'],
            receivedAction: action
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('API RDV error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur', 
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rdv - Enhanced appointment consultation with session awareness
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');
    
    logger.debug('GET RDV request', { appointmentId, sessionId, status });
    
    if (appointmentId) {
      // Get specific appointment
      const appointment = sessionStore.get(`appointment_${appointmentId}`);
      
      if (appointment) {
        logger.info('Appointment retrieved', { appointmentId });
        return NextResponse.json({ 
          success: true, 
          data: appointment
        });
      } else {
        // Fallback simulation for testing
        return NextResponse.json({ 
          success: true, 
          data: {
            id: appointmentId,
            patientId: 'pat_simulation',
            patientName: 'Patient Simulation',
            scheduledAt: new Date().toISOString(),
            careType: 'consultation',
            status: 'scheduled',
            clinicAddress: 'Cité 109, Daboussy El Achour, Alger',
            timezone: 'Africa/Algiers',
            isSimulation: true
          }
        });
      }
    }

    // Get appointments list with optional filtering
    const allAppointments = Array.from(sessionStore.entries())
      .filter(([key]) => key.startsWith('appointment_'))
      .map(([_, appointment]) => appointment);

    let filteredAppointments = allAppointments;
    
    // Filter by status if specified
    if (status) {
      filteredAppointments = allAppointments.filter(apt => apt.status === status);
    }

    // Sort by creation date
    filteredAppointments.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    logger.debug('Appointments retrieved', { 
      total: allAppointments.length,
      filtered: filteredAppointments.length,
      status
    });
    
    return NextResponse.json({ 
      success: true, 
      data: filteredAppointments,
      metadata: {
        total: allAppointments.length,
        filtered: filteredAppointments.length,
        filterStatus: status
      },
      pagination: {
        limit: 50,
        offset: 0,
        hasMore: false
      },
      timezone: 'Africa/Algiers'
    });

  } catch (error) {
    logger.error('GET RDV error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des données',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Cleanup function to periodically clean old sessions (call from cron job)
export async function cleanup() {
  try {
    const dialogManager = getSharedDialogManager();
    const cleanedSessions = dialogManager.cleanupSessions();
    
    // Also cleanup old appointments
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    let cleanedAppointments = 0;
    
    for (const [key, appointment] of sessionStore.entries()) {
      if (key.startsWith('appointment_')) {
        const createdAt = new Date(appointment.createdAt || 0);
        if (createdAt < cutoff && appointment.status === 'cancelled') {
          sessionStore.delete(key);
          cleanedAppointments++;
        }
      }
    }
    
    logger.info('Cleanup completed', { 
      cleanedSessions, 
      cleanedAppointments,
      remainingAppointments: Array.from(sessionStore.keys()).filter(k => k.startsWith('appointment_')).length
    });
    
    return { cleanedSessions, cleanedAppointments };
  } catch (error) {
    logger.error('Cleanup error:', error);
    throw error;
  }
}