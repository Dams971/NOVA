import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
import { withAuth } from '@/lib/middleware/auth';

async function handleGetCabinets(_request: NextRequest) {
  try {
    const cabinets = await db.getAllCabinets();
    
    // Add additional statistics for each cabinet
    const cabinetsWithStats = await Promise.all(
      cabinets.map(async (cabinet) => {
        const patients = await db.findPatientsByCabinet(cabinet.id);
        const services = await db.findServicesByCabinet(cabinet.id);
        
        return {
          ...cabinet,
          stats: {
            totalPatients: patients.length,
            totalServices: services.length,
            activeStatus: cabinet.is_active ? 'Active' : 'Inactive'
          }
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: cabinetsWithStats
    });
  } catch (error) {
    console.error('Get cabinets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cabinets' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetCabinets, ['super_admin', 'admin']);