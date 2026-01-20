# 📧 Workflow N8N - Email de Confirmation de Visite

## 🎯 Objectif

Ce workflow N8N envoie automatiquement un email de confirmation aux prospects lorsqu'un agent programme un rendez-vous depuis le dashboard IMMO Copilot.

---

## 📊 Architecture du Workflow

```
┌─────────────────┐
│  1. WEBHOOK     │  ← Dashboard envoie le payload
│    TRIGGER      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. FUNCTION    │  → Génère le template HTML de l'email
│    NODE         │     avec les données du bien
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. GMAIL/SMTP  │  → Envoie l'email au prospect
│     NODE        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. RESPOND     │  → Retourne une réponse au dashboard
│    TO WEBHOOK   │
└─────────────────┘
```

---

## 🏢 Gestion Multi-Agences : Envoi depuis l'Email de Chaque Agence

### Le Problème

Vous gérez **plusieurs agences** immobilières, chacune avec sa propre adresse email :
- **Immocope** : `contact@immocope.com`
- **RealAgency** : `contact@realagency.com`

Les emails de confirmation doivent être envoyés **depuis l'adresse de l'agence concernée**, pas depuis une adresse centralisée.

### ✅ Solution : SMTP avec Credentials Multiples

Le workflow N8N ci-dessous :
1. **Reçoit** le payload avec `agency: "AGENCY_A"` ou `"AGENCY_B"`
2. **Sélectionne automatiquement** :
   - L'adresse email d'envoi (`contact@immocope.com` ou `contact@realagency.com`)
   - Le credential SMTP correspondant
   - Le nom de l'agence et ses coordonnées
3. **Envoie** l'email depuis la bonne adresse

### Configuration Requise

Chaque agence doit :
1. **Fournir son adresse email** : `contact@son-agence.com`
2. **Créer un mot de passe d'application Gmail** (si Gmail) :
   - Google Account → Sécurité → Validation en 2 étapes → Mots de passe des applications
   - Créer un nouveau mot de passe pour "N8N Email"
3. **Donner les credentials SMTP** au gestionnaire N8N (vous)

> 🔒 **Sécurité** : Les credentials SMTP sont stockés de manière sécurisée dans N8N. Chaque agence conserve le contrôle de son compte email.

---

## 🔧 Configuration Détaillée

### NODE 1 : Webhook Trigger

**Type** : Webhook
**Nom** : `Recevoir demande d'email`

