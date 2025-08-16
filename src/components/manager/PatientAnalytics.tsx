'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Activity, 
  PieChart, 
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PatientSearchService, PatientAnalytics as PatientAnalyticsData } from '@/lib/services/patient-search-service';

interface PatientAnalyticsProps {
  cabinetId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Helper function to get width class for progress bars
const getProgressWidthClass = (percentage: number): string => {
  const clampedPercentage = Math.min(Math.max(Math.round(percentage), 0), 100);

  // Use Tailwind width classes for common percentages
  const widthClasses: { [key: number]: string } = {
    0: 'w-0',
    5: 'w-[5%]',
    10: 'w-[10%]',
    15: 'w-[15%]',
    20: 'w-1/5',
    25: 'w-1/4',
    30: 'w-[30%]',
    33: 'w-1/3',
    35: 'w-[35%]',
    40: 'w-2/5',
    45: 'w-[45%]',
    50: 'w-1/2',
    55: 'w-[55%]',
    60: 'w-3/5',
    65: 'w-[65%]',
    66: 'w-2/3',
    70: 'w-[70%]',
    75: 'w-3/4',
    80: 'w-4/5',
    85: 'w-[85%]',
    90: 'w-[90%]',
    95: 'w-[95%]',
    100: 'w-full'
  };

  // Find the closest match or use arbitrary value
  const closest = Object.keys(widthClasses)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - clampedPercentage) < Math.abs(prev - clampedPercentage) ? curr : prev
    );

  return widthClasses[closest] || `w-[${clampedPercentage}%]`;
};

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
              {Math.abs(trend.value)}% ce mois
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

function ChartCard({ title, children, actions }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function PatientAnalytics({ cabinetId }: PatientAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PatientAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchService = PatientSearchService.getInstance();

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchService.getPatientAnalytics(cabinetId);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement des analyses');
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [cabinetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyses des Patients</h2>
          <p className="text-gray-500">Vue d&apos;ensemble des données patients du cabinet</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <button type="button" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={analytics.totalPatients}
          subtitle={`${analytics.activePatients} actifs`}
          icon={Users}
          color="blue"
        />
        
        <StatCard
          title="Nouveaux ce mois"
          value={analytics.newPatientsThisMonth}
          subtitle={`${analytics.newPatientsThisYear} cette année`}
          icon={TrendingUp}
          color="green"
        />
        
        <StatCard
          title="Âge moyen"
          value={`${analytics.averageAge} ans`}
          icon={Calendar}
          color="orange"
        />
        
        <StatCard
          title="Total visites"
          value={analytics.visitStatistics.totalVisits}
          subtitle={`${analytics.visitStatistics.averageVisits} par patient`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <ChartCard title="Répartition par âge">
          <div className="space-y-3">
            {Object.entries(analytics.ageDistribution).map(([range, count]) => {
              const percentage = analytics.totalPatients > 0 
                ? Math.round((count / analytics.totalPatients) * 100) 
                : 0;
              
              return (
                <div key={range} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{range} ans</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${getProgressWidthClass(percentage)}`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Gender Distribution */}
        <ChartCard title="Répartition par genre">
          <div className="space-y-3">
            {Object.entries(analytics.genderDistribution).map(([gender, count]) => {
              const percentage = analytics.totalPatients > 0 
                ? Math.round((count / analytics.totalPatients) * 100) 
                : 0;
              
              const genderLabels = {
                male: 'Hommes',
                female: 'Femmes',
                other: 'Autre',
                unspecified: 'Non spécifié'
              };
              
              const colors = {
                male: 'bg-blue-600',
                female: 'bg-pink-600',
                other: 'bg-purple-600',
                unspecified: 'bg-gray-600'
              };
              
              return (
                <div key={gender} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {genderLabels[gender as keyof typeof genderLabels]}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors[gender as keyof typeof colors]} ${getProgressWidthClass(percentage)}`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communication Preferences */}
        <ChartCard title="Préférences de communication">
          <div className="space-y-3">
            {Object.entries(analytics.communicationPreferences).map(([method, count]) => {
              const percentage = analytics.totalPatients > 0 
                ? Math.round((count / analytics.totalPatients) * 100) 
                : 0;
              
              const methodLabels = {
                email: 'Email',
                sms: 'SMS',
                phone: 'Téléphone'
              };
              
              const colors = {
                email: 'bg-blue-600',
                sms: 'bg-green-600',
                phone: 'bg-orange-600'
              };
              
              return (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {methodLabels[method as keyof typeof methodLabels]}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors[method as keyof typeof colors]} ${getProgressWidthClass(percentage)}`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Most Active Patients */}
        <ChartCard title="Patients les plus actifs">
          <div className="space-y-3">
            {analytics.visitStatistics.mostActivePatients.length > 0 ? (
              analytics.visitStatistics.mostActivePatients.map((patient, index) => (
                <div key={patient.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {patient.totalVisits} visites
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucune donnée de visite disponible
              </p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Medical Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Allergies */}
        <ChartCard title="Allergies les plus fréquentes">
          <div className="space-y-3">
            {analytics.medicalStatistics.commonAllergies.length > 0 ? (
              analytics.medicalStatistics.commonAllergies.slice(0, 5).map((allergy) => (
                <div key={allergy.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{allergy.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-red-600 h-2 rounded-full transition-all duration-300 ${getProgressWidthClass(Math.min((allergy.count / analytics.medicalStatistics.patientsWithAllergies) * 100, 100))}`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {allergy.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucune allergie enregistrée
              </p>
            )}
          </div>
        </ChartCard>

        {/* Medical Summary */}
        <ChartCard title="Résumé médical">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total entrées médicales</span>
              <span className="text-lg font-bold text-gray-900">
                {analytics.medicalStatistics.totalMedicalRecords}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Patients avec allergies</span>
              <span className="text-lg font-bold text-red-600">
                {analytics.medicalStatistics.patientsWithAllergies}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Patients avec médicaments</span>
              <span className="text-lg font-bold text-blue-600">
                {analytics.medicalStatistics.patientsWithMedications}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Patients sans visite</span>
              <span className="text-lg font-bold text-orange-600">
                {analytics.visitStatistics.patientsWithNoVisits}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
