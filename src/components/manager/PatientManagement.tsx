'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  Settings,
  MoreVertical
} from 'lucide-react';
import { Patient, PatientFilters, PatientSearchResult } from '@/lib/models/patient';
// PatientService is used via API calls and hooks
import PatientList from './PatientList';
import PatientForm from './PatientForm';
import PatientDetail from './PatientDetail';
import PatientFiltersPanel from './PatientFiltersPanel';

interface PatientManagementProps {
  cabinetId: string;
}

type ViewMode = 'list' | 'detail' | 'form';

export default function PatientManagement({ cabinetId }: PatientManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
    offset: 0,
    limit: 20
  });

  const [filters, setFilters] = useState<PatientFilters>({
    cabinetId,
    search: '',
    isActive: true,
    limit: 20,
    offset: 0
  });

  const patientService = PatientService.getInstance();

  const loadPatients = useCallback(async (newFilters?: Partial<PatientFilters>) => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = {
        ...filters,
        ...newFilters,
        cabinetId
      };

      const result = await patientService.getPatients(searchFilters);
      
      if (result.success && result.data) {
        setPatients(result.data.patients);
        setPagination({
          total: result.data.total,
          hasMore: result.data.hasMore,
          offset: searchFilters.offset || 0,
          limit: searchFilters.limit || 20
        });
      } else {
        setError(result.error || 'Erreur lors du chargement des patients');
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [filters, cabinetId, patientService]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    const newFilters = { ...filters, search: term, offset: 0 };
    setFilters(newFilters);
    loadPatients(newFilters);
  }, [filters, loadPatients]);

  const handleFiltersChange = useCallback((newFilters: Partial<PatientFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    loadPatients(updatedFilters);
  }, [filters, loadPatients]);

  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('detail');
  }, []);

  const handlePatientEdit = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setShowForm(true);
  }, []);

  const handlePatientCreate = useCallback(() => {
    setSelectedPatient(null);
    setShowForm(true);
  }, []);

  const handlePatientSave = useCallback(async (patient: Patient) => {
    setShowForm(false);
    setSelectedPatient(patient);
    await loadPatients(); // Refresh the list
  }, [loadPatients]);

  const handlePatientDelete = useCallback(async (patientId: string) => {
    try {
      const result = await patientService.deletePatient(patientId);
      if (result.success) {
        await loadPatients(); // Refresh the list
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(null);
          setViewMode('list');
        }
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur inattendue lors de la suppression');
    }
  }, [patientService, loadPatients, selectedPatient]);

  const handleLoadMore = useCallback(() => {
    const newOffset = pagination.offset + pagination.limit;
    const newFilters = { ...filters, offset: newOffset };
    setFilters(newFilters);
    
    // For load more, we append to existing patients
    patientService.getPatients(newFilters).then(result => {
      if (result.success && result.data) {
        setPatients(prev => [...prev, ...result.data!.patients]);
        setPagination({
          total: result.data.total,
          hasMore: result.data.hasMore,
          offset: newOffset,
          limit: pagination.limit
        });
      }
    });
  }, [filters, pagination, patientService]);

  const handleExportPatients = useCallback(() => {
    // This would implement CSV/Excel export functionality
    console.log('Exporting patients...');
  }, []);

  const getPatientStats = () => {
    const activeCount = patients.filter(p => p.isActive).length;
    const inactiveCount = patients.length - activeCount;
    const newThisMonth = patients.filter(p => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return p.createdAt >= thisMonth;
    }).length;

    return { activeCount, inactiveCount, newThisMonth, total: pagination.total };
  };

  const stats = getPatientStats();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Patients</h1>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activeCount}</div>
                <div className="text-xs text-gray-500">Actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.newThisMonth}</div>
                <div className="text-xs text-gray-500">Ce mois</div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPatients}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showFilters 
                  ? 'border-blue-300 text-blue-700 bg-blue-50' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </button>

            <button
              onClick={handlePatientCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Patient
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rechercher par nom, email, téléphone..."
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <PatientFiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Patient List */}
        <div className={`${viewMode === 'list' ? 'w-full' : 'w-1/2'} border-r border-gray-200`}>
          <PatientList
            patients={patients}
            loading={loading}
            error={error}
            hasMore={pagination.hasMore}
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            onPatientEdit={handlePatientEdit}
            onPatientDelete={handlePatientDelete}
            onLoadMore={handleLoadMore}
          />
        </div>

        {/* Patient Detail/Form */}
        {viewMode === 'detail' && selectedPatient && (
          <div className="w-1/2">
            <PatientDetail
              patient={selectedPatient}
              onEdit={() => handlePatientEdit(selectedPatient)}
              onClose={() => {
                setViewMode('list');
                setSelectedPatient(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Patient Form Modal */}
      {showForm && (
        <PatientForm
          patient={selectedPatient}
          cabinetId={cabinetId}
          onSave={handlePatientSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
