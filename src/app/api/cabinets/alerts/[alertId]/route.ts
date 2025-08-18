import { NextRequest, NextResponse } from 'next/server';
import APIGateway from '@/lib/api/gateway';
import { CabinetHealthService } from '@/lib/services/cabinet-health-service';

const _gateway = new APIGateway({
  auth: { required: true, roles: ['super_admin', 'admin'] },
  rateLimit: { maxRequests: 60, windowMs: 60000 }
});

async function acknowledgeAlertHandler(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
): Promise<NextResponse> {
  try {
    const { alertId } = await params;
    const body = await req.json();
    const { action } = body;
    
    const healthService = new CabinetHealthService();
    
    if (action === 'acknowledge') {
      const success = await healthService.acknowledgeAlert(alertId);
      
      if (!success) {
        return APIGateway.createResponse(
          { success: false, error: 'Alert not found' },
          404
        );
      }
      
      return APIGateway.createResponse({
        success: true,
        message: 'Alert acknowledged'
      });
    }
    
    if (action === 'resolve') {
      const success = await healthService.resolveAlert(alertId);
      
      if (!success) {
        return APIGateway.createResponse(
          { success: false, error: 'Alert not found' },
          404
        );
      }
      
      return APIGateway.createResponse({
        success: true,
        message: 'Alert resolved'
      });
    }
    
    return APIGateway.createResponse(
      { success: false, error: 'Invalid action. Use "acknowledge" or "resolve"' },
      400
    );
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const PATCH = acknowledgeAlertHandler;