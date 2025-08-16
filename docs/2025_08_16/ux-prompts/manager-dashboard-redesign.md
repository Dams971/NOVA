# Prompt de Refonte UX - Dashboard Manager NOVA (Interface Productive)

## Contexte
Dashboard manager pour les gestionnaires de cabinets dentaires qui doit devenir un centre de contrôle ultra-efficace avec données temps réel.

## Prompt Spécifique

Transforme ce dashboard manager en interface productive de classe mondiale inspirée des meilleurs SaaS médicaux (SimplePractice, Dentrix, Maiia Pro).

### HEADER INTELLIGENT - CONTEXTE PERMANENT

```jsx
<header className="dashboard-header">
  <div className="cabinet-context">
    <Logo cabinet={currentCabinet} />
    <div className="cabinet-info">
      <h1>Cabinet {cabinetName}</h1>
      <StatusBadge status="online" />
      <span className="last-sync">↻ Sync il y a 2s</span>
    </div>
  </div>
  
  <div className="quick-actions">
    <SearchBar placeholder="Patient, RDV, facture..." />
    <NotificationBell unread={3} />
    <QuickAdd items={['RDV', 'Patient', 'Tâche']} />
    <UserMenu user={currentUser} />
  </div>
</header>
```

### DASHBOARD PRINCIPAL - WIDGETS PERSONNALISABLES

```jsx
<div className="dashboard-grid customizable">
  {/* KPI Row - Métriques temps réel */}
  <div className="kpi-row">
    <KPICard
      title="Aujourd'hui"
      value={stats.todayAppointments}
      total={stats.totalSlots}
      trend="+12%"
      icon="📅"
      sparkline={last7Days}
      onClick={() => navigateTo('/appointments/today')}
    />
    
    <KPICard
      title="Revenus du mois"
      value="12,450€"
      target="15,000€"
      progress={83}
      icon="💰"
      breakdown={{
        'Consultations': 8500,
        'Soins': 3950
      }}
    />
    
    <KPICard
      title="Taux d'occupation"
      value="87%"
      status="excellent"
      icon="📊"
      heatmap={weekOccupancy}
    />
    
    <KPICard
      title="Nouveaux patients"
      value={28}
      change="+8"
      period="ce mois"
      icon="👥"
      avatars={newPatients.slice(0,5)}
    />
  </div>

  {/* Planning en temps réel */}
  <Widget title="Planning du jour" refreshInterval={30}>
    <TimelineView>
      {appointments.map(apt => (
        <AppointmentBlock
          key={apt.id}
          patient={apt.patient}
          practitioner={apt.practitioner}
          time={apt.time}
          duration={apt.duration}
          type={apt.type}
          status={apt.status}
          onDrag={handleReschedule}
          actions={['SMS', 'Appel', 'Annuler']}
        />
      ))}
      
      {/* Slots disponibles */}
      <EmptySlot 
        time="14:30"
        duration={30}
        onBook={quickBook}
        suggested="M. Martin (rappel)"
      />
    </TimelineView>
    
    <FloatingLegend>
      <Status color="green">Confirmé</Status>
      <Status color="yellow">En attente</Status>
      <Status color="red">Urgent</Status>
      <Status color="gray">Annulé</Status>
    </FloatingLegend>
  </Widget>

  {/* Liste patients en attente */}
  <Widget title="Salle d'attente" badge={waitingCount}>
    <WaitingList>
      {waitingPatients.map(patient => (
        <PatientCard
          avatar={patient.photo}
          name={patient.name}
          arrivalTime={patient.arrival}
          waitTime={calculateWait(patient.arrival)}
          reason={patient.reason}
          alerts={patient.alerts}
          onCall={() => callPatient(patient)}
        />
      ))}
    </WaitingList>
    
    <AverageWaitTime time="12 min" trend="down" />
  </Widget>

  {/* Tâches et rappels */}
  <Widget title="Tâches du jour" collapsible>
    <TaskList>
      <TaskGroup title="Urgent" color="red">
        <Task
          title="Rappeler Mme Dubois"
          subtitle="Post-opératoire implant"
          due="09:00"
          priority="high"
          onComplete={markComplete}
        />
      </TaskGroup>
      
      <TaskGroup title="Rappels" color="blue">
        <Task
          title="Commander matériel"
          subtitle="Stock composite bas"
          due="Avant midi"
          assignee="Sarah"
        />
      </TaskGroup>
      
      <TaskGroup title="Administratif" color="gray">
        <Task
          title="Factures à envoyer"
          count={8}
          value="3,200€"
          action="Traiter"
        />
      </TaskGroup>
    </TaskList>
  </Widget>
</div>
```

### TABLEAU DE BORD FINANCIER

```jsx
<FinancialDashboard>
  {/* Graphique revenus */}
  <ChartWidget title="Évolution CA" timeRange={timeRange}>
    <LineChart
      data={revenueData}
      lines={['CA', 'Objectif']}
      annotations={events}
      interactive
      exportable
    />
    
    <ChartControls>
      <TimeRangeSelector />
      <CompareToggle />
      <ExportButton formats={['PDF', 'Excel']} />
    </ChartControls>
  </ChartWidget>

  {/* Répartition par actes */}
  <PieChart
    title="Répartition des actes"
    data={actesData}
    showLegend
    showValues
    interactive
  />

  {/* Impayés */}
  <UnpaidWidget>
    <h3>⚠️ Impayés à relancer</h3>
    <UnpaidList>
      {unpaidInvoices.map(invoice => (
        <UnpaidItem
          patient={invoice.patient}
          amount={invoice.amount}
          daysOverdue={invoice.overdue}
          actions={['SMS', 'Email', 'Appel']}
        />
      ))}
    </UnpaidList>
    <TotalUnpaid amount={totalUnpaid} />
  </UnpaidWidget>
</FinancialDashboard>
```

