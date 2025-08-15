# NOVA RDV v2 - Stack Technologique et Décisions Architecturales

## Vue d'ensemble

Le système NOVA RDV v2 est construit avec un stack moderne privilégiant la performance, la sécurité et la maintenabilité. Chaque choix technologique est justifié par les contraintes spécifiques du secteur médical algérien.

## Frontend / Interface Utilisateur

### Next.js 15 avec App Router
**Choix :** Framework React full-stack
**Raison :**
- **SSR/SSG** : Améliore SEO et performance initiale
- **App Router** : Nouvelle architecture plus performante
- **API Routes** : Backend intégré pour simplicité déploiement
- **Optimisations** : Bundle splitting, lazy loading automatique
- **TypeScript natif** : Sécurité de type end-to-end

```typescript
// Configuration Next.js optimisée
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
    typedRoutes: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  images: {
    domains: ['nova-platform.com'],
    formats: ['image/avif', 'image/webp']
  }
}
```

**Alternatives considérées :**
- **Nuxt.js** : Rejeté car équipe plus familière avec React
- **SvelteKit** : Rejeté car écosystème moins mature
- **Remix** : Rejeté car communauté plus petite

### React 19 avec Concurrent Features
**Choix :** Version cutting-edge de React
**Raison :**
- **Concurrent rendering** : UI responsive même avec calculs lourds
- **Suspense** : Meilleure gestion des états de chargement
- **Server Components** : Réduction bundle côté client
- **Automatic batching** : Optimisations de rendu automatiques

```typescript
// Utilisation Suspense pour chargement données
function AppointmentCalendar() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <AppointmentGrid />
    </Suspense>
  )
}

// Server Component pour données statiques
async function AppointmentList({ cabinetId }: { cabinetId: string }) {
  const appointments = await getAppointments(cabinetId)
  return <div>{/* Rendu côté serveur */}</div>
}
```

### TailwindCSS 4.0 avec Design System NOVA
**Choix :** Framework CSS utility-first
**Raison :**
- **Performance** : CSS minimal en production
- **Consistance** : Design tokens centralisés
- **Productivité** : Développement rapide
- **Maintenance** : Pas de CSS legacy à maintenir

```typescript
// Design tokens NOVA
export const designSystem = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#0066ff', // Bleu NOVA principal
      900: '#1e3a8a'
    },
    medical: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    }
  },
  spacing: {
    // Espacement basé sur grille 8px
    '18': '4.5rem', // 72px pour composants médicaux
  }
}
```

## Backend / API

### Node.js 20 LTS avec TypeScript
**Choix :** Runtime JavaScript server-side
**Raison :**
- **Performance** : V8 engine optimisé
- **Écosystème** : npm packages pour intégrations
- **Unification** : Même langage frontend/backend
- **LTS** : Support long terme pour stabilité

**Configuration TypeScript stricte :**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true
  }
}
```

### Validation avec Zod
**Choix :** Bibliothèque de validation TypeScript-first
**Raison :**
- **Type safety** : Génération automatique de types
- **Runtime validation** : Sécurité données entrantes
- **API cohérente** : Même schémas frontend/backend
- **Performance** : Validation rapide et optimisée

```typescript
// Schémas de validation stricts
export const AppointmentCreateSchema = z.object({
  patient: z.object({
    name: z.string().min(1).max(120),
    phone_e164: z.string().regex(/^\+213[567]\d{8}$/),
    email: z.string().email().optional()
  }),
  slot: z.object({
    start_iso: z.string().datetime(),
    end_iso: z.string().datetime(),
    duration_minutes: z.number().int().min(15).max(180)
  }),
  care_type: z.enum([
    'consultation', 'urgence', 'detartrage', 
    'soin', 'extraction', 'prothese', 
    'orthodontie', 'chirurgie'
  ]),
  clinic_address: z.literal('Cité 109, Daboussy El Achour, Alger'),
  timezone: z.literal('Africa/Algiers')
})

// Inférence automatique des types
type AppointmentCreate = z.infer<typeof AppointmentCreateSchema>
```

## Base de Données

### PostgreSQL 16 avec Extensions
**Choix :** Base de données relationnelle avancée
**Raison :**
- **ACID compliance** : Intégrité données médicales critiques
- **JSON support** : Flexibilité pour métadonnées
- **Performances** : Indexation avancée, requêtes complexes
- **Extensions** : pg_cron pour tâches automatisées
- **Isolation** : ROW LEVEL SECURITY pour multi-tenancy

```sql
-- Configuration optimisée pour NOVA
-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Paramètres performances
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
```

**Stratégie Multi-tenant :**
```sql
-- Isolation stricte par cabinet
CREATE POLICY cabinet_isolation ON appointments
    FOR ALL TO authenticated_users
    USING (cabinet_id = current_setting('app.current_cabinet_id')::uuid);

