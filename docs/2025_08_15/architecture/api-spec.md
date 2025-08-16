# API Specification - NOVA RDV Error Handling

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.3
info:
  title: NOVA RDV - Error Handling API
  version: 2.0.0
  description: |
    API centralisée pour la gestion des erreurs dans NOVA RDV.
    Cette API définit les contracts pour :
    - Gestion des erreurs TypeScript
    - Validation des données
    - Normalisation des réponses d'erreur
    - Monitoring de la qualité du code

  contact:
    name: NOVA RDV Team
    email: dev@nova-rdv.dz
  license:
    name: Proprietary
    url: https://nova-rdv.dz/license

servers:
  - url: https://api.nova-rdv.dz/v2
    description: Production server
  - url: https://staging-api.nova-rdv.dz/v2
    description: Staging server
  - url: http://localhost:3000/api
    description: Development server

security:
  - bearerAuth: []

paths:
  # Error Handling Endpoints
  /errors/report:
    post:
      summary: Report une erreur système
      description: |
        Endpoint pour reporter des erreurs capturées côté client.
        Utilisé par le gestionnaire d'erreurs global.
      tags: [Error Handling]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorReport'
            examples:
              typescript_error:
                summary: Erreur TypeScript
                value:
                  type: "TYPE_ERROR"
                  message: "Property 'unknown' does not exist on type"
                  source: "component"
                  file: "src/components/PatientForm.tsx"
                  line: 42
                  context:
                    component: "PatientForm"
                    props: { "patientId": "123" }
              validation_error:
                summary: Erreur de validation
                value:
                  type: "VALIDATION_ERROR"
                  message: "Invalid phone number format"
                  source: "api"
                  field: "phone"
                  context:
                    expectedFormat: "+213[567]XXXXXXXX"
                    receivedValue: "0555123456"
      responses:
        '201':
          description: Erreur enregistrée avec succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorReportResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '429':
          $ref: '#/components/responses/RateLimitError'

  /errors/normalize:
    post:
      summary: Normalise une erreur
      description: |
        Convertit une erreur raw en erreur NOVA structurée.
        Utilisé par les API routes pour standardiser les réponses.
      tags: [Error Handling]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RawError'
      responses:
        '200':
          description: Erreur normalisée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NormalizedError'

  # Type Validation Endpoints
  /validation/validate:
    post:
      summary: Valide des données avec un schéma
      description: |
        Endpoint pour valider des données avec les schémas Zod.
        Retourne les erreurs de validation détaillées.
      tags: [Validation]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationRequest'
      responses:
        '200':
          description: Validation réussie
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationSuccess'
        '422':
          description: Erreurs de validation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationErrors'

  # Quality Metrics Endpoints
  /quality/metrics:
    get:
      summary: Métriques de qualité du code
      description: |
        Retourne les métriques de qualité de code :
        - Nombre d'erreurs TypeScript
        - Violations ESLint
        - Couverture de tests
        - Performance de build
      tags: [Quality]
      parameters:
        - name: timeRange
          in: query
          schema:
            type: string
            enum: [hour, day, week, month]
            default: day
        - name: component
          in: query
          schema:
            type: string
          description: Filtrer par composant spécifique
      responses:
        '200':
          description: Métriques de qualité
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QualityMetrics'

  /quality/alerts:
    get:
      summary: Alertes de qualité
      description: |
        Liste des alertes de qualité actives :
        - Erreurs critiques
        - Régressions de performance
        - Violations de standards
      tags: [Quality]
      responses:
        '200':
          description: Liste des alertes
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QualityAlerts'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Core Error Types
    ErrorReport:
      type: object
      required:
        - type
        - message
        - source
      properties:
        type:
          type: string
          enum: 
            - TYPE_ERROR
            - VALIDATION_ERROR
            - RUNTIME_ERROR
            - ESLINT_ERROR
            - COMPONENT_ERROR
        message:
          type: string
          description: Message d'erreur détaillé
        source:
          type: string
          enum: [api, component, service, middleware, hook]
        file:
          type: string
          description: Fichier source de l'erreur
        line:
          type: integer
          description: Ligne de l'erreur
        column:
          type: integer
          description: Colonne de l'erreur
        field:
          type: string
          description: Champ concerné (pour erreurs de validation)
        stack:
          type: string
          description: Stack trace complète
        context:
          type: object
          additionalProperties: true
          description: Contexte additionnel
        userId:
          type: string
          description: ID utilisateur (si applicable)
        sessionId:
          type: string
          description: ID de session
        userAgent:
          type: string
          description: User agent du client
        url:
          type: string
          description: URL où l'erreur s'est produite

    ErrorReportResponse:
      type: object
      required:
        - success
        - errorId
        - timestamp
      properties:
        success:
          type: boolean
          example: true
        errorId:
          type: string
          description: ID unique de l'erreur
          example: "err_type_error_1692123456_abc123"
        timestamp:
          type: string
          format: date-time
          description: Timestamp de l'enregistrement
        actionsTaken:
          type: array
          items:
            type: string
          description: Actions automatiques prises
          example: ["logged", "alerted", "metrics_updated"]

    RawError:
      type: object
      required:
        - error
      properties:
        error:
          oneOf:
            - type: string
            - type: object
          description: Erreur brute à normaliser
        context:
          type: object
          additionalProperties: true
          description: Contexte additionnel

    NormalizedError:
      type: object
      required:
        - code
        - message
        - type
        - timestamp
      properties:
        code:
          type: string
          description: Code d'erreur standardisé
          example: "VALIDATION_ERROR"
        message:
          type: string
          description: Message utilisateur localisé
          example: "Numéro de téléphone invalide. Format requis: +213[567]XXXXXXXX"
        type:
          type: string
          enum: [validation, authentication, authorization, not_found, conflict, server_error]
        timestamp:
          type: string
          format: date-time
        field:
          type: string
          description: Champ concerné (si applicable)
        details:
          type: object
          additionalProperties: true
          description: Détails techniques
        suggestions:
          type: array
          items:
            type: string
          description: Suggestions pour corriger l'erreur

    # Validation Types
    ValidationRequest:
      type: object
      required:
        - schema
        - data
      properties:
        schema:
          type: string
          enum: [Patient, Appointment, Cabinet, Practitioner]
          description: Nom du schéma Zod à utiliser
        data:
          type: object
          additionalProperties: true
          description: Données à valider
        options:
          type: object
          properties:
            strict:
              type: boolean
              default: true
            allowUnknown:
              type: boolean
              default: false

    ValidationSuccess:
      type: object
      required:
        - success
        - data
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          additionalProperties: true
          description: Données validées et transformées
        warnings:
          type: array
          items:
            type: string
          description: Avertissements non bloquants

    ValidationErrors:
      type: object
      required:
        - success
        - errors
      properties:
        success:
          type: boolean
          example: false
        errors:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'
        code:
          type: string
          example: "VALIDATION_ERROR"

    ValidationError:
      type: object
      required:
        - field
        - message
        - code
      properties:
        field:
          type: string
          description: Nom du champ en erreur
          example: "phone"
        message:
          type: string
          description: Message d'erreur
          example: "Format de téléphone invalide"
        code:
          type: string
          description: Code d'erreur spécifique
          example: "INVALID_PHONE_FORMAT"
        expectedType:
          type: string
          description: Type attendu
          example: "string matching +213[567]XXXXXXXX"
        receivedValue:
          description: Valeur reçue
          example: "0555123456"
        path:
          type: array
          items:
            type: string
          description: Chemin vers le champ en erreur
          example: ["patient", "contact", "phone"]

    # Quality Metrics Types
    QualityMetrics:
      type: object
      required:
        - timestamp
        - period
        - metrics
      properties:
        timestamp:
          type: string
          format: date-time
        period:
          type: string
          enum: [hour, day, week, month]
        metrics:
          type: object
          required:
            - typeErrors
            - eslintWarnings
            - testCoverage
            - buildTime
          properties:
            typeErrors:
              $ref: '#/components/schemas/ErrorMetric'
            eslintWarnings:
              $ref: '#/components/schemas/ErrorMetric'
            testCoverage:
              type: object
              properties:
                percentage:
                  type: number
                  minimum: 0
                  maximum: 100
                trend:
                  type: string
                  enum: [improving, stable, declining]
                target:
                  type: number
                  example: 95
            buildTime:
              type: object
              properties:
                average:
                  type: number
                  description: Temps moyen en secondes
                trend:
                  type: string
                  enum: [improving, stable, declining]
                target:
                  type: number
                  example: 30
            codeComplexity:
              type: object
              properties:
                average:
                  type: number
                  description: Complexité cyclomatique moyenne
                hotspots:
                  type: array
                  items:
                    type: object
                    properties:
                      file:
                        type: string
                      complexity:
                        type: number

    ErrorMetric:
      type: object
      required:
        - count
        - trend
      properties:
        count:
          type: integer
          minimum: 0
        trend:
          type: string
          enum: [improving, stable, declining]
        byCategory:
          type: object
          additionalProperties:
            type: integer
        topFiles:
          type: array
          items:
            type: object
            properties:
              file:
                type: string
              count:
                type: integer

    QualityAlerts:
      type: object
      required:
        - alerts
        - summary
      properties:
        alerts:
          type: array
          items:
            $ref: '#/components/schemas/QualityAlert'
        summary:
          type: object
          properties:
            total:
              type: integer
            critical:
              type: integer
            warning:
              type: integer
            info:
              type: integer

    QualityAlert:
      type: object
      required:
        - id
        - type
        - severity
        - message
        - createdAt
      properties:
        id:
          type: string
          description: ID unique de l'alerte
        type:
          type: string
          enum:
            - TYPE_ERROR_SPIKE
            - ESLINT_VIOLATIONS
            - BUILD_FAILURE
            - COVERAGE_DROP
            - PERFORMANCE_REGRESSION
        severity:
          type: string
          enum: [critical, warning, info]
        message:
          type: string
          description: Description de l'alerte
        createdAt:
          type: string
          format: date-time
        resolvedAt:
          type: string
          format: date-time
          description: Timestamp de résolution (si applicable)
        metadata:
          type: object
          additionalProperties: true
          description: Données additionnelles
        actions:
          type: array
          items:
            type: string
          description: Actions recommandées

  responses:
    ValidationError:
      description: Erreur de validation des données
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ValidationErrors'
          example:
            type: "https://nova-rdv.dz/problems/validation-error"
            title: "Validation Error"
            status: 400
            detail: "One or more fields have invalid values"
            errors:
              - field: "phone"
                message: "Format de téléphone invalide"
                code: "INVALID_PHONE_FORMAT"
                expectedType: "string matching +213[567]XXXXXXXX"
                receivedValue: "0555123456"

    RateLimitError:
      description: Limite de taux dépassée
      content:
        application/problem+json:
          schema:
            type: object
            properties:
              type:
                type: string
                example: "https://nova-rdv.dz/problems/rate-limit-exceeded"
              title:
                type: string
                example: "Rate Limit Exceeded"
              status:
                type: integer
                example: 429
              detail:
                type: string
                example: "Too many error reports. Please try again later"
              resetTime:
                type: string
                format: date-time
              limit:
                type: integer

