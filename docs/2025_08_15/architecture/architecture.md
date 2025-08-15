# NOVA RDV v2 - Architecture Système

## Vue d'ensemble

NOVA RDV v2 est un système de prise de rendez-vous médical conçu pour le cabinet dentaire situé à "Cité 109, Daboussy El Achour, Alger". Le système utilise le fuseau horaire "Africa/Algiers" (UTC+01, sans DST) et impose une validation JSON stricte à tous les niveaux.

## Contraintes Système

### Contraintes Fixes
- **Adresse clinique** : "Cité 109, Daboussy El Achour, Alger" (immutable)
- **Fuseau horaire** : "Africa/Algiers" (UTC+01, sans changement DST)
- **Format téléphone** : E.164 algérien (+213 uniquement)
- **Langue** : Français exclusivement pour les interactions utilisateur
- **Sortie** : JSON uniquement via Anthropic tool_choice avec schéma strict

### Types de Soins Supportés
- consultation
- urgence
- detartrage
- soin
- extraction
- prothese
- orthodontie
- chirurgie

### Actions RDV Disponibles
- FIND_SLOTS : Recherche de créneaux disponibles
- CREATE : Création de nouveau rendez-vous
- RESCHEDULE : Reprogrammation d'un rendez-vous existant
- CANCEL : Annulation de rendez-vous
- CONFIRMATION : Confirmation de rendez-vous
- NEED_INFO : Demande d'informations complémentaires

## Diagrammes C4

### 1. Diagramme de Contexte (C1)

```mermaid
C4Context
    title NOVA RDV v2 - Diagramme de Contexte

    Person(patient, "Patient", "Personne souhaitant prendre un rendez-vous")
    Person(staff, "Personnel Cabinet", "Dentiste, assistante, réceptionniste")
    Person(admin, "Administrateur", "Gestionnaire système NOVA")

    System(nova_rdv, "NOVA RDV v2", "Système de gestion des rendez-vous médicaux")
    
    System_Ext(anthropic, "Anthropic Claude API", "Service IA pour traitement naturel des demandes")
    System_Ext(sms_service, "Service SMS", "Notifications et confirmations SMS")
    System_Ext(email_service, "Service Email", "Notifications et confirmations email")
    
    Rel(patient, nova_rdv, "Prend rendez-vous via", "Chat/API")
    Rel(staff, nova_rdv, "Gère les rendez-vous", "Interface web")
    Rel(admin, nova_rdv, "Administre le système", "Dashboard admin")
    
    Rel(nova_rdv, anthropic, "Traite les demandes", "HTTPS/JSON")
    Rel(nova_rdv, sms_service, "Envoie notifications", "API")
    Rel(nova_rdv, email_service, "Envoie confirmations", "SMTP")
```

### 2. Diagramme de Conteneurs (C2)

```mermaid
C4Container
    title NOVA RDV v2 - Diagramme de Conteneurs

    Person(patient, "Patient")
    Person(staff, "Personnel Cabinet")

    Container_Boundary(nova_platform, "Plateforme NOVA") {
        Container(web_app, "Application Web", "Next.js 15", "Interface utilisateur responsive")
        Container(api_gateway, "API Gateway", "Next.js API Routes", "Point d'entrée API unifié")
        Container(rdv_service, "Service RDV", "TypeScript", "Logique métier des rendez-vous")
        Container(ai_service, "Service IA", "Anthropic SDK", "Traitement NLP des demandes")
        Container(websocket_server, "Serveur WebSocket", "Node.js/WS", "Mises à jour temps réel")
        Container(auth_service, "Service Auth", "JWT/MFA", "Authentification et autorisation")
    }

    ContainerDb(postgres_main, "PostgreSQL Principal", "Base de données", "Données globales et métadonnées")
    ContainerDb(postgres_cabinet, "PostgreSQL Cabinet", "Base de données", "Données isolées par cabinet")
    ContainerDb(redis, "Redis Cache", "Cache", "Sessions et cache rapide")

    Container_Ext(anthropic_api, "Anthropic Claude API")
    Container_Ext(notification_service, "Services Notifications")

    Rel(patient, web_app, "Utilise", "HTTPS")
    Rel(staff, web_app, "Gère", "HTTPS")
    
    Rel(web_app, api_gateway, "Appelle", "HTTPS/JSON")
    Rel(web_app, websocket_server, "Se connecte", "WebSocket")
    
    Rel(api_gateway, rdv_service, "Route vers", "Function calls")
    Rel(api_gateway, auth_service, "Vérifie auth", "Function calls")
    
    Rel(rdv_service, ai_service, "Traite demandes", "Function calls")
    Rel(rdv_service, postgres_cabinet, "Lit/Écrit", "SQL")
    
    Rel(ai_service, anthropic_api, "Envoie prompts", "HTTPS")
    
    Rel(auth_service, postgres_main, "Vérifie utilisateurs", "SQL")
    Rel(auth_service, redis, "Cache sessions", "TCP")
    
    Rel(websocket_server, postgres_cabinet, "Écoute changements", "SQL")
    Rel(rdv_service, notification_service, "Envoie notifications", "API")
```

