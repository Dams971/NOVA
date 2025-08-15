import { NextRequest, NextResponse } from 'next/server';
import { CabinetProvisioningService } from '../../../../lib/services/cabinet-provisioning-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { deploymentId: string } }
) {
  try {
    const { deploymentId } = params;

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    const deployment = provisioningService.getDeployment(deploymentId);

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: deployment.id,
        cabinetId: deployment.cabinetId,
        status: deployment.status,
        steps: deployment.steps.map(step => ({
          id: step.id,
          name: step.name,
          status: step.status,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
          error: step.error
        })),
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
        completedAt: deployment.completedAt,
        error: deployment.error
      }
    });

  } catch (_error) {
    console.error('Get deployment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { deploymentId: string } }
) {
  try {
    const { deploymentId } = params;

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    const result = await provisioningService.rollbackDeployment(deploymentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment rolled back successfully'
    });

  } catch (_error) {
    console.error('Rollback deployment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}