# 🏢 Guide : Envoi d'Emails Multi-Agences

## 📌 Problématique

Vous gérez **plusieurs agences immobilières** via un seul dashboard. Chaque agence doit envoyer ses emails de confirmation depuis **sa propre adresse email**, pas depuis une adresse centralisée.

### Exemple

- **Agence Immocope** → Les emails doivent partir de `contact@immocope.com`
- **Agence RealAgency** → Les emails doivent partir de `contact@realagency.com`

---

## ✅ Solution : SMTP Multi-Credentials avec N8N

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD MULTI-AGENCES                 │
│                                                             │
│  ┌─────────────┐              ┌─────────────┐             │
│  │  Immocope   │              │ RealAgency  │             │
│  │  (AGENCY_A) │              │ (AGENCY_B)  │             │
│  └──────┬──────┘              └──────┬──────┘             │
│         │                             │                     │
└─────────┼─────────────────────────────┼─────────────────────┘
          │ Payload:                    │ Payload:
          │ agency: "AGENCY_A"          │ agency: "AGENCY_B"
          │                             │
          └──────────┬──────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   N8N WEBHOOK        │
          │   Function Node      │
          │                      │
          │  Switch selon agency │
          └──────────┬───────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌────────────────┐
│ SMTP Immocope  │      │ SMTP RealAgency│
│                │      │                │
│ From:          │      │ From:          │
│ contact@       │      │ contact@       │
│ immocope.com   │      │ realagency.com │
└────────┬───────┘      └────────┬───────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              ┌─────────────┐
              │  PROSPECT   │
              │   (Email)   │
              └─────────────┘
```

---

## 🔧 Configuration Détaillée

### Étape 1 : Configuration dans N8N

#### A. Créer les Credentials SMTP (un par agence)

**Pour Immocope** :

1. N8N → **Settings** → **Credentials** → **New**
2. Type : **SMTP**
3. Configuration :
   ```
   Name: Immocope SMTP
   Host: smtp.gmail.com
   Port: 587
   Secure: false (STARTTLS)
   Username: contact@immocope.com
   Password: [mot-de-passe-application-gmail]
   ```
4. **Test** → **Save**

**Pour RealAgency** :

1. N8N → **Settings** → **Credentials** → **New**
2. Type : **SMTP**
3. Configuration :
   ```
   Name: RealAgency SMTP
   Host: smtp.gmail.com
   Port: 587
   Secure: false (STARTTLS)
   Username: contact@realagency.com
   Password: [mot-de-passe-application-gmail]
   ```
4. **Test** → **Save**

#### B. Workflow N8N

**Node 1 : Webhook**
- Reçoit le payload du dashboard avec `agency: "AGENCY_A"` ou `"AGENCY_B"`

**Node 2 : Function (Switch Agency)**

Ce node détecte l'agence et configure dynamiquement :
- L'adresse email d'envoi
- Le nom de l'agence
- Le credential SMTP à utiliser

```javascript
const agency = $input.item.json.agency;

// Configuration par agence
const config = {
  'AGENCY_A': {
    name: 'Immocope',
    email: 'contact@immocope.com',
    phone: '+33 1 23 45 67 89',
    smtpCredential: 'Immocope SMTP'
  },
  'AGENCY_B': {
    name: 'RealAgency',
    email: 'contact@realagency.com',
    phone: '+33 9 87 65 43 21',
    smtpCredential: 'RealAgency SMTP'
  }
};

const agencyConfig = config[agency] || config['AGENCY_A'];

return {
  json: {
    ...($input.item.json),
    fromEmail: agencyConfig.email,
    fromName: agencyConfig.name,
    agencyPhone: agencyConfig.phone,
    smtpCredential: agencyConfig.smtpCredential
  }
};
```

**Node 3 : Send Email (SMTP)**

Configuration :
```
From Email: {{ $json.fromEmail }}
From Name: {{ $json.fromName }}
To Email: {{ $json.to }}
Subject: {{ $json.subject }}
Message (HTML): {{ $json.htmlBody }}