**Configuration** :
- **HTTP Method** : `POST`
- **Path** : `/webhook/immocope-send-email` (ou `realagency-send-email` pour l'agence B)
- **Response Mode** : `When Last Node Finishes`
- **Response Code** : `200`

**Payload reçu** :
```json
{
  "type": "visit_confirmation",
  "lead": {
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "telephone": "+33 6 12 34 56 78"
  },
  "bien": {
    "nom": "Appartement T3 - Paris 15ème",
    "adresse": "42 Rue de la Convention, 75015 Paris",
    "type": "Appartement",
    "prix": "450000"
  },
  "visit": {
    "date": "lundi 30 décembre 2025",
    "time": "14:30",
    "dateISO": "2025-12-30T14:30:00.000Z"
  },
  "agency": "AGENCY_A"
}
```

---

### NODE 2 : Function - Génération du Template Email

**Type** : Function
**Nom** : `Générer template email`

**Code JavaScript complet** :

```javascript
// ==========================================
// RÉCUPÉRATION DES DONNÉES
// ==========================================
const lead = $input.item.json.lead;
const bien = $input.item.json.bien;
const visit = $input.item.json.visit;
const agency = $input.item.json.agency;

// ==========================================
// CONFIGURATION PAR AGENCE
// ==========================================
const agencyName = agency === 'AGENCY_A' ? 'Immocope' : 'RealAgency';
const agencyColor = '#C5A065'; // Or premium
const agencyPhone = agency === 'AGENCY_A' ? '+33 1 23 45 67 89' : '+33 9 87 65 43 21';
const agencyEmail = agency === 'AGENCY_A' ? 'contact@immocope.com' : 'contact@realagency.com';

// Email d'envoi (From)
const fromEmail = agencyEmail;
const fromName = agencyName;

// SMTP Credential à utiliser (pour sélection dynamique dans le SMTP Node)
const smtpCredential = agency === 'AGENCY_A' ? 'Immocope SMTP' : 'RealAgency SMTP';

// ==========================================
// FORMATAGE DES DONNÉES
// ==========================================
const prixFormate = bien.prix ? `${parseInt(bien.prix).toLocaleString('fr-FR')} €` : 'Sur demande';

// ==========================================
// SUJET DE L'EMAIL
// ==========================================
const subject = `✅ Confirmation de votre visite - ${bien.nom || 'Bien immobilier'} - ${agencyName}`;

// ==========================================
// CORPS HTML DE L'EMAIL
// ==========================================
const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, ${agencyColor} 0%, #B08F55 100%);
      color: black;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 24px;
    }
    .bien-box {
      background: linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%);
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      border: 2px solid ${agencyColor};
    }
    .bien-box h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: ${agencyColor};
      font-size: 20px;
      font-weight: 700;
    }
    .bien-detail {
      margin: 12px 0;
      font-size: 15px;
      color: #444;
      display: flex;
      align-items: flex-start;
    }
    .bien-detail .icon {
      margin-right: 8px;
      font-size: 18px;
    }
    .bien-detail strong {
      color: ${agencyColor};
      margin-right: 6px;
    }
    .info-box {
      background: #f9f9f9;
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      border-left: 4px solid ${agencyColor};
    }
    .info-box h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: ${agencyColor};
      font-size: 18px;
      font-weight: 600;
    }
    .info-row {
      display: flex;
      margin: 12px 0;
      font-size: 15px;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      min-width: 120px;
    }
    .info-value {
      color: #333;
      flex: 1;
    }
    .cta-box {
      background: #f0f8ff;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: center;
      border: 1px solid #d0e8ff;
    }
    .cta-box p {
      margin: 0;
      font-size: 15px;
      color: #333;
    }
    .map-link {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 24px;
      background: ${agencyColor};
      color: black;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .map-link:hover {
      transform: translateY(-2px);
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #f9f9f9;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
    .footer .small {
      font-size: 12px;
      color: #999;
    }
    .contact-info {
      margin: 16px 0;
      padding: 16px;
      background: white;
      border-radius: 8px;
    }
    .contact-info p {
      margin: 6px 0;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 12px;
      }
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .bien-box, .info-box {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🏠 ${agencyName}</h1>
      <p>Confirmation de votre visite</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <p>Bonjour <strong>${lead.nom}</strong>,</p>
        <p>Nous avons le plaisir de confirmer votre visite pour le bien suivant :</p>
      </div>

      <!-- Bien Details -->
      <div class="bien-box">
        <h3>🏡 ${bien.nom || 'Bien immobilier'}</h3>
        ${bien.adresse ? `
        <div class="bien-detail">
          <span class="icon">📍</span>
          <div><strong>Adresse :</strong> ${bien.adresse}</div>
        </div>
        ` : ''}
        ${bien.type ? `
        <div class="bien-detail">
          <span class="icon">🏷️</span>
          <div><strong>Type :</strong> ${bien.type}</div>
        </div>
        ` : ''}
        ${bien.prix ? `
        <div class="bien-detail">
          <span class="icon">💰</span>
          <div><strong>Prix :</strong> ${prixFormate}</div>
        </div>
        ` : ''}

        ${bien.adresse ? `
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bien.adresse)}"
           class="map-link"
           target="_blank">
          🗺️ Voir sur Google Maps
        </a>
        ` : ''}
      </div>

      <!-- Visit Details -->
      <div class="info-box">
        <h3>📅 Détails de votre rendez-vous</h3>
        <div class="info-row">
          <span class="info-label">📆 Date :</span>
          <span class="info-value">${visit.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🕐 Heure :</span>
          <span class="info-value">${visit.time}</span>
        </div>
        ${bien.adresse ? `
        <div class="info-row">
          <span class="info-label">📍 Lieu :</span>
          <span class="info-value">${bien.adresse}</span>
        </div>
        ` : ''}
      </div>

      <!-- CTA Box -->
      <div class="cta-box">
        <p>
          💬 Un de nos agents vous contactera au <strong>${lead.telephone}</strong>
          pour confirmer tous les détails de la visite.
        </p>
      </div>

      <!-- Closing -->
      <p style="margin-top:30px; font-size:16px; color:#333;">
        Nous sommes impatients de vous faire découvrir ce bien !
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>${agencyName}</strong></p>

      <div class="contact-info">
        <p>📞 ${agencyPhone}</p>
        <p>📧 ${agencyEmail}</p>
      </div>

      <p class="small">Cet email a été envoyé automatiquement</p>
      <p class="small">Pour toute question, répondez directement à cet email</p>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// VERSION TEXTE BRUT (FALLBACK)
// ==========================================
const textBody = `
Bonjour ${lead.nom},

