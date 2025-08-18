import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/unified-connection';
import { withAuth } from '@/lib/middleware/auth';

async function handleGetStats(request: NextRequest) {
  try {
    // Get overall statistics
    const stats = await db.getStats();
    
    // Get recent appointments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { searchParams } = new URL(request.url);
    const cabinetId = searchParams.get('cabinetId');
    
    let recentAppointments = [];
    let upcomingAppointments = [];
    
    if (cabinetId) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      recentAppointments = await db.findAppointmentsByCabinet(cabinetId, sevenDaysAgo, now);
      upcomingAppointments = await db.findAppointmentsByCabinet(cabinetId, now, thirtyDaysFromNow);
    }
    
    // Calculate additional metrics
    const metrics = {
      ...stats,
      recentAppointments: recentAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      averageAppointmentsPerDay: Math.round(recentAppointments.length / 7 * 10) / 10,
      occupancyRate: calculateOccupancyRate(upcomingAppointments),
      lastUpdated: new Date()
    };
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

function calculateOccupancyRate(appointments: unknown[]): number {
  if (appointments.length === 0) return 0;
  
  // Assuming 8 hours per day, 30 minutes per slot = 16 slots per day
  const totalSlots = 16 * 30; // for 30 days
  const bookedSlots = appointments.length;
  
  return Math.round((bookedSlots / totalSlots) * 100);
}

export const GET = withAuth(handleGetStats);