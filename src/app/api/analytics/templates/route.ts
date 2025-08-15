import { NextResponse } from 'next/server';
import { ReportTemplate } from '@/lib/models/analytics';

export async function GET() {
  try {
    // Mock report templates
    const templates: ReportTemplate[] = [
      {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete analytics report with all metrics and charts',
        sections: ['overview', 'trends', 'breakdown', 'comparison'],
        defaultFormat: 'pdf',
        isDefault: true
      },
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level overview for management',
        sections: ['overview', 'comparison'],
        defaultFormat: 'pdf',
        isDefault: false
      },
      {
        id: 'operational',
        name: 'Operational Report',
        description: 'Detailed operational metrics and trends',
        sections: ['trends', 'breakdown'],
        defaultFormat: 'excel',
        isDefault: false
      },
      {
        id: 'financial',
        name: 'Financial Report',
        description: 'Revenue and financial performance focus',
        sections: ['overview', 'trends'],
        defaultFormat: 'excel',
        isDefault: false
      }
    ];

    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error in analytics/templates API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}