-- Index pour performances multi-tenant
CREATE INDEX CONCURRENTLY idx_appointments_cabinet_scheduled 
ON appointments(cabinet_id, scheduled_at) 
WHERE status IN ('scheduled', 'confirmed');
```

### Redis 7 pour Cache et Sessions
**Choix :** Base de données en mémoire
**Raison :**
- **Performance** : Cache ultra-rapide < 1ms
- **Sessions** : Stockage JWT et refresh tokens
- **Pub/Sub** : Notifications temps réel WebSocket
- **Persistence** : AOF pour durabilité critique

```typescript
// Configuration Redis pour NOVA
export const redisConfig = {
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0, // Base principale
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  // Sérialisation optimisée
  keyPrefix: 'nova:',
  // Pool de connexions
  family: 4,
  compression: 'gzip'
}

// Patterns de cache
class AppointmentCache {
  async getAvailableSlots(date: string, cabinetId: string): Promise<TimeSlot[]> {
    const key = `slots:${cabinetId}:${date}`
    const cached = await redis.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    const slots = await this.calculateSlots(date, cabinetId)
    await redis.setex(key, 300, JSON.stringify(slots)) // 5min TTL
    return slots
  }
}
```

## Intelligence Artificielle

### Anthropic Claude 3.7 Sonnet
**Choix :** LLM pour traitement langage naturel
**Raison :**
- **Compréhension française** : Excellent pour l'algérien français
- **Tool calling** : Integration API native
- **JSON mode** : Réponses structurées garanties
- **Context window** : 200k tokens pour conversations longues
- **Fiabilité** : Moins d'hallucinations que alternatives

```typescript
// Configuration optimisée pour RDV médicaux
export class AppointmentAI {
  private anthropic: Anthropic
  
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 30000
    })
  }

  async processAppointmentRequest(message: string): Promise<AppointmentResponse> {
    const response = await this.anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      temperature: 0.1, // Déterministe pour cohérence
      system: MEDICAL_APPOINTMENT_SYSTEM_PROMPT,
      tools: [appointmentTool],
      tool_choice: { type: "tool", name: "rdv_json" },
      thinking: { type: "disabled" }, // Pas de raisonnement visible
      messages: [{ 
        role: "user", 
        content: message 
      }]
    })

    return this.extractStructuredResponse(response)
  }
}
```

**Alternatives considérées :**
- **OpenAI GPT-4** : Rejeté car moins bon en français médical
- **Google Gemini** : Rejeté car tool calling moins mature
- **Cohere Command** : Rejeté car support français limité

## Temps Réel et Communication

### WebSocket avec WS Library
**Choix :** Communication bidirectionnelle temps réel
**Raison :**
- **Faible latence** : Notifications instantanées < 100ms
- **Simplicité** : Pas de sur-ingénierie vs Socket.IO
- **Performance** : Moins d'overhead que HTTP polling
- **Scalabilité** : Support clustering avec Redis

```typescript
// Serveur WebSocket optimisé
export class NovaWebSocketServer {
  private wss: WebSocketServer
  private clients = new Map<string, Set<WebSocket>>()

  constructor() {
    this.wss = new WebSocketServer({
      port: 8080,
      perMessageDeflate: true, // Compression
      maxPayload: 16 * 1024, // 16KB max
      clientTracking: true
    })

    this.setupHeartbeat()
    this.setupRoomManagement()
  }

  // Isolation par cabinet
  joinCabinetRoom(ws: WebSocket, cabinetId: string) {
    if (!this.clients.has(cabinetId)) {
      this.clients.set(cabinetId, new Set())
    }
    this.clients.get(cabinetId)!.add(ws)
  }

  // Diffusion événements RDV
  broadcastAppointmentUpdate(cabinetId: string, event: AppointmentEvent) {
    const clients = this.clients.get(cabinetId)
    if (!clients) return

    const message = JSON.stringify({
      type: 'appointment_update',
      data: event,
      timestamp: new Date().toISOString()
    })

    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  }
}
```

### Nodemailer pour Notifications Email
**Choix :** Bibliothèque email Node.js mature
**Raison :**
- **Fiabilité** : Battle-tested en production
- **Templates** : Support HTML/text avec variables
- **Queuing** : Intégration avec Redis Bull
- **Providers** : Support SMTP/SendGrid/SES

## Authentification et Sécurité

### JWT avec Refresh Tokens
**Choix :** Tokens stateless pour authentification
**Raison :**
- **Scalabilité** : Pas d'état serveur à maintenir
- **Performance** : Validation locale sans DB
- **Sécurité** : Courte durée de vie (15min)
- **Mobile-friendly** : Standard pour applications mobiles

```typescript
// Service d'authentification sécurisé
export class AuthService {
  private jwtSecret = process.env.JWT_SECRET!
  private refreshSecret = process.env.JWT_REFRESH_SECRET!