Nous avons le plaisir de confirmer votre visite pour le bien suivant :

🏡 BIEN IMMOBILIER
${bien.nom || 'Bien immobilier'}
${bien.adresse ? '📍 Adresse : ' + bien.adresse : ''}
${bien.type ? '🏷️ Type : ' + bien.type : ''}
${bien.prix ? '💰 Prix : ' + prixFormate : ''}

📅 DÉTAILS DE VOTRE RENDEZ-VOUS
📆 Date : ${visit.date}
🕐 Heure : ${visit.time}
${bien.adresse ? '📍 Lieu : ' + bien.adresse : ''}

💬 Un de nos agents vous contactera au ${lead.telephone} pour confirmer tous les détails.

Nous sommes impatients de vous faire découvrir ce bien !

---
${agencyName}
📞 ${agencyPhone}
📧 ${agencyEmail}

Pour toute question, répondez directement à cet email
`;

// ==========================================
// RETOUR DU RÉSULTAT
// ==========================================
return {
  json: {
    // Destinataire
    to: lead.email,

    // Expéditeur (dynamique selon l'agence)
    fromEmail: fromEmail,
    fromName: fromName,

    // Contenu de l'email
    subject: subject,
    htmlBody: htmlBody,
    textBody: textBody,

    // Métadonnées
    leadName: lead.nom,
    bienNom: bien.nom,
    bienAdresse: bien.adresse,

    // Credential SMTP à utiliser (pour sélection dynamique)
    smtpCredential: smtpCredential
  }
};
```

---

### NODE 3 : Envoyer Email (SMTP Dynamique)

**Type** : Send Email (SMTP)
**Nom** : `Envoyer email depuis l'agence`

#### Configuration Dynamique par Agence

**From Email** : `{{ $json.fromEmail }}`
**From Name** : `{{ $json.fromName }}`
**To Email** : `{{ $json.to }}`
**Subject** : `{{ $json.subject }}`
**Email Type** : `HTML`
**Message (HTML)** : `{{ $json.htmlBody }}`
**Message (Text)** : `{{ $json.textBody }}`

**Reply To** : `{{ $json.fromEmail }}`

#### Credentials SMTP

Vous devez créer **2 credentials SMTP dans N8N** (une par agence) :

##### Credential 1 : Immocope SMTP
- **Name** : `Immocope SMTP`
- **Host** : `smtp.gmail.com` (ou votre serveur SMTP)
- **Port** : `587`
- **Secure** : `false` (STARTTLS)
- **Username** : `contact@immocope.com`
- **Password** : `mot-de-passe-application-gmail`

##### Credential 2 : RealAgency SMTP
- **Name** : `RealAgency SMTP`
- **Host** : `smtp.gmail.com` (ou votre serveur SMTP)
- **Port** : `587`
- **Secure** : `false` (STARTTLS)
- **Username** : `contact@realagency.com`
- **Password** : `mot-de-passe-application-gmail`

#### Sélection Dynamique du Credential

Dans le SMTP Node, utilisez une **expression** pour sélectionner le credential :

```javascript
{{ $json.smtpCredential }}
```

> ⚠️ **Note Gmail** : Chaque agence doit créer un "Mot de passe d'application" dans son compte Google :
> - Google Account → Sécurité → Validation en 2 étapes → Mots de passe des applications
> - Créer un mot de passe pour "N8N Email"

