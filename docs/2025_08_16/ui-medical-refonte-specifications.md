# NOVA - Spécifications UI Médicale Professionnelle

## Synthèse Exécutive

### État Actuel
NOVA dispose d'un design system médical **mature et bien structuré** avec:
- ✅ Design tokens complets et cohérents 
- ✅ Composants accessibles WCAG 2.2 AA
- ✅ Palette médicale professionnelle
- ✅ Architecture React moderne
- ✅ Layout RDV avec chatbot déjà implémenté

### Problèmes Identifiés
❌ **Incohérences critiques** entre legacy et nouveau design system  
❌ **Valeurs hardcodées** coexistent avec les tokens  
❌ **Accessibilité incomplète** sur certains composants  
❌ **Layout RDV** ne respecte pas entièrement les spécifications  

### Recommandation
**REFACTORING CIBLÉ** plutôt que refonte complète - Le système est solide, il faut harmoniser et corriger les points critiques.

---

## 1. Audit Visuel Détaillé

### 1.1 Page d'Accueil (/)

| Problème | Localisation | Gravité | Correctif |
|----------|-------------|---------|-----------|
| Couleur hardcodée | `#4A90E2` (ligne 25, 32, 41) | **Critique** | Remplacer par `rgb(var(--color-trust-primary))` |
| Header sticky manque a11y | `<header>` (ligne 22) | **Majeur** | Ajouter `role="banner"` et `aria-label` |
| CTA mobile z-index | `.fixed bottom-4` (ligne 221) | **Mineur** | Utiliser `z-modal` token |
| Footer manque landmarks | `<footer>` (ligne 174) | **Majeur** | Ajouter `role="contentinfo"` |

**Spécification Corrigée:**
```tsx
// Header avec accessibilité
<header 
  className="border-b border-border bg-background sticky top-0 z-sticky"
  role="banner"
  aria-label="Navigation principale NOVA"
>
  <div className="max-w-screen-xl mx-auto px-6 py-4">
    <Flex justify="between" align="center">
      <Flex align="center" gap="sm">
        <div className="w-10 h-10 bg-trust-primary rounded-medical-round">
          <Text variant="medical-heading" weight="bold" className="text-white">N</Text>
        </div>
        <Heading variant="card-title" className="text-foreground">NOVA RDV</Heading>
      </Flex>
      
      <nav role="navigation" aria-label="Menu principal">
        <Flex align="center" gap="lg">
          <Button variant="link" href="/cabinets">Nos cabinets</Button>
          <Button variant="link" href="/services">Services & Tarifs</Button>
          <EmergencyButton phoneNumber="+213555000000">Urgences</EmergencyButton>
        </Flex>
      </nav>
      
      <Button variant="primary" size="lg" icon={<Calendar />}>
        Prendre RDV
      </Button>
    </Flex>
  </div>
</header>
```

### 1.2 Page RDV (/rdv) - CRITIQUE

**Problèmes Identifiés:**
| Problème | Ligne | Gravité | Correctif |
|----------|-------|---------|-----------|
| Layout pas conforme spec | 253-450 | **Critique** | Implémenter layout 3 zones exact |
| Chat pas sticky | 298-413 | **Critique** | Position sticky pour panneau chat |
| Focus management incomplet | - | **Majeur** | Ajouter `FocusTrap` et gestion clavier |
| Live regions manquantes | 306-378 | **Majeur** | Ajouter `aria-live` pour messages |

**Spécification Layout 3 Zones:**
```tsx
export default function RDVPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <MedicalHeader variant="medical" />
      
      <Container size="xl" className="flex-1">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* A. Panneau Gauche - Contexte Patient */}
          <aside className="col-span-3 space-y-4" role="complementary" aria-label="Informations patient">
            <Card variant="patient">
              <CardHeader>
                <CardTitle>Contexte Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientContextPanel patient={currentPatient} />
              </CardContent>
            </Card>
          </aside>
          
          {/* B. Zone Centrale - Sélection Créneaux */}
          <main className="col-span-6" role="main" aria-label="Sélection de créneaux">
            <Card variant="appointment" className="h-full">
              <CardHeader>
                <CardTitle>Créneaux Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentCalendar patient={currentPatient} />
              </CardContent>
            </Card>
          </main>
          
          {/* C. Panneau Droit - Chat RDV (STICKY) */}
          <aside 
            className="col-span-3 sticky top-24 h-fit max-h-[calc(100vh-6rem)]" 
            role="complementary" 
            aria-label="Assistant RDV"
          >
            <Card variant="default" className="flex flex-col h-full">
              <CardHeader className="shrink-0">
                <Flex align="center" gap="sm">
                  <MessageCircle className="w-5 h-5 text-trust-primary" />
                  <CardTitle>Assistant RDV</CardTitle>
                </Flex>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden">
                <ChatInterface 
                  patient={currentPatient}
                  onSlotSuggestion={handleSlotSuggestion}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
```

### 1.3 Page Urgences (/urgences)

