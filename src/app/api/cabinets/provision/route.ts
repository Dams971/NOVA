import { NextRequest, NextResponse } from 'next/server';
import { CreateCabinetRequest } from '../../../../lib/models/cabinet';
import { CabinetProvisioningService, ProvisioningOptions } from '../../../../lib/services/cabinet-provisioning-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cabinetData, options }: { 
      cabinetData: CreateCabinetRequest; 
      options?: ProvisioningOptions 
    } = body;

    if (!cabinetData) {
      return NextResponse.json(
        { error: 'Cabinet data is required' },
        { status: 400 }
      );
    }

    const provisioningService = new CabinetProvisioningService();
    const result = await provisioningService.provisionCabinet(cabinetData, options);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          validationErrors: result.validationErrors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cabinet: result.data?.cabinet,
        deployment: {
          id: result.data?.deployment.id,
          status: result.data?.deployment.status,
          steps: result.data?.deployment.steps.map(step => ({
            id: step.id,
            name: step.name,
            status: step.status,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            error: step.error
          }))
        }
      }
    });

  } catch (error) {
    console.error('Cabinet provisioning API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}