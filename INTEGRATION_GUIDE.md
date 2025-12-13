# Guide d'Intégration WhatsApp → EMKAI Copilot

## 🎯 Objectif
Synchroniser automatiquement les conversations WhatsApp avec Airtable pour les afficher dans le Dashboard.

---

## 📋 Prérequis

- Compte WhatsApp Business API
- Base Airtable configurée
- Backend Node.js (Express/Next.js)

---

## 🔧 Option 1 : WhatsApp Business API + Webhook

### 1. Configuration WhatsApp Business

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Webhook pour recevoir les messages
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { entry } = req.body;

    for (const change of entry[0].changes) {
      const message = change.value.messages?.[0];

      if (message) {
        await saveMessageToAirtable({
          leadPhone: message.from,
          sender: 'lead',
          message: message.text.body,
          timestamp: new Date(message.timestamp * 1000).toISOString()
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Fonction pour sauvegarder dans Airtable
async function saveMessageToAirtable({ leadPhone, sender, message, timestamp }) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Leads';

  // 1. Trouver le lead par téléphone
  const findResponse = await axios.get(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
    {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      params: {
        filterByFormula: `{phone} = '${leadPhone}'`
      }
    }
  );

  if (findResponse.data.records.length > 0) {
    const record = findResponse.data.records[0];
    const existingConversation = record.fields.conversation || [];

    // 2. Ajouter le nouveau message
    const updatedConversation = [
      ...existingConversation,
      { sender, message, timestamp }
    ];

    // 3. Mettre à jour Airtable
    await axios.patch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${record.id}`,
      {
        fields: {
          conversation: JSON.stringify(updatedConversation)
        }
      },
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Envoyer un message WhatsApp
app.post('/api/send-whatsapp', async (req, res) => {
  const { to, message } = req.body;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Sauvegarder le message envoyé
    await saveMessageToAirtable({
      leadPhone: to,
      sender: 'bot',
      message: message,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### 2. Structure Airtable

Dans votre table "Leads", ajoutez un champ :

- **Nom** : `conversation`
- **Type** : `Long text` (pour stocker le JSON)

Exemple de données stockées :
```json
[
  {
    "sender": "bot",
    "message": "Bonjour ! Comment puis-je vous aider ?",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  {
    "sender": "lead",
    "message": "Je cherche un appartement",
    "timestamp": "2025-01-15T10:31:00Z"
  }
]
```

---

## 🔧 Option 2 : Zapier (No-Code)

### Configuration Zapier

1. **Trigger** : WhatsApp Business (Nouveau message)
2. **Action** : Airtable (Update Record)
   - Trouver le record par `phone`
   - Ajouter au champ `conversation` (format JSON)

### Formule Zapier pour ajouter au JSON

```javascript
// Dans Zapier Code Step
const existingConversation = JSON.parse(inputData.conversation || '[]');

existingConversation.push({
  sender: inputData.from === 'bot' ? 'bot' : 'lead',
  message: inputData.message,
  timestamp: new Date().toISOString()
});

output = [{
  conversation: JSON.stringify(existingConversation)
}];
```

---

## 🔧 Option 3 : Import manuel depuis export WhatsApp

Si vous avez déjà des conversations exportées :

### 1. Parser le fichier texte WhatsApp

```javascript
// parseWhatsApp.js
const fs = require('fs');

function parseWhatsAppExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const conversation = [];
  const regex = /\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] ([^:]+): (.+)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const [, date, time, sender, message] = match;
      conversation.push({
        sender: sender.includes('Bot') ? 'bot' : 'lead',
        message: message,
        timestamp: new Date(`${date} ${time}`).toISOString()
      });
    }
  }

  return conversation;
}

// Exemple d'utilisation
const conversation = parseWhatsAppExport('./whatsapp_export.txt');
console.log(JSON.stringify(conversation, null, 2));
```

---

## 📊 Modification du Frontend pour données réelles

### Récupérer depuis Airtable

```javascript
// src/data/mockData.js devient src/services/airtable.js

const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

export async function fetchLeads() {
  const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/Leads`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  const data = await response.json();

  return data.records.map(record => ({
    id: record.id,
    nom: record.fields.nom,
    email: record.fields.email,
    score: record.fields.score,
    statut: record.fields.statut,
    summary: record.fields.summary,
    phone: record.fields.phone,
    contacted: record.fields.contacted || false,
    budget: record.fields.budget,
    typeProjet: record.fields.typeProjet,
    secteur: record.fields.secteur,
    delai: record.fields.delai,
    conversation: JSON.parse(record.fields.conversation || '[]')
  }));
}
```

### Modifier App.jsx

```javascript
// src/App.jsx
import { fetchLeads } from './services/airtable';

function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await fetchLeads();
        setLeads(data);
      } catch (error) {
        console.error('Error loading leads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  // ... reste du code
}
```

---

## 🔒 Variables d'Environnement

Créez un fichier `.env` :

```bash
# WhatsApp
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_TOKEN=your_whatsapp_token

# Airtable
AIRTABLE_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=your_base_id

# Frontend (.env)
VITE_AIRTABLE_TOKEN=your_airtable_token
VITE_AIRTABLE_BASE_ID=your_base_id
```

---

## ✅ Checklist de déploiement

- [ ] Configurer WhatsApp Business API
- [ ] Créer le webhook backend
- [ ] Ajouter le champ `conversation` dans Airtable
- [ ] Tester l'envoi/réception de messages
- [ ] Modifier le frontend pour utiliser les vraies données
- [ ] Déployer le backend (Vercel/Heroku/Railway)
- [ ] Configurer les variables d'environnement

---

## 📞 Support

Pour plus d'aide :
- [Documentation WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Documentation Airtable API](https://airtable.com/developers/web/api/introduction)
