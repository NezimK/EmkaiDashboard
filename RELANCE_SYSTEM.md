# 🔔 Système de Relance Automatique

## Vue d'ensemble

Le système de relance semi-automatique permet de gérer intelligemment le suivi des leads **TIÈDES** et **FROIDS** sans perdre d'opportunités.

---

## 📋 Logique de Relance

### Leads TIÈDES (Priorité Moyenne)

| Tentative | Délai    | Action                                    |
|-----------|----------|-------------------------------------------|
| 1ère      | J+3      | Première relance - Rappel de l'estimation |
| 2ème      | J+7      | Deuxième relance - Proposition de RDV     |
| 3ème      | J+14     | Dernière relance avant passage en FROID   |

**Objectif** : Maintenir l'intérêt et convertir en visite

### Leads FROIDS (Priorité Basse)

| Tentative | Délai    | Action                                     |
|-----------|----------|--------------------------------------------|
| 1ère      | J+30     | Relance mensuelle - Toujours intéressé ?   |
| 2ème      | J+60     | Dernière chance - Actualité du marché      |
| 3ème      | J+90     | Clôture du dossier (suggestion d'archivage)|

**Objectif** : Récupérer les leads "dormants"

---

## 🎯 Conditions d'Arrêt Automatique

Le système **NE relance PAS** un lead si :

- ✅ Le lead a répondu après le dernier message
- ✅ Le statut a changé (EN_DECOUVERTE, VISITE_PROGRAMMEE, ARCHIVE)
- ✅ L'IA a été stoppée manuellement (PAUSE_IA)
- ✅ Le nombre maximum de relances est atteint (3)
- ✅ L'agent en charge est déjà en contact

---

## ⏰ Horaires Optimaux

**Jours** : Lundi à Vendredi
**Heures** : 10h00 - 18h00

> **Indicateur visuel** : Le dashboard affiche si c'est le bon moment pour relancer

---

## 📝 Templates de Messages

### Structure des Templates

Chaque message contient des **variables dynamiques** :

- `{nom}` → Prénom/Nom du lead
- `{adresse}` → Adresse du bien
- `{agentName}` → Nom de l'agent
- `{agencyName}` → Nom de l'agence
- `{agentPhone}` → Téléphone de l'agent
- `{agentEmail}` → Email de l'agent

### Exemple - Lead TIEDE, Tentative 1

```
Objet : Suite à votre demande d'estimation

Bonjour Jean Dupont,

Je reviens vers vous concernant votre projet immobilier 15 rue de la Paix.

Avez-vous eu le temps de consulter notre première estimation ?

Je reste à votre disposition pour :
✓ Affiner l'évaluation de votre bien
✓ Répondre à vos questions
✓ Planifier une visite sans engagement

Quel serait le meilleur moment pour échanger cette semaine ?

Cordialement,
Sophie Martin
Immocope
```

---

## 🖥️ Interface Dashboard

### Onglet "Relance"

L'interface affiche les leads par **niveau d'urgence** :

#### 1️⃣ Relances Urgentes (En retard)
- Badge **ROUGE**
- En retard de X heures
- Priorité absolue

#### 2️⃣ À Relancer Aujourd'hui
- Badge **ORANGE**
- Date/heure suggérée
- Haute priorité

#### 3️⃣ Cette Semaine
- Badge **BLEU**
- Date prévue dans les 3 jours
- Priorité normale

#### 4️⃣ Relances Planifiées
- Badge **GRIS**
- Date future programmée
- Suivi proactif

### Actions Disponibles

Pour chaque lead à relancer :

**Bouton "Copier"**
- Copie le message pré-rempli dans le presse-papier
- Permet de le coller dans WhatsApp externe

**Bouton "Envoyer"**
- Ouvre la modal de conversation
- Message pré-rempli et prêt à envoyer
- Un clic pour valider

---

## 📊 Statistiques

Le header affiche :

```
┌─────────────┬──────────────┬──────────────┬─────────────┐
│  URGENTS    │  AUJOURD'HUI │ CETTE SEMAINE│  PLANIFIÉS  │
│      3      │       7      │      12      │     23      │
└─────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 🔧 Configuration

### Modifier les Délais

Fichier : `src/config/relanceConfig.js`

```javascript
export const RELANCE_DELAYS = {
  TIEDE: {
    first: 3,      // Modifier ici (en jours)
    second: 7,
    third: 14,
    maxAttempts: 3
  },
  FROID: {
    first: 30,
    second: 60,
    third: 90,
    maxAttempts: 3
  }
};
```

### Modifier les Horaires

```javascript
export const RELANCE_HOURS = {
  start: 10,     // Heure de début (24h)
  end: 18,       // Heure de fin
  workDays: [1, 2, 3, 4, 5] // 1=Lundi, 5=Vendredi
};
```

### Personnaliser les Templates

```javascript
export const RELANCE_TEMPLATES = {
  TIEDE: {
    attempt1: {
      subject: "Votre nouveau sujet",
      template: `Votre nouveau message...`
    }
  }
};
```

---

## 🔄 Workflow Recommandé

### Chaque Matin (9h00-9h30)

1. Ouvrir l'onglet **"Relance"**
2. Vérifier les **Relances Urgentes**
3. Traiter les **À Relancer Aujourd'hui**

### Pour Chaque Lead

1. **Lire** le message pré-rempli
2. **Personnaliser** si nécessaire (ajout d'une note)
3. **Copier** ou **Envoyer** directement
4. Le système marque automatiquement la relance effectuée

### Suivi

- Le dashboard se met à jour en temps réel
- Les leads relancés disparaissent de la liste
- S'ils répondent, ils passent automatiquement en "EN_DECOUVERTE"

---

## 💡 Conseils d'Utilisation

### ✅ Bonnes Pratiques

- **Personnaliser** légèrement chaque message
- **Relancer le matin** (10h-12h) ou fin d'après-midi (16h-18h)
- **Respecter** le nombre max de relances (éviter le spam)
- **Noter** les retours dans la conversation
- **Archiver** après 3 relances sans réponse

### ❌ À Éviter

- Ne pas relancer pendant les weekends
- Ne pas modifier radicalement le template (perd la cohérence)
- Ne pas relancer si le lead a manifesté un désintérêt clair
- Ne pas négliger les "Urgents" au profit des "Planifiés"

---

## 🔮 Évolutions Futures (Phase 2)

### Option : Relance Entièrement Automatique

Si vous souhaitez passer en mode 100% automatique :

1. **Intégration N8N**
   - Workflow qui vérifie les relances tous les jours à 10h
   - Envoi automatique des messages WhatsApp
   - Notification à l'agent après envoi

2. **Machine Learning**
   - Analyse des meilleurs moments d'envoi par lead
   - Optimisation des templates selon les taux de réponse
   - Scoring prédictif de conversion

3. **A/B Testing**
   - Test de plusieurs versions de messages
   - Identification des formulations les plus efficaces

---

## 📈 Métriques de Performance

### KPIs à Suivre

- **Taux de réponse par tentative** : 1ère vs 2ème vs 3ème
- **Délai moyen de réponse** : Combien de temps avant réaction ?
- **Taux de conversion** : Relance → Visite → Mandat
- **Meilleurs jours/heures** : Quand obtient-on le plus de réponses ?

### Exemple de Tableau de Bord

```
Relances TIEDE (30 derniers jours)
├─ Tentative 1 : 45% de réponses (23/51)
├─ Tentative 2 : 28% de réponses (12/43)
└─ Tentative 3 : 15% de réponses (5/33)

Relances FROID (30 derniers jours)
├─ Tentative 1 : 12% de réponses (8/67)
├─ Tentative 2 : 8% de réponses (4/51)
└─ Tentative 3 : 3% de réponses (1/38)
```

---

## 🆘 Support

### Questions Fréquentes

**Q : Un lead a répondu après 2 relances. Que se passe-t-il ?**
R : Il disparaît automatiquement de l'onglet Relance et passe en "EN_DECOUVERTE"

**Q : Puis-je modifier un message juste avant l'envoi ?**
R : Oui ! Cliquez sur "Envoyer", le message s'ouvre pré-rempli et modifiable

**Q : Comment arrêter les relances pour un lead spécifique ?**
R : Activez "PAUSE_IA" sur le lead ou changez son statut

**Q : Les relances sont-elles visibles dans l'historique ?**
R : Oui, chaque relance est marquée avec `isRelance: true` dans la conversation

---

## 🎓 Formation Agents

### Checklist d'Onboarding

- [ ] Lire la documentation complète
- [ ] Comprendre la différence TIEDE vs FROID
- [ ] Tester l'envoi d'une relance sur un lead de test
- [ ] Personnaliser au moins un template
- [ ] Vérifier l'historique des relances dans une conversation

**Temps estimé** : 30 minutes

---

Créé avec ❤️ pour optimiser la conversion des leads immobiliers
