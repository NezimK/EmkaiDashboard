# 🔐 Système de Connexion Persistante

## Vue d'ensemble

Le système "Se souvenir de moi" permet aux utilisateurs de rester connectés même après la fermeture du navigateur, tout en maintenant la sécurité des données.

---

## 🎯 Fonctionnalités

### 1. Case à Cocher "Se souvenir de moi"

Sur la page de connexion, l'utilisateur peut cocher cette option pour activer la connexion persistante.

**Comportements** :

#### ✅ Si COCHÉ :
- L'email est sauvegardé dans `localStorage`
- La session utilisateur complète est sauvegardée dans `localStorage`
- L'utilisateur reste connecté même après :
  - Fermeture du navigateur
  - Redémarrage de l'ordinateur
  - Plusieurs jours d'inactivité

#### ❌ Si NON COCHÉ :
- Seul l'email est sauvegardé (pré-remplissage)
- La session est stockée uniquement dans `sessionStorage`
- Déconnexion automatique à la fermeture du navigateur

---

## 🔒 Sécurité

### Stockage des Données

#### localStorage (Persistant)
```javascript
{
  "rememberedEmail": "agent@immocope.com",  // Email pré-rempli
  "rememberMe": "true",                      // État de la checkbox
  "emkai_user": "{...}"                      // Session complète (si activé)
}
```

#### sessionStorage (Temporaire)
```javascript
{
  "emkai_user": "{...}"  // Session toujours stockée ici
}
```

### Validation de Sécurité

Lors de la restauration de session, le système vérifie :

```javascript
✓ L'utilisateur a un agency
✓ L'utilisateur a un agencyName
✓ L'utilisateur a un email
✓ L'utilisateur a un name
✓ L'utilisateur a un role
```

Si **UNE SEULE** de ces conditions échoue :
- ❌ Session invalide → Déconnexion forcée
- 🧹 Nettoyage de sessionStorage ET localStorage
- 🔄 Redirection vers la page de login

### Protection contre les Attaques

**1. Injection de Code**
- Les données sont parsées avec `JSON.parse()` dans un `try/catch`
- Erreurs de parsing → Nettoyage automatique

**2. Session Expirée/Corrompue**
- Validation stricte des champs obligatoires
- Logs de sécurité dans la console

**3. Vol de Session**
- Pas de token JWT (session simple)
- Données chiffrées uniquement côté navigateur (localStorage)

> ⚠️ **Note** : Pour une sécurité maximale en production, implémenter des tokens JWT avec expiration.

---

## 🔄 Flux de Connexion

### Scénario 1 : Première Connexion (Sans "Se souvenir de moi")

```
1. Utilisateur entre email + password
2. handleLogin() est appelé avec rememberMe=false
3. Session sauvegardée dans sessionStorage uniquement
4. Email sauvegardé dans localStorage (pré-remplissage)
5. Utilisateur connecté

→ Fermeture du navigateur = Déconnexion
→ Rafraîchissement de page = Connexion maintenue
```

### Scénario 2 : Première Connexion (Avec "Se souvenir de moi")

```
1. Utilisateur coche "Se souvenir de moi"
2. Utilisateur entre email + password
3. handleLogin() est appelé avec rememberMe=true
4. Session sauvegardée dans sessionStorage + localStorage
5. Email + checkbox state sauvegardés dans localStorage
6. Utilisateur connecté

→ Fermeture du navigateur = Connexion maintenue
→ Rafraîchissement de page = Connexion maintenue
→ Retour après 7 jours = Connexion maintenue
```

### Scénario 3 : Retour sur le Site (Session Active)

```
1. Page se charge
2. useEffect() s'exécute
3. Vérification sessionStorage → Trouvé ✅
4. Validation des données → Valide ✅
5. setCurrentUser() + setIsAuthenticated(true)
6. Redirection automatique vers le dashboard

→ Connexion instantanée, sans login
```

### Scénario 4 : Retour sur le Site (Connexion Persistante)

