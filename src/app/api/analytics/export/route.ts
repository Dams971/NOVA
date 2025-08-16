import { NextRequest, NextResponse } from 'next/server';
import { ExportOptions, CabinetAnalytics, TimeSeriesData, DrillDownData } from '@/lib/models/analytics';
import { AnalyticsService } from '@/lib/services/analytics-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cabinetId, format, dateRange } = body as ExportOptions & { cabinetId: string };

    if (!cabinetId || !format || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    
    // Convert date strings back to Date objects
    const parsedDateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    };

    // Generate mock analytics data
    const analytics = analyticsService.generateMockAnalytics(cabinetId, parsedDateRange);

    // Generate export content based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        content = generateCSVContent(analytics);
        mimeType = 'text/csv';
        filename = `cabinet-analytics-${cabinetId}.csv`;
        break;
      
      case 'excel':
        // For now, return CSV format for Excel (would need xlsx library for proper Excel format)
        content = generateCSVContent(analytics);
        mimeType = 'application/vnd.ms-excel';
        filename = `cabinet-analytics-${cabinetId}.xlsx`;
        break;
      
      case 'pdf':
        // For now, return JSON format (would need PDF generation library)
        content = JSON.stringify(analytics, null, 2);
        mimeType = 'application/json';
        filename = `cabinet-analytics-${cabinetId}.json`;
        break;
      
      default:
        throw new Error('Unsupported export format');
    }

    // Return the file content
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in analytics/export API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

function generateCSVContent(analytics: CabinetAnalytics): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Cabinet Analytics Report');
  lines.push(`Period: ${analytics.period.start} to ${analytics.period.end}`);
  lines.push('');
  
  // Overview
  lines.push('Overview');
  lines.push('Metric,Value,Trend');
  lines.push(`Total Appointments,${analytics.overview.totalAppointments},${analytics.overview.trends.appointments}%`);
  lines.push(`Total Revenue,${analytics.overview.totalRevenue},${analytics.overview.trends.revenue}%`);
  lines.push(`Total Patients,${analytics.overview.totalPatients},${analytics.overview.trends.patients}%`);
  lines.push(`Average Utilization,${analytics.overview.averageUtilization}%,${analytics.overview.trends.utilization}%`);
  lines.push('');
  
  // Time Series Data
  lines.push('Daily Appointments');
  lines.push('Date,Appointments');
  analytics.timeSeries.appointments.forEach((item: TimeSeriesData) => {
    lines.push(`${item.date},${item.value}`);
  });
  lines.push('');
  
  lines.push('Daily Revenue');
  lines.push('Date,Revenue');
  analytics.timeSeries.revenue.forEach((item: TimeSeriesData) => {
    lines.push(`${item.date},${item.value}`);
  });
  lines.push('');
  
  // Breakdown Data
  lines.push('Appointments by Type');
  lines.push('Type,Count,Percentage,Trend');
  analytics.breakdown.appointmentsByType.forEach((item: DrillDownData) => {
    lines.push(`${item.category},${item.value},${item.percentage}%,${item.trendValue}%`);
  });
  lines.push('');
  
  lines.push('Revenue by Service');
  lines.push('Service,Revenue,Percentage,Trend');
  analytics.breakdown.revenueByService.forEach((item: DrillDownData) => {
    lines.push(`${item.category},${item.value},${item.percentage}%,${item.trendValue}%`);
  });
  
  return lines.join('\n');
}