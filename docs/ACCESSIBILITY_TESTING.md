# Guide de Test d'Accessibilité - Nova

## Vue d'ensemble

Ce guide présente les méthodes et outils pour tester l'accessibilité de l'application Nova. Il couvre les tests automatisés, manuels et les outils recommandés.

## Tests Automatisés

### Configuration des Tests

#### Installation des Dépendances
```bash
npm install --save-dev @axe-core/react jest-axe
```

#### Configuration Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom'
  }
});
```

#### Setup des Tests
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

### Exécution des Tests

#### Tests d'Accessibilité Complets
```bash
# Exécuter tous les tests d'accessibilité
npm run test:accessibility

# Exécuter avec couverture
npm run test:accessibility -- --coverage

# Exécuter en mode watch
npm run test:accessibility -- --watch
```

#### Tests Spécifiques
```bash
# Tester un composant spécifique
npm run test -- PatientForm.accessibility.test.tsx

# Tester avec des règles axe spécifiques
npm run test -- --testNamePattern="keyboard navigation"
```

### Exemple de Test Automatisé

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PatientForm from '@/components/manager/PatientForm';

expect.extend(toHaveNoViolations);

test('PatientForm should be accessible', async () => {
  const { container } = render(
    <PatientForm cabinetId="test" onSave={vi.fn()} onCancel={vi.fn()} />
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Tests Manuels

### 1. Navigation au Clavier

#### Checklist de Navigation
- [ ] **Tab** : Navigation vers l'élément suivant
- [ ] **Shift + Tab** : Navigation vers l'élément précédent
- [ ] **Enter** : Activation des boutons et liens
- [ ] **Espace** : Activation des boutons et cases à cocher
- [ ] **Échap** : Fermeture des modales et menus
- [ ] **Flèches** : Navigation dans les menus et listes

#### Test de Navigation
```bash
# Script de test de navigation
./scripts/test-keyboard-navigation.sh
```

#### Points à Vérifier
1. **Ordre de tabulation logique**
2. **Indicateurs de focus visibles**
3. **Pas de piège de focus**
4. **Raccourcis clavier fonctionnels**

### 2. Tests avec Lecteurs d'Écran

#### Lecteurs d'Écran Recommandés
- **Windows** : NVDA (gratuit), JAWS
- **macOS** : VoiceOver (intégré)
- **Linux** : Orca (gratuit)
- **Mobile** : TalkBack (Android), VoiceOver (iOS)

#### Configuration NVDA (Windows)
1. Télécharger NVDA depuis nvaccess.org
2. Installer et redémarrer
3. Utiliser Ctrl+Alt+N pour démarrer/arrêter
4. Naviguer avec les flèches et Tab

#### Configuration VoiceOver (macOS)
1. Système > Accessibilité > VoiceOver
2. Activer VoiceOver (Cmd+F5)
3. Utiliser VO+flèches pour naviguer
4. VO = Control+Option

#### Points à Tester
- [ ] **Annonces appropriées** des éléments
- [ ] **Structure de navigation** claire
- [ ] **Formulaires** bien étiquetés
- [ ] **États dynamiques** annoncés
- [ ] **Erreurs** communiquées clairement

### 3. Tests de Contraste

#### Outils de Vérification
- **Colour Contrast Analyser** (gratuit)
- **WebAIM Contrast Checker** (en ligne)
- **axe DevTools** (extension navigateur)

#### Ratios Requis
- **Texte normal** : 4.5:1 minimum
- **Texte large** : 3.0:1 minimum
- **Éléments d'interface** : 3.0:1 minimum

#### Test Manuel
```bash
# Vérifier les contrastes avec notre script
./scripts/check-color-contrast.sh
```

### 4. Tests de Zoom

#### Niveaux à Tester
- [ ] **100%** : Affichage normal
- [ ] **150%** : Zoom modéré
- [ ] **200%** : Zoom élevé (requis WCAG)
- [ ] **400%** : Zoom maximum

#### Points à Vérifier
1. **Contenu lisible** à tous les niveaux
2. **Pas de défilement horizontal** (sauf exceptions)
3. **Fonctionnalités accessibles**
4. **Mise en page préservée**

## Outils de Test

### Extensions Navigateur

#### axe DevTools
- **Installation** : Chrome Web Store / Firefox Add-ons
- **Usage** : F12 > onglet axe
- **Avantages** : Tests complets, suggestions de correction

#### WAVE
- **Installation** : Extension navigateur
- **Usage** : Clic sur l'icône WAVE
- **Avantages** : Visualisation des problèmes sur la page

#### Lighthouse
- **Installation** : Intégré à Chrome DevTools
- **Usage** : F12 > Lighthouse > Accessibility
- **Avantages** : Score global et recommandations

### Outils de Ligne de Commande

#### Pa11y
```bash
# Installation
npm install -g pa11y