### 3. Diagramme de Composants - Service RDV (C3)

```mermaid
C4Component
    title Service RDV - Diagrammes de Composants

    Container_Boundary(rdv_service, "Service RDV") {
        Component(rdv_controller, "RDV Controller", "TypeScript", "Endpoints API pour rendez-vous")
        Component(appointment_service, "Appointment Service", "TypeScript", "Logique métier des RDV")
        Component(slot_manager, "Slot Manager", "TypeScript", "Gestion des créneaux horaires")
        Component(patient_service, "Patient Service", "TypeScript", "Gestion des patients")
        Component(notification_manager, "Notification Manager", "TypeScript", "Orchestration des notifications")
        Component(validation_engine, "Validation Engine", "Zod", "Validation JSON stricte")
        Component(timezone_handler, "Timezone Handler", "date-fns", "Gestion fuseau Africa/Algiers")
    }

    Container_Boundary(ai_service, "Service IA") {
        Component(nlp_processor, "NLP Processor", "Anthropic SDK", "Traitement langage naturel")
        Component(intent_classifier, "Intent Classifier", "TypeScript", "Classification des intentions")
        Component(response_formatter, "Response Formatter", "TypeScript", "Formatage JSON strict")
    }

    ContainerDb(postgres_cabinet, "PostgreSQL Cabinet")
    Container_Ext(anthropic_api, "Anthropic Claude API")
    Container_Ext(websocket_server, "WebSocket Server")

    Rel(rdv_controller, appointment_service, "Délègue à")
    Rel(rdv_controller, validation_engine, "Valide avec")
    
    Rel(appointment_service, slot_manager, "Vérifie disponibilité")
    Rel(appointment_service, patient_service, "Gère patients")
    Rel(appointment_service, notification_manager, "Déclenche notifications")
    Rel(appointment_service, timezone_handler, "Convertit heures")
    
    Rel(appointment_service, nlp_processor, "Traite demandes NL")
    
    Rel(nlp_processor, intent_classifier, "Classifie")
    Rel(nlp_processor, response_formatter, "Formate")
    Rel(nlp_processor, anthropic_api, "Appelle")
    
    Rel(appointment_service, postgres_cabinet, "Persiste", "SQL")
    Rel(notification_manager, websocket_server, "Diffuse", "WebSocket")
```

## Architecture Technique

### Isolation Multi-tenant

Le système utilise une architecture multi-tenant avec isolation stricte :

- **Base principale** (`nova_main`) : métadonnées globales, utilisateurs, cabinets
- **Bases cabinet** (`nova_cabinet_{id}`) : données isolées par cabinet
- **Contrôle d'accès** : RBAC avec validation par cabinet

### Gestion du Temps

- **Fuseau fixe** : Africa/Algiers (UTC+01)
- **Pas de DST** : Pas de changement d'heure saisonnier
- **Validation** : Tous les timestamps en ISO 8601
- **Conversion** : Automatique via `date-fns` avec timezone fixe

### Validation JSON Stricte

