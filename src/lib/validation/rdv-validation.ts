import { z } from 'zod';

// Fixed clinic address and timezone
const CLINIC_ADDRESS = 'Cité 109, Daboussy El Achour, Alger';
const TIMEZONE = 'Africa/Algiers';

// Algerian phone number validation (E.164 format)
export const phoneE164Schema = z.string()
  .regex(/^\+213[567]\d{8}$/, 'Le numéro de téléphone doit être au format algérien (+213[567]XXXXXXXX)');

// Patient schema
export const patientSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  phone_e164: phoneE164Schema,
  email: z.string().email('Email invalide').optional(),
  patient_id: z.string().uuid().optional()
});

// Slot schema
export const slotSchema = z.object({
  start_iso: z.string().datetime({ offset: true }),
  end_iso: z.string().datetime({ offset: true }),
  duration_minutes: z.number().min(15).max(180).optional()
});

// Care types enum
export const careTypeSchema = z.enum([
  'consultation',
  'urgence',
  'detartrage',
  'soin',
  'extraction',
  'prothese',
  'orthodontie',
  'chirurgie'
]);

// Action types enum
export const actionSchema = z.enum([
  'FIND_SLOTS',
  'CREATE',
  'RESCHEDULE',
  'CANCEL',
  'CONFIRMATION',
  'NEED_INFO'
]);

// Status enum
export const statusSchema = z.enum([
  'CONFIRMED',
  'PENDING',
  'CANCELLED',
  'NEED_INFO'
]);

// Available slot schema
export const availableSlotSchema = z.object({
  start_iso: z.string().datetime({ offset: true }),
  end_iso: z.string().datetime({ offset: true }),
  available: z.boolean()
});

// Main appointment schema with strict constraints
export const appointmentSchema = z.object({
  action: actionSchema,
  clinic_address: z.literal(CLINIC_ADDRESS),
  timezone: z.literal(TIMEZONE),
  patient: patientSchema.optional(),
  slot: slotSchema.optional(),
  reason: z.string().max(200).optional(),
  care_type: careTypeSchema.optional(),
  appointment_id: z.string().uuid().optional(),
  status: statusSchema.optional(),
  missing_fields: z.array(z.string()).optional(),
  clarification_question: z.string().max(200).optional(),
  available_slots: z.array(availableSlotSchema).optional()
});

// Create appointment request schema
export const createAppointmentSchema = z.object({
  patient: patientSchema,
  slot: slotSchema,
  reason: z.string().max(200),
  care_type: careTypeSchema,
  notes: z.string().max(500).optional(),
  gdpr_consent: z.boolean()
});

// Update appointment request schema
export const updateAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  slot: slotSchema.optional(),
  reason: z.string().max(200).optional(),
  care_type: careTypeSchema.optional(),
  notes: z.string().max(500).optional()
});

// Cancel appointment request schema
export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  cancellation_reason: z.string().max(200).optional()
});

// Find slots request schema
export const findSlotsSchema = z.object({
  date: z.string().date().or(z.string().datetime()),
  care_type: careTypeSchema.optional(),
  duration_minutes: z.number().min(15).max(180).optional()
});

// AI conversation schema
export const aiConversationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  session_id: z.string().uuid().optional(),
  context: z.record(z.any()).optional()
});

// Validation helper functions
export function validateWorkingHours(date: Date): boolean {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;
  
  // Sunday (0) is closed
  if (day === 0) return false;
  
  // Saturday (6): 8h-13h
  if (day === 6) {
    return time >= 8 * 60 && time < 13 * 60;
  }
  
  // Monday-Friday: 8h-18h with lunch break 12h-13h
  const isWorkingHours = time >= 8 * 60 && time < 18 * 60;
  const isLunchBreak = time >= 12 * 60 && time < 13 * 60;
  
  return isWorkingHours && !isLunchBreak;
}

export function validateSlotAvailability(
  start: Date,
  end: Date,
  existingAppointments: Array<{ start: Date; end: Date }>
): boolean {
  // Check working hours
  if (!validateWorkingHours(start) || !validateWorkingHours(end)) {
    return false;
  }
  
  // Check for conflicts with existing appointments
  for (const appointment of existingAppointments) {
    const hasConflict = 
      (start >= appointment.start && start < appointment.end) ||
      (end > appointment.start && end <= appointment.end) ||
      (start <= appointment.start && end >= appointment.end);
    
    if (hasConflict) return false;
  }
  
  return true;
}

// Format phone number to E.164
export function formatPhoneToE164(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('213')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    // Local format: 0555123456 -> +213555123456
    return `+213${digits.substring(1)}`;
  } else if (digits.length === 9) {
    // Without prefix: 555123456 -> +213555123456
    return `+213${digits}`;
  }
  
  throw new Error('Format de téléphone invalide');
}

// Validate timezone offset for Africa/Algiers (UTC+01)
export function validateAlgiersTimezone(dateString: string): boolean {
  const offsetRegex = /[+-]\d{2}:\d{2}$/;
  const match = dateString.match(offsetRegex);
  
  if (!match) return false;
  
  // Africa/Algiers is UTC+01:00
  return match[0] === '+01:00';
}

// Care type durations and prices
export const CARE_TYPE_CONFIG = {
  consultation: { duration: 30, price: 2000 },
  urgence: { duration: 45, price: 3000 },
  detartrage: { duration: 45, price: 2500 },
  soin: { duration: 60, price: 3500 },
  extraction: { duration: 45, price: 4000 },
  prothese: { duration: 90, price: 15000 },
  orthodontie: { duration: 30, price: 5000 },
  chirurgie: { duration: 120, price: 20000 }
} as const;

// Export types
export type Patient = z.infer<typeof patientSchema>;
export type Slot = z.infer<typeof slotSchema>;
export type CareType = z.infer<typeof careTypeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Status = z.infer<typeof statusSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointment = z.infer<typeof cancelAppointmentSchema>;
export type FindSlots = z.infer<typeof findSlotsSchema>;
export type AIConversation = z.infer<typeof aiConversationSchema>;