import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patient-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetId = searchParams.get('cabinetId');

    if (!cabinetId) {
      return NextResponse.json({
        success: false,
        error: 'cabinetId is required'
      }, { status: 400 });
    }

    const patientService = PatientService.getInstance();
    const result = await patientService.getPatientStatistics(cabinetId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (_error) {
    console.error('Error fetching patient statistics:', _error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