```typescript
// Schéma Zod pour validation RDV
const AppointmentRequestSchema = z.object({
  action: z.enum(["FIND_SLOTS", "CREATE", "RESCHEDULE", "CANCEL", "CONFIRMATION", "NEED_INFO"]),
  clinic_address: z.literal("Cité 109, Daboussy El Achour, Alger"),
  timezone: z.literal("Africa/Algiers"),
  patient: z.object({
    name: z.string().min(1).max(120),
    phone_e164: z.string().regex(/^\+213[567]\d{8}$/),
    email: z.string().email().optional(),
    patient_id: z.string().optional()
  }).optional(),
  slot: z.object({
    start_iso: z.string().datetime(),
    end_iso: z.string().datetime(),
    duration_minutes: z.number().min(15).max(180)
  }).optional(),
  care_type: z.enum(["consultation", "urgence", "detartrage", "soin", "extraction", "prothese", "orthodontie", "chirurgie"]).optional(),
  // ... autres champs
});
```

### Intégration Anthropic Claude

Le système utilise Claude 3.7 Sonnet avec `tool_choice` forcé pour garantir des réponses JSON uniquement :

```typescript
const response = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  system: APPOINTMENT_SYSTEM_PROMPT,
  tool_choice: { type: "tool", name: "rdv_json" },
  thinking: { type: "disabled" }, // Pas de raisonnement affiché
  messages: [{ role: "user", content: userPrompt }]
});
```

### WebSocket Temps Réel

- **Port** : 8080 (configuré)
- **Événements** : création, modification, annulation RDV
- **Authentification** : JWT token dans query params
- **Isolement** : Messages filtrés par cabinet

### Sécurité et RGPD

#### Chiffrement des Données
- **En transit** : TLS 1.3 pour toutes les communications
- **Au repos** : Chiffrement AES-256 pour données sensibles
- **Clés** : Rotation automatique via Azure Key Vault

#### Contrôle d'Accès
- **RBAC** : Rôles super_admin, admin, manager, staff
- **MFA** : TOTP obligatoire pour admins
- **Sessions** : JWT avec refresh tokens, expiration courte

#### Conformité RGPD
- **Consentement** : Collecte explicite et traçable
- **Portabilité** : Export JSON des données patient
- **Droit à l'oubli** : Pseudonymisation après suppression
- **Audit** : Logs détaillés de tous les accès

## Flux de Données

### 1. Prise de Rendez-vous

```mermaid
sequenceDiagram
    participant P as Patient
    participant WA as Web App
    participant AG as API Gateway
    participant RS as RDV Service
    participant AI as AI Service
    participant DB as PostgreSQL
    participant WS as WebSocket

    P->>WA: "Je veux un RDV demain matin"
    WA->>AG: POST /api/appointments
    AG->>RS: processAppointment()
    RS->>AI: analyzeRequest()
    AI->>AI: validateJSON()
    AI-->>RS: {action: "FIND_SLOTS", ...}
    RS->>DB: findAvailableSlots()
    DB-->>RS: [slots disponibles]
    RS-->>AG: {available_slots: [...]}
    AG-->>WA: JSON Response
    WA-->>P: Affiche créneaux
    
    P->>WA: Sélectionne créneau
    WA->>AG: POST /api/appointments/create
    AG->>RS: createAppointment()
    RS->>DB: INSERT appointment
    RS->>WS: broadcastUpdate()
    RS-->>AG: {status: "CONFIRMED"}
    AG-->>WA: Confirmation
    WA-->>P: "RDV confirmé"
```

### 2. Mise à jour Temps Réel

```mermaid
sequenceDiagram
    participant S1 as Staff 1
    participant S2 as Staff 2
    participant WS as WebSocket Server
    participant DB as PostgreSQL

    S1->>WS: Connecté (cabinet-1)
    S2->>WS: Connecté (cabinet-1)
    
    Note over DB: Nouveau RDV créé
    DB->>WS: Trigger notification
    WS->>S1: {type: "appointment_created", data: {...}}
    WS->>S2: {type: "appointment_created", data: {...}}
    
    S1->>S1: Met à jour calendrier
    S2->>S2: Met à jour calendrier
```

