import { NextResponse } from 'next/server';
import { CabinetHealthService } from '@/lib/services/cabinet-health-service';
import APIGateway from '@/lib/api/gateway';

const gateway = new APIGateway({
  auth: { required: true, roles: ['super_admin', 'admin'] },
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});

async function getAlertsHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const cabinetId = url.searchParams.get('cabinetId');
    const healthService = new CabinetHealthService();
    const alerts = healthService.getActiveAlerts(cabinetId || undefined);
    
    // If includeResolved is true, we would fetch resolved alerts too
    // For now, we only return active alerts
    
    return APIGateway.createResponse({
      success: true,
      data: alerts,
      count: alerts.length
    });
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const GET = gateway.createHandler(getAlertsHandler);