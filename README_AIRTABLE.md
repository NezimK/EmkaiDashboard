# 🔗 Connexion Airtable - EMKAI Copilot

Ce guide explique comment connecter votre Dashboard aux vraies données Airtable alimentées par n8n.

---

## 📋 Prérequis

Votre table Airtable **LEADS** doit contenir ces colonnes :

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `nom` | Text | Nom du lead | "Sophie Dubois" |
| `email` | Email | Email du lead | "sophie@email.com" |
| `phone` | Phone | Téléphone | "+33 6 12 34 56 78" |
| `score` | Single Select | CHAUD / TIEDE / FROID | "CHAUD" |
| `statut` | Single Select | QUALIFIE / NOUVEAU | "QUALIFIE" |
| `summary` | Long Text | Résumé IA | "Investissement 200k..." |
| `budget` | Text | Budget | "200 000€" |
| `typeProjet` | Text | Type de projet | "Investissement locatif" |
| `secteur` | Text | Secteur géographique | "Nord" |
| `delai` | Text | Délai | "Cette semaine" |
| `contacted` | Checkbox | Lead contacté ? | false |
| `stop_ai` | Checkbox | IA stoppée ? | false |
| **`Conversation_JSON`** | **Long Text** | **JSON de la conversation** | Voir ci-dessous |

---

## 🗨️ Format du champ `Conversation_JSON`

C'est une **chaîne de caractères** contenant un tableau JSON :

```json
[
  {
    "role": "user",
    "text": "Bonjour, vous êtes dispo ?",
    "time": "2023-10-27T10:00:00Z"
  },
  {
    "role": "assistant",
    "text": "Bonjour ! Vous cherchez un bien pour investissement ou résidence principale ?",
    "time": "2023-10-27T10:00:05Z"
  },
  {
    "role": "user",
    "text": "Investissement locatif",
    "time": "2023-10-27T10:00:15Z"
  }
]
```

### Mapping automatique

Le service Airtable convertit automatiquement :
- `role: "user"` → `sender: "lead"` (bulle grise à gauche)
- `role: "assistant"` → `sender: "bot"` (bulle dorée à droite)
- `text` → `message`
- `time` → `timestamp`

---

## 🔧 Configuration

### 1. Créer un Personal Access Token Airtable

1. Allez sur [https://airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Créez un nouveau token avec les permissions :
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
3. Sélectionnez votre base EMKAI
4. Copiez le token généré

### 2. Récupérer votre Base ID

1. Ouvrez votre base Airtable
2. URL format : `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. Copiez la partie `appXXXXXXXXXXXXXX`

### 3. Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet :

```bash
VITE_AIRTABLE_TOKEN=patXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
VITE_AIRTABLE_TABLE_NAME=LEADS
```

---

## 🚀 Activer la connexion Airtable

### Option A : Utiliser les données réelles (Recommandé)

Modifiez [src/App.jsx](src/App.jsx:7) :

```javascript
// Remplacer cette ligne
import { mockLeads as initialLeads, getKPIs } from './data/mockData';

// Par celle-ci
import { fetchLeadsFromAirtable } from './services/airtable';
```

Puis dans le composant :

```javascript
function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les leads depuis Airtable
  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        const data = await fetchLeadsFromAirtable();
        setLeads(data);
      } catch (error) {
        console.error('Erreur chargement leads:', error);
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
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Chargement des leads...</div>
      </div>
    );
  }

  // ... reste du code
}
```

### Option B : Mode Hybride (Test)

Gardez les mock data mais testez la connexion :

```javascript
import { fetchLeadsFromAirtable } from './services/airtable';

// Test au démarrage
useEffect(() => {
  fetchLeadsFromAirtable()
    .then(data => console.log('✅ Connexion Airtable OK:', data))
    .catch(err => console.error('❌ Erreur Airtable:', err));
}, []);
```

---

## 🎨 Affichage de la Conversation

Le composant [LeadModal.jsx](src/components/LeadModal.jsx:88) affiche automatiquement :

### Messages User (Client)
- Alignés à **gauche**
- Bulle **grise** (`bg-gray-200`)
- Nom du lead affiché

### Messages Assistant (Sarah)
- Alignés à **droite**
- Bulle **dorée** (`bg-accent`)
- "Sarah (Assistant)" affiché

### Heure
- Format : `10:30`
- Affichée en petit sous chaque message

### Cas vide
Si `Conversation_JSON` est vide ou invalide :
```
📱 Aucun historique de conversation disponible
```

---

## 🔄 Synchronisation n8n → Airtable

Votre workflow n8n doit :

1. **Recevoir les messages WhatsApp**
2. **Parser la conversation**
3. **Formater en JSON** :
   ```json
   [
     { "role": "user", "text": "...", "time": "..." },
     { "role": "assistant", "text": "...", "time": "..." }
   ]
   ```
4. **Stocker dans Airtable** dans le champ `Conversation_JSON`

### Exemple n8n (Code Node)

```javascript
// Dans un Code Node n8n
const conversation = [];

for (const message of items) {
  conversation.push({
    role: message.from === 'bot' ? 'assistant' : 'user',
    text: message.body,
    time: new Date(message.timestamp * 1000).toISOString()
  });
}

return [{
  json: {
    Conversation_JSON: JSON.stringify(conversation)
  }
}];
```

---

## ✅ Checklist de vérification

- [ ] Token Airtable créé avec les bonnes permissions
- [ ] Base ID récupéré
- [ ] Fichier `.env` créé avec les 3 variables
- [ ] Colonne `Conversation_JSON` présente dans Airtable
- [ ] Format JSON respecté : `[{ role, text, time }]`
- [ ] n8n alimente correctement Airtable
- [ ] Test de connexion réussi (voir console)
- [ ] Les conversations s'affichent correctement dans la modal

---

## 🐛 Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez votre `VITE_AIRTABLE_TOKEN`
- Le token a-t-il les bonnes permissions ?
- Le token n'a-t-il pas expiré ?

### Erreur 404 (Not Found)
- Vérifiez le `VITE_AIRTABLE_BASE_ID`
- Vérifiez le `VITE_AIRTABLE_TABLE_NAME`

### Conversation vide
- Vérifiez que le champ `Conversation_JSON` n'est pas vide
- Vérifiez le format JSON (doit être un tableau)
- Console : regardez les erreurs de parsing

### Conversation ne s'affiche pas
- Ouvrez la console navigateur (F12)
- Vérifiez les erreurs dans le parsing JSON
- Le format doit être : `[{ role, text, time }]`

---

## 📞 Support

Pour toute question, vérifiez :
1. Les logs dans la console (F12)
2. Le format de vos données dans Airtable
3. Les variables d'environnement

---

**Le Dashboard affiche maintenant vos vraies conversations WhatsApp depuis Airtable !** 🎉
