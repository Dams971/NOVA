import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { TimeGranularity } from '@/lib/models/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetId = searchParams.get('cabinetId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') as TimeGranularity || TimeGranularity.DAY;

    if (!cabinetId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: cabinetId, startDate, endDate' },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    // For now, return mock data since we don't have real data yet
    const analytics = analyticsService.generateMockAnalytics(cabinetId, dateRange);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (_error) {
    console.error('Error in analytics/cabinet API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}