# NOVA RDV v2 - Spécification API OpenAPI

```yaml
openapi: 3.0.3
info:
  title: NOVA RDV v2 API
  description: |
    API de gestion des rendez-vous pour le cabinet dentaire NOVA.
    
    **Contraintes système :**
    - Adresse fixe : "Cité 109, Daboussy El Achour, Alger"
    - Fuseau horaire : "Africa/Algiers" (UTC+01, sans DST)
    - Téléphones : Format E.164 algérien (+213 uniquement)
    - Langue : Français exclusivement
    - Validation : JSON strict avec schémas Zod
    
  version: 2.0.0
  contact:
    name: NOVA Support
    email: support@nova-platform.com
  license:
    name: Propriétaire
    
servers:
  - url: https://api.nova-platform.com/v2
    description: Production
  - url: https://staging-api.nova-platform.com/v2
    description: Staging
  - url: http://localhost:3000/api
    description: Développement local

security:
  - BearerAuth: []
  - ApiKeyAuth: []

paths:
  /appointments:
    post:
      summary: Traitement intelligent d'une demande de RDV
      description: |
        Endpoint principal pour traiter les demandes de rendez-vous en langage naturel.
        Utilise l'IA Claude pour comprendre l'intention et retourner une réponse JSON stricte.
      tags:
        - Appointments
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentRequest'
            examples:
              prise_rdv_simple:
                summary: Prise de RDV simple
                value:
                  message: "Bonjour, je voudrais prendre un rendez-vous pour demain matin"
                  patient_context:
                    phone_e164: "+213555123456"
                    name: "Ahmed Benali"
              recherche_creneaux:
                summary: Recherche de créneaux
                value:
                  message: "Quels sont les créneaux disponibles vendredi après-midi ?"
              urgence:
                summary: Demande d'urgence
                value:
                  message: "J'ai une rage de dent, c'est urgent !"
                  patient_context:
                    phone_e164: "+213667789012"
                    name: "Fatima Khelil"
      responses:
        '200':
          description: Réponse JSON structurée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentResponse'
              examples:
                creneaux_disponibles:
                  summary: Créneaux trouvés
                  value:
                    action: "FIND_SLOTS"
                    clinic_address: "Cité 109, Daboussy El Achour, Alger"
                    timezone: "Africa/Algiers"
                    status: "CONFIRMED"
                    available_slots:
                      - start_iso: "2025-08-16T09:00:00+01:00"
                        end_iso: "2025-08-16T09:30:00+01:00"
                        available: true
                      - start_iso: "2025-08-16T10:30:00+01:00"
                        end_iso: "2025-08-16T11:00:00+01:00"
                        available: true
                rdv_cree:
                  summary: RDV créé avec succès
                  value:
                    action: "CREATE"
                    clinic_address: "Cité 109, Daboussy El Achour, Alger"
                    timezone: "Africa/Algiers"
                    status: "CONFIRMED"
                    patient:
                      name: "Ahmed Benali"
                      phone_e164: "+213555123456"
                      patient_id: "pat_789abc"
                    slot:
                      start_iso: "2025-08-16T09:00:00+01:00"
                      end_iso: "2025-08-16T09:30:00+01:00"
                      duration_minutes: 30
                    care_type: "consultation"
                    appointment_id: "apt_123def"
                informations_manquantes:
                  summary: Informations manquantes
                  value:
                    action: "NEED_INFO"
                    clinic_address: "Cité 109, Daboussy El Achour, Alger"
                    timezone: "Africa/Algiers"
                    status: "NEED_INFO"
                    missing_fields: ["patient.name", "patient.phone_e164"]
                    clarification_question: "Pouvez-vous me donner votre nom complet et numéro de téléphone ?"
        '400':
          description: Requête invalide
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Non authentifié
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: Trop de requêtes
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Erreur serveur
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    get:
      summary: Liste des rendez-vous
      description: Récupère la liste des rendez-vous avec filtres
      tags:
        - Appointments
      security:
        - BearerAuth: []
      parameters:
        - name: cabinet_id
          in: query
          description: ID du cabinet (auto-détecté si non fourni)
          schema:
            type: string
            format: uuid
        - name: patient_id
          in: query
          description: ID du patient
          schema:
            type: string
            format: uuid
        - name: status
          in: query
          description: Statut du rendez-vous
          schema:
            $ref: '#/components/schemas/AppointmentStatus'
        - name: care_type
          in: query
          description: Type de soin
          schema:
            $ref: '#/components/schemas/CareType'
        - name: date_from
          in: query
          description: Date de début (ISO 8601)
          schema:
            type: string
            format: date-time
            example: "2025-08-15T00:00:00+01:00"
        - name: date_to
          in: query
          description: Date de fin (ISO 8601)
          schema:
            type: string
            format: date-time
            example: "2025-08-22T23:59:59+01:00"
        - name: limit
          in: query
          description: Nombre maximum de résultats
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          description: Décalage pour pagination
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: Liste des rendez-vous
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentListResponse'

  /appointments/{appointmentId}:
    get:
      summary: Détails d'un rendez-vous
      description: Récupère les détails complets d'un rendez-vous
      tags:
        - Appointments
      security:
        - BearerAuth: []
      parameters:
        - name: appointmentId
          in: path
          required: true
          description: ID du rendez-vous
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Détails du rendez-vous
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentDetail'
        '404':
          description: Rendez-vous non trouvé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    put:
      summary: Modification d'un rendez-vous
      description: Modifie un rendez-vous existant (reprogrammation, changement de statut, etc.)
      tags:
        - Appointments
      security:
        - BearerAuth: []
      parameters:
        - name: appointmentId
          in: path
          required: true
          description: ID du rendez-vous
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentUpdateRequest'
      responses:
        '200':
          description: Rendez-vous modifié avec succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentDetail'
        '400':
          description: Données invalides
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Rendez-vous non trouvé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Conflit (créneau déjà pris)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Annulation d'un rendez-vous
      description: Annule un rendez-vous (changement de statut vers "cancelled")
      tags:
        - Appointments
      security:
        - BearerAuth: []
      parameters:
        - name: appointmentId
          in: path
          required: true
          description: ID du rendez-vous
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
                  maxLength: 500
                  description: Raison de l'annulation
                notify_patient:
                  type: boolean
                  default: true
                  description: Notifier le patient
      responses:
        '200':
          description: Rendez-vous annulé avec succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentDetail'
        '404':
          description: Rendez-vous non trouvé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /appointments/slots/availability:
    get:
      summary: Vérification de disponibilité
      description: Vérifie la disponibilité de créneaux spécifiques
      tags:
        - Slots
      security:
        - BearerAuth: []
      parameters:
        - name: start_iso
          in: query
          required: true
          description: Début du créneau (ISO 8601)
          schema:
            type: string
            format: date-time
            example: "2025-08-16T09:00:00+01:00"
        - name: duration_minutes
          in: query
          required: true
          description: Durée en minutes
          schema:
            type: integer
            minimum: 15
            maximum: 180
        - name: practitioner_id
          in: query
          description: ID du praticien (optionnel)
          schema:
            type: string
            format: uuid
        - name: care_type
          in: query
          description: Type de soin pour ajuster la durée
          schema:
            $ref: '#/components/schemas/CareType'
      responses:
        '200':
          description: Disponibilité du créneau
          content:
            application/json:
              schema:
                type: object
                properties:
                  available:
                    type: boolean
                    description: Créneau disponible
                  conflicts:
                    type: array
                    items:
                      $ref: '#/components/schemas/AppointmentConflict'
                  alternative_slots:
                    type: array
                    items:
                      $ref: '#/components/schemas/TimeSlot'
                    description: Créneaux alternatifs proches

  /appointments/calendar:
    get:
      summary: Vue calendrier
      description: Récupère les événements pour affichage calendrier
      tags:
        - Calendar
      security:
        - BearerAuth: []
      parameters:
        - name: start_date
          in: query
          required: true
          description: Date de début (ISO 8601)
          schema:
            type: string
            format: date
            example: "2025-08-15"
        - name: end_date
          in: query
          required: true
          description: Date de fin (ISO 8601)
          schema:
            type: string
            format: date
            example: "2025-08-22"
        - name: practitioner_id
          in: query
          description: Filtrer par praticien
          schema:
            type: string
            format: uuid
        - name: view_type
          in: query
          description: Type de vue
          schema:
            type: string
            enum: ["day", "week", "month"]
            default: "week"
      responses:
        '200':
          description: Événements du calendrier
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CalendarResponse'

  /patients:
    get:
      summary: Recherche de patients
      description: Recherche de patients pour association aux RDV
      tags:
        - Patients
      security:
        - BearerAuth: []
      parameters:
        - name: search
          in: query
          description: Recherche par nom, téléphone ou email
          schema:
            type: string
            minLength: 2
        - name: phone_e164
          in: query
          description: Recherche par téléphone exact
          schema:
            type: string
            pattern: '^\+213[567]\d{8}$'
        - name: limit
          in: query
          description: Nombre maximum de résultats
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 10
      responses:
        '200':
          description: Liste des patients trouvés
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PatientListResponse'

    post:
      summary: Création d'un nouveau patient
      description: Crée un nouveau patient dans le système
      tags:
        - Patients
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatientCreateRequest'
      responses:
        '201':
          description: Patient créé avec succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PatientDetail'
        '400':
          description: Données invalides
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Patient déjà existant
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /notifications/preferences:
    get:
      summary: Préférences de notification
      description: Récupère les préférences de notification du cabinet
      tags:
        - Notifications
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Préférences de notification
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationPreferences'

    put:
      summary: Mise à jour des préférences
      description: Met à jour les préférences de notification
      tags:
        - Notifications
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NotificationPreferences'
      responses:
        '200':
          description: Préférences mises à jour
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationPreferences'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        Authentification JWT. Le token doit contenir :
        - user_id : ID de l'utilisateur
        - cabinet_assignments : Liste des cabinets accessibles
        - roles : Rôles de l'utilisateur
        - exp : Date d'expiration
    
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Clé API pour intégrations externes

  schemas:
    AppointmentRequest:
      type: object
      required:
        - message
      properties:
        message:
          type: string
          minLength: 3
          maxLength: 1000
          description: Demande en langage naturel
          example: "Je voudrais prendre un rendez-vous pour un détartrage la semaine prochaine"
        patient_context:
          type: object
          description: Informations patient connues (optionnel)
          properties:
            patient_id:
              type: string
              format: uuid
              description: ID patient existant
            name:
              type: string
              minLength: 2
              maxLength: 120
              description: Nom complet du patient
            phone_e164:
              type: string
              pattern: '^\+213[567]\d{8}$'
              description: Téléphone au format E.164 algérien
            email:
              type: string
              format: email
              description: Email du patient
        session_id:
          type: string
          description: ID de session pour suivi conversation
          example: "sess_abc123"
        context:
          type: object
          description: Contexte additionnel
          properties:
            urgency_level:
              type: string
              enum: ["low", "medium", "high", "emergency"]
              default: "medium"
            preferred_language:
              type: string
              enum: ["fr"]
              default: "fr"
              description: Langue préférée (français uniquement)

    AppointmentResponse:
      type: object
      required:
        - action
        - clinic_address
        - timezone
      properties:
        action:
          type: string
          enum: ["FIND_SLOTS", "CREATE", "RESCHEDULE", "CANCEL", "CONFIRMATION", "NEED_INFO"]
          description: Action identifiée par l'IA
        clinic_address:
          type: string
          const: "Cité 109, Daboussy El Achour, Alger"
          description: Adresse fixe du cabinet
        timezone:
          type: string
          const: "Africa/Algiers"
          description: Fuseau horaire fixe
        patient:
          type: object
          description: Informations patient (si identifié)
          properties:
            name:
              type: string
              minLength: 1
              maxLength: 120
            phone_e164:
              type: string
              pattern: '^\+213[567]\d{8}$'
            email:
              type: string
              format: email
            patient_id:
              type: string
              format: uuid
          required:
            - name
            - phone_e164
        slot:
          type: object
          description: Créneau horaire (si applicable)
          properties:
            start_iso:
              type: string
              format: date-time
              description: Début en ISO 8601
              example: "2025-08-16T09:00:00+01:00"
            end_iso:
              type: string
              format: date-time
              description: Fin en ISO 8601
              example: "2025-08-16T09:30:00+01:00"
            duration_minutes:
              type: integer
              minimum: 15
              maximum: 180
              description: Durée en minutes
        reason:
          type: string
          maxLength: 200
          description: Motif du rendez-vous
        care_type:
          $ref: '#/components/schemas/CareType'
        appointment_id:
          type: string
          format: uuid
          description: ID du RDV (pour modifications)
        status:
          type: string
          enum: ["CONFIRMED", "PENDING", "CANCELLED", "NEED_INFO"]
          description: Statut de la demande
        missing_fields:
          type: array
          items:
            type: string
          description: Champs manquants si status=NEED_INFO
          example: ["patient.name", "patient.phone_e164"]
        clarification_question:
          type: string
          maxLength: 200
          description: Question de clarification unique
          example: "Pouvez-vous me donner votre nom complet ?"
        available_slots:
          type: array
          items:
            $ref: '#/components/schemas/TimeSlot'
          description: Créneaux disponibles (pour FIND_SLOTS)

    AppointmentDetail:
      type: object
      properties:
        id:
          type: string
          format: uuid
        cabinet_id:
          type: string
          format: uuid
        patient:
          $ref: '#/components/schemas/PatientSummary'
        practitioner:
          $ref: '#/components/schemas/PractitionerSummary'
        care_type:
          $ref: '#/components/schemas/CareType'
        title:
          type: string
          maxLength: 200
        description:
          type: string
          maxLength: 1000
        scheduled_at:
          type: string
          format: date-time
          description: Heure programmée (Africa/Algiers)
        duration_minutes:
          type: integer
          minimum: 15
          maximum: 180
        status:
          $ref: '#/components/schemas/AppointmentStatus'
        notes:
          type: string
          maxLength: 2000
        price:
          type: number
          format: decimal
          multipleOf: 0.01
          minimum: 0
        metadata:
          type: object
          description: Métadonnées additionnelles
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        last_modified_by:
          type: string
          format: uuid
          description: ID utilisateur dernière modification

    AppointmentUpdateRequest:
      type: object
      properties:
        patient_id:
          type: string
          format: uuid
        practitioner_id:
          type: string
          format: uuid
        care_type:
          $ref: '#/components/schemas/CareType'
        title:
          type: string
          maxLength: 200
        description:
          type: string
          maxLength: 1000
        scheduled_at:
          type: string
          format: date-time
          description: Nouvelle heure (Africa/Algiers)
        duration_minutes:
          type: integer
          minimum: 15
          maximum: 180
        status:
          $ref: '#/components/schemas/AppointmentStatus'
        notes:
          type: string
          maxLength: 2000
        price:
          type: number
          format: decimal
          multipleOf: 0.01
          minimum: 0
        notify_patient:
          type: boolean
          default: true
          description: Notifier le patient des changements

    AppointmentListResponse:
      type: object
      properties:
        appointments:
          type: array
          items:
            $ref: '#/components/schemas/AppointmentDetail'
        pagination:
          $ref: '#/components/schemas/PaginationMetadata'
        filters_applied:
          type: object
          description: Filtres appliqués à la requête

    CalendarResponse:
      type: object
      properties:
        events:
          type: array
          items:
            $ref: '#/components/schemas/CalendarEvent'
        view_info:
          type: object
          properties:
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date
            timezone:
              type: string
              const: "Africa/Algiers"
            working_hours:
              type: object
              properties:
                start:
                  type: string
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                  example: "08:00"
                end:
                  type: string
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                  example: "18:00"
                days:
                  type: array
                  items:
                    type: string
                    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    CalendarEvent:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        start:
          type: string
          format: date-time
        end:
          type: string
          format: date-time
        all_day:
          type: boolean
          default: false
        status:
          $ref: '#/components/schemas/AppointmentStatus'
        patient_name:
          type: string
        care_type:
          $ref: '#/components/schemas/CareType'
        practitioner_id:
          type: string
          format: uuid
        background_color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
        border_color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
        text_color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
        editable:
          type: boolean
          description: Événement modifiable

    TimeSlot:
      type: object
      properties:
        start_iso:
          type: string
          format: date-time
          description: Début du créneau
        end_iso:
          type: string
          format: date-time
          description: Fin du créneau
        available:
          type: boolean
          description: Créneau disponible
        practitioner_id:
          type: string
          format: uuid
          description: Praticien disponible
        reason_unavailable:
          type: string
          description: Raison si non disponible
          enum: ["booked", "break", "closed", "holiday"]

    AppointmentConflict:
      type: object
      properties:
        appointment_id:
          type: string
          format: uuid
        patient_name:
          type: string
        start_time:
          type: string
          format: date-time
        end_time:
          type: string
          format: date-time
        overlap_duration:
          type: integer
          description: Durée de chevauchement en minutes

    PatientSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        phone_e164:
          type: string
          pattern: '^\+213[567]\d{8}$'
        email:
          type: string
          format: email

    PatientDetail:
      allOf:
        - $ref: '#/components/schemas/PatientSummary'
        - type: object
          properties:
            date_of_birth:
              type: string
              format: date
            gender:
              type: string
              enum: ["M", "F", "Other"]
            address:
              $ref: '#/components/schemas/Address'
            emergency_contact:
              type: object
              properties:
                name:
                  type: string
                  maxLength: 200
                phone_e164:
                  type: string
                  pattern: '^\+213[567]\d{8}$'
                relationship:
                  type: string
                  maxLength: 100
            medical_notes:
              type: string
              maxLength: 5000
            preferences:
              $ref: '#/components/schemas/PatientPreferences'
            total_visits:
              type: integer
              minimum: 0
            last_visit:
              type: string
              format: date-time
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time

    PatientListResponse:
      type: object
      properties:
        patients:
          type: array
          items:
            $ref: '#/components/schemas/PatientSummary'
        pagination:
          $ref: '#/components/schemas/PaginationMetadata'

    PatientCreateRequest:
      type: object
      required:
        - first_name
        - last_name
        - phone_e164
      properties:
        first_name:
          type: string
          minLength: 1
          maxLength: 100
        last_name:
          type: string
          minLength: 1
          maxLength: 100
        phone_e164:
          type: string
          pattern: '^\+213[567]\d{8}$'
        email:
          type: string
          format: email
        date_of_birth:
          type: string
          format: date
        gender:
          type: string
          enum: ["M", "F", "Other"]
        address:
          $ref: '#/components/schemas/Address'
        emergency_contact:
          type: object
          properties:
            name:
              type: string
              maxLength: 200
            phone_e164:
              type: string
              pattern: '^\+213[567]\d{8}$'
            relationship:
              type: string
              maxLength: 100
        medical_notes:
          type: string
          maxLength: 5000
        preferences:
          $ref: '#/components/schemas/PatientPreferences'

    PatientPreferences:
      type: object
      properties:
        preferred_language:
          type: string
          enum: ["fr"]
          default: "fr"
        communication_method:
          type: string
          enum: ["sms", "email", "phone", "none"]
          default: "sms"
        reminder_enabled:
          type: boolean
          default: true
        reminder_hours:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 168
          description: Heures avant RDV pour rappels
          example: [24, 2]
        privacy_consent:
          type: object
          properties:
            data_processing:
              type: boolean
              description: Consentement traitement données
            marketing:
              type: boolean
              description: Consentement marketing
            data_sharing:
              type: boolean
              description: Consentement partage données
            consent_date:
              type: string
              format: date-time
          required:
            - data_processing
            - consent_date

    PractitionerSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        specialization:
          type: string
        license_number:
          type: string

    Address:
      type: object
      properties:
        street:
          type: string
          maxLength: 255
        city:
          type: string
          maxLength: 100
        postal_code:
          type: string
          maxLength: 20
        state:
          type: string
          maxLength: 100
        country:
          type: string
          maxLength: 100
          default: "Algérie"

    NotificationPreferences:
      type: object
      properties:
        sms_enabled:
          type: boolean
          default: true
        email_enabled:
          type: boolean
          default: true
        reminder_times:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 168
          description: Heures avant RDV
          example: [24, 2]
        confirmation_required:
          type: boolean
          default: true
          description: Demander confirmation patient
        templates:
          type: object
          properties:
            appointment_created:
              type: string
              maxLength: 500
            appointment_reminder:
              type: string
              maxLength: 500
            appointment_cancelled:
              type: string
              maxLength: 500

    AppointmentStatus:
      type: string
      enum:
        - scheduled
        - confirmed
        - in_progress
        - completed
        - cancelled
        - no_show
      description: |
        Statuts des rendez-vous :
        - scheduled : Programmé (état initial)
        - confirmed : Confirmé par le patient
        - in_progress : En cours de traitement
        - completed : Terminé avec succès
        - cancelled : Annulé
        - no_show : Patient absent

    CareType:
      type: string
      enum:
        - consultation
        - urgence
        - detartrage
        - soin
        - extraction
        - prothese
        - orthodontie
        - chirurgie
      description: |
        Types de soins disponibles :
        - consultation : Consultation de routine
        - urgence : Urgence dentaire
        - detartrage : Nettoyage et détartrage
        - soin : Soin dentaire général
        - extraction : Extraction dentaire
        - prothese : Pose/ajustement prothèse
        - orthodontie : Traitement orthodontique
        - chirurgie : Chirurgie dentaire

    PaginationMetadata:
      type: object
      properties:
        total:
          type: integer
          minimum: 0
          description: Nombre total d'éléments
        page:
          type: integer
          minimum: 1
          description: Page actuelle
        per_page:
          type: integer
          minimum: 1
          maximum: 100
          description: Éléments par page
        total_pages:
          type: integer
          minimum: 0
          description: Nombre total de pages
        has_next:
          type: boolean
          description: Page suivante disponible
        has_prev:
          type: boolean
          description: Page précédente disponible

    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              description: Code d'erreur machine
              example: "INVALID_PHONE_FORMAT"
            message:
              type: string
              description: Message d'erreur humain
              example: "Le numéro de téléphone doit être au format algérien (+213)"
            details:
              type: object
              description: Détails additionnels
            field:
              type: string
              description: Champ en erreur (si applicable)
            request_id:
              type: string
              format: uuid
              description: ID de requête pour debugging
        timestamp:
          type: string
          format: date-time
          description: Timestamp de l'erreur

  examples:
    AppointmentRequestSimple:
      summary: Demande simple de RDV
      value:
        message: "Bonjour, je voudrais prendre un rendez-vous pour un détartrage"
        patient_context:
          name: "Karim Benali"
          phone_e164: "+213555123456"

    AppointmentRequestUrgent:
      summary: Demande urgente
      value:
        message: "J'ai très mal aux dents depuis hier soir, c'est urgent !"
        patient_context:
          phone_e164: "+213667789012"
        context:
          urgency_level: "emergency"

    AppointmentResponseSlots:
      summary: Créneaux disponibles
      value:
        action: "FIND_SLOTS"
        clinic_address: "Cité 109, Daboussy El Achour, Alger"
        timezone: "Africa/Algiers"
        status: "CONFIRMED"
        care_type: "detartrage"
        available_slots:
          - start_iso: "2025-08-16T09:00:00+01:00"
            end_iso: "2025-08-16T09:45:00+01:00"
            available: true
          - start_iso: "2025-08-16T14:30:00+01:00"
            end_iso: "2025-08-16T15:15:00+01:00"
            available: true

    AppointmentResponseCreated:
      summary: RDV créé avec succès
      value:
        action: "CREATE"
        clinic_address: "Cité 109, Daboussy El Achour, Alger"
        timezone: "Africa/Algiers"
        status: "CONFIRMED"
        appointment_id: "apt_abc123def456"
        patient:
          name: "Karim Benali"
          phone_e164: "+213555123456"
          patient_id: "pat_789xyz"
        slot:
          start_iso: "2025-08-16T09:00:00+01:00"
          end_iso: "2025-08-16T09:45:00+01:00"
          duration_minutes: 45
        care_type: "detartrage"
        reason: "Nettoyage de routine"

tags:
  - name: Appointments
    description: Gestion des rendez-vous médicaux
  - name: Slots
    description: Gestion des créneaux horaires
  - name: Calendar
    description: Vue calendrier des rendez-vous
  - name: Patients
    description: Gestion des patients
  - name: Notifications
    description: Système de notifications

x-webhooks:
  appointment_created:
    post:
      summary: Nouveau rendez-vous créé
      description: Webhook déclenché lors de la création d'un RDV
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                event:
                  type: string
                  const: "appointment.created"
                data:
                  $ref: '#/components/schemas/AppointmentDetail'
                timestamp:
                  type: string
                  format: date-time
                cabinet_id:
                  type: string
                  format: uuid

  appointment_updated:
    post:
      summary: Rendez-vous modifié
      description: Webhook déclenché lors de la modification d'un RDV
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                event:
                  type: string
                  const: "appointment.updated"
                data:
                  $ref: '#/components/schemas/AppointmentDetail'
                changes:
                  type: object
                  description: Champs modifiés
                timestamp:
                  type: string
                  format: date-time
                cabinet_id:
                  type: string
                  format: uuid

  appointment_cancelled:
    post:
      summary: Rendez-vous annulé
      description: Webhook déclenché lors de l'annulation d'un RDV
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                event:
                  type: string
                  const: "appointment.cancelled"
                data:
                  $ref: '#/components/schemas/AppointmentDetail'
                reason:
                  type: string
                cancelled_by:
                  type: string
                  enum: ["patient", "staff", "system"]
                timestamp:
                  type: string
                  format: date-time
                cabinet_id:
                  type: string
                  format: uuid
```

