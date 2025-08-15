import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withCORS, withRateLimit, combineMiddlewares } from '../middleware/auth';

/**
 * API Gateway configuration
 */
export interface APIGatewayConfig {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  cors?: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  auth?: {
    required: boolean;
    roles?: string[];
  };
}

/**
 * Default API Gateway configuration
 */
const defaultConfig: APIGatewayConfig = {
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  auth: {
    required: true
  }
};

/**
 * API Gateway class for handling requests
 */
export class APIGateway {
  private config: APIGatewayConfig;

  constructor(config: Partial<APIGatewayConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Create API handler with gateway middleware
   */
  public createHandler(
    handler: (req: NextRequest) => Promise<NextResponse>,
    routeConfig?: Partial<APIGatewayConfig>
  ) {
    const finalConfig = { ...this.config, ...routeConfig };
    const middlewares = [];

    // Add CORS middleware
    middlewares.push(withCORS);

    // Add rate limiting middleware
    if (finalConfig.rateLimit) {
      middlewares.push(
        withRateLimit(
          finalConfig.rateLimit.maxRequests,
          finalConfig.rateLimit.windowMs
        )
      );
    }

    // Add authentication middleware
    if (finalConfig.auth?.required) {
      middlewares.push(withAuth);
    }

    // Combine all middlewares
    const combinedMiddleware = combineMiddlewares(...middlewares);
    
    return combinedMiddleware(handler);
  }

  /**
   * Handle API errors consistently
   */
  public static handleError(error: any): NextResponse {
    console.error('API Gateway Error:', error);

    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          code: 'DB_CONNECTION_ERROR',
          message: 'Unable to connect to database'
        },
        { status: 503 }
      );
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: error.details || error.message
        },
        { status: 400 }
      );
    }

    // Authorization errors
    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access', 
          code: 'UNAUTHORIZED',
          message: error.message
        },
        { status: 401 }
      );
    }

    // Cabinet access errors
    if (error.code === 'CABINET_ACCESS_DENIED') {
      return NextResponse.json(
        { 
          error: 'Cabinet access denied', 
          code: 'CABINET_ACCESS_DENIED',
          message: 'You do not have access to this cabinet'
        },
        { status: 403 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }

  /**
   * Validate request body against schema
   */
  public static validateRequestBody(body: any, schema: any): { isValid: boolean; errors?: string[] } {
    // Basic validation - in production, use a library like Joi or Zod
    const errors: string[] = [];

    if (!body) {
      errors.push('Request body is required');
      return { isValid: false, errors };
    }

    // Add more validation logic based on schema
    // This is a simplified version
    for (const [key, rules] of Object.entries(schema)) {
      const value = body[key];
      const ruleSet = rules as any;

      if (ruleSet.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
      }

      if (value !== undefined && ruleSet.type && typeof value !== ruleSet.type) {
        errors.push(`${key} must be of type ${ruleSet.type}`);
      }

      if (value && ruleSet.minLength && value.length < ruleSet.minLength) {
        errors.push(`${key} must be at least ${ruleSet.minLength} characters long`);
      }

      if (value && ruleSet.maxLength && value.length > ruleSet.maxLength) {
        errors.push(`${key} must be no more than ${ruleSet.maxLength} characters long`);
      }
    }

    return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Create standardized API response
   */
  public static createResponse(data: any, status: number = 200, meta?: any): NextResponse {
    const response = {
      success: status >= 200 && status < 300,
      data,
      meta,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status });
  }
}

export default APIGateway;