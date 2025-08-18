import { User, Calendar, Clock } from 'lucide-react';

export function PatientContext() {
  return (
    <div className="space-y-6">
      {/* Informations patient */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" aria-hidden="true" />
          Informations patient
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-neutral-50 rounded-medical-small">
            <label className="text-sm font-medium text-neutral-700">Nom complet</label>
            <p className="text-neutral-900">Ahmed Boudiaf</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-medical-small">
            <label className="text-sm font-medium text-neutral-700">Téléphone</label>
            <p className="text-neutral-900">+213 555 123 456</p>
          </div>
        </div>
      </div>

      {/* Type de consultation */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" aria-hidden="true" />
          Type de consultation
        </h3>
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-medical-small">
          <h4 className="font-medium text-primary-900">Consultation générale</h4>
          <p className="text-sm text-primary-700 mt-1">Examen complet et diagnostic</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span className="text-sm text-primary-700">30 minutes</span>
          </div>
        </div>
      </div>

      {/* Derniers rendez-vous */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Historique récent</h3>
        <div className="space-y-2">
          <div className="p-3 bg-neutral-50 rounded-medical-small text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-neutral-900">Consultation</p>
                <p className="text-neutral-600">15 mars 2024</p>
              </div>
              <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">
                Terminé
              </span>
            </div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-medical-small text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-neutral-900">Nettoyage</p>
                <p className="text-neutral-600">20 février 2024</p>
              </div>
              <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">
                Terminé
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations pratiques */}
      <div className="p-4 bg-warning-50 border border-warning-200 rounded-medical-small">
        <h4 className="font-medium text-warning-900 mb-2">À prévoir</h4>
        <ul className="text-sm text-warning-800 space-y-1">
          <li>• Carte d&apos;identité</li>
          <li>• Carte vitale</li>
          <li>• Ordonnances récentes</li>
        </ul>
      </div>
    </div>
  );
}