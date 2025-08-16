# Prompt de Refonte UX - Page RDV NOVA (Expérience Conversationnelle Premium)

## Contexte
Page de prise de RDV actuelle qui doit devenir une expérience conversationnelle exceptionnelle inspirée de Maiia et des meilleures pratiques de booking médical.

## Prompt Spécifique

Transforme cette page de prise de RDV en une expérience conversationnelle premium style Maiia avec split-screen intelligent. Voici la refonte complète :

### LAYOUT SPLIT-SCREEN IMMERSIF
**Structure 60/40** :
- **Gauche (60%)** : Interface conversationnelle
- **Droite (40%)** : Résumé temps réel + calendrier
- Container max 1440px pour grands écrans
- Fond gradient médical subtil (bleu → blanc)

### COLONNE GAUCHE - CHAT CONVERSATIONNEL

#### Header Intelligent
```jsx
<div className="chat-header">
  {/* Avatar animé Nova */}
  <div className="nova-avatar pulse-gentle">
    <img src="/nova-ai.svg" alt="Nova Assistant" />
    <span className="status-dot online" />
  </div>
  
  {/* Infos assistant */}
  <div>
    <h2>Nova Assistant</h2>
    <p className="text-sm">🟢 En ligne • Temps de réponse < 2s</p>
  </div>
  
  {/* Progress stepper */}
  <div className="stepper">
    <StepIndicator active={1} total={4} />
  </div>
</div>
```

