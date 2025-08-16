# Stratégie de Migration - NOVA RDV

## Vue d'ensemble

Cette stratégie définit l'approche systématique pour migrer NOVA RDV d'un codebase avec 65+ types `any`, 25+ types `unknown` mal gérés, et violations ESLint multiples vers un système type-safe robuste.

## Analyse de l'État Actuel

### 1. Audit du Code Existant

```bash
# Commandes d'audit automatique
npm run audit:types        # Détecte tous les types any/unknown
npm run audit:eslint       # Liste toutes les violations ESLint
npm run audit:coverage     # Vérifie la couverture de tests
npm run audit:complexity   # Analyse la complexité cyclomatique
```

### 2. Métriques de Base

| Métrique | État Actuel | Objectif |
|----------|-------------|----------|
| Types `any` | 65+ | 0 |
| Types `unknown` mal gérés | 25+ | 0 |
| Violations ESLint | ~150 | 0 |
| Couverture de tests | ~70% | 95% |
| Build time | ~45s | <30s |

### 3. Risques Identifiés

- **High Risk**: Composants React sans error boundaries
- **Medium Risk**: API routes sans validation
- **Low Risk**: Types any dans les tests

## Plan de Migration - 4 Phases

### Phase 1: Fondations Type-Safe (Semaine 1)

#### Objectifs
- Créer le système de types de base
- Implémenter les schémas Zod
- Établir le gestionnaire d'erreurs global

#### Tâches Détaillées

**Jour 1-2: Types de Base**
```typescript
// 1. Créer src/types/core/
- api.ts          # Types API génériques
- common.ts       # Types communs (UUID, Email, etc.)
- errors.ts       # Types d'erreur

// 2. Créer src/types/validation/
- schemas.ts      # Schémas Zod de base
- api.ts          # Validation API
- forms.ts        # Validation formulaires
```

**Jour 3-4: Gestionnaire d'Erreurs**
```typescript
// 1. Implémenter src/lib/errors/
- error-manager.ts    # Gestionnaire principal
- base-errors.ts      # Classes d'erreur de base
- normalizer.ts       # Normalisation d'erreurs

// 2. Créer src/components/error-boundary/
- GlobalErrorBoundary.tsx  # Error boundary global
- ErrorFallback.tsx        # UI de fallback
```

**Jour 5: Hooks et Utilitaires**
```typescript
// 1. Créer src/hooks/
- useErrorHandler.ts   # Hook de gestion d'erreur
- useValidation.ts     # Hook de validation

// 2. Tests unitaires
- Tester tous les nouveaux composants
- Couverture 95%+ pour les nouveaux modules
```

#### Critères de Validation Phase 1
- [ ] Tous les types de base créés et testés
- [ ] Gestionnaire d'erreurs fonctionnel
- [ ] Error boundary implémenté
- [ ] 95%+ couverture sur nouveau code
- [ ] 0 violation ESLint sur nouveau code

### Phase 2: Migration des Entités (Semaine 2)

#### Objectifs
- Remplacer tous les types `any` dans les entités métier
- Implémenter la validation Zod complète
- Migrer les hooks principaux

#### Tâches par Entité

**Patient (Jour 1-2)**
```typescript
// Avant:
interface Patient {
  id: string;
  data: any;
  contact: any;
}

// Après:
interface Patient extends BaseEntity {
  firstName: string;
  lastName: string;
  email: Email;
  phone: PhoneNumber;
  // ... types stricts
}
```

**Rendez-vous (Jour 2-3)**
```typescript
// Migration src/types/entities/appointment.ts
// Migration src/hooks/useAppointments.ts
// Migration src/components/manager/AppointmentForm.tsx
```

**Cabinet (Jour 3-4)**
```typescript
// Migration src/types/entities/cabinet.ts
// Migration src/services/cabinet.service.ts
// Migration composants admin
```

**Tests et Validation (Jour 5)**
```typescript
// Créer tests de validation pour chaque entité
// Vérifier la compatibilité avec l'existant
// Tests d'intégration
```

#### Stratégie de Migration Progressive

```typescript
// 1. Créer les nouveaux types
export interface PatientV2 extends BaseEntity {
  // Types stricts
}

// 2. Adapter les services existants
export class PatientService {
  // Méthodes avec types legacy
  async getLegacyPatient(id: string): Promise<any> {
    // Existant
  }
  
  // Nouvelles méthodes type-safe
  async getPatient(id: string): Promise<Patient> {
    const legacy = await this.getLegacyPatient(id);
    return transformLegacyPatient(legacy);
  }
}

// 3. Migration graduelle des composants
```