  generateTokens(user: User): TokenPair {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        cabinet_assignments: user.cabinetAssignments,
        permissions: this.getUserPermissions(user)
      },
      this.jwtSecret,
      { 
        expiresIn: '15m',
        issuer: 'nova-platform',
        audience: 'nova-api'
      }
    )

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  async validateAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired', 'TOKEN_EXPIRED')
      }
      throw new AuthError('Invalid token', 'TOKEN_INVALID')
    }
  }
}
```

### Speakeasy pour MFA (TOTP)
**Choix :** Bibliothèque 2FA standard
**Raison :**
- **Sécurité médicale** : Données sensibles nécessitent MFA
- **Standards** : RFC 6238 TOTP compatible Google Authenticator
- **Backup codes** : Récupération en cas de perte device
- **Simplicité** : API claire et documentée

```typescript
// Configuration MFA pour praticiens
export class MFAService {
  generateSecret(user: User): MFASecret {
    const secret = speakeasy.generateSecret({
      name: `NOVA (${user.email})`,
      issuer: 'NOVA Platform',
      length: 32
    })

    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: user.email,
      issuer: 'NOVA Platform',
      encoding: 'ascii'
    })

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // ±1 période de 30s pour tolérance
    })
  }
}
```

## Gestion du Temps et Internationalisation

### date-fns avec Timezone Support
**Choix :** Bibliothèque de manipulation dates
**Raison :**
- **Tree-shaking** : Import sélectif des fonctions
- **Performance** : Plus rapide que Moment.js
- **Immutable** : Fonctions pures, pas d'effets de bord
- **TypeScript** : Support natif avec types stricts

```typescript
// Gestion timezone Africa/Algiers
import { 
  format, 
  parseISO, 
  zonedTimeToUtc, 
  utcToZonedTime 
} from 'date-fns'
import { fr } from 'date-fns/locale'

export class AlgerianTimeService {
  private static readonly TIMEZONE = 'Africa/Algiers'
  private static readonly UTC_OFFSET = '+01:00'

  // Conversion vers timezone locale (toujours +01:00)
  static toAlgerianTime(utcDate: Date): Date {
    return utcToZonedTime(utcDate, this.TIMEZONE)
  }

  // Format pour affichage utilisateur
  static formatForUser(date: Date): string {
    const algerianTime = this.toAlgerianTime(date)
    return format(algerianTime, 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  // Validation que la date est bien dans le fuseau correct
  static validateTimezone(isoString: string): boolean {
    return isoString.endsWith(this.UTC_OFFSET)
  }

  // Génération créneaux disponibles
  static generateSlots(date: string, duration: number): TimeSlot[] {
    const workingHours = { start: 8, end: 18 } // 8h-18h
    const slots: TimeSlot[] = []
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const startTime = `${date}T${hour.toString().padStart(2, '0')}:00:00${this.UTC_OFFSET}`
      const endTime = `${date}T${hour.toString().padStart(2, '0')}:${duration.toString().padStart(2, '0')}:00${this.UTC_OFFSET}`
      
      slots.push({
        start_iso: startTime,
        end_iso: endTime,
        available: true
      })
    }
    
    return slots
  }
}
```

## Testing et Qualité Code

### Vitest pour Tests Unitaires
**Choix :** Framework de test moderne
**Raison :**
- **Performance** : Plus rapide que Jest
- **Vite integration** : Même configuration build/test
- **ESM natif** : Support modules ES sans configuration
- **Watch mode** : Rechargement instant

```typescript
// Configuration Vitest optimisée
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts'
      ]
    },
    // Isolation tests base de données
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
})

