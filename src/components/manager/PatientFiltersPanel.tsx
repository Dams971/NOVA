'use client';

import React, { useState } from 'react';
import { X, Calendar, Users, Filter } from 'lucide-react';
import { PatientFilters } from '@/lib/models/patient';

interface PatientFiltersPanelProps {
  filters: PatientFilters;
  onFiltersChange: (filters: Partial<PatientFilters>) => void;
  onClose: () => void;
}

export default function PatientFiltersPanel({ filters, onFiltersChange, onClose }: PatientFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<PatientFilters>(filters);

  const handleFilterChange = (key: keyof PatientFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const resetFilters = () => {
    const resetFilters: PatientFilters = {
      cabinetId: filters.cabinetId,
      search: '',
      isActive: true,
      limit: 20,
      offset: 0
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtres avancés</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          title="Fermer"
          aria-label="Fermer le panneau de filtres"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            id="status"
            value={localFilters.isActive === undefined ? 'all' : localFilters.isActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('isActive', value === 'all' ? undefined : value === 'active');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les patients</option>
            <option value="active">Patients actifs</option>
            <option value="inactive">Patients inactifs</option>
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label htmlFor="ageMin" className="block text-sm font-medium text-gray-700 mb-2">
            Âge minimum
          </label>
          <input
            id="ageMin"
            type="number"
            value={localFilters.ageMin || ''}
            onChange={(e) => handleFilterChange('ageMin', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 18"
            min="0"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="ageMax" className="block text-sm font-medium text-gray-700 mb-2">
            Âge maximum
          </label>
          <input
            id="ageMax"
            type="number"
            value={localFilters.ageMax || ''}
            onChange={(e) => handleFilterChange('ageMax', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 65"
            min="0"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Last Visit Date Range */}
        <div>
          <label htmlFor="lastVisitFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Dernière visite depuis
          </label>
          <input
            id="lastVisitFrom"
            type="date"
            value={localFilters.lastVisitFrom ? localFilters.lastVisitFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => handleFilterChange('lastVisitFrom', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lastVisitTo" className="block text-sm font-medium text-gray-700 mb-2">
            Dernière visite jusqu'à
          </label>
          <input
            id="lastVisitTo"
            type="date"
            value={localFilters.lastVisitTo ? localFilters.lastVisitTo.toISOString().split('T')[0] : ''}
            onChange={(e) => handleFilterChange('lastVisitTo', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Results per page */}
        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
            Résultats par page
          </label>
          <select
            id="limit"
            value={localFilters.limit || 20}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Filtres rapides</h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const newFilters = {
                ...localFilters,
                lastVisitFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                lastVisitTo: undefined
              };
              setLocalFilters(newFilters);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Vus ce mois
          </button>

          <button
            type="button"
            onClick={() => {
              const newFilters = {
                ...localFilters,
                lastVisitTo: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                lastVisitFrom: undefined
              };
              setLocalFilters(newFilters);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Users className="h-4 w-4 mr-1" />
            À recontacter
          </button>

          <button
            type="button"
            onClick={() => {
              const newFilters = {
                ...localFilters,
                ageMin: 65,
                ageMax: undefined
              };
              setLocalFilters(newFilters);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Seniors (65+)
          </button>

          <button
            type="button"
            onClick={() => {
              const newFilters = {
                ...localFilters,
                ageMin: undefined,
                ageMax: 18
              };
              setLocalFilters(newFilters);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Mineurs (-18)
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={resetFilters}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Réinitialiser
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Appliquer les filtres
        </button>
      </div>
    </div>
  );
}
