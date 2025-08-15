'use client';

import React, { useState, useEffect } from 'react';
import { Cabinet } from '@/lib/models/cabinet';
import CabinetOverviewGrid from './CabinetOverviewGrid';
import CabinetDetailView from './CabinetDetailView';
import ComparativeAnalyticsDashboard from './ComparativeAnalyticsDashboard';

type DashboardView = 'overview' | 'detail' | 'comparative';

interface AdminDashboardProps {
  initialView?: DashboardView;
}

export default function AdminDashboard({ initialView = 'overview' }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCabinets = async () => {
      try {
        const response = await fetch('/api/admin/cabinets');
        if (response.ok) {
          const data = await response.json();
          setCabinets(data.data || []);
        }
      } catch (_error) {
        console.error('Failed to fetch cabinets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCabinets();
  }, []);

  const handleCabinetSelect = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet);
    setCurrentView('detail');
  };

  const handleBackToOverview = () => {
    setSelectedCabinet(null);
    setCurrentView('overview');
  };

  const handleViewComparative = () => {
    setCurrentView('comparative');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setCurrentView('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentView === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cabinet Overview
            </button>
            <button
              type="button"
              onClick={handleViewComparative}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentView === 'comparative'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Comparative Analytics
            </button>
          </nav>
        </div>

        {/* Content */}
        {currentView === 'overview' && (
          <CabinetOverviewGrid
            onCabinetDetail={handleCabinetSelect}
            onCabinetSelect={handleCabinetSelect}
          />
        )}

        {currentView === 'detail' && selectedCabinet && (
          <CabinetDetailView
            cabinet={selectedCabinet}
            onBack={handleBackToOverview}
          />
        )}

        {currentView === 'comparative' && (
          <ComparativeAnalyticsDashboard
            cabinets={cabinets}
            onCabinetSelect={handleCabinetSelect}
          />
        )}
      </div>
    </div>
  );
}