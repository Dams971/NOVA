# Prompt de Refonte UX - Page Urgences NOVA (Interface Critique)

## Contexte
Page urgences qui doit devenir une interface critique ultra-efficace pour les situations d'urgence dentaire, avec réactivité maximale et réassurance.

## Prompt Spécifique

Crée une page urgences médicales exceptionnelle qui sauve littéralement des situations critiques. Inspiration : services d'urgence hospitaliers + Maiia urgences.

### HERO URGENCE - IMPACT IMMÉDIAT

```jsx
<div className="emergency-hero bg-gradient-urgent">
  {/* Alerte principale */}
  <div className="alert-banner pulsing">
    <span className="badge-urgent">🚨 URGENCE DENTAIRE</span>
    <h1 className="text-4xl font-bold">
      Nous sommes là pour vous aider maintenant
    </h1>
  </div>
  
  {/* Actions immédiates */}
  <div className="emergency-actions grid-3">
    <BigButton className="call-now animate-pulse">
      📞 Appeler maintenant
      <span className="subtitle">01 23 45 67 89</span>
      <span className="availability">Disponible 24/7</span>
    </BigButton>
    
    <BigButton className="book-urgent">
      ⚡ RDV Urgent
      <span className="subtitle">Sous 2 heures</span>
      <span className="slots">3 créneaux disponibles</span>
    </BigButton>
    
    <BigButton className="video-consult">
      📹 Téléconsultation
      <span className="subtitle">Immédiate</span>
      <span className="wait-time">~5 min d'attente</span>
    </BigButton>
  </div>
</div>
```

### TRIAGE INTELLIGENT - AUTO-ÉVALUATION

```jsx
<section className="triage-section">
  <h2>🩺 Évaluez votre urgence</h2>
  
  <div className="symptom-cards">
    {/* Urgence vitale */}
    <Card className="level-critical" onClick={handleCritical}>
      <span className="icon">🔴</span>
      <h3>Urgence Vitale</h3>
      <ul>
        <li>• Gonflement du visage/cou</li>
        <li>• Difficulté à respirer/avaler</li>
        <li>• Saignement incontrôlable</li>
        <li>• Traumatisme facial grave</li>
      </ul>
      <Alert>→ Appelez le 15 immédiatement</Alert>
    </Card>
    
    {/* Urgence haute */}
    <Card className="level-high" onClick={handleHigh}>
      <span className="icon">🟠</span>
      <h3>Urgence Élevée</h3>
      <ul>
        <li>• Douleur intense (8-10/10)</li>
        <li>• Abcès avec fièvre</li>
        <li>• Dent cassée avec nerf exposé</li>
        <li>• Infection qui se propage</li>
      </ul>
      <Button>→ Consultation sous 2h</Button>
    </Card>
    
    {/* Urgence modérée */}
    <Card className="level-moderate" onClick={handleModerate}>
      <span className="icon">🟡</span>
      <h3>Urgence Modérée</h3>
      <ul>
        <li>• Douleur supportable (4-7/10)</li>
        <li>• Couronne/plombage tombé</li>
        <li>• Gencive enflée localisée</li>
        <li>• Sensibilité au chaud/froid</li>
      </ul>
      <Button>→ RDV dans la journée</Button>
    </Card>
  </div>
</section>
```

### CABINETS DE GARDE - GÉOLOCALISATION

```jsx
<section className="emergency-locations">
  <h2>📍 Cabinets de garde près de vous</h2>
  
  {/* Map interactive */}
  <div className="map-container">
    <InteractiveMap 
      userLocation={currentLocation}
      emergencyCenters={centers}
      showRoute
      showWaitTimes
    />
  </div>
  
  {/* Liste des cabinets */}
  <div className="centers-list">
    {centers.map(center => (
      <CenterCard key={center.id}>
        <div className="center-info">
          <h3>{center.name}</h3>
          <p className="distance">📍 {center.distance} km</p>
          <p className="wait-time">⏱️ ~{center.waitTime} min d'attente</p>
          <p className="availability">
            {center.available ? "✅ Accepte urgences" : "❌ Complet"}
          </p>
        </div>
        <div className="center-actions">
          <Button icon="🚗">Itinéraire</Button>
          <Button icon="📞">Appeler</Button>
          <Button icon="📅">Réserver</Button>
        </div>
      </CenterCard>
    ))}
  </div>
</section>
```

### PREMIERS SOINS - GUIDE INTERACTIF