---

### NODE 4 : Respond to Webhook

**Type** : Respond to Webhook
**Nom** : `Réponse au dashboard`

**Configuration** :
- **Response Code** : `200`
- **Response Body** :

```json
{
  "success": true,
  "message": "Email envoyé à {{ $json.leadName }} pour le bien {{ $json.bienNom }}",
  "recipient": "{{ $json.to }}",
  "timestamp": "{{ $now }}"
}
```

---

## 🎨 Personnalisation du Template

### Couleurs par Agence

Dans le code JavaScript de la Function Node, modifiez :

```javascript
// Pour Immocope
const agencyColor = '#C5A065'; // Or premium
const agencyPhone = '+33 1 23 45 67 89';
const agencyEmail = 'contact@immocope.com';

// Pour RealAgency
const agencyColor = '#3B82F6'; // Bleu moderne
const agencyPhone = '+33 9 87 65 43 21';
const agencyEmail = 'contact@realagency.com';
```

### Ajout d'un Logo

Dans le header HTML, ajoutez :

```html
<div class="header">
  <img src="https://votre-domaine.com/logo.png"
       alt="Logo"
       style="width:120px; height:auto; margin-bottom:16px;">
  <h1>🏠 ${agencyName}</h1>
  <p>Confirmation de votre visite</p>
</div>
```

---

## ✅ Test du Workflow

### 1. Test depuis N8N

Dans N8N, cliquez sur "Listen for Test Event" sur le Webhook Node, puis envoyez ce payload :

```bash
curl -X POST https://votre-n8n.com/webhook/immocope-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "visit_confirmation",
    "lead": {
      "nom": "Test Prospect",
      "email": "votre-email@example.com",
      "telephone": "+33 6 12 34 56 78"
    },
    "bien": {
      "nom": "Appartement T3 Test",
      "adresse": "1 Place de la Concorde, 75008 Paris",
      "type": "Appartement",
      "prix": "500000"
    },
    "visit": {
      "date": "lundi 30 décembre 2025",
      "time": "15:00",
      "dateISO": "2025-12-30T15:00:00.000Z"
    },
    "agency": "AGENCY_A"
  }'
```

### 2. Test depuis le Dashboard

1. Connectez-vous au dashboard
2. Sélectionnez un lead avec un email valide **ET** un bien associé
3. Programmez une visite
4. Vérifiez la réception de l'email

---

## 🔑 Guide de Configuration SMTP par Agence

### Pour chaque nouvelle agence immobilière

Lorsque vous ajoutez une nouvelle agence au dashboard, suivez ces étapes :

#### Étape 1 : L'agence crée un mot de passe d'application

**Si l'agence utilise Gmail** :

