'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Cabinet } from '@/lib/models/cabinet';
import { CabinetService } from '@/lib/services/cabinet-service';
import ManagerDashboard from '@/components/manager/ManagerDashboard';

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
      } catch (err) {
        console.error('Error loading cabinet:', err);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !cabinet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return <ManagerDashboard cabinet={cabinet} userId={userId} />;
}