## Codes d'Erreur Spécifiques

| Code | Description | Action |
|------|-------------|---------|
| `INVALID_PHONE_FORMAT` | Format téléphone incorrect | Utiliser format +213XXXXXXXXX |
| `CLINIC_ADDRESS_MISMATCH` | Adresse cabinet incorrecte | Vérifier adresse fixe |
| `TIMEZONE_INVALID` | Fuseau horaire incorrect | Utiliser Africa/Algiers |
| `SLOT_UNAVAILABLE` | Créneau non disponible | Proposer alternatives |
| `PATIENT_NOT_FOUND` | Patient inexistant | Créer nouveau patient |
| `CARE_TYPE_INVALID` | Type de soin non supporté | Utiliser enum CareType |
| `DURATION_OUT_OF_RANGE` | Durée invalide | Entre 15 et 180 minutes |
| `APPOINTMENT_CONFLICT` | Conflit de planning | Choisir autre créneau |
| `MISSING_REQUIRED_INFO` | Informations manquantes | Fournir champs requis |
| `RATE_LIMIT_EXCEEDED` | Trop de requêtes | Attendre avant retry |
| `AI_PROCESSING_ERROR` | Erreur traitement IA | Reformuler la demande |
| `JSON_VALIDATION_FAILED` | JSON invalide | Vérifier format |