# Test d'une page
pa11y http://localhost:3000/patients

# Test avec options
pa11y --standard WCAG2AA --reporter cli http://localhost:3000
```

#### axe-cli
```bash
# Installation
npm install -g @axe-core/cli

# Test d'une page
axe http://localhost:3000/patients

# Test avec sauvegarde
axe http://localhost:3000 --save results.json
```

### Simulateurs

#### Simulateur de Daltonisme
- **Color Oracle** (gratuit)
- **Sim Daltonism** (macOS)
- **Chrome DevTools** (intégré)

#### Simulateur de Vision
- **NoCoffee** (extension Chrome)
- **WAVE** (simulation de vision floue)

## Processus de Test

### 1. Tests en Développement

#### Avant Chaque Commit
```bash
# Exécuter les tests d'accessibilité
npm run test:accessibility

# Vérifier avec axe
npm run lint:accessibility

# Test de navigation rapide
./scripts/quick-keyboard-test.sh
```

#### Checklist Développeur
- [ ] Tous les éléments interactifs ont des labels
- [ ] Les couleurs ont un contraste suffisant
- [ ] La navigation au clavier fonctionne
- [ ] Les erreurs sont annoncées
- [ ] Les états de chargement sont communiqués

### 2. Tests en Intégration

#### Tests Automatisés CI/CD
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run accessibility tests
        run: npm run test:accessibility
      - name: Run axe tests
        run: npm run test:axe
```

#### Tests Manuels
1. **Test complet avec lecteur d'écran**
2. **Vérification des contrastes**
3. **Test de zoom à 200%**
4. **Navigation complète au clavier**

### 3. Tests en Production

#### Monitoring Continu
```javascript
// Monitoring axe en production (développement uniquement)
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

#### Audits Périodiques
- **Mensuel** : Audit automatisé complet
- **Trimestriel** : Test utilisateur avec personnes handicapées
- **Annuel** : Audit professionnel externe

## Résolution des Problèmes

### Problèmes Courants

#### 1. Boutons sans Label
```tsx
// ❌ Problème
<button onClick={handleClose}>
  <X />
</button>

// ✅ Solution
<button onClick={handleClose} aria-label="Fermer">
  <X />
</button>
```

#### 2. Formulaires sans Labels
```tsx
// ❌ Problème
<input type="text" placeholder="Nom" />

// ✅ Solution
<label htmlFor="name">Nom</label>
<input id="name" type="text" />
```

#### 3. Contrastes Insuffisants
```css
/* ❌ Problème */
.text-light { color: #999; } /* 2.8:1 */

/* ✅ Solution */
.text-accessible { color: #666; } /* 4.5:1 */
```

#### 4. Focus Non Visible
```css
/* ❌ Problème */
button:focus { outline: none; }

/* ✅ Solution */
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Outils de Débogage

#### Console axe
```javascript
// Dans la console du navigateur
axe.run().then(results => {
  console.log(results.violations);
});
```

#### Inspection des Éléments
1. **F12** > Éléments
2. **Accessibility** tab (Chrome)
3. Vérifier l'arbre d'accessibilité

## Ressources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Outils
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [Pa11y](https://pa11y.org/)

### Formation
- [Deque University](https://dequeuniversity.com/)
- [WebAIM Training](https://webaim.org/training/)
- [A11y Project](https://www.a11yproject.com/)

## Support

Pour toute question sur les tests d'accessibilité :
- **Documentation** : Consulter ce guide
- **Outils** : Utiliser les scripts fournis
- **Formation** : Ressources listées ci-dessus
- **Support** : Contacter l'équipe de développement