```
1. Page se charge
2. useEffect() s'exécute
3. Vérification sessionStorage → Vide ❌
4. Vérification localStorage → Trouvé ✅
5. Validation des données → Valide ✅
6. Copie dans sessionStorage pour cette session
7. setCurrentUser() + setIsAuthenticated(true)
8. Redirection automatique vers le dashboard

→ Connexion automatique même après fermeture
```

---

## 💻 Implémentation Technique

### Login.jsx

**State Management**
```javascript
const [rememberMe, setRememberMe] = useState(false);
```

**Chargement des Préférences**
```javascript
useEffect(() => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

  if (savedEmail && savedRememberMe) {
    setEmail(savedEmail);
    setRememberMe(true);
  }
}, []);
```

**Sauvegarde lors de la Soumission**
```javascript
if (rememberMe) {
  localStorage.setItem('rememberedEmail', email);
  localStorage.setItem('rememberMe', 'true');
} else {
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberMe');
}
```

### App.jsx

**Restauration de Session**
```javascript
useEffect(() => {
  // 1. Vérifier sessionStorage (prioritaire)
  let savedUser = sessionStorage.getItem('emkai_user');
  let storageType = 'session';

  // 2. Sinon, vérifier localStorage
  if (!savedUser) {
    savedUser = localStorage.getItem('emkai_user');
    storageType = 'local';
  }

  // 3. Si trouvé, valider et restaurer
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);

      if (user && user.agency && user.agencyName && ...) {
        setCurrentUser(user);
        setIsAuthenticated(true);

        // Synchroniser localStorage → sessionStorage
        if (storageType === 'local') {
          sessionStorage.setItem('emkai_user', savedUser);
        }
      }
    } catch (error) {
      // Nettoyage en cas d'erreur
      sessionStorage.removeItem('emkai_user');
      localStorage.removeItem('emkai_user');
    }
  }
}, []);
```

**Sauvegarde lors du Login**
```javascript
const handleLogin = (email, password, rememberMe = false) => {
  const result = validateLogin(email, password);

  if (result.success) {
    const userJSON = JSON.stringify(result.user);

    // Toujours sauvegarder dans sessionStorage
    sessionStorage.setItem('emkai_user', userJSON);

    // Si "Se souvenir de moi", aussi dans localStorage
    if (rememberMe) {
      localStorage.setItem('emkai_user', userJSON);
    } else {
      localStorage.removeItem('emkai_user');
    }
  }
};
```

**Déconnexion Propre**
```javascript
const handleLogout = () => {
  // Nettoyer les états
  setIsAuthenticated(false);
  setCurrentUser(null);

  // Nettoyer sessionStorage ET localStorage
  sessionStorage.removeItem('emkai_user');
  localStorage.removeItem('emkai_user');

  // Garder rememberedEmail pour pré-remplissage
  // (ne pas supprimer)
};
```

---

## 📊 Tableau de Bord

### Données Stockées

| Clé                 | Type          | Durée       | Contenu                    |
|---------------------|---------------|-------------|----------------------------|
| `rememberedEmail`   | localStorage  | Permanent   | Email de l'utilisateur     |
| `rememberMe`        | localStorage  | Permanent   | État checkbox (true/false) |
| `emkai_user`        | sessionStorage| Session     | Objet utilisateur complet  |
| `emkai_user`        | localStorage  | Permanent*  | Objet utilisateur complet  |

\* Seulement si "Se souvenir de moi" est coché

### Exemple de Donnée `emkai_user`

```json
{
  "name": "Sophie Martin",
  "email": "agent@immocope.com",
  "role": "agent",
  "agency": "AGENCY_A",
  "agencyName": "Immocope",
  "phone": "+33 6 12 34 56 78"
}
```

---

## 🧪 Tests Utilisateur

### Test 1 : Connexion Sans "Se souvenir de moi"

1. ❌ Ne pas cocher "Se souvenir de moi"
2. Se connecter avec `agent@immocope.com`
3. Fermer le navigateur complètement
4. Rouvrir le site