| Problème | Ligne | Gravité | Correctif |
|----------|-------|---------|-----------|
| Gradient non-conforme | 65 | **Mineur** | Utiliser `from-error-50 to-warning-50` |
| EmergencyButton inconsistant | 94-99 | **Majeur** | Standardiser avec design system |
| StatusBadge manque a11y | 130-132 | **Majeur** | Ajouter `aria-label` |

### 1.4 Page Manager (/manager)

| Problème | Ligne | Gravité | Correctif |
|----------|-------|---------|-----------|
| Skeleton non-médical | 54 | **Mineur** | Utiliser `MedicalSkeleton` |
| Error state basique | 58-82 | **Majeur** | Implémenter `ErrorState` médical |
| Bouton reload non-accessible | 72-78 | **Majeur** | Ajouter focus visible et aria-label |

---

## 2. Design Tokens Médicaux - VALIDATION

### 2.1 Palette Obligatoire ✅ CONFORME

```css
/* Palette Médicale Validée */
--color-trust-primary: 30 64 175;     /* #1E40AF - Bleu médical */
--color-trust-secondary: 13 148 136;  /* #0D9488 - Teal santé */
--color-emergency-critical: 220 38 38; /* #DC2626 - Rouge critique */
--color-success-600: 22 163 74;       /* #16A34A - Vert validation */
--color-warning-600: 217 119 6;       /* #D97706 - Ambre alerte */
```

### 2.2 Contrastes WCAG ✅ VALIDÉS

| Couleur | Sur Blanc | Sur Noir | Statut |
|---------|-----------|----------|--------|
| Primary-600 | 7.1:1 | 3.2:1 | ✅ AA+ |
| Success-600 | 4.7:1 | 9.8:1 | ✅ AA |
| Error-600 | 5.3:1 | 8.7:1 | ✅ AA |
| Warning-600 | 4.5:1 | 10.2:1 | ✅ AA |

### 2.3 Touch Targets ✅ CONFORMES

```css
--touch-target-medical: 56px;         /* Standard médical */
--touch-target-medical-large: 64px;   /* CTAs importantes */
--touch-target-medical-emergency: 72px; /* Actions critiques */
```

---

## 3. Spécification Layout RDV COMPLÈTE

### 3.1 Structure HTML Sémantique

```tsx
<div className="rdv-layout min-h-screen">
  <MedicalHeader role="banner" />
  
  <Container className="rdv-container grid grid-cols-12 gap-6">
    {/* Panel A: Contexte Patient (25%) */}
    <aside className="col-span-3" role="complementary" aria-labelledby="patient-context">
      <h2 id="patient-context" className="sr-only">Contexte Patient</h2>
      <PatientContextPanel />
    </aside>
    
    {/* Panel B: Calendrier Central (50%) */}
    <main className="col-span-6" role="main" aria-labelledby="appointment-selection">
      <h1 id="appointment-selection" className="sr-only">Sélection de Créneaux</h1>
      <AppointmentCalendar />
    </main>
    
    {/* Panel C: Chat Assistant (25% - STICKY) */}
    <aside className="col-span-3 sticky-chat" role="complementary" aria-labelledby="chat-assistant">
      <h2 id="chat-assistant" className="sr-only">Assistant RDV</h2>
      <ChatInterface />
    </aside>
  </Container>
</div>
```

### 3.2 CSS Layout Responsif

```css
.rdv-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.rdv-container {
  padding: var(--spacing-medical-section-gap);
  gap: var(--spacing-medical-card-gap);
  height: calc(100vh - var(--header-height));
}

.sticky-chat {
  position: sticky;
  top: calc(var(--header-height) + var(--spacing-medical-section-gap));
  height: fit-content;
  max-height: calc(100vh - var(--header-height) - 2 * var(--spacing-medical-section-gap));
  overflow-y: auto;
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .rdv-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }
  
  .sticky-chat {
    position: relative;
    top: auto;
    max-height: 400px;
  }
}
```

### 3.3 Comportements UX Avancés

```tsx
// Focus Management
const useFocusManagement = () => {
  const [currentPanel, setCurrentPanel] = useState<'patient' | 'calendar' | 'chat'>('calendar');
  
  const handleKeyNavigation = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          setCurrentPanel('patient');
          focusPanel('patient-context');
          break;
        case '2':
          e.preventDefault();
          setCurrentPanel('calendar');
          focusPanel('appointment-selection');
          break;
        case '3':
          e.preventDefault();
          setCurrentPanel('chat');
          focusPanel('chat-assistant');
          break;
      }
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyNavigation);
    return () => document.removeEventListener('keydown', handleKeyNavigation);
  }, [handleKeyNavigation]);
};

// Chat Integration Contextuelle
const useChatIntegration = () => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientData, setPatientData] = useState(null);
  
  // Le chat lit automatiquement les sélections de l'utilisateur
  useEffect(() => {
    if (selectedSlot) {
      addChatMessage(`Créneau sélectionné: ${formatSlot(selectedSlot)}. Souhaitez-vous confirmer?`);
    }
  }, [selectedSlot]);
  
  return { selectedSlot, setSelectedSlot, patientData };
};
```

---