```jsx
<section className="first-aid">
  <h2>🏥 En attendant les soins</h2>
  
  <Accordion defaultOpen="pain">
    <AccordionItem value="pain">
      <h3>💊 Gérer la douleur</h3>
      <div className="aid-content">
        <Steps>
          <Step>Prendre paracétamol 1g (max 4g/jour)</Step>
          <Step>Appliquer froid sur la joue (10min on/off)</Step>
          <Step>Rincer bouche eau salée tiède</Step>
          <Step>Éviter aspirine (risque saignement)</Step>
        </Steps>
        <Warning>
          ⚠️ Ne jamais mettre d'aspirine directement sur la dent
        </Warning>
      </div>
    </AccordionItem>
    
    <AccordionItem value="bleeding">
      <h3>🩸 Arrêter un saignement</h3>
      <div className="aid-content">
        <VideoTutorial src="/first-aid-bleeding.mp4" />
        <Steps>
          <Step>Mordre compresse stérile 20 min</Step>
          <Step>Garder tête surélevée</Step>
          <Step>Éviter rinçage vigoureux</Step>
          <Step>Si persiste >30min → Urgences</Step>
        </Steps>
      </div>
    </AccordionItem>
    
    <AccordionItem value="tooth-loss">
      <h3>🦷 Dent tombée</h3>
      <Timer className="critical-timer">
        ⏰ Fenêtre critique: 30 minutes!
      </Timer>
      <Steps urgent>
        <Step>Récupérer la dent par la couronne</Step>
        <Step>Rincer doucement (pas frotter!)</Step>
        <Step>Conserver dans lait/salive</Step>
        <Step>Consulter IMMÉDIATEMENT</Step>
      </Steps>
    </AccordionItem>
  </Accordion>
</section>
```

### TÉLÉCONSULTATION EXPRESS

```jsx
<section className="video-consultation">
  <Card className="teleconsult-card gradient-medical">
    <h2>📹 Téléconsultation immédiate</h2>
    <div className="consult-info">
      <Stat icon="⏱️" label="Temps d'attente" value="<5 min" />
      <Stat icon="💰" label="Tarif" value="25€" subtext="Remboursé" />
      <Stat icon="👨‍⚕️" label="Dentistes en ligne" value="3" status="online" />
    </div>
    
    <Button className="start-video-call" size="xl">
      Démarrer la consultation vidéo
      <span className="pulse-dot live" />
    </Button>
    
    <Features>
      <Feature>✅ Ordonnance digitale</Feature>
      <Feature>✅ Conseils personnalisés</Feature>
      <Feature>✅ Suivi post-consultation</Feature>
    </Features>
  </Card>
</section>
```

### NUMÉROS UTILES - TOUJOURS VISIBLES

```jsx
<aside className="emergency-numbers sticky">
  <h3>📞 Numéros d'urgence</h3>
  <div className="numbers-grid">
    <NumberCard 
      service="SAMU" 
      number="15" 
      desc="Urgences médicales"
      className="primary"
    />
    <NumberCard 
      service="SOS Dentaire" 
      number="01 23 45 67 89" 
      desc="24/7"
    />
    <NumberCard 
      service="Centre Anti-Poison" 
      number="01 40 05 48 48"
    />
    <NumberCard 
      service="Pharmacie de garde" 
      number="3237"
    />
  </div>
</aside>
```

### CHAT D'URGENCE - FLOTTANT

```jsx
<ChatWidget className="emergency-chat">
  <ChatHeader>
    <Avatar status="online" />
    <div>
      <p className="font-bold">Dr. Sarah - Urgentiste</p>
      <p className="text-sm">Répond en <30s</p>
    </div>
  </ChatHeader>
  
  <QuickMessages>
    <QuickMsg>J'ai très mal</QuickMsg>
    <QuickMsg>Dent cassée</QuickMsg>
    <QuickMsg>Joue gonflée</QuickMsg>
    <QuickMsg>Saignement</QuickMsg>
  </QuickMessages>
</ChatWidget>
```

### DESIGN SYSTÈME URGENCE

```css
/* Couleurs urgence */
--critical-red: #dc2626
--high-orange: #ea580c  
--moderate-yellow: #f59e0b
--safe-green: #16a34a
--emergency-gradient: linear-gradient(135deg, #fef2f2, #ffffff)

/* Animations */
@keyframes pulse-urgent {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

@keyframes alert-blink {
  0%, 100% { background: var(--critical-red); }
  50% { background: var(--high-orange); }
}

/* Typography urgence */
.text-urgent {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--critical-red);
}
```

### MOBILE FIRST - ACTIONS RAPIDES

Sur mobile:
- Bouton appel fixe en bas
- Swipe entre niveaux urgence
- Tap-to-call sur tous numéros
- Géolocalisation auto
- Mode une main accessible

### ACCESSIBILITÉ CRITIQUE

- Contraste maximum (AAA)
- Tailles touch 72px minimum
- Annonces vocales urgence
- Support mode panique
- Navigation d'urgence simplifiée

### INTÉGRATIONS VITALES

- API géolocalisation navigateur
- Intégration Google Maps/Waze
- Click-to-call natif
- Partage position WhatsApp
- Notification push délai attente

### MÉTRIQUES CRITIQUES

- Temps avant action <10s
- Taux appel urgence >40%
- Géolocalisation réussie >95%
- Satisfaction post-urgence >4/5
- Résolution premier contact >70%

Crée cette interface d'urgence qui peut littéralement sauver des vies, avec React/Next.js, animations Framer Motion critiques, et design système optimisé pour le stress.