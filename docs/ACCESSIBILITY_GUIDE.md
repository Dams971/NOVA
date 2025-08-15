# Guide d'Accessibilité - Nova

## Vue d'ensemble

L'accessibilité web garantit que nos applications sont utilisables par tous, y compris les personnes en situation de handicap. Ce guide présente les bonnes pratiques d'accessibilité pour le projet Nova.

## Standards et Conformité

### WCAG 2.1 Level AA
Nous visons la conformité WCAG 2.1 Level AA, qui couvre :
- **Perceptible** : L'information doit être présentable de manière perceptible
- **Utilisable** : Les composants d'interface doivent être utilisables
- **Compréhensible** : L'information et l'interface doivent être compréhensibles
- **Robuste** : Le contenu doit être suffisamment robuste

### Réglementations
- **RGAA 4.1** (Référentiel Général d'Amélioration de l'Accessibilité)
- **Section 508** (États-Unis)
- **EN 301 549** (Europe)

## Bonnes Pratiques par Composant

### 1. Boutons et Éléments Interactifs

#### ✅ Correct
```tsx
// Bouton avec texte visible
<button type="button" onClick={handleClick}>
  Sauvegarder
</button>

// Bouton avec icône et label accessible
<button 
  type="button"
  onClick={handleClose}
  aria-label="Fermer la modal"
  title="Fermer"
>
  <X className="h-4 w-4" />
</button>

// Lien avec contexte clair
<a href="/patients" aria-label="Voir tous les patients">
  Patients (24)
</a>
```

#### ❌ Incorrect
```tsx
// Bouton sans texte accessible
<button onClick={handleClose}>
  <X className="h-4 w-4" />
</button>

// Div cliquable sans sémantique
<div onClick={handleClick}>
  Cliquez ici
</div>
```

### 2. Formulaires

#### ✅ Correct
```tsx
// Input avec label associé
<label htmlFor="firstName" className="block text-sm font-medium">
  Prénom *
</label>
<input
  id="firstName"
  type="text"
  value={firstName}
  onChange={handleChange}
  aria-describedby={error ? 'firstName-error' : undefined}
  aria-invalid={!!error}
  required
/>
{error && (
  <div id="firstName-error" className="text-red-600 text-sm">
    {error}
  </div>
)}

// Select avec label
<label htmlFor="status" className="block text-sm font-medium">
  Statut
</label>
<select id="status" value={status} onChange={handleStatusChange}>
  <option value="">Sélectionner un statut</option>
  <option value="active">Actif</option>
  <option value="inactive">Inactif</option>
</select>
```

#### ❌ Incorrect
```tsx
// Input sans label
<input type="text" placeholder="Prénom" />

// Select sans label
<select>
  <option>Choisir...</option>
</select>
```

### 3. Navigation et Structure

#### ✅ Correct
```tsx
// Navigation sémantique
<nav aria-label="Navigation principale">
  <ul>
    <li><a href="/dashboard">Tableau de bord</a></li>
    <li><a href="/patients">Patients</a></li>
    <li><a href="/appointments">Rendez-vous</a></li>
  </ul>
</nav>

// Structure de page claire
<main>
  <h1>Gestion des Patients</h1>
  <section aria-labelledby="filters-heading">
    <h2 id="filters-heading">Filtres</h2>
    {/* Contenu des filtres */}
  </section>
</main>

// Breadcrumb accessible
<nav aria-label="Fil d'Ariane">
  <ol>
    <li><a href="/">Accueil</a></li>
    <li><a href="/patients">Patients</a></li>
    <li aria-current="page">Marie Dubois</li>
  </ol>
</nav>
```

### 4. Modales et Overlays

#### ✅ Correct
```tsx
function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Fermer la modal">
          <X />
        </button>
      </div>
    </div>
  );
}
```

### 5. Tableaux de Données

#### ✅ Correct
```tsx
<table>
  <caption>Liste des patients (24 résultats)</caption>
  <thead>
    <tr>
      <th scope="col">Nom</th>
      <th scope="col">Email</th>
      <th scope="col">Téléphone</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Marie Dubois</th>
      <td>marie@example.com</td>
      <td>+33 1 23 45 67 89</td>
      <td>
        <button aria-label="Modifier Marie Dubois">
          Modifier
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### 6. États et Feedback

#### ✅ Correct
```tsx
// Loading state
<button disabled={loading} aria-describedby="loading-status">
  {loading ? 'Chargement...' : 'Sauvegarder'}
