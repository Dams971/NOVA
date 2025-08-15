import { NextResponse } from 'next/server';
import { CabinetProvisioningService, CabinetTemplate } from '../../../lib/services/cabinet-provisioning-service';

export async function GET() {
  try {
    const provisioningService = new CabinetProvisioningService();
    const templates = provisioningService.getAllTemplates();

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (_error) {
    console.error('Get templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const template: CabinetTemplate = await request.json();

    if (!template.id || !template.name || !template.settings) {
      return NextResponse.json(
        { error: 'Template ID, name, and settings are required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    
    // Check if template already exists
    const existingTemplate = provisioningService.getTemplate(template.id);
    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this ID already exists' },
        { status: 409 }
      );
    }

    provisioningService.addTemplate(template);

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (_error) {
    console.error('Create template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}