1. Se connecter au compte Gmail de l'agence (ex: `contact@immocope.com`)
2. Aller sur [Google Account Security](https://myaccount.google.com/security)
3. **Activer la validation en 2 étapes** (si pas déjà fait)
4. Rechercher "Mots de passe des applications"
5. Cliquer sur **"Générer"**
6. Sélectionner :
   - **Application** : Autre (nom personnalisé)
   - **Nom** : `N8N Email Dashboard`
7. Cliquer sur **"Générer"**
8. **Copier** le mot de passe généré (16 caractères)
9. **Envoyer de manière sécurisée** ce mot de passe au gestionnaire N8N

**Si l'agence utilise un autre fournisseur** :
- **Office 365/Outlook** : Créer un mot de passe d'application similaire
- **Serveur SMTP personnalisé** : Utiliser le mot de passe du compte email

#### Étape 2 : Créer le credential SMTP dans N8N

En tant que gestionnaire N8N :

1. Ouvrir N8N
2. **Settings** → **Credentials** → **New**
3. Type : **SMTP**
4. Configuration :
   - **Name** : `[Nom de l'agence] SMTP` (ex: "Immocope SMTP")
   - **Host** : `smtp.gmail.com` (ou autre)
   - **Port** : `587`
   - **Secure** : `false` (STARTTLS)
   - **Username** : `contact@immocope.com` (email de l'agence)
   - **Password** : Le mot de passe d'application Gmail
5. **Test** → **Save**

#### Étape 3 : Ajouter l'agence dans le code

Dans le **Function Node** du workflow, ajouter la nouvelle agence :

```javascript
// Ajoutez votre nouvelle agence ici
const agencyName = agency === 'AGENCY_A' ? 'Immocope'
                 : agency === 'AGENCY_B' ? 'RealAgency'
                 : agency === 'AGENCY_C' ? 'Nouvelle Agence'  // ← NOUVEAU
                 : 'Agence';

const agencyPhone = agency === 'AGENCY_A' ? '+33 1 23 45 67 89'
                  : agency === 'AGENCY_B' ? '+33 9 87 65 43 21'
                  : agency === 'AGENCY_C' ? '+33 6 00 00 00 00'  // ← NOUVEAU
                  : '';

const agencyEmail = agency === 'AGENCY_A' ? 'contact@immocope.com'
                  : agency === 'AGENCY_B' ? 'contact@realagency.com'
                  : agency === 'AGENCY_C' ? 'contact@nouvelle-agence.com'  // ← NOUVEAU
                  : '';

const smtpCredential = agency === 'AGENCY_A' ? 'Immocope SMTP'
                     : agency === 'AGENCY_B' ? 'RealAgency SMTP'
                     : agency === 'AGENCY_C' ? 'Nouvelle Agence SMTP'  // ← NOUVEAU
                     : '';
```

#### Étape 4 : Ajouter l'agence dans le dashboard

Dans le fichier `.env` du dashboard :

```env
# Nouvelle Agence C
VITE_AIRTABLE_TOKEN_AGENCY_C=patXXXXXXXXXXXXXX
VITE_AIRTABLE_BASE_ID_AGENCY_C=appXXXXXXXXXXXXXX
VITE_N8N_WEBHOOK_AGENCY_C=https://n8n.com/webhook/nouvelle-agence-send-message
VITE_N8N_WEBHOOK_EMAIL_AGENCY_C=https://n8n.com/webhook/nouvelle-agence-send-email
```

Dans `src/data/users.js` :

```javascript
'agent@nouvelle-agence.com': {
  id: 'user-005',
  email: 'agent@nouvelle-agence.com',
  password: 'agent123',
  name: 'Agent Nouvelle Agence',
  role: 'agent',
  agency: 'AGENCY_C',  // ← Nouveau ID d'agence
  agencyName: 'Nouvelle Agence'
}
```

---

## 🐛 Troubleshooting

### Email non reçu

**Vérifiez** :
- Le webhook est bien activé dans N8N
- L'URL du webhook est correcte dans `.env`
- Les credentials Gmail/SMTP sont valides
- L'email du prospect n'est pas dans les spams

### Adresse manquante

**Vérifiez** :
- Le lead a bien un `Bien_Associe` dans Airtable
- La table `Biens` existe et contient le champ `Adresse`
- Le champ `Adresse` n'est pas vide pour ce bien

### Erreur 500 dans N8N

**Vérifiez** :
- Le code JavaScript du Function Node est correct (pas de virgule manquante)
- Les champs `lead`, `bien`, `visit` existent dans le payload
- Les credentials email sont configurés

---

## 📊 Monitoring

### Logs N8N

Pour voir les executions :
1. N8N → Executions
2. Filtrer par workflow "Email Confirmation"
3. Voir les détails de chaque execution

### Logs Dashboard

Dans la console du navigateur :
```
✅ Email de confirmation envoyé avec succès
```

---

## 🚀 Déploiement Production

### Checklist

- [ ] Workflow activé dans N8N
- [ ] URL webhook copiée dans `.env` (frontend)
- [ ] Credentials Gmail/SMTP configurés
- [ ] Test réussi avec un email réel
- [ ] Template personnalisé (logo, couleurs, coordonnées)
- [ ] Vérifier la boîte spam lors des premiers tests
- [ ] Configurer SPF/DKIM pour éviter les spams (si SMTP personnalisé)

---

## 📞 Support

Pour toute question sur ce workflow :
- Documentation complète : [DOCUMENTATION.md](./DOCUMENTATION.md)
- Section N8N : Ligne 511-764
