# 📱 Guide : Message WhatsApp de Confirmation de Visite

## 🎯 Objectif

Envoyer automatiquement un **message WhatsApp de confirmation** au prospect lorsqu'un agent programme un rendez-vous depuis le dashboard.

---

## ✅ Avantages WhatsApp vs Email

| Critère | WhatsApp ✅ | Email ❌ |
|---------|------------|----------|
| **Taux d'ouverture** | 98% | 20-30% |
| **Configuration** | Simple (N8N déjà configuré) | Complexe (SMTP, DNS, SPF/DKIM) |
| **Multi-agences** | Automatique | Nécessite credentials par agence |
| **Délivrabilité** | Instantanée | Risque spam |
| **Coût** | Gratuit | Gratuit (limité) ou payant |

---

## 🔄 Architecture

```
┌──────────────────┐
│   Dashboard      │
│  (Agent programme│
│    une visite)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ sendVisitConfirm │
│  ationWhatsApp() │  (airtable.js)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  N8N Webhook     │  (EXISTANT - déjà utilisé pour messages Sarah)
│  AGENCY_A / B    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  WhatsApp API    │
│  → Prospect      │
└──────────────────┘
```

---

## 📝 Message Envoyé au Prospect

Voici le message WhatsApp que le prospect reçoit :

```
✅ *Confirmation de votre visite*

Bonjour Jean Dupont,

Nous avons le plaisir de confirmer votre rendez-vous :

🏡 *Appartement T3 - Paris 15ème*
📍 42 Rue de la Convention, 75015 Paris
🏷️ Type : Appartement
💰 Prix : 450 000 €

📅 *Votre rendez-vous*
📆 Date : lundi 30 décembre 2025
🕐 Heure : 14:30
📍 Lieu : 42 Rue de la Convention, 75015 Paris

🗺️ Voir l'itinéraire : https://www.google.com/maps/search/?api=1&query=42+Rue+de+la+Convention%2C+75015+Paris

Un de nos agents vous contactera pour confirmer tous les détails.

À très bientôt ! 🤝

---
Immocope
```

---

## 🔧 Configuration N8N (Aucune modification requise !)

### Webhook Existant

Vous utilisez **déjà** les webhooks N8N pour envoyer les messages WhatsApp de Sarah :
- `VITE_N8N_WEBHOOK_AGENCY_A` pour Immocope
- `VITE_N8N_WEBHOOK_AGENCY_B` pour RealAgency

Le système envoie simplement un **nouveau type de message** au même webhook.

### Payload Envoyé

```json
{
  "phone": "+33612345678",
  "message": "✅ *Confirmation de votre visite*\n\nBonjour Jean Dupont...",
  "type": "visit_confirmation"
}
```

Le champ `type: "visit_confirmation"` permet de différencier ce message des messages conversationnels de Sarah.

---

## 🎨 Personnalisation du Message (Optionnel)

