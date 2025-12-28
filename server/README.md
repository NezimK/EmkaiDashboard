# IMMO Copilot Backend - Google Calendar Integration

Backend Express.js pour l'intégration OAuth2 de Google Calendar.

## Installation

1. Installer les dépendances :
```bash
cd server
npm install
```

2. Créer un fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

3. Configurer les credentials Google Cloud Console :

### Étape 1 : Créer un projet Google Cloud Console

1. Aller sur https://console.cloud.google.com/
2. Créer un nouveau projet ou sélectionner un projet existant
3. Nom du projet : "IMMO Copilot" (ou votre choix)

### Étape 2 : Activer l'API Google Calendar

1. Dans la console, aller dans "APIs & Services" > "Library"
2. Rechercher "Google Calendar API"
3. Cliquer sur "Enable"

### Étape 3 : Créer les credentials OAuth 2.0

1. Aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create Credentials" > "OAuth client ID"
3. Type d'application : "Web application"
4. Nom : "IMMO Copilot Web Client"
5. Authorized redirect URIs :
   - `http://localhost:3001/api/auth/google/callback`
   - Si vous déployez en production, ajouter aussi : `https://votre-domaine.com/api/auth/google/callback`
6. Cliquer sur "Create"
7. Copier le **Client ID** et **Client Secret** dans votre fichier `.env`

### Étape 4 : Configurer l'écran de consentement OAuth

1. Aller dans "APIs & Services" > "OAuth consent screen"
2. User Type : "External" (ou "Internal" si vous avez un Google Workspace)
3. Remplir les informations :
   - App name : "IMMO Copilot"
   - User support email : votre email
   - Developer contact email : votre email
4. Scopes : Ajouter le scope `https://www.googleapis.com/auth/calendar.events`
5. Test users : Ajouter vos emails de test si vous êtes en mode "Testing"

## Lancer le serveur

### Mode développement (avec auto-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur http://localhost:3001

## API Endpoints

### 1. Health Check
```
GET /health
```
Vérifier que le serveur fonctionne.

### 2. Obtenir l'URL d'authentification Google
```
POST /api/auth/google/url
Body: {
  "userId": "user-001",
  "userEmail": "demo@immocope.com",
  "agency": "AGENCY_A"
}
```
Retourne l'URL d'autorisation Google OAuth2.

### 3. Callback OAuth (géré automatiquement)
```
GET /api/auth/google/callback?code=...&state=...
```
Endpoint de redirection après autorisation Google.

### 4. Vérifier le statut de connexion
```
POST /api/auth/google/status
Body: {
  "userId": "user-001"
}
```
Retourne si l'utilisateur est connecté à Google Calendar.

### 5. Déconnecter Google Calendar
```
POST /api/auth/google/disconnect
Body: {
  "userId": "user-001"
}
```
Supprime les tokens de l'utilisateur.

### 6. Créer un événement calendrier
```
POST /api/calendar/event
Body: {
  "userId": "user-001",
  "eventDetails": {
    "title": "Visite - M. Dupont",
    "description": "Visite de l'appartement au 123 rue Example",
    "startDateTime": "2025-01-15T14:00:00+01:00",
    "endDateTime": "2025-01-15T15:00:00+01:00"
  }
}
```
Crée un événement dans Google Calendar de l'utilisateur.

### 7. Supprimer un événement calendrier
```
POST /api/calendar/event/delete
Body: {
  "userId": "user-001",
  "eventId": "event_id_from_google"
}
```
Supprime un événement du Google Calendar de l'utilisateur.

## Base de données

Le backend utilise SQLite pour stocker les tokens OAuth de manière sécurisée.

**Fichier** : `tokens.db`

**Table** : `user_tokens`
- `user_id` : ID de l'utilisateur
- `user_email` : Email de l'utilisateur
- `agency` : Agence de l'utilisateur
- `access_token` : Token d'accès Google
- `refresh_token` : Token de rafraîchissement
- `expiry_date` : Date d'expiration du token
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## Sécurité

- Les tokens sont stockés dans une base de données SQLite locale
- Les tokens sont automatiquement rafraîchis avant expiration
- Le `refresh_token` permet de maintenir l'accès sans redemander l'autorisation
- CORS activé pour permettre les requêtes depuis le frontend

## Déploiement en production

1. Mettre à jour `GOOGLE_REDIRECT_URI` dans `.env` avec votre domaine de production
2. Ajouter l'URI de redirection dans Google Cloud Console
3. Utiliser une vraie base de données (PostgreSQL, MySQL) au lieu de SQLite
4. Configurer HTTPS obligatoire
5. Ajouter des variables d'environnement sécurisées
