# 🗄️ Configuration de la Base de Données MySQL pour Nova

## Prérequis
- ✅ MySQL installé sur Windows
- ✅ MySQL en cours d'exécution

## 🚀 Configuration Automatique (Recommandée)

### Option 1: Script Automatique
```bash
# 1. Installer les dépendances si nécessaire
npm install

# 2. Exécuter le script de configuration
npm run setup-db

# 3. Exécuter les migrations
npm run migrate

# 4. Démarrer le serveur
npm run dev
```

## 🔧 Configuration Manuelle (Alternative)

### Étape 1: Créer la base de données
Ouvrez MySQL Command Line Client ou MySQL Workbench et exécutez :

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS nova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur (optionnel)
CREATE USER IF NOT EXISTS 'nova_user'@'localhost' IDENTIFIED BY 'nova_password_2024';

-- Donner les privilèges
GRANT ALL PRIVILEGES ON nova_db.* TO 'nova_user'@'localhost';
FLUSH PRIVILEGES;
```

### Étape 2: Configurer les variables d'environnement
Le fichier `.env.local` a été créé avec la configuration suivante :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=nova_user
DB_PASSWORD=nova_password_2024
DB_NAME=nova_db
```

### Étape 3: Exécuter les migrations
```bash
npm run migrate
```

### Étape 4: Démarrer l'application
```bash
npm run dev
```

## 🧪 Données de Test

Les migrations incluent des données de test :

### Cabinets
- **Cabinet Dentaire Central** (cabinet-1) - Paris
- **Clinique Dentaire Nord** (cabinet-2) - Lille

### Utilisateurs de Test
- **Manager**: manager@cabinet-central.fr / password123
- **Praticien**: dr.martin@cabinet-central.fr / password123
- **Patients**: marie.dubois@email.com, pierre.martin@email.com, sophie.laurent@email.com

### Patients de Test
- **Marie Dubois** - 5 visites, dernière visite: 15/01/2024
- **Pierre Martin** - 3 visites, dernière visite: 10/01/2024
- **Sophie Laurent** - 2 visites, dernière visite: 05/01/2024

## 🔍 Vérification

### Tester la connexion
```bash
# Vérifier que les tables ont été créées
mysql -u nova_user -p nova_db -e "SHOW TABLES;"

# Vérifier les données
mysql -u nova_user -p nova_db -e "SELECT COUNT(*) as patients FROM patients;"
```

### Accéder à l'interface
1. Démarrer le serveur : `npm run dev`
2. Aller sur : `http://localhost:3000/manager/cabinet-1`
3. Cliquer sur l'onglet **"Patients"**

## 🚨 Résolution des Problèmes

### Erreur de connexion MySQL
```bash
# Vérifier que MySQL est démarré
net start mysql

# Ou via Services Windows
services.msc -> MySQL -> Démarrer
```

### Erreur d'authentification
Si vous utilisez votre utilisateur root MySQL existant, modifiez `.env.local` :
```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_root
```

### Erreur de port
Si MySQL utilise un port différent :
```env
DB_PORT=3307  # ou votre port MySQL
```

### Réinitialiser la base de données
```bash
# Supprimer et recréer
mysql -u root -p -e "DROP DATABASE IF EXISTS nova_db;"
npm run setup-db
npm run migrate
```

## 📊 Structure de la Base de Données

### Tables Principales
- `users` - Utilisateurs (patients, praticiens, managers)
- `cabinets` - Cabinets dentaires
- `cabinet_members` - Associations utilisateurs-cabinets
- `patients` - Données patients étendues
- `medical_records` - Historique médical
- `appointments` - Rendez-vous
- `sessions` - Sessions d'authentification
- `migrations` - Suivi des migrations

### Relations
- Un patient appartient à un cabinet
- Un patient a plusieurs enregistrements médicaux
- Un cabinet a plusieurs membres (praticiens, managers)
- Les rendez-vous lient patients, praticiens et cabinets

## ✅ Validation

Une fois configuré, vous devriez pouvoir :
- ✅ Voir la liste des patients dans l'interface
- ✅ Créer de nouveaux patients
- ✅ Modifier les informations des patients
- ✅ Rechercher et filtrer les patients
- ✅ Consulter l'historique médical

## 🎯 Prochaines Étapes

1. **Tester l'interface** - Créer, modifier, supprimer des patients
2. **Configurer l'authentification** - Se connecter avec les comptes de test
3. **Ajouter des données** - Créer vos propres patients et cabinets
4. **Personnaliser** - Adapter les champs selon vos besoins

**La base de données Nova est maintenant prête !** 🎉