Credentials: Sélection automatique via {{ $json.smtpCredential }}
```

> ⚠️ **Important** : N8N ne supporte pas la sélection dynamique de credentials directement. Vous devez utiliser **un Switch Node** qui route vers 2 Send Email nodes différents (un par agence).

---

## 🔀 Workflow N8N Corrigé avec Switch

Voici l'architecture correcte :

```
┌──────────────┐
│   Webhook    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Function   │  → Détecte agency
│ (Prépare)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  SWITCH      │  → Route selon agency
│              │
└──┬────────┬──┘
   │        │
   │        └──────────────────┐
   │                           │
   ▼                           ▼
┌──────────────┐      ┌────────────────┐
│ Send Email   │      │  Send Email    │
│ (Immocope)   │      │  (RealAgency)  │
│              │      │                │
│ Credential:  │      │  Credential:   │
│ Immocope SMTP│      │ RealAgency SMTP│
└──────┬───────┘      └────────┬───────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
            ┌──────────┐
            │ Response │
            └──────────┘
```

### Configuration du Switch Node

**Type** : Switch
**Mode** : Rules
**Règles** :

```
Route 0: {{ $json.agency }} equals "AGENCY_A" → Vers Send Email Immocope
Route 1: {{ $json.agency }} equals "AGENCY_B" → Vers Send Email RealAgency
```

---

## 📧 Obtenir le Mot de Passe d'Application Gmail

Chaque agence doit suivre ces étapes :

### Pour Gmail

1. **Se connecter** au compte Gmail de l'agence
2. **Aller sur** : https://myaccount.google.com/security
3. **Activer** la validation en 2 étapes (si pas déjà fait)
4. **Rechercher** "Mots de passe des applications"
5. **Cliquer** sur "Générer"
6. **Sélectionner** :
   - Application : "Autre (nom personnalisé)"
   - Nom : "N8N Email Dashboard"
7. **Cliquer** sur "Générer"
8. **Copier** le mot de passe (16 caractères, format : `xxxx xxxx xxxx xxxx`)
9. **Envoyer** ce mot de passe de manière sécurisée au gestionnaire N8N

### Pour Office 365 / Outlook

1. **Se connecter** sur https://account.microsoft.com
2. **Sécurité** → **Options de sécurité avancées**
3. **Mots de passe d'application** → **Créer un nouveau mot de passe**
4. **Copier** le mot de passe généré

### Pour d'autres fournisseurs

- **Vérifier** si votre fournisseur email supporte SMTP
- **Utiliser** les credentials standards (email + mot de passe)
- **Configuration SMTP** :
  - Host : `smtp.votre-fournisseur.com`
  - Port : `587` (STARTTLS) ou `465` (SSL)

---

## 🔒 Sécurité

### Les agences conservent le contrôle

- **Mot de passe d'application** : Peut être révoqué à tout moment par l'agence
- **Stockage** : Les credentials sont stockés de manière sécurisée dans N8N
- **Accès** : Seul le gestionnaire N8N a accès aux credentials
- **Isolation** : Chaque agence ne peut envoyer que depuis sa propre adresse

### Best Practices

1. **Utiliser des mots de passe d'application**, jamais le mot de passe principal
2. **Révoquer** les mots de passe d'application si une agence quitte la plateforme
3. **Logs** : Activer les logs N8N pour tracer les envois d'emails
4. **SPF/DKIM** : Configurer ces protocoles pour éviter que les emails tombent en spam

---

## 📊 Test Complet

### Test Agence A (Immocope)

1. **Se connecter** au dashboard avec un compte Immocope
2. **Sélectionner** un lead avec un email valide
3. **Programmer** une visite
4. **Vérifier** l'email reçu :
   - Expéditeur : `Immocope <contact@immocope.com>`
   - Contenu : Logo et coordonnées d'Immocope

### Test Agence B (RealAgency)

1. **Se connecter** au dashboard avec un compte RealAgency
2. **Sélectionner** un lead avec un email valide
3. **Programmer** une visite
4. **Vérifier** l'email reçu :
   - Expéditeur : `RealAgency <contact@realagency.com>`
   - Contenu : Logo et coordonnées de RealAgency

---

## 🚀 Ajout d'une Nouvelle Agence

### Checklist Complète

#### 1️⃣ Configuration N8N

- [ ] Obtenir le mot de passe d'application de la nouvelle agence
- [ ] Créer le credential SMTP dans N8N (`Nouvelle Agence SMTP`)
- [ ] Tester le credential

#### 2️⃣ Mise à Jour du Workflow

- [ ] Ajouter la nouvelle agence dans le **Function Node** :
  ```javascript
  'AGENCY_C': {
    name: 'Nouvelle Agence',
    email: 'contact@nouvelle-agence.com',
    phone: '+33 X XX XX XX XX',
    smtpCredential: 'Nouvelle Agence SMTP'
  }
  ```
- [ ] Ajouter une nouvelle route dans le **Switch Node** :
  ```
  Route 2: {{ $json.agency }} equals "AGENCY_C"
  ```
- [ ] Créer un nouveau **Send Email Node** avec le credential `Nouvelle Agence SMTP`

#### 3️⃣ Configuration Dashboard

- [ ] Ajouter dans `.env` :
  ```env
  VITE_AIRTABLE_TOKEN_AGENCY_C=patXXXXXXXXXXXXXX
  VITE_AIRTABLE_BASE_ID_AGENCY_C=appXXXXXXXXXXXXXX
  VITE_N8N_WEBHOOK_EMAIL_AGENCY_C=https://...
  ```
- [ ] Ajouter dans `src/data/users.js` :
  ```javascript
  'agent@nouvelle-agence.com': {
    id: 'user-XXX',
    agency: 'AGENCY_C',
    agencyName: 'Nouvelle Agence',
    ...
  }
  ```
- [ ] Mettre à jour `src/services/airtable.js` si nécessaire

#### 4️⃣ Test

- [ ] Se connecter avec le compte de la nouvelle agence
- [ ] Programmer un RDV
- [ ] Vérifier que l'email part de `contact@nouvelle-agence.com`

---

## 💡 FAQ

### Q: Est-ce que l'agence doit me donner son mot de passe Gmail principal ?

**Non.** L'agence crée un **mot de passe d'application** spécifique pour N8N. Elle peut le révoquer à tout moment sans affecter son compte Gmail principal.

### Q: Combien d'emails peut-on envoyer par jour ?

**Gmail** : 500 emails/jour par compte
**Office 365** : 10 000 emails/jour (selon le plan)
**SMTP personnalisé** : Dépend de votre hébergeur

### Q: Les emails risquent-ils de tomber en spam ?

Pour éviter ça :
1. Configurer **SPF** : Autoriser N8N à envoyer depuis votre domaine
2. Configurer **DKIM** : Signer les emails
3. Configurer **DMARC** : Politique de validation
4. Utiliser un **domaine professionnel** (pas @gmail.com)

### Q: Peut-on utiliser un service tiers comme SendGrid ?

Oui ! SendGrid, Mailgun, ou Amazon SES offrent :
- ✅ Meilleure délivrabilité
- ✅ Plus d'emails par jour
- ✅ Analytics détaillés
- ✅ Templates avancés

Il suffit de créer un credential SMTP avec leurs informations au lieu de Gmail.

---

## 📞 Support

Pour toute question :
- Documentation complète : [N8N_WORKFLOW_EMAIL_CONFIRMATION.md](./N8N_WORKFLOW_EMAIL_CONFIRMATION.md)
- Dashboard : [DOCUMENTATION.md](./DOCUMENTATION.md)
