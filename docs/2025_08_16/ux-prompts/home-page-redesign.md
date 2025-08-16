# Prompt de Refonte UX - Page d'Accueil NOVA

## Contexte
Page d'accueil actuelle de NOVA RDV qui nécessite une refonte complète inspirée de Maiia.com avec une approche médicale premium et rassurante.

## Prompt Spécifique

Je veux transformer cette page d'accueil de plateforme dentaire en une expérience exceptionnelle inspirée de Maiia. Voici les éléments à améliorer :

### HERO SECTION
**Actuellement** : Header basique avec logo "N" et navigation simple
**Objectif** : Hero immersif style Maiia avec :
- Headline puissante : "Votre sourire mérite les meilleurs soins dentaires"
- Sous-titre rassurant : "Prenez rendez-vous en 2 minutes avec des dentistes certifiés près de chez vous"
- Barre de recherche intelligente avec 3 champs :
  * Spécialité (orthodontie, implants, urgence...)
  * Localisation (avec géolocalisation)
  * Date souhaitée
- Image de fond subtile (sourire confiant ou cabinet moderne)
- Stats de réassurance : "12 000+ patients satisfaits" | "48 cabinets partenaires" | "RDV sous 24h"

### SECTION SERVICES (comme les cartes Maiia)
Remplacer les liens texte par 4 cartes visuelles :
1. **Consultation rapide** 
   - Icône : 🦷
   - "RDV disponibles aujourd'hui"
   - Badge "Nouveau"
   
2. **Urgences dentaires**
   - Icône : 🚨
   - "Prise en charge immédiate"
   - Animation pulse subtile
   
3. **Soins préventifs**
   - Icône : 🛡️
   - "Bilan complet offert"
   - Couleur verte apaisante
   
4. **Orthodontie**
   - Icône : ✨
   - "Consultations invisalign"
   - Badge "Populaire"

### SECTION RÉASSURANCE PATIENT
Nouvelle section avec :
- **Process en 3 étapes** (style timeline) :
  1. Choisissez votre praticien
  2. Réservez en ligne 24/7
  3. Recevez SMS de confirmation
  
- **Témoignages patients** (carrousel) :
  * Photos réelles
  * Notes Google Reviews
  * Verbatims authentiques

- **Garanties NOVA** :
  * ✅ Remboursement Sécurité Sociale
  * ✅ Tiers payant accepté
  * ✅ Données 100% sécurisées
  * ✅ Annulation gratuite 24h avant

### SECTION PRATICIENS
Grille de "Nos meilleurs dentistes" avec :
- Photo professionnelle
- Nom et spécialité
- Note moyenne (4.8⭐)
- Prochain créneau disponible
- Bouton "Voir le profil"

### FOOTER MÉDICAL
Footer organisé en colonnes :
- **Services** : liens utiles
- **Aide** : FAQ, Contact, Réclamations
- **Légal** : RGPD, CGU, Mentions
- **App mobile** : Badges App Store/Play Store
- Réseaux sociaux discrets

### COULEURS À APPLIQUER
```css
--trust-blue: #4eb3c9 (principal comme Maiia)
--soft-pink: #f68092 (accents CTA)
--medical-gray: #f8f9fa (fonds)
--text-dark: #2c3e50
--success-green: #27ae60
--urgent-red: #e74c3c
```

### TYPOGRAPHIE
- Titres : Font 'Outfit' ou 'Poppins' (moderne, arrondi)
- Corps : 'Inter' ou 'Source Sans 3' (lisibilité maximale)
- Tailles : H1 48px, H2 36px, Body 18px minimum

### ANIMATIONS & MICRO-INTERACTIONS
- Hover sur cartes : légère élévation + ombre
- Boutons : transition couleur 200ms
- Scroll reveal pour sections
- Loading skeleton pendant recherche
- Confettis subtils après booking réussi

### RESPONSIVE MOBILE-FIRST
- Hero : Stack vertical sur mobile
- Cartes : 2 colonnes tablet, 1 colonne mobile
- Navigation : Hamburger menu fluide
- Touch targets : minimum 48px

### ACCESSIBILITÉ WCAG AAA
- Contrastes : minimum 7:1
- Focus visible sur tous les éléments
- Alt text sur toutes les images
- ARIA labels pour screen readers
- Navigation clavier complète

### MESSAGES CLÉS À INTÉGRER
- "Prenez soin de votre sourire"
- "Des soins dentaires sans stress"
- "Votre santé bucco-dentaire, notre priorité"
- "Consultez depuis chez vous"

### ÉLÉMENTS DIFFÉRENCIANTS NOVA
- Chat bot "Nova Assistant" en bottom-right
- Badge "Cabinet vérifié" sur praticiens
- Indicateur temps d'attente moyen
- Mode nuit automatique après 20h
- Support multilingue (FR/AR/EN)

### OPTIMISATIONS PERFORMANCE
- Images WebP avec fallback
- Lazy loading sous le fold
- Critical CSS inline
- Prefetch page RDV au hover CTA
- Bundle < 150KB

Transforme cette page en utilisant React/Next.js avec Tailwind CSS. Crée une expérience médicale premium qui inspire confiance et facilite la prise de RDV.