tags:
  - name: Error Handling
    description: Gestion centralisée des erreurs
  - name: Validation
    description: Validation des données avec Zod
  - name: Quality
    description: Métriques et monitoring de qualité

externalDocs:
  description: Documentation complète NOVA RDV
  url: https://docs.nova-rdv.dz
```

## Exemples d'Usage

### 1. Reporter une Erreur TypeScript

```typescript
// src/lib/error-reporting.ts
import { ErrorManager } from '@/lib/errors/manager';

export const reportTypeError = async (
  error: TypeError,
  component: string,
  props?: Record<string, unknown>
) => {
  const errorManager = ErrorManager.getInstance();
  
  await errorManager.report({
    type: 'TYPE_ERROR',
    message: error.message,
    source: 'component',
    file: `src/components/${component}.tsx`,
    context: {
      component,
      props: props ? JSON.stringify(props, null, 2) : undefined
    },
    stack: error.stack
  });
};
```

### 2. Valider des Données

```typescript
// src/lib/validation/client.ts
export const validatePatientData = async (data: unknown) => {
  const response = await fetch('/api/validation/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema: 'Patient',
      data,
      options: { strict: true }
    })
  });
  
  if (!response.ok) {
    const errors = await response.json();
    throw new ValidationError(errors.errors);
  }
  
  return response.json();
};
```

### 3. Monitoring de Qualité

```typescript
// src/hooks/useQualityMetrics.ts
export const useQualityMetrics = (timeRange: string = 'day') => {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch(`/api/quality/metrics?timeRange=${timeRange}`);
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, [timeRange]);
  
  return metrics;
};
```

Cette spécification API fournit une base solide pour implémenter la gestion centralisée des erreurs et le monitoring de qualité dans NOVA RDV.