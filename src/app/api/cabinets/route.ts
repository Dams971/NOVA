import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { withPermission, withCORS, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGetCabinets(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const rbacService = RBACService.getInstance();
    const userRole = request.auth!.user.role;
    const assignedCabinets = request.auth!.user.assignedCabinets;

    // Mock cabinet data - in real implementation, this would come from database
    const allCabinets = [
      {
        id: 'cabinet-1',
        name: 'Cabinet Dentaire Paris Centre',
        slug: 'paris-centre',
        address: {
          street: '123 Rue de Rivoli',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        phone: '+33 1 42 60 30 30',
        email: 'contact@cabinet-paris-centre.fr',
        timezone: 'Europe/Paris',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-07-15'),
      },
      {
        id: 'cabinet-2',
        name: 'Cabinet Dentaire Lyon',
        slug: 'lyon',
        address: {
          street: '45 Rue de la République',
          city: 'Lyon',
          postalCode: '69002',
          country: 'France',
        },
        phone: '+33 4 78 42 15 30',
        email: 'contact@cabinet-lyon.fr',
        timezone: 'Europe/Paris',
        status: 'active',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-07-10'),
      },
      {
        id: 'cabinet-3',
        name: 'Cabinet Dentaire Marseille',
        slug: 'marseille',
        address: {
          street: '78 La Canebière',
          city: 'Marseille',
          postalCode: '13001',
          country: 'France',
        },
        phone: '+33 4 91 54 20 10',
        email: 'contact@cabinet-marseille.fr',
        timezone: 'Europe/Paris',
        status: 'deploying',
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-19'),
      },
    ];

    // Get accessible cabinets based on user role
    const allCabinetIds = allCabinets.map(c => c.id);
    const accessibleCabinetIds = rbacService.getAccessibleCabinets(
      userRole,
      assignedCabinets,
      allCabinetIds
    );

    // Filter cabinets based on access
    const accessibleCabinets = allCabinets.filter(cabinet =>
      accessibleCabinetIds.includes(cabinet.id)
    );

    return NextResponse.json({
      success: true,
      cabinets: accessibleCabinets,
      total: accessibleCabinets.length,
      userRole,
      accessLevel: userRole === 'super_admin' || userRole === 'admin' ? 'all' : 'assigned',
    });

  } catch (error) {
    console.error('Get cabinets error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function handleCreateCabinet(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, email', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Only super_admin can create cabinets
    const userRole = request.auth!.user.role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super administrators can create cabinets', code: 'CABINET_CREATE_DENIED' },
        { status: 403 }
      );
    }

    // Mock cabinet creation - in real implementation, this would create in database
    const newCabinet = {
      id: `cabinet-${Date.now()}`,
      name: body.name,
      slug: body.slug,
      address: body.address || {},
      phone: body.phone || '',
      email: body.email,
      timezone: body.timezone || 'Europe/Paris',
      status: 'deploying',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: 'Cabinet created successfully',
      cabinet: newCabinet,
    }, { status: 201 });

  } catch (error) {
    console.error('Create cabinet error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const GET = withCORS(withPermission('cabinet', 'read')(handleGetCabinets));
export const POST = withCORS(withPermission('cabinet', 'create')(handleCreateCabinet));