import { NextRequest, NextResponse } from 'next/server';
import Bootstrap from '@/lib/core/bootstrap';
import APIGateway from '@/lib/api/gateway';
import { getInitializationPromise } from '@/lib/core/init';

const gateway = new APIGateway({
  auth: { required: false }, // System status should be public
  rateLimit: { maxRequests: 30, windowMs: 60000 }
});

async function statusHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // Ensure system is initialized
    await getInitializationPromise();
    
    const bootstrap = Bootstrap.getInstance();
    const validation = await bootstrap.validateSystemReadiness();
    
    const status = {
      initialized: bootstrap.isReady(),
      ready: validation.ready,
      issues: validation.issues,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    const statusCode = validation.ready ? 200 : 503;
    return APIGateway.createResponse(status, statusCode);
    
  } catch (error) {
    return APIGateway.handleError(error);
  }
}

export const GET = gateway.createHandler(statusHandler);