## Patterns Architecturaux

### 1. CQRS (Command Query Responsibility Segregation)

- **Commands** : Créer, modifier, supprimer RDV
- **Queries** : Recherche créneaux, liste RDV, statistiques
- **Séparation** : Optimisation distincte lecture/écriture

### 2. Event Sourcing (partiel)

- **Événements** : appointment_created, appointment_updated, appointment_cancelled
- **Projections** : Vues matérialisées pour requêtes rapides
- **Audit** : Traçabilité complète des modifications

### 3. Circuit Breaker

```typescript
class AnthropicCircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 4. Repository Pattern

```typescript
interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByFilters(filters: AppointmentFilters): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  delete(id: string): Promise<void>;
}

class PostgreSQLAppointmentRepository implements AppointmentRepository {
  constructor(private db: Database, private cabinetId: string) {}
  
  async findById(id: string): Promise<Appointment | null> {
    const query = `
      SELECT * FROM appointments 
      WHERE id = $1 AND cabinet_id = $2
    `;
    const result = await this.db.query(query, [id, this.cabinetId]);
    return result.rows[0] ? this.mapToAppointment(result.rows[0]) : null;
  }
}
```

## Monitoring et Observabilité

### Métriques Clés
- **Performance** : Temps de réponse API < 200ms (p95)
- **Disponibilité** : SLA 99.9% (8.76h downtime/an max)
- **IA** : Taux de compréhension > 95%, JSON valide > 99.9%
- **Concurrence** : Support 1000 utilisateurs simultanés

### Logs Structurés
```json
{
  "timestamp": "2025-08-15T10:30:00.000Z",
  "level": "INFO",
  "service": "rdv-service",
  "cabinet_id": "cabinet-123",
  "user_id": "user-456",
  "action": "appointment_created",
  "appointment_id": "apt-789",
  "patient_phone": "+213555123456",
  "duration_ms": 145,
  "timezone": "Africa/Algiers"
}
```

### Alertes
- **Erreurs IA** : > 5% taux d'erreur sur 5min
- **Base de données** : Connexions > 80% du pool
- **WebSocket** : > 100 déconnexions/min
- **Validation** : > 1% de JSON invalides

## Scalabilité

### Horizontal
- **API** : Load balancer avec sticky sessions
- **WebSocket** : Cluster avec Redis Pub/Sub
- **Base de données** : Read replicas pour requêtes
- **Cache** : Redis Cluster pour haute disponibilité

### Vertical
- **CPU** : Optimisations V8, worker threads pour IA
- **Mémoire** : Connection pooling, cache LRU
- **Réseau** : Compression gzip, CDN pour assets

### Limites Architecturales
- **Cabinets** : 1000 cabinets max par instance
- **Concurrence** : 50 RDV simultanés par cabinet
- **Données** : 100GB max par base cabinet
- **Rétention** : 7 ans données médicales (conformité)

## Plan de Déploiement

### Environnements
1. **Développement** : Local avec Docker Compose
2. **Test** : Azure Container Instances
3. **Staging** : Azure App Service (slot staging)
4. **Production** : Azure App Service avec Auto-scaling

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- test: Vitest + Playwright E2E
- security: SAST avec CodeQL
- build: Docker multi-stage
- deploy: Blue-green avec health checks
- rollback: Automatique si health check échoue
```

### Migration de Données
```sql
-- Script migration v1 -> v2
ALTER TABLE appointments ADD COLUMN care_type VARCHAR(50);
UPDATE appointments SET care_type = 'consultation' WHERE care_type IS NULL;
ALTER TABLE appointments ALTER COLUMN care_type SET NOT NULL;

-- Index pour performances
CREATE INDEX CONCURRENTLY idx_appointments_care_type_scheduled 
ON appointments(care_type, scheduled_at) 
WHERE status IN ('scheduled', 'confirmed');
```

Cette architecture garantit un système robuste, sécurisé et conforme aux exigences métier du cabinet dentaire tout en respectant les contraintes techniques strictes imposées.