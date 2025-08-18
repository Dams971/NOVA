import { NextResponse } from 'next/server';
import { AuthService, RegisterUserRequest, AuthenticationError } from '@/lib/auth/auth-service';
import { RBACService } from '@/lib/auth/rbac';
import { withPermission, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGetUsers(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    // This endpoint requires user read permission
    // The withPermission middleware already checked this

    const _authService = AuthService.getInstance();
    const _rbacService = RBACService.getInstance();

    // Get query parameters for filtering
    const url = new URL(request.url);
    const _cabinetId = url.searchParams.get('cabinetId');
    const _role = url.searchParams.get('role');

    // For non-super-admin users, filter based on their accessible cabinets
    const userRole = request.auth!.user.role;
    const assignedCabinets = request.auth!.user.assignedCabinets;

    let accessibleCabinets: string[] = [];
    if (userRole === 'super_admin' || userRole === 'admin') {
      // These roles can see all cabinets - we'd need to fetch from DB
      // For now, we'll use the assigned cabinets as a placeholder
      accessibleCabinets = assignedCabinets;
    } else {
      accessibleCabinets = assignedCabinets;
    }

    // TODO: Implement actual user fetching from database
    // This is a placeholder response
    const users = [
      {
        id: 'user-1',
        email: 'manager@example.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        isActive: true,
        assignedCabinets: ['cabinet-1'],
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'staff@example.com',
        firstName: 'Jane',
        lastName: 'Staff',
        role: 'staff',
        isActive: true,
        assignedCabinets: ['cabinet-1'],
        createdAt: new Date(),
      },
    ];

    // Filter users based on access permissions
    const filteredUsers = users.filter(user => {
      // Super admin can see all users
      if (userRole === 'super_admin') {
        return true;
      }

      // Admin can see users in accessible cabinets
      if (userRole === 'admin') {
        return user.assignedCabinets.some(cabinet => accessibleCabinets.includes(cabinet));
      }

      // Manager can only see staff in their cabinets
      if (userRole === 'manager') {
        return user.role === 'staff' && 
               user.assignedCabinets.some(cabinet => accessibleCabinets.includes(cabinet));
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      total: filteredUsers.length,
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function handleCreateUser(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body: RegisterUserRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, role', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const rbacService = RBACService.getInstance();
    const currentUserRole = request.auth!.user.role;

    // Check if current user can assign the requested role
    const assignableRoles = rbacService.getAssignableRoles(currentUserRole);
    if (!assignableRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Cannot assign this role', code: 'ROLE_ASSIGNMENT_DENIED' },
        { status: 403 }
      );
    }

    // For non-super-admin users, restrict cabinet assignments
    if (currentUserRole !== 'super_admin' && body.assignedCabinets) {
      const userAssignedCabinets = request.auth!.user.assignedCabinets;
      const invalidCabinets = body.assignedCabinets.filter(
        cabinet => !userAssignedCabinets.includes(cabinet)
      );

      if (invalidCabinets.length > 0) {
        return NextResponse.json(
          { error: 'Cannot assign cabinets you do not have access to', code: 'CABINET_ASSIGNMENT_DENIED' },
          { status: 403 }
        );
      }
    }

    const authService = AuthService.getInstance();
    const user = await authService.registerUser(body);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        assignedCabinets: user.assignedCabinets,
        createdAt: user.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Apply different middleware based on HTTP method
export const GET = withCORS(withPermission('user', 'read')(handleGetUsers));
export const POST = withCORS(withPermission('user', 'create')(handleCreateUser));