#### Zone de Conversation
**Messages Bot (style Maiia)** :
- Bulles bleues douces (#e3f2fd)
- Avatar Nova à gauche
- Animations d'apparition (fade + slide)
- Typing indicator avec 3 points animés

**Messages Patient** :
- Bulles blanches avec bordure
- Alignées à droite
- État "vu" avec checkmark

**Suggestions Chips** :
```jsx
<div className="suggestion-chips">
  <Chip onClick={() => select('Détartrage')}>
    🦷 Détartrage
  </Chip>
  <Chip onClick={() => select('Urgence')}>
    🚨 Urgence dentaire
  </Chip>
  <Chip onClick={() => select('Contrôle')}>
    🔍 Contrôle annuel
  </Chip>
  <Chip onClick={() => select('Esthétique')}>
    ✨ Soins esthétiques
  </Chip>
</div>
```

#### Input Zone Améliorée
```jsx
<div className="input-zone">
  <input 
    placeholder="Tapez votre message ou utilisez les suggestions..."
    className="medical-input"
  />
  <button className="voice-button">🎤</button>
  <button className="send-button">➤</button>
</div>
```

### COLONNE DROITE - RÉSUMÉ DYNAMIQUE

#### Carte Résumé RDV
```jsx
<Card className="appointment-summary sticky top-4">
  <h3>📋 Votre rendez-vous</h3>
  
  {/* Infos collectées en temps réel */}
  <div className="summary-items">
    <SummaryItem 
      icon="🦷" 
      label="Motif" 
      value={motif || "À définir"}
      status={motif ? "complete" : "pending"}
    />
    <SummaryItem 
      icon="👨‍⚕️" 
      label="Praticien" 
      value={praticien?.name || "Selon disponibilité"}
    />
    <SummaryItem 
      icon="📅" 
      label="Date" 
      value={date || "À choisir"}
    />
    <SummaryItem 
      icon="⏰" 
      label="Heure" 
      value={time || "À choisir"}
    />
  </div>
  
  {/* Tarif estimé */}
  <div className="price-estimate">
    <span>Tarif estimé:</span>
    <strong>45-75€</strong>
    <small>Remboursé à 70%</small>
  </div>
</Card>
```

#### Mini Calendrier Intégré
```jsx
<Card className="calendar-widget">
  <MiniCalendar 
    availableSlots={slots}
    onSelectDate={(date) => updateSummary({date})}
    highlightToday
    showNextAvailable
  />
  
  {/* Créneaux rapides */}
  <div className="quick-slots">
    <h4>Créneaux disponibles:</h4>
    <SlotButton time="09:00" available />
    <SlotButton time="10:30" available />
    <SlotButton time="14:00" />
    <SlotButton time="16:00" available urgent />
  </div>
</Card>
```

### FLOW CONVERSATIONNEL OPTIMISÉ

#### Étape 1: Accueil Personnalisé
```
Nova: "Bonjour ! 👋 Je suis Nova, votre assistant dentaire. 
       Je vais vous aider à prendre rendez-vous en moins de 2 minutes.
       
       Pour quel type de soin venez-vous nous voir ?"
       
[Chips: Urgence | Contrôle | Détartrage | Esthétique | Autre]
```

#### Étape 2: Urgence Detection
```
Si urgence sélectionnée:
Nova: "🚨 Je comprends qu'il s'agit d'une urgence. 
       Sur une échelle de 1 à 10, évaluez votre douleur:"
       
[Slider interactif 1-10 avec emojis]
[Si >7: Proposer urgence immédiate + numéro]
```

#### Étape 3: Sélection Praticien
```
Nova: "Avez-vous une préférence pour votre dentiste ?"

[Cards praticiens avec photos, spécialités, avis]
ou
[Chip: "Peu importe, le plus tôt possible"]
```

#### Étape 4: Choix Créneau
```
Nova: "Parfait ! Voici les prochains créneaux disponibles:"

[Calendrier interactif avec slots colorés]
- Vert: Disponible
- Orange: Dernières places
- Gris: Complet
```

### ÉLÉMENTS UX DIFFÉRENCIANTS

#### Réassurance Continue
- Badge "Données sécurisées 🔒" visible
- Compteur "1 234 RDV pris aujourd'hui"
- Temps moyen d'attente affiché
- Note moyenne cabinet (4.8⭐)

#### Animations Subtiles
- Typing indicator pendant réflexion Nova
- Confettis discrets après confirmation
- Progress bar entre étapes
- Micro-animations sur hover/focus

#### Gestion d'Erreurs Empathique
```
Nova: "Je n'ai pas bien compris 🤔 
       Pouvez-vous reformuler ou utiliser les suggestions ?"
```

#### Mode Accessibilité
- Switch "Mode simplifié" pour seniors
- Taille texte adaptable (A- A+)
- Contraste élevé disponible
- Navigation 100% clavier

### COULEURS SPÉCIFIQUES RDV
```css
--chat-blue: #e3f2fd (bulles bot)
--chat-white: #ffffff (bulles patient)
--accent-pink: #f68092 (CTAs principaux)
--success-green: #4caf50 (confirmation)
--warning-orange: #ff9800 (urgence modérée)
--error-red: #f44336 (urgence haute)
--bg-gradient: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)
```

### RESPONSIVE MOBILE
Sur mobile (<768px):
- Chat plein écran avec résumé en drawer
- Clavier ne cache pas l'input
- Chips scrollables horizontalement
- Calendrier en bottom sheet

### INTÉGRATIONS INTELLIGENTES
- Détection automatique timezone
- Sync avec Google Calendar
- SMS de rappel automatique
- Email de confirmation avec ICS
- QR code pour ajouter au wallet

### MÉTRIQUES DE SUCCÈS
- Taux de complétion >85%
- Temps moyen <90 secondes
- Satisfaction post-booking >4.5/5
- Taux d'abandon <10%
- No-show <5%

### TOUCHES FINALES
- Easter egg: Nova sourit si on lui dit "merci"
- Mode nuit automatique après 20h
- Sauvegarde automatique progression
- Reprise de session si interruption
- Multi-langue (FR/AR/EN) avec switch facile

Implémente cette expérience premium en React/Next.js avec Framer Motion pour les animations et Tailwind pour le styling. L'objectif est de créer LA meilleure expérience de prise de RDV médical, surpassant même Doctolib et Maiia.