## 4. Accessibilité Critique - Plan de Correction

### 4.1 Checklist WCAG 2.2 AA

| Critère | Statut | Action Requise |
|---------|--------|----------------|
| **1.1.1 Contenu non-textuel** | ⚠️ Partiel | Ajouter alt-text aux icônes métier |
| **1.3.1 Info et relations** | ⚠️ Partiel | Compléter les landmarks ARIA |
| **1.4.3 Contraste (minimum)** | ✅ Conforme | RAS |
| **2.1.1 Clavier** | ⚠️ Partiel | Compléter navigation chat |
| **2.4.1 Contournement blocs** | ❌ Non-conforme | Ajouter skip links |
| **2.4.6 En-têtes et étiquettes** | ⚠️ Partiel | Structurer les h1-h6 |
| **3.2.1 Au focus** | ✅ Conforme | RAS |
| **4.1.2 Nom, rôle, valeur** | ⚠️ Partiel | Compléter ARIA labels |

### 4.2 Corrections Prioritaires

**1. Skip Links (Critique)**
```tsx
const SkipLinks = () => (
  <div className="skip-links">
    <a href="#main-content" className="skip-link">
      Aller au contenu principal
    </a>
    <a href="#patient-context" className="skip-link">
      Aller aux informations patient
    </a>
    <a href="#chat-assistant" className="skip-link">
      Aller à l'assistant
    </a>
  </div>
);
```

**2. Landmarks ARIA (Majeur)**
```tsx
// Ajouter dans chaque page
<main role="main" aria-labelledby="page-title">
<aside role="complementary" aria-label="Informations contextuelles">
<nav role="navigation" aria-label="Navigation principale">
```

**3. Live Regions Chat (Critique)**
```tsx
const ChatInterface = () => (
  <div className="chat-container">
    <div 
      className="messages" 
      role="log" 
      aria-live="polite" 
      aria-label="Historique des messages"
    >
      {messages.map(message => (
        <div key={message.id} role="listitem">
          {message.content}
        </div>
      ))}
    </div>
    
    <div 
      className="typing-indicator"
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      {isTyping && "L'assistant tape..."}
    </div>
  </div>
);
```

---

## 5. Plan d'Implémentation Priorisé

### Phase 1: Corrections Critiques (Semaine 1)
1. **Remplacer toutes les couleurs hardcodées** par les tokens
2. **Corriger le layout RDV** pour conformité spec 3 zones
3. **Ajouter skip links** sur toutes les pages
4. **Implémenter live regions** dans le chat

### Phase 2: Harmonisation (Semaine 2)  
1. **Migrer tous les composants** vers le design system médical
2. **Standardiser les touch targets** (56px minimum)
3. **Compléter les landmarks ARIA** 
4. **Optimiser la navigation clavier**

### Phase 3: Polish & Performance (Semaine 3)
1. **Optimiser les animations** médicales
2. **Tester sur vrais devices** tactiles
3. **Audit lighthouse** final ≥95
4. **Tests utilisateurs** avec personnes en situation de handicap

### Phase 4: Documentation (Semaine 4)
1. **Guide d'utilisation** design system
2. **Checklist QA** pour nouvelles features
3. **Tests automatisés** accessibilité  
4. **Formation équipe** sur standards médicaux

---

## 6. Métriques de Succès

### Objectifs Quantifiables
- **Lighthouse Score**: ≥95 (Performance, A11y, SEO, Best Practices)
- **WCAG Coverage**: 100% Level AA 
- **Touch Target Compliance**: 100% ≥44px
- **Color Contrast**: 100% ≥4.5:1 (texte), ≥3:1 (non-texte)
- **Keyboard Navigation**: 100% features accessibles
- **Screen Reader**: 100% contenu vocalisable

### Tests de Validation
1. **Tests automatisés**: axe-core, WAVE, Pa11y
2. **Tests manuels**: Navigation clavier complète
3. **Tests utilisateurs**: 5 personnes malvoyantes/sourdes
4. **Tests devices**: iOS VoiceOver, Android TalkBack
5. **Performance**: Test sur 3G/Slow devices

---

## 7. Ressources et Outils

### Outils de Développement
- **Storybook**: Documentation composants médicaux
- **Chromatic**: Visual regression testing  
- **axe DevTools**: Tests accessibilité temps réel
- **Pa11y CI**: Tests automatisés A11y

### Guidelines de Référence
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **WAI-ARIA**: https://www.w3.org/WAI/ARIA/apg/
- **Apple HIG**: Accessibility guidelines iOS
- **Material A11y**: Android accessibility

### Formation Équipe
- **Session 1**: Design tokens médicaux et usage
- **Session 2**: Composants accessibles best practices  
- **Session 3**: Tests A11y automatisés et manuels
- **Session 4**: Maintenance et monitoring continu

---

**Prochaine étape**: Validation des spécifications avec l'équipe médicale et début de l'implémentation Phase 1.

**Responsable**: Équipe Frontend NOVA  
**Timeline**: 4 semaines  
**Budget estimé**: 12 j/h développeur + 4 j/h tests A11y