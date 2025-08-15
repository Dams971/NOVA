'use client';

import React from 'react';
import { CabinetHealthStatus } from '@/lib/services/cabinet-health-service';

interface CabinetHealthCardProps {
  healthStatus: CabinetHealthStatus;
  onRefresh?: (cabinetId: string) => void;
  showDetails?: boolean;
}

export default function CabinetHealthCard({ 
  healthStatus, 
  onRefresh,
  showDetails = false 
}: CabinetHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'degraded': return '⚠';
      case 'unhealthy': return '✗';
      default: return '?';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${getStatusColor(healthStatus.status).split(' ')[2]} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getStatusColor(healthStatus.status)}`}>
            {getStatusIcon(healthStatus.status)}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{healthStatus.cabinetName}</h3>
            <p className="text-sm text-gray-500">
              Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {healthStatus.uptime.toFixed(1)}% uptime
            </div>
            <div className="text-xs text-gray-500">
              {healthStatus.responseTime}ms response
            </div>
          </div>
          
          {onRefresh && (
            <button
              onClick={() => onRefresh(healthStatus.cabinetId)}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              title="Refresh health check"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* Health Checks */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Health Checks</h4>
            <div className="grid grid-cols-2 gap-2">
              {healthStatus.checks.map((check) => (
                <div key={check.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      check.status === 'healthy' ? 'bg-green-500' :
                      check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {check.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{check.responseTime}ms</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {healthStatus.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2">Issues</h4>
              <ul className="space-y-1">
                {healthStatus.issues.map((issue, index) => (
                  <li key={index} className="text-xs text-red-600 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}