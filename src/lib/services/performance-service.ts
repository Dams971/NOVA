import { AppointmentStatus } from '../models/appointment';
import { CabinetKPIs, PerformanceAlert, RealtimeUpdate } from '../models/performance';

export interface PerformanceServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private realtimeSubscribers: Map<string, ((update: RealtimeUpdate) => void)[]> = new Map();

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  async getCabinetKPIs(cabinetId: string, startDate: Date, endDate: Date): Promise<PerformanceServiceResult<CabinetKPIs>> {
    try {
      // In a real implementation, this would query the cabinet's database
      // For now, we'll simulate the data
      const kpis = await this.calculateKPIs(cabinetId, startDate, endDate);
      
      return {
        success: true,
        data: kpis
      };
    } catch (_error) {
      console.error('Error calculating KPIs:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  private async calculateKPIs(cabinetId: string, startDate: Date, endDate: Date): Promise<CabinetKPIs> {
    // Simulate database queries - in real implementation, these would be actual DB calls
    const appointments = await this.getAppointmentsForPeriod(cabinetId, startDate, endDate);
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousAppointments = await this.getAppointmentsForPeriod(cabinetId, previousPeriodStart, startDate);

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
    const noShowAppointments = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;

    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;

    const totalRevenue = appointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.price || 0), 0);
    
    const averageAppointmentValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

    // Calculate trends
    const previousTotal = previousAppointments.length;
    const previousRevenue = previousAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.price || 0), 0);
    const previousNoShows = previousAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const previousNoShowRate = previousTotal > 0 ? (previousNoShows / previousTotal) * 100 : 0;

    const appointmentTrend = previousTotal > 0 ? ((totalAppointments - previousTotal) / previousTotal) * 100 : 0;
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const noShowTrend = noShowRate - previousNoShowRate;

    return {
      cabinetId,
      period: { start: startDate, end: endDate },
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      completionRate,
      noShowRate,
      cancellationRate,
      totalRevenue,
      averageAppointmentValue,
      totalPatients: await this.getPatientCount(cabinetId, startDate, endDate),
      newPatients: await this.getNewPatientCount(cabinetId, startDate, endDate),
      returningPatients: await this.getReturningPatientCount(cabinetId, startDate, endDate),
      averageWaitTime: 15, // Simulated
      appointmentUtilization: 75, // Simulated
      trends: {
        appointments: appointmentTrend,
        revenue: revenueTrend,
        patients: 0, // Would be calculated similarly
        noShowRate: noShowTrend
      },
      updatedAt: new Date()
    };
  }

  private async getAppointmentsForPeriod(cabinetId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Simulate appointment data - in real implementation, this would query the cabinet's database
    const mockAppointments = [
      { id: '1', status: AppointmentStatus.COMPLETED, price: 80, scheduledAt: new Date() },
      { id: '2', status: AppointmentStatus.COMPLETED, price: 120, scheduledAt: new Date() },
      { id: '3', status: AppointmentStatus.NO_SHOW, price: 0, scheduledAt: new Date() },
      { id: '4', status: AppointmentStatus.CANCELLED, price: 0, scheduledAt: new Date() },
      { id: '5', status: AppointmentStatus.COMPLETED, price: 200, scheduledAt: new Date() }
    ];
    
    return mockAppointments;
  }

  private async getPatientCount(cabinetId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simulate patient count
    return 45;
  }

  private async getNewPatientCount(cabinetId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simulate new patient count
    return 8;
  }

  private async getReturningPatientCount(cabinetId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simulate returning patient count
    return 37;
  }

  async getActiveAlerts(cabinetId: string): Promise<PerformanceServiceResult<PerformanceAlert[]>> {
    try {
      // Simulate alerts based on KPIs
      const alerts: PerformanceAlert[] = [];
      
      const kpisResult = await this.getCabinetKPIs(
        cabinetId, 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        new Date()
      );

      if (kpisResult.success && kpisResult.data) {
        const kpis = kpisResult.data;
        
        // Check for high no-show rate
        if (kpis.noShowRate > 15) {
          alerts.push({
            id: `alert-${Date.now()}-1`,
            cabinetId,
            type: 'warning',
            category: 'appointments',
            title: 'Taux de no-show élevé',
            message: `Le taux de no-show est de ${kpis.noShowRate.toFixed(1)}%, au-dessus du seuil de 15%`,
            threshold: 15,
            currentValue: kpis.noShowRate,
            isActive: true,
            createdAt: new Date()
          });
        }

        // Check for low appointment utilization
        if (kpis.appointmentUtilization < 60) {
          alerts.push({
            id: `alert-${Date.now()}-2`,
            cabinetId,
            type: 'critical',
            category: 'operations',
            title: 'Faible taux d\'occupation',
            message: `Le taux d\'occupation des créneaux est de ${kpis.appointmentUtilization}%, en dessous du seuil de 60%`,
            threshold: 60,
            currentValue: kpis.appointmentUtilization,
            isActive: true,
            createdAt: new Date()
          });
        }

        // Check for revenue decline
        if (kpis.trends.revenue < -10) {
          alerts.push({
            id: `alert-${Date.now()}-3`,
            cabinetId,
            type: 'warning',
            category: 'revenue',
            title: 'Baisse du chiffre d\'affaires',
            message: `Le chiffre d\'affaires a baissé de ${Math.abs(kpis.trends.revenue).toFixed(1)}% par rapport à la période précédente`,
            currentValue: kpis.trends.revenue,
            isActive: true,
            createdAt: new Date()
          });
        }
      }

      return {
        success: true,
        data: alerts
      };
    } catch (_error) {
      console.error('Error getting alerts:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<PerformanceServiceResult<boolean>> {
    try {
      // In real implementation, this would update the alert in the database
      console.warn(`Alert ${alertId} acknowledged by user ${userId}`);
      
      return {
        success: true,
        data: true
      };
    } catch (_error) {
      console.error('Error acknowledging alert:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  // Real-time updates
  subscribeToUpdates(cabinetId: string, callback: (update: RealtimeUpdate) => void): void {
    if (!this.realtimeSubscribers.has(cabinetId)) {
      this.realtimeSubscribers.set(cabinetId, []);
    }
    this.realtimeSubscribers.get(cabinetId)!.push(callback);
  }

  unsubscribeFromUpdates(cabinetId: string, callback: (update: RealtimeUpdate) => void): void {
    const subscribers = this.realtimeSubscribers.get(cabinetId);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  private notifySubscribers(cabinetId: string, update: RealtimeUpdate): void {
    const subscribers = this.realtimeSubscribers.get(cabinetId);
    if (subscribers) {
      subscribers.forEach(callback => callback(update));
    }
  }

  // Simulate real-time updates (in real implementation, this would be triggered by actual events)
  simulateRealtimeUpdate(cabinetId: string): void {
    const update: RealtimeUpdate = {
      cabinetId,
      type: 'kpi',
      data: { metric: 'totalAppointments', value: Math.floor(Math.random() * 100) },
      timestamp: new Date()
    };
    
    this.notifySubscribers(cabinetId, update);
  }
}