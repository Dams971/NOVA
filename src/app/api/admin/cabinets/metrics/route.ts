import { NextRequest, NextResponse } from 'next/server';
import { CabinetService } from '@/lib/services/cabinet-service';

// Mock metrics service - in a real implementation, this would fetch from analytics database
class CabinetMetricsService {
  async getCabinetMetrics(cabinetId: string) {
    // Mock data - replace with actual database queries
    return {
      cabinetId,
      appointmentsToday: Math.floor(Math.random() * 20) + 5,
      appointmentsThisWeek: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      patientCount: Math.floor(Math.random() * 500) + 100,
      utilizationRate: Math.floor(Math.random() * 40) + 60,
      healthStatus: ['healthy', 'degraded', 'unhealthy'][Math.floor(Math.random() * 3)] as 'healthy' | 'degraded' | 'unhealthy',
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 3600000)) // Random time within last hour
    };
  }

  async getAllCabinetMetrics(cabinetIds: string[]) {
    return Promise.all(cabinetIds.map(id => this.getCabinetMetrics(id)));
  }
}

export async function GET(request: NextRequest) {
  try {
    const cabinetService = new CabinetService();
    const metricsService = new CabinetMetricsService();

    // Get all cabinets first
    const cabinetsResult = await cabinetService.getAllCabinets();
    
    if (!cabinetsResult.success || !cabinetsResult.data) {
      return NextResponse.json(
        { error: 'Failed to fetch cabinets' },
        { status: 400 }
      );
    }

    // Get metrics for all cabinets
    const cabinetIds = cabinetsResult.data.map(cabinet => cabinet.id);
    const metrics = await metricsService.getAllCabinetMetrics(cabinetIds);

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error in GET /api/admin/cabinets/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}