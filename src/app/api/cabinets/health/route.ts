import { NextRequest, NextResponse } from 'next/server';
import APIGateway from '@/lib/api/gateway';
import { CabinetHealthService } from '@/lib/services/cabinet-health-service';

const gateway = new APIGateway({
  auth: { required: true, roles: ['super_admin', 'admin'] },
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});

async function getAllCabinetHealthHandler(_req: NextRequest): Promise<NextResponse> {
  try {
    const healthService = new CabinetHealthService();
    const healthStatuses = await healthService.getAllCabinetHealth();
    
    return APIGateway.createResponse({
      success: true,
      data: healthStatuses,
      summary: healthService.getHealthSummary()
    });
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const GET = gateway.createHandler(getAllCabinetHealthHandler);