</button>
<div id="loading-status" aria-live="polite">
  {loading && 'Sauvegarde en cours...'}
</div>

// Success/Error messages
<div role="alert" className="alert-success">
  Patient créé avec succès
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {searchResults.length} résultats trouvés
</div>
```

## Gestion du Focus

### Ordre de Tabulation
```tsx
// Utiliser tabIndex approprié
<div>
  <button tabIndex={0}>Premier</button>
  <button tabIndex={0}>Deuxième</button>
  <button tabIndex={-1}>Pas dans l'ordre de tab</button>
</div>
```

### Focus Visible
```css
/* Assurer un indicateur de focus visible */
.btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Éviter de supprimer complètement l'outline */
.btn:focus {
  outline: none; /* ❌ Mauvais */
}
```

### Gestion du Focus dans les Modales
```tsx
// Piéger le focus dans la modal
const trapFocus = (e: KeyboardEvent) => {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
};
```

## Couleurs et Contraste

### Ratios de Contraste Minimum
- **Texte normal** : 4.5:1
- **Texte large** (18pt+ ou 14pt+ gras) : 3:1
- **Éléments d'interface** : 3:1

### Palette de Couleurs Accessibles
```css
:root {
  /* Couleurs principales avec bon contraste */
  --primary-blue: #1565C0; /* Contraste 4.5:1 sur blanc */
  --success-green: #2E7D32; /* Contraste 4.5:1 sur blanc */
  --warning-orange: #F57C00; /* Contraste 3.1:1 sur blanc */
  --error-red: #C62828; /* Contraste 5.1:1 sur blanc */
  
  /* Textes */
  --text-primary: #212121; /* Contraste 16:1 sur blanc */
  --text-secondary: #757575; /* Contraste 4.5:1 sur blanc */
}
```

### Ne Pas Se Fier Uniquement à la Couleur
```tsx
// ✅ Correct - Utilise couleur + icône + texte
<div className="status-active">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <span>Actif</span>
</div>

// ❌ Incorrect - Seule la couleur indique le statut
<div className="text-green-600">Actif</div>
```

## Tests d'Accessibilité

### Tests Automatisés
```bash
# Installer axe-core pour les tests
npm install --save-dev @axe-core/react

# Utiliser dans les tests
import { axe, toHaveNoViolations } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<PatientForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Tests Manuels
1. **Navigation au clavier** : Tab, Shift+Tab, Enter, Espace, Échap
2. **Lecteur d'écran** : NVDA (Windows), VoiceOver (Mac), Orca (Linux)
3. **Zoom** : Tester jusqu'à 200% de zoom
4. **Contraste** : Vérifier avec des outils comme Colour Contrast Analyser

### Outils Recommandés
- **axe DevTools** : Extension navigateur
- **Lighthouse** : Audit d'accessibilité intégré
- **WAVE** : Web Accessibility Evaluation Tool
- **Color Oracle** : Simulateur de daltonisme

## Checklist d'Accessibilité

### Avant de Committer
- [ ] Tous les boutons ont un nom accessible
- [ ] Tous les inputs ont des labels associés
- [ ] Les images ont un texte alternatif approprié
- [ ] La navigation au clavier fonctionne
- [ ] Les couleurs ont un contraste suffisant
- [ ] Les erreurs sont annoncées aux lecteurs d'écran
- [ ] Les modales gèrent correctement le focus

### Avant de Déployer
- [ ] Tests automatisés d'accessibilité passent
- [ ] Test manuel avec lecteur d'écran
- [ ] Test de navigation au clavier complet
- [ ] Vérification des contrastes de couleur
- [ ] Test avec zoom à 200%

## Ressources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Outils
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### Formation
- [WebAIM](https://webaim.org/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project](https://www.a11yproject.com/)

## Support

Pour toute question sur l'accessibilité, contactez l'équipe de développement ou consultez les ressources ci-dessus.
