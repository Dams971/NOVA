import { NextRequest, NextResponse } from 'next/server';
import JWTManager, { AuthContext } from '../auth/jwt';
import { RBACService, UserRole } from '../auth/rbac';

export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthContext;
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const jwtManager = JWTManager.getInstance();
    
    try {
      // Extract token from request
      const token = jwtManager.extractTokenFromRequest(req);
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      // Create auth context
      const authContext = await jwtManager.createAuthContext(token);
      
      if (!authContext) {
        return NextResponse.json(
          { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      // Attach auth context to request
      req.auth = authContext;

      // Call the actual handler
      return await handler(req);

    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function withRole(requiredRole: string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.auth?.hasRole(requiredRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Cabinet access authorization middleware
 */
export function withCabinetAccess(getCabinetId: (req: AuthenticatedRequest) => string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const cabinetId = getCabinetId(req);
      
      if (!req.auth?.hasCabinetAccess(cabinetId)) {
        return NextResponse.json(
          { error: 'Cabinet access denied', code: 'CABINET_ACCESS_DENIED' },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * API rate limiting middleware
 */
export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const clientId = req.auth?.user.userId || (req as any).ip || 'anonymous';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      // Check current request count
      const clientRequests = requests.get(clientId);
      
      if (clientRequests) {
        if (clientRequests.count >= maxRequests && clientRequests.resetTime > windowStart) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            { status: 429 }
          );
        }
        clientRequests.count++;
      } else {
        requests.set(clientId, { count: 1, resetTime: now + windowMs });
      }

      return await handler(req);
    };
  };
}

/**
 * CORS middleware for API routes
 */
export function withCORS(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Call handler and add CORS headers to response
    const response = await handler(req);
    
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

/**
 * Permission-based authorization middleware using RBAC
 */
export function withPermission(resource: string, action: string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.auth?.user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const rbacService = RBACService.getInstance();
      const hasPermission = rbacService.hasPermission(
        req.auth.user.role,
        resource,
        action,
        {
          userId: req.auth.user.userId,
          assignedCabinets: req.auth.user.assignedCabinets,
        }
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Cabinet-scoped permission middleware
 */
export function withCabinetPermission(
  resource: string,
  action: string,
  getCabinetId: (req: AuthenticatedRequest) => string
) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.auth?.user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const cabinetId = getCabinetId(req);
      const rbacService = RBACService.getInstance();
      
      const canPerform = rbacService.canPerformAction(
        req.auth.user.role,
        resource,
        action,
        cabinetId,
        req.auth.user.assignedCabinets
      );

      if (!canPerform) {
        return NextResponse.json(
          { error: 'Cabinet access denied or insufficient permissions', code: 'CABINET_PERMISSION_DENIED' },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * User management authorization middleware
 */
export function withUserManagement() {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.auth?.user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const rbacService = RBACService.getInstance();
      const hasPermission = rbacService.hasPermission(
        req.auth.user.role,
        'user',
        'create'
      ) || rbacService.hasPermission(
        req.auth.user.role,
        'user',
        'update'
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'User management permissions required', code: 'USER_MANAGEMENT_DENIED' },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Analytics access middleware
 */
export function withAnalyticsAccess(getCabinetId?: (req: AuthenticatedRequest) => string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.auth?.user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const rbacService = RBACService.getInstance();
      
      // If cabinet-specific analytics
      if (getCabinetId) {
        const cabinetId = getCabinetId(req);
        const canAccess = rbacService.canPerformAction(
          req.auth.user.role,
          'analytics',
          'read',
          cabinetId,
          req.auth.user.assignedCabinets
        );

        if (!canAccess) {
          return NextResponse.json(
            { error: 'Analytics access denied for this cabinet', code: 'ANALYTICS_ACCESS_DENIED' },
            { status: 403 }
          );
        }
      } else {
        // Global analytics access
        const hasPermission = rbacService.hasPermission(
          req.auth.user.role,
          'analytics',
          'read'
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Analytics access denied', code: 'ANALYTICS_ACCESS_DENIED' },
            { status: 403 }
          );
        }
      }

      return await handler(req);
    });
  };
}

/**
 * Combine multiple middlewares
 */
export function combineMiddlewares(
  ...middlewares: Array<(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => (req: AuthenticatedRequest) => Promise<NextResponse>>
) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}