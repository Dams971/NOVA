import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RDVLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

export function RDVLayout({ leftPanel, centerPanel, rightPanel, className }: RDVLayoutProps) {
  return (
    <div className={cn(
      "max-w-[1280px] mx-auto px-6",
      "grid gap-6",
      "lg:grid-cols-[320px_1fr_400px]", // Desktop: 3 colonnes
      "md:grid-cols-[1fr_400px]", // Tablet: 2 colonnes
      "grid-cols-1", // Mobile: 1 colonne
      className
    )}>
      {/* Panneau gauche - Contexte Patient */}
      <aside className="lg:block md:hidden space-y-4">
        <div className="bg-white rounded-medical-medium p-medical-card-padding shadow-medical-card">
          {leftPanel}
        </div>
      </aside>

      {/* Zone centrale - Sélection créneau */}
      <main className="space-y-6">
        <div className="bg-white rounded-medical-medium p-medical-card-padding shadow-medical-card">
          {centerPanel}
        </div>
      </main>

      {/* Panneau droit - Chat sticky */}
      <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
        <div className="bg-white rounded-medical-medium shadow-medical-card h-full flex flex-col">
          {rightPanel}
        </div>
      </aside>
    </div>
  );
}