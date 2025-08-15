# Nova - Page d'accueil

Nova est une solution IA révolutionnaire pour la gestion des rendez-vous dentaires qui automatise la prise de RDV en moins de 60 secondes et réduit le taux de no-show par 3.

## 🚀 Fonctionnalités

- **Hero Section** : Présentation impactante avec animations subtiles
- **Navigation responsive** : Header transparent qui devient opaque au scroll
- **Section Problème/Solution** : Présentation des défis et de la solution Nova
- **Fonctionnalités détaillées** : Chatbot IA, calendrier intelligent, rappels automatisés, dashboard analytics
- **Témoignages** : Carousel interactif avec témoignages de dentistes
- **Call-to-Action** : Section finale avec boutons d'action
- **Footer complet** : Liens, contact, mentions légales

## 🛠 Stack Technique

- **Framework** : Next.js 15 avec App Router
- **Styling** : Tailwind CSS avec classes personnalisées Nova
- **Animations** : Framer Motion pour les micro-interactions
- **Icônes** : Lucide React
- **Fonts** : Montserrat (titres) et Open Sans (texte) via next/font
- **TypeScript** : Support complet avec types

## 🎨 Charte Graphique

### Couleurs principales
- **Nova Blue** : `#1565C0`
- **Nova Blue Light** : `#1E88E5`
- **Nova Blue Dark** : `#0D47A1`
- **Beige Warm** : `#F5F3F0`
- **Beige Dark** : `#E8E6E1`

### Typography
- **Titres** : Montserrat (300-800)
- **Texte** : Open Sans (300-700)

## 🚀 Installation et Démarrage

1. **Cloner le projet**
```bash
git clone https://github.com/Dams971/NOVA.git
cd nova
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
Aller sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
src/
├── app/
│   ├── globals.css          # Styles globaux et variables CSS Nova
│   ├── layout.tsx           # Layout principal avec fonts
│   └── page.tsx             # Page d'accueil assemblant tous les composants
├── components/
│   └── landing/
│       ├── Navigation.tsx   # Header avec effet de transparence
│       ├── Hero.tsx         # Section hero avec animations
│       ├── Features.tsx     # Problème/solution et fonctionnalités
│       ├── Testimonials.tsx # Carousel de témoignages
│       ├── CallToAction.tsx # Section CTA finale
│       └── Footer.tsx       # Footer complet
```

## 🎯 Fonctionnalités Implémentées

### Navigation
- ✅ Header transparent qui devient opaque au scroll
- ✅ Menu hamburger responsive sur mobile
- ✅ Scroll fluide vers les sections
- ✅ Animations d'apparition

### Hero Section
- ✅ Titre principal avec animation de soulignement
- ✅ Statistiques animées (60s, ÷3, 24/7)
- ✅ Boutons CTA avec effets hover
- ✅ Mockup interface Nova côté droit
- ✅ Éléments flottants animés
- ✅ Indicateur de scroll

### Features
- ✅ Section problèmes avec 3 cartes animées
- ✅ Solution Nova avec liste de bénéfices
- ✅ Statistiques avec compteurs animés
- ✅ 4 fonctionnalités détaillées avec mockups
- ✅ Layout alterné gauche/droite

### Testimonials
- ✅ Carousel automatique avec 4 témoignages
- ✅ Navigation manuelle (flèches + indicateurs)
- ✅ Données mockées de dentistes réels
- ✅ Résultats chiffrés pour chaque témoignage
- ✅ Statistiques globales

### Call-to-Action
- ✅ Design impactant avec gradient Nova
- ✅ 2 boutons CTA principaux
- ✅ Garanties et avantages
- ✅ Éléments d'urgence et social proof
- ✅ Contact rapide

### Footer
- ✅ Design sur fond Nova Blue Dark
- ✅ Logo et description Nova
- ✅ Informations de contact
- ✅ Réseaux sociaux
- ✅ Liens organisés par catégories
- ✅ Newsletter
- ✅ Mentions légales et RGPD

## 🎨 Animations et Interactions

- **Scroll animations** : Intersection Observer pour les animations au scroll
- **Hover effects** : Effets de survol sur boutons et cartes
- **Micro-interactions** : Animations subtiles avec Framer Motion
- **Responsive design** : Mobile-first avec breakpoints optimisés
- **Performance** : Lazy loading et optimisations Next.js

## 📱 Responsive Design

- **Mobile** : < 640px - Navigation hamburger, layout vertical
- **Tablet** : 640px - 1024px - Adaptation des grilles
- **Desktop** : > 1024px - Layout complet avec animations

## 🔧 Personnalisation

### Couleurs
Modifier les variables CSS dans `src/app/globals.css` :
```css
:root {
  --nova-blue: #1565C0;
  --nova-blue-light: #1E88E5;
  /* ... */
}
```

### Contenu
- **Témoignages** : Modifier le tableau `testimonials` dans `Testimonials.tsx`
- **Fonctionnalités** : Adapter les données dans `Features.tsx`
- **Contact** : Mettre à jour les informations dans `Footer.tsx`

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm run build
vercel --prod
```

### Autres plateformes
```bash
npm run build
npm start
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Contact

- **Email** : contact@nova-dental.fr
- **Téléphone** : 01 23 45 67 89
- **Site web** : [nova-dental.fr](https://nova-dental.fr)

---

Développé avec ❤️ pour révolutionner la dentisterie
