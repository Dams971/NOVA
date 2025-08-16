import { NextResponse } from 'next/server';
import { CabinetHealthService } from '@/lib/services/cabinet-health-service';
import APIGateway from '@/lib/api/gateway';

const _gateway = new APIGateway({
  auth: { required: true, roles: ['super_admin', 'admin', 'manager'] },
  rateLimit: { maxRequests: 60, windowMs: 60000 }
});

async function getCabinetHealthHandler(
  req: NextRequest,
  { params }: { params: { cabinetId: string } }
): Promise<NextResponse> {
  try {
    const { cabinetId } = params;
    const healthService = new CabinetHealthService();
    
    // Check if user has access to this cabinet (for managers)
    // This would be implemented in the gateway middleware
    
    const healthStatus = await healthService.checkCabinetHealth(cabinetId);
    const alerts = healthService.getActiveAlerts(cabinetId);
    
    return APIGateway.createResponse({
      success: true,
      data: {
        health: healthStatus,
        alerts: alerts
      }
    });
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

async function refreshCabinetHealthHandler(
  req: NextRequest,
  { params }: { params: { cabinetId: string } }
): Promise<NextResponse> {
  try {
    const { cabinetId } = params;
    const healthService = new CabinetHealthService();
    
    // Force a fresh health check
    const healthStatus = await healthService.checkCabinetHealth(cabinetId);
    
    return APIGateway.createResponse({
      success: true,
      data: healthStatus,
      message: 'Health check refreshed'
    });
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const GET = gateway.createHandler(getCabinetHealthHandler);
export const POST = gateway.createHandler(refreshCabinetHealthHandler);