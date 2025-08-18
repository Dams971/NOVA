import { NextRequest, NextResponse } from 'next/server';
import APIGateway from '@/lib/api/gateway';
import HealthMonitor from '@/lib/monitoring/health';

const gateway = new APIGateway({
  auth: { required: false }, // Health check should be public
  rateLimit: { maxRequests: 60, windowMs: 60000 }
});

async function healthHandler(_req: NextRequest): Promise<NextResponse> {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const systemHealth = await healthMonitor.getSystemHealth();
    
    const statusCode = systemHealth.status === 'healthy' ? 200 : 
                      systemHealth.status === 'degraded' ? 200 : 503;
    
    return APIGateway.createResponse(systemHealth, statusCode);
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const GET = gateway.createHandler(healthHandler);