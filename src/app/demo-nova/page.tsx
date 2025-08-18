'use client';

import { CheckCircle, Settings, Phone, Calendar } from 'lucide-react';
import { CalendarView } from '@/components/rdv/CalendarView';
import { ChatRDV } from '@/components/rdv/ChatRDV';
import { PatientContext } from '@/components/rdv/PatientContext';
import { RDVLayout } from '@/components/rdv/RDVLayout';
import { ButtonMedical } from '@/components/ui/nova/ButtonMedical';

export default function DemoNovaPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      {/* Header de démonstration */}
      <header className="max-w-[1280px] mx-auto px-6 mb-8">
        <div className="bg-white rounded-medical-medium p-medical-card-padding shadow-medical-card mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            NOVA Medical Design System
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            Démonstration des nouveaux composants médicaux avec design tokens unifiés
          </p>
          
          {/* Démonstration des boutons */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Boutons Médicaux</h2>
              <div className="flex flex-wrap gap-4">
                <ButtonMedical variant="primary" size="md">
                  Primaire
                </ButtonMedical>
                <ButtonMedical variant="secondary" size="md">
                  Secondaire
                </ButtonMedical>
                <ButtonMedical variant="outline" size="md">
                  Contour
                </ButtonMedical>
                <ButtonMedical variant="ghost" size="md">
                  Fantôme
                </ButtonMedical>
                <ButtonMedical variant="success" size="md" leftIcon={<CheckCircle className="w-4 h-4" />}>
                  Succès
                </ButtonMedical>
                <ButtonMedical variant="warning" size="md" leftIcon={<Settings className="w-4 h-4" />}>
                  Attention
                </ButtonMedical>
                <ButtonMedical variant="emergency" size="md" leftIcon={<Phone className="w-4 h-4" />}>
                  Urgence
                </ButtonMedical>
                <ButtonMedical variant="trust" size="md" leftIcon={<Calendar className="w-4 h-4" />}>
                  Confiance
                </ButtonMedical>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Tailles des boutons</h2>
              <div className="flex flex-wrap items-end gap-4">
                <ButtonMedical variant="primary" size="sm">
                  Petit
                </ButtonMedical>
                <ButtonMedical variant="primary" size="md">
                  Moyen
                </ButtonMedical>
                <ButtonMedical variant="primary" size="lg">
                  Grand
                </ButtonMedical>
                <ButtonMedical variant="primary" size="xl">
                  Très grand (CTA)
                </ButtonMedical>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">États des boutons</h2>
              <div className="flex flex-wrap gap-4">
                <ButtonMedical variant="primary" size="md">
                  Normal
                </ButtonMedical>
                <ButtonMedical variant="primary" size="md" isLoading>
                  Chargement...
                </ButtonMedical>
                <ButtonMedical variant="primary" size="md" disabled>
                  Désactivé
                </ButtonMedical>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-medical-medium p-medical-card-padding shadow-medical-card">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
            Layout RDV à 3 zones
          </h2>
          <p className="text-neutral-600 mb-6">
            Architecture responsive avec chat sticky et navigation accessible
          </p>
        </div>
      </header>

      {/* Démonstration du layout RDV */}
      <RDVLayout
        leftPanel={
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Panneau contexte patient
            </h3>
            <PatientContext />
          </div>
        }
        centerPanel={
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Zone centrale - Calendrier
            </h3>
            <CalendarView />
          </div>
        }
        rightPanel={
          <div className="h-full">
            <div className="p-4 border-b border-neutral-200 bg-primary-50">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Chat Assistant IA
              </h3>
              <p className="text-sm text-primary-700">
                Chat sticky avec composant réutilisable
              </p>
            </div>
            <div className="flex-1">
              <ChatRDV />
            </div>
          </div>
        }
      />
      
      {/* Démonstration des couleurs design tokens */}
      <section className="max-w-[1280px] mx-auto px-6 mt-16">
        <div className="bg-white rounded-medical-medium p-medical-card-padding shadow-medical-card">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Palette de couleurs médicales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Couleurs primaires */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Primaire (Medical Blue)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded border"></div>
                  <span className="text-sm">primary-100</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 rounded border"></div>
                  <span className="text-sm">primary-600</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-700 rounded border"></div>
                  <span className="text-sm">primary-700</span>
                </div>
              </div>
            </div>

            {/* Couleurs de statut */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Statuts médicaux</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success-600 rounded border"></div>
                  <span className="text-sm">success-600</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning-600 rounded border"></div>
                  <span className="text-sm">warning-600</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-error-600 rounded border"></div>
                  <span className="text-sm">error-600</span>
                </div>
              </div>
            </div>

            {/* Couleurs d'urgence */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Urgences</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emergency-low rounded border"></div>
                  <span className="text-sm">emergency-low</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emergency-moderate rounded border"></div>
                  <span className="text-sm">emergency-moderate</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emergency-critical rounded border"></div>
                  <span className="text-sm">emergency-critical</span>
                </div>
              </div>
            </div>

            {/* Couleurs neutres */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Neutres</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded border"></div>
                  <span className="text-sm">neutral-100</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-500 rounded border"></div>
                  <span className="text-sm">neutral-500</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-900 rounded border"></div>
                  <span className="text-sm">neutral-900</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}