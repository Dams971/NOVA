'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Cabinet } from '@/lib/models/cabinet';
import { CabinetService } from '@/lib/services/cabinet-service';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';

/**
 * Manager Dashboard Page
 * Features:
 * - Accessible loading states
 * - Comprehensive error handling
 * - ARIA landmarks
 * - Screen reader support
 * - Keyboard navigation
 */
export default function ManagerDashboardPage() {
  const params = useParams();
  const cabinetId = params.cabinetId as string;
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in real implementation, this would come from authentication
  const userId = 'manager-user-1';

  useEffect(() => {
    const loadCabinet = async () => {
      try {
        const cabinetService = new CabinetService();
        const result = await cabinetService.getCabinetById(cabinetId);
        
        if (result.success && result.data) {
          setCabinet(result.data);
        } else {
          setError(result.error || 'Cabinet not found');
        }
      } catch (_err) {
        console.error('Error loading cabinet:', _err);
        setError('Failed to load cabinet');
      } finally {
        setLoading(false);
      }
    };

    if (cabinetId) {
      loadCabinet();
    }
  }, [cabinetId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !cabinet) {
    return (
      <div className="min-h-screen bg-medical-gray-50 flex items-center justify-center" role="alert">
        <div className="text-center max-w-md medical-card p-8">
          <div className="w-16 h-16 bg-medical-red-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
            <span className="text-medical-red-600 text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-medical-gray-900 mb-2">Erreur de chargement</h1>
          <p className="text-medical-gray-600 mb-4">{error || 'Cabinet introuvable'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-medical-blue-600 text-white rounded-medical-medium hover:bg-medical-blue-700 focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:ring-offset-2 transition-colors touch-target-medical"
            aria-label="Recharger la page pour réessayer"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return <ManagerDashboard cabinet={cabinet} userId={userId} />;
}