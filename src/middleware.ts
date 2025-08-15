import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NOVA Platform Middleware
 * Handles: Authentication, Rate Limiting, Tenant Resolution, Security Headers
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  /^\/$/,                    // Homepage
  /^\/login/,               // Login page
  /^\/register/,            // Registration
  /^\/api\/auth\/login/,    // Login API
  /^\/api\/auth\/register/, // Register API
  /^\/api\/health/,         // Health check
  /^\/api\/system/,         // System status
  /^\/_next/,               // Next.js internal
  /^\/favicon\.ico/,        // Favicon
  /^\/static/,              // Static assets
  /^\/images/,              // Images
  /^\/css/,                 // CSS files
  /^\/js/,                  // JavaScript files
];

// Routes that require special handling
const API_ROUTES = /^\/api\//;
const ADMIN_ROUTES = /^\/admin/;
const MANAGER_ROUTES = /^\/manager/;

export async function middleware(request: NextRequest) {
  // Minimal middleware - just pass through
  return NextResponse.next();
}

/**
 * Multi-tier rate limiting
 */
async function checkRateLimits(request: NextRequest, ip: string, pathname: string) {
  const promises = [
    ratelimit.checkIPLimit(ip),
    ratelimit.checkRouteLimit(pathname, ip),
  ];

  // If user is authenticated, add user-based rate limiting
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1] || request.cookies.get('access_token')?.value;
  
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      if (payload) {
        promises.push(
          ratelimit.checkUserLimit(payload.userId),
          ratelimit.checkTenantLimit(payload.assignedCabinets[0] || 'default')
        );
      }
    } catch {
      // Token invalid, continue with IP-only rate limiting
    }
  }

  const results = await Promise.all(promises);
  const blocked = results.find(result => !result.allowed);
  
  return {
    allowed: !blocked,
    result: blocked || results[0]
  };
}

/**
 * Authentication verification
 */
async function checkAuthentication(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('access_token')?.value;
  
  const token = authHeader?.split(' ')[1] || cookieToken;
  
  if (!token) {
    return { authenticated: false };
  }

  try {
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return { authenticated: false };
    }

    // Check if token is not revoked (implement JWT blacklist if needed)
    const isRevoked = await checkTokenRevocation(payload.jti);
    if (isRevoked) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: payload
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false };
  }
}

/**
 * Tenant access validation
 */
async function checkTenantAccess(request: NextRequest, user: any) {
  // Extract tenant ID from URL or headers
  const pathname = request.nextUrl.pathname;
  const tenantMatch = pathname.match(/\/manager\/([^\/]+)/);
  const requestedTenant = tenantMatch?.[1];

  if (!requestedTenant) {
    return { allowed: true, tenantId: null };
  }

  // Super admin can access all tenants
  if (user.role === 'super_admin') {
    return { allowed: true, tenantId: requestedTenant };
  }

  // Check if user has access to the requested tenant
  if (!user.assignedCabinets.includes(requestedTenant)) {
    return {
      allowed: false,
      reason: 'Access denied: User not assigned to this cabinet',
      tenantId: requestedTenant
    };
  }

  return { allowed: true, tenantId: requestedTenant };
}

/**
 * Route-based authorization
 */
async function checkAuthorization(pathname: string, user: any) {
  // Admin routes require admin or super_admin role
  if (ADMIN_ROUTES.test(pathname)) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      return {
        allowed: false,
        reason: 'Insufficient privileges for admin access'
      };
    }
  }

  // Manager routes require manager or higher
  if (MANAGER_ROUTES.test(pathname)) {
    if (!['manager', 'admin', 'super_admin'].includes(user.role)) {
      return {
        allowed: false,
        reason: 'Insufficient privileges for manager access'
      };
    }
  }

  // API-specific authorizations
  if (API_ROUTES.test(pathname)) {
    return checkAPIAuthorization(pathname, user);
  }

  return { allowed: true };
}

/**
 * API-specific authorization rules
 */
async function checkAPIAuthorization(pathname: string, user: any) {
  const sensitiveEndpoints = [
    '/api/admin',
    '/api/system',
    '/api/analytics/export'
  ];

  if (sensitiveEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      return {
        allowed: false,
        reason: 'Administrative privileges required'
      };
    }
  }

  return { allowed: true };
}

/**
 * Security headers
 */
function addSecurityHeaders(response: NextResponse) {
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

/**
 * Response creators
 */
function createRateLimitResponse() {
  return NextResponse.json(
    {
      type: 'about:blank',
      title: 'Too Many Requests',
      detail: 'Rate limit exceeded. Please try again later.',
      status: 429
    },
    { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'application/problem+json'
      }
    }
  );
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function createAccessDeniedResponse(reason: string) {
  return NextResponse.json(
    {
      type: 'about:blank',
      title: 'Access Denied',
      detail: reason,
      status: 403
    },
    { 
      status: 403,
      headers: {
        'Content-Type': 'application/problem+json'
      }
    }
  );
}

function createForbiddenResponse(reason: string) {
  return NextResponse.json(
    {
      type: 'about:blank',
      title: 'Forbidden',
      detail: reason,
      status: 403
    },
    { 
      status: 403,
      headers: {
        'Content-Type': 'application/problem+json'
      }
    }
  );
}

function createInternalErrorResponse() {
  return NextResponse.json(
    {
      type: 'about:blank',
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred',
      status: 500
    },
    { 
      status: 500,
      headers: {
        'Content-Type': 'application/problem+json'
      }
    }
  );
}

/**
 * Utility functions
 */
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return (
    cfConnectingIP ||
    xRealIP ||
    xForwardedFor?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Placeholder functions - implement in their respective modules
async function verifyAccessToken(token: string) {
  // Import and use your JWT verification logic
  const { JWTManager } = await import('@/lib/auth/jwt');
  const jwtManager = JWTManager.getInstance();
  return jwtManager.verifyAccessToken(token);
}

async function checkTokenRevocation(jti?: string): Promise<boolean> {
  // Implement JWT blacklist checking if needed
  return false;
}

async function logAccess(request: NextRequest, user: any, ip: string, userAgent: string) {
  // Implement audit logging
  console.log(`Access: ${user.userId} from ${ip} to ${request.nextUrl.pathname}`);
}

async function logSecurityEvent(request: NextRequest, ip: string, event: string) {
  // Implement security event logging
  console.error(`Security event from ${ip}: ${event}`);
}

class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|static|images|css|js).*)',
  ],
};