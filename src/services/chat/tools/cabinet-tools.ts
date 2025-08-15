import { z } from 'zod';
import { db } from '@/lib/database/postgresql-connection';
import { Problems } from '@/lib/http/problem';

/**
 * NOVA AI Chatbot - Cabinet Management Tools
 * Handles cabinet/clinic information for the AI chatbot with multi-tenant support
 */

// Input validation schemas
const GetPractitionersSchema = z.object({
  tenantId: z.string(),
  specialty: z.string().optional(),
  isActive: z.boolean().default(true)
});

const GetInfoSchema = z.object({
  tenantId: z.string()
});

const GetBusinessHoursSchema = z.object({
  tenantId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const GetServicesSchema = z.object({
  tenantId: z.string(),
  category: z.string().optional(),
  isActive: z.boolean().default(true)
});

export type GetPractitionersParams = z.infer<typeof GetPractitionersSchema>;
export type GetInfoParams = z.infer<typeof GetInfoSchema>;
export type GetBusinessHoursParams = z.infer<typeof GetBusinessHoursSchema>;
export type GetServicesParams = z.infer<typeof GetServicesSchema>;

export interface PractitionerInfo {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  nextAvailability?: string;
  scheduleConfig?: Record<string, any>;
}

export interface CabinetInfo {
  id: string;
  name: string;
  slug: string;
  address: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  contact: {
    phone?: string;
    email?: string;
  };
  timezone: string;
  status: string;
  businessHours: Record<string, { open: string; close: string }>;
}

export interface BusinessHours {
  isOpen: boolean;
  currentDay: string;
  todayHours: {
    open: string;
    close: string;
  } | null;
  weeklyHours: Record<string, { open: string; close: string }>;
  nextOpenDay?: {
    day: string;
    hours: { open: string; close: string };
  };
}

export interface ServiceInfo {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  category: string;
  isActive: boolean;
}

export interface CabinetStats {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  weekAppointments: number;
  practitioners: number;
  services: number;
}

export class CabinetTools {
  private static instance: CabinetTools;

  private constructor() {}

  public static getInstance(): CabinetTools {
    if (!CabinetTools.instance) {
      CabinetTools.instance = new CabinetTools();
    }
    return CabinetTools.instance;
  }

  /**
   * Get list of practitioners
   */
  async getPractitioners(params: GetPractitionersParams): Promise<PractitionerInfo[]> {
    const validated = GetPractitionersSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      let query = `
        SELECT id, first_name, last_name, specialization, license_number, 
               phone, email, is_active, schedule_config
        FROM practitioners 
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];

      if (validated.specialty) {
        query += ' AND (specialization LIKE ? OR specialization = ?)';
        queryParams.push(`%${validated.specialty}%`, validated.specialty);
      }

      if (validated.isActive !== undefined) {
        query += ' AND is_active = ?';
        queryParams.push(validated.isActive);
      }

      query += ' ORDER BY first_name, last_name';

      const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);
      
      const practitioners: PractitionerInfo[] = [];

      for (const row of rows) {
        // Get next available slot for each practitioner
        const nextAvailability = await this.getNextAvailability(connection, row.id);
        
        practitioners.push({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          firstName: row.first_name,
          lastName: row.last_name,
          specialty: row.specialization || 'Dentiste généraliste',
          licenseNumber: row.license_number,
          phone: row.phone,
          email: row.email,
          isActive: row.is_active,
          nextAvailability: nextAvailability,
          scheduleConfig: row.schedule_config ? JSON.parse(row.schedule_config) : {}
        });
      }

      return practitioners;

    } finally {
      await connection.end();
    }
  }

  /**
   * Get cabinet information
   */
  async getInfo(params: GetInfoParams): Promise<CabinetInfo> {
    const validated = GetInfoSchema.parse(params);
    
    // Get cabinet info from main database
    const mainConnection = await createConnection();
    
    try {
      const [rows] = await mainConnection.execute<RowDataPacket[]>(
        `SELECT id, name, slug, address_street, address_city, address_postal_code, 
                address_country, phone, email, timezone, status, business_hours
         FROM cabinets WHERE id = ?`,
        [validated.tenantId]
      );

      if (rows.length === 0) {
        throw Problems.resourceNotFound('cabinet', validated.tenantId);
      }

      const cabinet = rows[0];
      
      return {
        id: cabinet.id,
        name: cabinet.name,
        slug: cabinet.slug,
        address: {
          street: cabinet.address_street,
          city: cabinet.address_city,
          postalCode: cabinet.address_postal_code,
          country: cabinet.address_country
        },
        contact: {
          phone: cabinet.phone,
          email: cabinet.email
        },
        timezone: cabinet.timezone,
        status: cabinet.status,
        businessHours: cabinet.business_hours ? JSON.parse(cabinet.business_hours) : {}
      };

    } finally {
      await mainConnection.end();
    }
  }

  /**
   * Get business hours and current status
   */
  async getBusinessHours(params: GetBusinessHoursParams): Promise<BusinessHours> {
    const validated = GetBusinessHoursParams.parse(params);
    
    const cabinetInfo = await this.getInfo({ tenantId: validated.tenantId });
    const businessHours = cabinetInfo.businessHours;
    
    const targetDate = validated.date ? new Date(validated.date) : new Date();
    const currentDay = this.getDayName(targetDate.getDay());
    const todayHours = businessHours[currentDay] || null;
    
    const isOpen = this.isCurrentlyOpen(todayHours, targetDate);
    
    // Find next open day if closed today
    let nextOpenDay: { day: string; hours: { open: string; close: string } } | undefined;
    
    if (!isOpen || !todayHours) {
      nextOpenDay = this.findNextOpenDay(businessHours, targetDate);
    }

    return {
      isOpen,
      currentDay,
      todayHours,
      weeklyHours: businessHours,
      nextOpenDay
    };
  }

  /**
   * Get available services
   */
  async getServices(params: GetServicesParams): Promise<ServiceInfo[]> {
    const validated = GetServicesSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      let query = `
        SELECT id, name, description, duration_minutes, price, category, is_active
        FROM services 
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];

      if (validated.category) {
        query += ' AND category = ?';
        queryParams.push(validated.category);
      }

      if (validated.isActive !== undefined) {
        query += ' AND is_active = ?';
        queryParams.push(validated.isActive);
      }

      query += ' ORDER BY category, name';

      const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        duration: row.duration_minutes,
        price: row.price,
        category: row.category,
        isActive: row.is_active
      }));

    } finally {
      await connection.end();
    }
  }

  /**
   * Get cabinet statistics for dashboard
   */
  async getStats(tenantId: string): Promise<CabinetStats> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      // Get patient stats
      const [patientStats] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active FROM patients'
      );

      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const [todayAppts] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM appointments WHERE DATE(scheduled_at) = ? AND status IN (?, ?)',
        [today, 'scheduled', 'confirmed']
      );

      // Get this week's appointments
      const startOfWeek = this.getStartOfWeek();
      const endOfWeek = this.getEndOfWeek();
      const [weekAppts] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM appointments WHERE scheduled_at BETWEEN ? AND ? AND status IN (?, ?)',
        [startOfWeek, endOfWeek, 'scheduled', 'confirmed']
      );

      // Get practitioner count
      const [practitionerStats] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM practitioners WHERE is_active = TRUE'
      );

      // Get service count
      const [serviceStats] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM services WHERE is_active = TRUE'
      );

      return {
        totalPatients: patientStats[0].total,
        activePatients: patientStats[0].active,
        todayAppointments: todayAppts[0].count,
        weekAppointments: weekAppts[0].count,
        practitioners: practitionerStats[0].count,
        services: serviceStats[0].count
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Get emergency contact information
   */
  async getEmergencyInfo(tenantId: string): Promise<{
    emergencyPhone?: string;
    afterHoursPhone?: string;
    emergencyInstructions?: string;
    nearestHospital?: {
      name: string;
      address: string;
      phone: string;
    };
  }> {
    const cabinetInfo = await this.getInfo({ tenantId });
    
    // This would typically come from cabinet configuration
    // For now, return default emergency info
    return {
      emergencyPhone: cabinetInfo.contact.phone,
      afterHoursPhone: cabinetInfo.contact.phone,
      emergencyInstructions: "En cas d'urgence dentaire grave, appelez le 15 (SAMU) ou rendez-vous aux urgences de l'hôpital le plus proche.",
      nearestHospital: {
        name: "Hôpital Saint-Antoine",
        address: "184 Rue du Faubourg Saint-Antoine, 75012 Paris",
        phone: "01 49 28 20 00"
      }
    };
  }

  /**
   * Search practitioners by name or specialty
   */
  async searchPractitioners(tenantId: string, query: string): Promise<PractitionerInfo[]> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, specialization, license_number, 
                phone, email, is_active, schedule_config
         FROM practitioners 
         WHERE is_active = TRUE
         AND (
           LOWER(first_name) LIKE ? OR 
           LOWER(last_name) LIKE ? OR 
           LOWER(specialization) LIKE ? OR
           LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?
         )
         ORDER BY first_name, last_name`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );

      const practitioners: PractitionerInfo[] = [];

      for (const row of rows) {
        const nextAvailability = await this.getNextAvailability(connection, row.id);
        
        practitioners.push({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          firstName: row.first_name,
          lastName: row.last_name,
          specialty: row.specialization || 'Dentiste généraliste',
          licenseNumber: row.license_number,
          phone: row.phone,
          email: row.email,
          isActive: row.is_active,
          nextAvailability: nextAvailability,
          scheduleConfig: row.schedule_config ? JSON.parse(row.schedule_config) : {}
        });
      }

      return practitioners;

    } finally {
      await connection.end();
    }
  }

  // Private helper methods

  private async getTenantConnection(tenantId: string): Promise<Connection> {
    // Get tenant database name from main database
    const mainConnection = await createConnection();
    
    try {
      const [rows] = await mainConnection.execute<RowDataPacket[]>(
        'SELECT database_name FROM cabinets WHERE id = ?',
        [tenantId]
      );

      if (rows.length === 0) {
        throw Problems.resourceNotFound('cabinet', tenantId);
      }

      const databaseName = rows[0].database_name;
      return await createConnection(databaseName);

    } finally {
      await mainConnection.end();
    }
  }

  private async getNextAvailability(connection: Connection, practitionerId: string): Promise<string | undefined> {
    // This is a simplified version - in production, you'd implement more sophisticated scheduling logic
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      // Check if practitioner has appointments tomorrow
      const [appointments] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM appointments WHERE practitioner_id = ? AND DATE(scheduled_at) = ? AND status IN (?, ?)',
        [practitionerId, tomorrowStr, 'scheduled', 'confirmed']
      );

      if (appointments[0].count < 8) { // Assume max 8 appointments per day
        return `${tomorrow.toLocaleDateString('fr-FR')} matin`;
      }

      // Check day after tomorrow
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      return `${dayAfter.toLocaleDateString('fr-FR')} matin`;

    } catch (_error) {
      console.error('Error getting next availability:', error);
      return undefined;
    }
  }

  private getDayName(dayIndex: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  }

  private isCurrentlyOpen(todayHours: { open: string; close: string } | null, targetDate: Date): boolean {
    if (!todayHours || !todayHours.open || !todayHours.close) {
      return false;
    }

    const currentTime = targetDate.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  private findNextOpenDay(
    businessHours: Record<string, { open: string; close: string }>,
    fromDate: Date
  ): { day: string; hours: { open: string; close: string } } | undefined {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dayName = days[checkDate.getDay()];
      
      const dayHours = businessHours[dayName];
      if (dayHours && dayHours.open && dayHours.close) {
        return {
          day: dayName,
          hours: dayHours
        };
      }
    }

    return undefined;
  }

  private getStartOfWeek(): string {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.toISOString().slice(0, 19).replace('T', ' ');
  }

  private getEndOfWeek(): string {
    const now = new Date();
    const endOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
    endOfWeek.setDate(diff);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek.toISOString().slice(0, 19).replace('T', ' ');
  }
}

export default CabinetTools;