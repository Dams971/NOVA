import { NextRequest, NextResponse } from 'next/server';
import { CabinetProvisioningService } from '../../../../lib/services/cabinet-provisioning-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    const template = provisioningService.getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Get template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    const template = provisioningService.getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default template' },
        { status: 400 }
      );
    }

    const removed = provisioningService.removeTemplate(templateId);

    if (!removed) {
      return NextResponse.json(
        { error: 'Failed to remove template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template removed successfully'
    });

  } catch (error) {
    console.error('Delete template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}