import { NextRequest, NextResponse } from 'next/server';
import { PerformanceService } from '@/lib/services/performance-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { cabinetId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'week';
    const cabinetId = params.cabinetId;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const performanceService = PerformanceService.getInstance();
    
    // Get KPIs
    const kpisResult = await performanceService.getCabinetKPIs(cabinetId, startDate, endDate);
    if (!kpisResult.success) {
      return NextResponse.json(
        { error: kpisResult.error },
        { status: 500 }
      );
    }

    // Get alerts
    const alertsResult = await performanceService.getActiveAlerts(cabinetId);
    if (!alertsResult.success) {
      return NextResponse.json(
        { error: alertsResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: kpisResult.data,
        alerts: alertsResult.data
      }
    });

  } catch (_error) {
    console.error('Error in manager dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { cabinetId: string } }
) {
  try {
    const body = await request.json();
    const { action, alertId, userId } = body;
    const cabinetId = params.cabinetId;

    const performanceService = PerformanceService.getInstance();

    if (action === 'acknowledge_alert' && alertId && userId) {
      const result = await performanceService.acknowledgeAlert(alertId, userId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (_error) {
    console.error('Error in manager dashboard POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}