#### Critères de Validation Phase 2
- [ ] Toutes les entités ont des types stricts
- [ ] Schémas Zod pour toutes les entités
- [ ] Services avec validation Zod
- [ ] Tests de régression passés
- [ ] 0 nouveau type `any`

### Phase 3: APIs et Composants (Semaine 3)

#### Objectifs
- Migrer toutes les API routes
- Corriger les violations ESLint
- Implémenter la validation d'entrée complète

#### API Routes (Jour 1-3)

```typescript
// Pattern de migration pour chaque route
// Avant:
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Pas de validation
  const result = await doSomething(body);
  return NextResponse.json(result);
}

// Après:
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  
  const validData = validate(CreatePatientSchema, body, {
    endpoint: '/api/patients',
    method: 'POST'
  });
  
  if (!validData) {
    throw new ValidationError('Invalid input data');
  }
  
  const result = await doSomething(validData);
  return NextResponse.json({
    success: true,
    data: result
  });
});
```

**Routes à Migrer (Priorité)**
1. `/api/patients/*` - Gestion patients
2. `/api/appointments/*` - Gestion RDV
3. `/api/auth/*` - Authentication
4. `/api/cabinets/*` - Gestion cabinets
5. `/api/chat/*` - Chat IA

#### Composants React (Jour 3-5)

**Stratégie de Migration**
```typescript
// 1. Identifier les composants avec types any
npm run audit:components

// 2. Migrer par ordre de criticité
// - Formulaires (validation critique)
// - Listes (performance)
// - Modales (UX)
// - Dashboard (monitoring)

// 3. Pattern de migration
// Avant:
const PatientForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  // ...
}

// Après:
const PatientForm = ({ onSubmit }: { onSubmit: (data: CreatePatientRequest) => void }) => {
  const { validate } = useValidation();
  const { handleError } = useErrorHandler({ component: 'PatientForm' });
  
  const handleSubmit = (formData: unknown) => {
    const validData = validate(CreatePatientSchema, formData);
    if (validData) {
      onSubmit(validData);
    }
  };
}
```

#### Corrections ESLint (Jour 4-5)

**Violations par Catégorie**
```typescript
// 1. @typescript-eslint/no-explicit-any
// Remplacer par types stricts

// 2. react-hooks/exhaustive-deps
// Ajouter les dépendances manquantes

// 3. @typescript-eslint/no-unused-vars
// Nettoyer le code mort

// 4. react/no-unescaped-entities
// Échapper les entités HTML

// Script de correction automatique
npm run lint:fix:auto
npm run lint:fix:manual  # Corrections manuelles restantes
```

#### Critères de Validation Phase 3
- [ ] Toutes les API routes validées
- [ ] 0 violation ESLint bloquante
- [ ] Composants principaux migrés
- [ ] Tests E2E passés
- [ ] Performance maintenue

### Phase 4: Finalisation et Optimisation (Semaine 4)

#### Objectifs
- Corriger les derniers types `unknown`
- Optimiser les performances
- Documentation complète
- Monitoring en production

#### Services Externes (Jour 1-2)

```typescript
// Types pour APIs externes
// src/types/external/

// 1. Supabase
export interface SupabaseUser {
  id: string;
  email: string;
  // Types stricts basés sur la doc Supabase
}

// 2. WebSocket
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

// 3. Email
export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
}
```

#### Performance et Build (Jour 2-3)

```typescript
// 1. Optimisation des imports
// Avant:
import * as utils from '@/lib/utils';

// Après:
import { specific } from '@/lib/utils/specific';

// 2. Types générés automatiquement
// Générer types DB à partir du schéma
npm run generate:types

// 3. Bundle analysis
npm run analyze:bundle
```

#### Documentation (Jour 3-4)

```markdown
# Documentation à créer/mettre à jour

## 1. Guide de Développement
- Standards TypeScript
- Patterns de validation
- Gestion d'erreurs

## 2. Documentation API
- Schémas OpenAPI mis à jour
- Exemples d'usage
- Guide d'intégration

## 3. Guide de Migration
- Pour les nouveaux développeurs
- Patterns recommandés
- Pièges à éviter
```

#### Monitoring Production (Jour 4-5)

