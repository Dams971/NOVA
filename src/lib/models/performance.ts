export interface CabinetKPIs {
  cabinetId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Appointment metrics
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  
  // Performance rates
  completionRate: number; // percentage
  noShowRate: number; // percentage
  cancellationRate: number; // percentage
  
  // Revenue metrics
  totalRevenue: number;
  averageAppointmentValue: number;
  
  // Patient metrics
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  
  // Operational metrics
  averageWaitTime: number; // in minutes
  appointmentUtilization: number; // percentage of available slots filled
  
  // Trends (compared to previous period)
  trends: {
    appointments: number; // percentage change
    revenue: number; // percentage change
    patients: number; // percentage change
    noShowRate: number; // percentage change
  };
  
  updatedAt: Date;
}

export interface PerformanceAlert {
  id: string;
  cabinetId: string;
  type: 'warning' | 'critical' | 'info';
  category: 'appointments' | 'revenue' | 'patients' | 'operations';
  title: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  isActive: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'alert';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    metric?: keyof CabinetKPIs;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    showTrend?: boolean;
    alertTypes?: string[];
  };
  isVisible: boolean;
}

export interface ManagerDashboardLayout {
  userId: string;
  cabinetId: string;
  widgets: DashboardWidget[];
  updatedAt: Date;
}

export interface RealtimeUpdate {
  cabinetId: string;
  type: 'kpi' | 'appointment' | 'alert';
  data: any;
  timestamp: Date;
}