// Tests types avec données médicales
describe('AppointmentService', () => {
  it('should create appointment with Algeria timezone', async () => {
    const appointment = await appointmentService.create({
      patient: {
        name: 'Ahmed Benali',
        phone_e164: '+213555123456'
      },
      slot: {
        start_iso: '2025-08-16T09:00:00+01:00',
        end_iso: '2025-08-16T09:30:00+01:00'
      },
      care_type: 'consultation',
      clinic_address: 'Cité 109, Daboussy El Achour, Alger',
      timezone: 'Africa/Algiers'
    })

    expect(appointment.timezone).toBe('Africa/Algiers')
    expect(appointment.scheduled_at).toMatch(/\+01:00$/)
  })
})
```

### Playwright pour Tests E2E
**Choix :** Framework de test end-to-end
**Raison :**
- **Multi-browser** : Chrome, Firefox, Safari, Edge
- **Performance** : Parallélisation native
- **API moderne** : async/await, auto-wait
- **Debugging** : Trace viewer, screenshots automatiques

```typescript
// Tests critiques parcours RDV
test.describe('Appointment Booking Flow', () => {
  test('should book appointment via chat interface', async ({ page }) => {
    await page.goto('/rdv')
    
    // Simulation conversation naturelle
    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Bonjour, je voudrais un RDV pour demain matin')
    await chatInput.press('Enter')
    
    // Vérification réponse IA structurée
    const response = await page.locator('[data-testid="ai-response"]').first()
    await expect(response).toContainText('créneaux disponibles')
    
    // Sélection créneau
    const slot = page.locator('[data-testid="time-slot"]').first()
    await slot.click()
    
    // Formulaire patient
    await page.locator('[data-testid="patient-name"]').fill('Ahmed Benali')
    await page.locator('[data-testid="patient-phone"]').fill('+213555123456')
    
    // Confirmation
    await page.locator('[data-testid="confirm-appointment"]').click()
    
    // Vérification succès
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Rendez-vous confirmé')
  })
})
```

### ESLint + TypeScript Strict
**Configuration :** Linting strict pour qualité code
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Monitoring et Observabilité

### Logs Structurés avec Winston
**Choix :** Logging professionnel
**Raison :**
- **Structure JSON** : Parsing automatique logs
- **Niveaux** : debug, info, warn, error, critical
- **Transports** : Console, fichier, base de données
- **Rotation** : Gestion automatique taille fichiers

```typescript
// Configuration logging médical
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'nova-rdv',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
})

// Logs spécifiques RGPD/HIPAA
export function logPatientAccess(
  userId: string, 
  patientId: string, 
  action: string,
  cabinetId: string
) {
  logger.info('Patient data access', {
    type: 'PATIENT_ACCESS',
    user_id: userId,
    patient_id: patientId,
    action,
    cabinet_id: cabinetId,
    ip_address: getCurrentIP(),
    user_agent: getCurrentUserAgent(),
    timestamp: new Date().toISOString(),
    compliance: 'RGPD'
  })
}
```

## DevOps et Déploiement

### Docker Multi-stage
**Choix :** Containerisation optimisée
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### GitHub Actions CI/CD
**Pipeline :** Automatisation déploiement
```yaml
name: Deploy NOVA RDV v2
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: javascript
      - uses: github/codeql-action/analyze@v2

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: nova-rdv-v2
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## Métriques de Performance

### Objectifs SLA
- **Temps de réponse API** : < 200ms (p95)
- **Disponibilité** : 99.9% (8.76h downtime/an max)
- **Traitement IA** : < 2s pour analyse NLP
- **WebSocket latency** : < 100ms pour notifications
- **Taux d'erreur** : < 0.1% requêtes valides

### Monitoring
```typescript
// Métriques application custom
export class NovaMetrics {
  private static metrics = new Map<string, number>()

  static recordAppointmentCreation(duration: number, success: boolean) {
    this.metrics.set('appointments_created_total', 
      (this.metrics.get('appointments_created_total') || 0) + 1)
    
    if (success) {
      this.metrics.set('appointments_created_success_total',
        (this.metrics.get('appointments_created_success_total') || 0) + 1)
    }
    
    this.metrics.set('appointments_creation_duration_ms', duration)
  }

  static recordAIProcessing(duration: number, tokens: number) {
    this.metrics.set('ai_requests_total',
      (this.metrics.get('ai_requests_total') || 0) + 1)
    
    this.metrics.set('ai_processing_duration_ms', duration)
    this.metrics.set('ai_tokens_consumed', tokens)
  }
}
```

## Sécurité et Conformité

### RGPD/GDPR Compliance
- **Chiffrement** : AES-256 pour données au repos
- **Transport** : TLS 1.3 pour données en transit
- **Audit logs** : Traçabilité complète accès données
- **Retention** : 7 ans pour données médicales
- **Anonymisation** : Pseudonymisation après suppression

### Validation E.164 Phone Format
```typescript
// Validation stricte numéros algériens
export const ALGERIAN_PHONE_REGEX = /^\+213[567]\d{8}$/

export function validateAlgerianPhone(phone: string): boolean {
  return ALGERIAN_PHONE_REGEX.test(phone)
}

export function formatAlgerianPhone(phone: string): string {
  // Normalise différents formats vers E.164
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('213')) {
    return `+${cleaned}`
  }
  
  if (cleaned.startsWith('0')) {
    return `+213${cleaned.substring(1)}`
  }
  
  if (cleaned.length === 9) {
    return `+213${cleaned}`
  }
  
  throw new Error('Invalid Algerian phone number format')
}
```

Cette stack technologique garantit un système robuste, performant et conforme aux exigences médicales algériennes tout en respectant les contraintes de développement moderne.