Si vous souhaitez personnaliser le message WhatsApp, éditez la fonction dans [src/services/airtable.js:512-535](src/services/airtable.js#L512-L535) :

### Ajouter le logo de l'agence

```javascript
const message = `✅ *Confirmation de votre visite*

${agency === 'AGENCY_A' ? '🏠 Immocope' : '🏢 RealAgency'}

Bonjour ${leadData.nom},
...
```

### Modifier le ton

```javascript
// Ton formel
const message = `Bonjour ${leadData.nom},

Nous vous confirmons votre rendez-vous...`

// Ton amical
const message = `Salut ${leadData.nom} ! 👋

Super nouvelle : votre visite est confirmée !...`
```

### Ajouter un bouton de rappel (si WhatsApp Business)

Si vous utilisez WhatsApp Business API avec boutons :

```javascript
const payload = {
  phone: leadData.telephone,
  message: message,
  type: 'visit_confirmation',
  buttons: [
    {
      type: 'url',
      text: 'Voir l\'itinéraire',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(leadData.adresse)}`
    },
    {
      type: 'phone_number',
      text: 'Appeler l\'agence',
      phone_number: agency === 'AGENCY_A' ? '+33123456789' : '+33987654321'
    }
  ]
};
```

---

## ✅ Test Complet

### Prérequis

1. ✅ N8N configuré et webhook actif
2. ✅ Table Biens créée dans Airtable avec le champ `Adresse`
3. ✅ Leads liés à des biens via `Bien_Associe`

### Étapes de Test

1. **Connectez-vous** au dashboard
2. **Sélectionnez** un lead avec :
   - ✅ Un numéro de téléphone valide
   - ✅ Un bien associé avec une adresse
3. **Cliquez** sur "Programmer une visite"
4. **Sélectionnez** une date et heure
5. **Validez**
6. **Vérifiez** que le prospect reçoit le message WhatsApp

### Exemple de Lead de Test

Dans Airtable, créez un lead de test :

**Table LEADS** :
- Prénom : `Test`
- Nom : `Prospect`
- Phone : `+33612345678` (votre numéro pour tester)
- Bien_Associe : Lien vers un bien

**Table Biens** :
- Nom : `Appartement T3 Test`
- Adresse : `1 Place de la Concorde, 75008 Paris`
- Type : `Appartement`
- Prix : `500000`

---

## 🔍 Logs et Debug

### Dans la Console du Dashboard

Lors de la programmation d'une visite, vous verrez :

```
✅ Message WhatsApp de confirmation envoyé avec succès
```

Ou en cas d'erreur :

```
⚠️ Message WhatsApp de confirmation non envoyé: Webhook URL not configured
❌ Erreur lors de l'envoi du message WhatsApp: [détails]
```

### Dans N8N

1. Ouvrir N8N → Executions
2. Filtrer par votre workflow WhatsApp
3. Vérifier le payload reçu et l'envoi

---

## 📊 Workflow Complet

Lorsqu'un agent programme un RDV :

```
1. Enregistrement dans Airtable
   ↓
2. Mise à jour du statut → "Visite Programmée"
   ↓
3. Envoi WhatsApp de confirmation au prospect ← NOUVEAU !
   ↓
4. Synchronisation Google Calendar (agent)
   ↓
5. Toast de confirmation
```

---

## 🐛 Troubleshooting

### Message WhatsApp non reçu

**Vérifiez** :
- Le numéro de téléphone du lead est valide (format international : `+33...`)
- Le webhook N8N est actif
- Les credentials WhatsApp sont valides dans N8N
- Le lead a bien un champ `Phone` ou `Telephone` renseigné

### Adresse manquante dans le message

**Vérifiez** :
- Le lead a bien un `Bien_Associe` dans Airtable
- La table `Biens` contient le champ `Adresse`
- Le champ `Adresse` n'est pas vide pour ce bien

### Lien Google Maps ne fonctionne pas

**Vérifiez** :
- L'adresse contient bien une adresse complète (rue, code postal, ville)
- L'URL est bien encodée (fait automatiquement par `encodeURIComponent`)

---

## 🚀 Déploiement Production

### Checklist

- [ ] Webhooks N8N actifs et testés
- [ ] Table Biens créée avec champ `Adresse`
- [ ] Leads de test liés à des biens
- [ ] Test réussi avec un numéro réel
- [ ] Message WhatsApp personnalisé (optionnel)
- [ ] Vérifier que les prospects reçoivent bien les messages

---

## 🎁 Fonctionnalités Supplémentaires (Optionnel)

### 1. Rappel Automatique 24h Avant

Créez un workflow N8N séparé qui :
1. Se déclenche quotidiennement
2. Interroge Airtable pour les visites du lendemain
3. Envoie un rappel WhatsApp

### 2. Confirmation de Présence

Ajoutez des boutons de réponse rapide :
- ✅ Je confirme ma présence
- ❌ Je dois annuler
- ⏰ Je dois décaler

### 3. Notification Agent

Envoyez aussi un WhatsApp à l'agent pour lui rappeler le RDV.

---

## 📞 Support

- Documentation complète : [DOCUMENTATION.md](./DOCUMENTATION.md)
- Code source : [src/services/airtable.js:479-563](src/services/airtable.js#L479-L563)
- Composant : [src/components/ScheduleVisitModal.jsx:109-127](src/components/ScheduleVisitModal.jsx#L109-L127)
