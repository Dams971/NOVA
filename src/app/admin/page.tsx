'use client';

import React, { useState } from 'react';
import CabinetOverviewGrid from '@/components/admin/CabinetOverviewGrid';
import CabinetDetailView from '@/components/admin/CabinetDetailView';
import { Cabinet } from '@/lib/models/cabinet';

export default function AdminPage() {
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  const handleCabinetDetail = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet);
    setView('detail');
  };

  const handleBackToOverview = () => {
    setSelectedCabinet(null);
    setView('overview');
  };

  const handleCabinetSettings = (cabinet: Cabinet) => {
    // TODO: Implement cabinet settings modal/page
    console.log('Open settings for cabinet:', cabinet.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {view === 'overview' && (
          <CabinetOverviewGrid 
            onCabinetDetail={handleCabinetDetail}
            onCabinetSettings={handleCabinetSettings}
            refreshInterval={30000}
          />
        )}
        
        {view === 'detail' && selectedCabinet && (
          <CabinetDetailView 
            cabinet={selectedCabinet}
            onBack={handleBackToOverview}
          />
        )}
      </div>
    </div>
  );
}