## Limites et Quotas

| Ressource | Limite | Période |
|-----------|--------|---------|
| Requêtes API | 1000 | 1 heure |
| Créations RDV | 100 | 1 heure |
| Recherches patients | 500 | 1 heure |
| Webhooks | 10000 | 1 jour |
| Taille requête | 1 MB | - |
| Timeout | 30 secondes | - |

## Environnements

| Environnement | URL Base | Description |
|---------------|----------|-------------|
| Production | `https://api.nova-platform.com/v2` | Système en production |
| Staging | `https://staging-api.nova-platform.com/v2` | Tests pré-production |
| Développement | `http://localhost:3000/api` | Développement local |

## Authentification

L'API utilise des tokens JWT Bearer avec les claims suivants :

```json
{
  "sub": "user_id",
  "iat": 1692097200,
  "exp": 1692100800,
  "cabinet_assignments": ["cabinet-123"],
  "roles": ["manager"],
  "permissions": ["appointments:read", "appointments:write"]
}
```

## Support WebSocket

URL WebSocket : `wss://api.nova-platform.com/ws`

Événements temps réel :
- `appointment_created`
- `appointment_updated` 
- `appointment_cancelled`
- `slot_availability_changed`

Cette spécification garantit une intégration robuste avec validation stricte des contraintes système NOVA.