### GESTION DES PRATICIENS

```jsx
<PractitionerManager>
  {/* Planning multi-praticiens */}
  <MultiCalendar>
    {practitioners.map(doc => (
      <PractitionerColumn
        key={doc.id}
        practitioner={doc}
        appointments={doc.appointments}
        availability={doc.availability}
        onDrop={handleAppointmentMove}
        showConflicts
      />
    ))}
  </MultiCalendar>

  {/* Stats par praticien */}
  <PractitionerStats>
    <StatCard
      practitioner="Dr. Martin"
      patients={45}
      revenue="8,200€"
      satisfaction={4.8}
      nextAvailable="14:30"
    />
  </PractitionerStats>
</PractitionerManager>
```

### COMMUNICATION CENTRALISÉE

```jsx
<CommunicationHub>
  {/* Messages récents */}
  <MessageCenter>
    <TabBar>
      <Tab active>SMS</Tab>
      <Tab>Emails</Tab>
      <Tab>Chat</Tab>
      <Tab badge={2}>Avis</Tab>
    </TabBar>
    
    <MessageList>
      <Message
        from="M. Dupont"
        content="Puis-je décaler mon RDV?"
        time="Il y a 5 min"
        actions={['Répondre', 'Appeler']}
        urgent
      />
    </MessageList>
    
    <QuickReply templates={smsTemplates} />
  </MessageCenter>

  {/* Campagnes */}
  <CampaignWidget>
    <h3>Rappels automatiques</h3>
    <Campaign
      name="Contrôle annuel"
      recipients={156}
      sent={89}
      opened={67}
      responded={23}
    />
  </CampaignWidget>
</CommunicationHub>
```

### TABLEAU PATIENTS AVANCÉ

```jsx
<PatientTable
  data={patients}
  columns={[
    'Photo',
    'Nom',
    'Dernier RDV',
    'Prochain RDV',
    'Solde',
    'Tags',
    'Actions'
  ]}
  features={{
    search: true,
    filters: true,
    sort: true,
    bulkActions: true,
    export: true,
    columnToggle: true
  }}
  rowActions={[
    'Voir dossier',
    'Nouveau RDV',
    'Envoyer SMS',
    'Facturer'
  ]}
  bulkActions={[
    'Envoyer rappel',
    'Exporter',
    'Archiver'
  ]}
/>
```

### ALERTES INTELLIGENTES

```jsx
<AlertSystem>
  <AlertBanner type="warning" dismissible>
    📋 3 ordonnances à valider avant 12h
  </AlertBanner>
  
  <AlertBanner type="info" action="Configurer">
    💡 Optimisez votre planning: 3 créneaux libres cet après-midi
  </AlertBanner>
  
  <AlertBanner type="success" autoHide={5000}>
    ✅ Backup automatique effectué
  </AlertBanner>
</AlertSystem>
```

### BARRE LATÉRALE CONTEXTUELLE

```jsx
<Sidebar collapsible defaultOpen>
  <QuickStats>
    <Stat label="En ligne" value={onlineStaff} />
    <Stat label="Patients aujourd'hui" value={todayCount} />
    <Stat label="Taux remplissage" value={fillRate} />
  </QuickStats>
  
  <QuickLinks>
    <Link icon="📊" to="/reports">Rapports</Link>
    <Link icon="⚙️" to="/settings">Paramètres</Link>
    <Link icon="📚" to="/help">Aide</Link>
  </QuickLinks>
  
  <RecentActivity limit={5} />
</Sidebar>
```

### DESIGN TOKENS PRODUCTIVITÉ

```css
/* Couleurs dashboard */
--dash-primary: #4f46e5 /* Indigo professionnel */
--dash-success: #10b981
--dash-warning: #f59e0b  
--dash-danger: #ef4444
--dash-neutral: #6b7280
--dash-bg: #f9fafb
--dash-card: #ffffff

/* Ombres et profondeur */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

/* Animations productives */
--transition-fast: 150ms
--transition-normal: 250ms
--transition-slow: 350ms
```

### WEBSOCKET - TEMPS RÉEL

```jsx
// Connexion WebSocket
useWebSocket({
  onAppointmentUpdate: (data) => updateCalendar(data),
  onNewMessage: (msg) => showNotification(msg),
  onStatsChange: (stats) => updateKPIs(stats),
  reconnectInterval: 3000
})
```

### RACCOURCIS CLAVIER

```
Ctrl+N : Nouveau RDV
Ctrl+P : Recherche patient  
Ctrl+M : Messages
Ctrl+D : Dashboard
Ctrl+S : Sauvegarder
ESC : Fermer modal
```

### RESPONSIVE TABLETTE

Sur tablette:
- Grid 2 colonnes
- Widgets empilables
- Navigation drawer
- Touch gestures
- Mode portrait/paysage

### MÉTRIQUES MANAGER

- Temps de chargement <1s
- Updates temps réel <100ms
- Taux utilisation features >80%
- Satisfaction manager >4.5/5
- Réduction temps admin -40%

Implémente ce dashboard productif avec React/Next.js, Recharts pour visualisations, WebSocket pour temps réel, et Tailwind pour un design système cohérent et professionnel.