```typescript
// 1. Métriques de qualité
interface QualityMetrics {
  typeErrors: number;
  buildTime: number;
  bundleSize: number;
  testCoverage: number;
}

// 2. Alertes automatiques
// Slack/email si régression
// Dashboard temps réel

// 3. Reporting
// Rapport hebdomadaire de qualité
// Tendances et amélirations
```

#### Critères de Validation Phase 4
- [ ] 0 type `any` non justifié
- [ ] 0 type `unknown` mal géré
- [ ] 0 violation ESLint
- [ ] Build time < 30s
- [ ] Tests coverage > 95%
- [ ] Documentation complète

## Outils et Scripts

### 1. Scripts d'Audit

```bash
# package.json
{
  "scripts": {
    "audit:types": "npx tsc --noEmit --strict",
    "audit:any": "grep -r ': any\\|: any\\[\\]' src/ || true",
    "audit:unknown": "grep -r ': unknown' src/ || true", 
    "audit:eslint": "npx eslint src/ --format=table",
    "audit:coverage": "npx vitest run --coverage",
    "audit:complexity": "npx madge --circular --warning src/",
    "audit:bundle": "npx next build && npx @next/bundle-analyzer",
    "audit:all": "npm run audit:types && npm run audit:eslint && npm run audit:coverage"
  }
}
```

### 2. Git Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Vérifier les types
npm run type-check

# Vérifier ESLint sur les fichiers stagés
npx lint-staged

# Vérifier qu'aucun nouveau 'any' n'est ajouté
git diff --cached --name-only | xargs grep -l ': any' && echo "❌ Nouveaux types 'any' détectés" && exit 1 || true

echo "✅ Pre-commit checks passed"
```

### 3. Templates de Code

```typescript
// Template pour nouveau composant
// scripts/templates/component.tsx
import React from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface {{ComponentName}}Props {
  // Props typées
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  const { handleError } = useErrorHandler({ component: '{{ComponentName}}' });
  
  return (
    <div>
      {/* Contenu */}
    </div>
  );
};
```

### 4. CI/CD Integration

```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Type Check
        run: npm run type-check
        
      - name: ESLint
        run: npm run lint
        
      - name: Test Coverage
        run: npm run test:coverage
        
      - name: Audit Types
        run: |
          ANY_COUNT=$(grep -r ': any\|: any\[\]' src/ | wc -l)
          if [ $ANY_COUNT -gt 0 ]; then
            echo "❌ Found $ANY_COUNT 'any' types"
            exit 1
          fi
          
      - name: Build Check
        run: npm run build
```

## Gestion des Risques

### 1. Risques Techniques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Régression fonctionnelle | High | Medium | Tests de régression complets |
| Performance dégradée | Medium | Low | Monitoring continu, rollback possible |
| Conflits de merge | Medium | High | Migration par petits PR, communication |
| Courbe d'apprentissage | Low | High | Formation équipe, documentation |

### 2. Plan de Rollback

```typescript
// En cas de problème critique
// 1. Rollback immédiat possible via Git
git revert <commit-range>

// 2. Feature flags pour activation progressive
const useStrictTypes = process.env.FEATURE_STRICT_TYPES === 'true';

// 3. Migration progressive avec backward compatibility
export function getLegacyPatient(id: string): Promise<any> {
  if (useStrictTypes) {
    return getPatient(id);
  }
  return legacyGetPatient(id);
}
```

### 3. Points de Contrôle

**Chaque fin de phase:**
- [ ] Demo fonctionnelle
- [ ] Métriques de qualité validées
- [ ] Tests de performance OK
- [ ] Validation par l'équipe
- [ ] Documentation mise à jour

## Communication et Formation

### 1. Planning de Formation

**Semaine 1**: Introduction TypeScript strict
- Concepts avancés TypeScript
- Zod et validation runtime
- Patterns d'erreur

**Semaine 2**: Hands-on Migration
- Ateliers pratiques
- Code review en pair
- Résolution de problèmes

**Semaine 3-4**: Best Practices
- Standards de qualité
- Monitoring et debugging
- Optimisation performance

### 2. Documentation Équipe

- Guide de migration développeur
- Patterns recommandés
- FAQ et troubleshooting
- Standards de code review

Cette stratégie de migration garantit une transition smooth vers un codebase type-safe tout en minimisant les risques et en maintenant la vélocité de développement de l'équipe NOVA RDV.