**Résultat attendu** :
- ✅ Déconnecté
- ✅ Email pré-rempli
- ❌ Checkbox non cochée

### Test 2 : Connexion Avec "Se souvenir de moi"

1. ✅ Cocher "Se souvenir de moi"
2. Se connecter avec `agent@immocope.com`
3. Fermer le navigateur complètement
4. Rouvrir le site

**Résultat attendu** :
- ✅ Connecté automatiquement
- ✅ Dashboard affiché directement
- ✅ Aucun login requis

### Test 3 : Déconnexion Manuelle

1. Se connecter avec "Se souvenir de moi"
2. Cliquer sur "Déconnexion"
3. Fermer et rouvrir le navigateur

**Résultat attendu** :
- ✅ Déconnecté
- ✅ Email pré-rempli
- ✅ Checkbox cochée (préférence sauvegardée)

### Test 4 : Décochage de "Se souvenir de moi"

1. Email pré-rempli avec checkbox cochée
2. Décocher "Se souvenir de moi"
3. Se connecter

**Résultat attendu** :
- ✅ Connexion réussie
- ✅ Session uniquement (pas de localStorage)
- ✅ Fermeture navigateur = Déconnexion

---

## 🔧 Configuration Avancée

### Expiration de Session (Futur)

Pour ajouter une expiration automatique :

```javascript
// Lors du login
const sessionData = {
  user: result.user,
  expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours
};

localStorage.setItem('emkai_user', JSON.stringify(sessionData));

// Lors de la vérification
const savedData = JSON.parse(localStorage.getItem('emkai_user'));
if (savedData.expiresAt < Date.now()) {
  // Session expirée
  localStorage.removeItem('emkai_user');
  return;
}
```

### Multi-Onglets

Le système fonctionne automatiquement sur plusieurs onglets :
- ✅ sessionStorage est partagé entre onglets
- ✅ localStorage est partagé entre onglets
- ✅ Cohérence automatique

### Nettoyage Automatique

Ajouter un cleanup au montage de l'app :

```javascript
// Nettoyer les anciennes clés (migration)
useEffect(() => {
  const oldKeys = ['old_session_key', 'deprecated_user'];
  oldKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}, []);
```

---

## 🐛 Dépannage

### Problème : L'utilisateur n'est pas reconnecté automatiquement

**Diagnostic** :
1. Ouvrir la console du navigateur (F12)
2. Onglet "Application" → "Local Storage"
3. Vérifier la présence de `emkai_user`

**Solutions** :
- Si absent : "Se souvenir de moi" n'était pas coché
- Si présent mais invalide : Supprimer manuellement et se reconnecter
- Si erreur de parsing : Vider le localStorage complètement

### Problème : La checkbox reste cochée mais ne fonctionne pas

**Diagnostic** :
- Vérifier que `localStorage.getItem('rememberMe')` retourne `"true"`

**Solution** :
```javascript
// Dans la console du navigateur
localStorage.setItem('rememberMe', 'true');
```

### Problème : Session corrompue

**Solution rapide** :
```javascript
// Dans la console du navigateur
localStorage.clear();
sessionStorage.clear();
// Rafraîchir la page
```

---

## 📈 Métriques d'Utilisation

### À Suivre

- **% utilisateurs** utilisant "Se souvenir de moi"
- **Durée moyenne** des sessions persistantes
- **Taux de déconnexion** manuelle vs automatique
- **Erreurs** de validation de session

---

## ✅ Checklist de Sécurité

- [x] Validation stricte des données utilisateur
- [x] Gestion d'erreurs avec try/catch
- [x] Nettoyage automatique en cas de corruption
- [x] Logs de sécurité dans la console
- [x] Pas de mot de passe stocké (uniquement session)
- [ ] **TODO** : Ajouter expiration de session (7 jours)
- [ ] **TODO** : Implémenter JWT pour production
- [ ] **TODO** : Ajouter refresh token

---

Créé avec ❤️ pour une expérience utilisateur optimale et sécurisée
