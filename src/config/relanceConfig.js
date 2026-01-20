/**
 * @fileoverview Configuration du système de relance automatique
 * @module config/relanceConfig
 *
 * @description
 * Définit les règles de relance pour les leads TIEDE et FROID
 * avec délais, templates de messages et conditions d'arrêt
 *
 * @author IMMO Copilot Team
 * @version 1.0.0
 */

// ============================================================
// DÉLAIS DE RELANCE (en jours)
// ============================================================

export const RELANCE_DELAYS = {
  TIEDE: {
    first: 3,      // J+3 : Première relance
    second: 7,     // J+7 : Deuxième relance
    third: 14,     // J+14 : Dernière relance avant passage en FROID
    maxAttempts: 3
  },
  FROID: {
    first: 30,     // J+30 : Relance mensuelle
    second: 60,    // J+60 : Dernière chance
    third: 90,     // J+90 : Archivage automatique suggéré
    maxAttempts: 3
  }
};

// ============================================================
// HEURES D'ENVOI AUTORISÉES
// ============================================================

export const RELANCE_HOURS = {
  start: 10,     // 10h00
  end: 18,       // 18h00
  workDays: [1, 2, 3, 4, 5] // Lundi à Vendredi (0 = Dimanche)
};

// ============================================================
// TEMPLATES DE MESSAGES PAR TYPE ET TENTATIVE
// ============================================================

export const RELANCE_TEMPLATES = {
  TIEDE: {
    attempt1: {
      subject: "Suite à votre demande d'estimation",
      template: `Bonjour {nom},

Je reviens vers vous concernant votre projet immobilier {adresse}.

Avez-vous eu le temps de consulter notre première estimation ?

Je reste à votre disposition pour :
✓ Affiner l'évaluation de votre bien
✓ Répondre à vos questions
✓ Planifier une visite sans engagement

Quel serait le meilleur moment pour échanger cette semaine ?

Cordialement,
{agentName}
{agencyName}`
    },
    attempt2: {
      subject: "Votre projet immobilier avance ?",
      template: `Bonjour {nom},

J'espère que vous allez bien.

Je souhaitais savoir si vous aviez avancé dans votre réflexion concernant {adresse}.

Le marché actuel est favorable, et j'ai récemment accompagné plusieurs propriétaires dans des situations similaires à la vôtre.

Seriez-vous disponible pour un point téléphonique de 15 minutes ?

Bien à vous,
{agentName}
{agencyName}`
    },
    attempt3: {
      subject: "Dernière opportunité - Estimation gratuite",
      template: `Bonjour {nom},

C'est mon dernier message concernant votre bien {adresse}.

Si votre projet est toujours d'actualité, je serais ravi d'en discuter avec vous.

Sinon, pas de souci ! Je reste joignable si vous changez d'avis.

📞 Un simple appel suffit : {agentPhone}

Excellente journée,
{agentName}
{agencyName}`
    }
  },
  FROID: {
    attempt1: {
      subject: "Toujours intéressé par votre projet ?",
      template: `Bonjour {nom},

Cela fait quelques semaines que nous avons échangé au sujet de {adresse}.

Le marché immobilier évolue constamment, et votre bien pourrait bénéficier des conditions actuelles.

Souhaitez-vous que nous fassions un point ensemble ?

Je reste disponible,
{agentName}
{agencyName}`
    },
    attempt2: {
      subject: "Mise à jour : marché immobilier dans votre secteur",
      template: `Bonjour {nom},

J'ai remarqué une évolution intéressante du marché dans le secteur de {adresse}.

Si votre projet immobilier est toujours en réflexion, ce serait le bon moment d'en reparler.

Êtes-vous disponible pour un échange rapide ?

Cordialement,
{agentName}
{agencyName}`
    },
    attempt3: {
      subject: "Clôture de votre dossier - Dernière nouvelle",
      template: `Bonjour {nom},

N'ayant pas eu de retour de votre part, je vais clôturer votre dossier concernant {adresse}.

Si toutefois votre situation évolue, n'hésitez pas à me recontacter directement.

Je vous souhaite le meilleur pour vos projets,
{agentName}
{agencyName}

📧 Email : {agentEmail}
📞 Téléphone : {agentPhone}`
    }
  }
};

// ============================================================
// RÈGLES DE CALCUL DU PROCHAIN ENVOI
// ============================================================

/**
 * Calcule la date de prochaine relance pour un lead
 *
 * @param {Object} lead - Lead à analyser
 * @returns {Date|null} Date de prochaine relance ou null si aucune relance nécessaire
 */
export function calculateNextRelance(lead) {
  const now = new Date();

  // Ne pas relancer si :
  // - Lead archivé
  // - Lead en découverte ou statut avancé
  // - IA stoppée
  if (lead.statut === 'ARCHIVE' ||
      lead.statut === 'EN_DECOUVERTE' ||
      lead.statut === 'VISITE_PROGRAMMEE' ||
      lead.stop_ai) {
    return null;
  }

  // Récupérer le dernier message du bot
  const lastBotMessage = lead.conversation
    ?.filter(msg => msg.sender === 'bot')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  // Si le lead a répondu après le dernier message du bot, ne pas relancer
  const lastLeadMessage = lead.conversation
    ?.filter(msg => msg.sender === 'lead')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (lastLeadMessage && lastBotMessage &&
      new Date(lastLeadMessage.timestamp) > new Date(lastBotMessage.timestamp)) {
    return null; // Le lead a répondu, attendre
  }

  // Calculer le nombre de jours depuis le dernier contact
  const lastContactDate = lastBotMessage
    ? new Date(lastBotMessage.timestamp)
    : new Date(lead.createdTime);

  const daysSinceContact = Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24));

  // Compter le nombre de relances déjà effectuées
  const relanceCount = lead.conversation?.filter(msg =>
    msg.sender === 'bot' && msg.isRelance === true
  ).length || 0;

  const delays = RELANCE_DELAYS[lead.score];

  if (!delays) return null; // Pas de relance pour les leads CHAUD

  // Déterminer quel délai appliquer selon le nombre de relances
  let nextDelay;
  if (relanceCount === 0) nextDelay = delays.first;
  else if (relanceCount === 1) nextDelay = delays.second;
  else if (relanceCount === 2) nextDelay = delays.third;
  else return null; // Max de relances atteint

  // Si le délai est dépassé, retourner "maintenant"
  if (daysSinceContact >= nextDelay) {
    return now;
  }

  // Sinon, calculer la date future
  const nextRelanceDate = new Date(lastContactDate);
  nextRelanceDate.setDate(nextRelanceDate.getDate() + nextDelay);

  return nextRelanceDate;
}

/**
 * Obtient le template de message approprié pour une relance
 *
 * @param {Object} lead - Lead à relancer
 * @param {Object} agent - Agent qui envoie la relance
 * @param {string} agencyName - Nom de l'agence
 * @returns {Object} Template avec subject et message
 */
export function getRelanceTemplate(lead, agent, agencyName) {
  const relanceCount = lead.conversation?.filter(msg =>
    msg.sender === 'bot' && msg.isRelance === true
  ).length || 0;

  const attemptKey = `attempt${relanceCount + 1}`;
  const template = RELANCE_TEMPLATES[lead.score]?.[attemptKey];

  if (!template) return null;

  // Remplacer les variables dans le template
  const replacements = {
    '{nom}': lead.nom,
    '{adresse}': lead.adresse || lead.bien || 'votre bien',
    '{agentName}': agent.name,
    '{agencyName}': agencyName,
    '{agentPhone}': agent.phone || '',
    '{agentEmail}': agent.email || ''
  };

  let message = template.template;
  let subject = template.subject;

  Object.entries(replacements).forEach(([key, value]) => {
    message = message.replace(new RegExp(key, 'g'), value);
    subject = subject.replace(new RegExp(key, 'g'), value);
  });

  return { subject, message };
}

/**
 * Vérifie si l'heure actuelle est appropriée pour envoyer une relance
 *
 * @returns {boolean} true si c'est le bon moment
 */
export function isGoodTimeToSend() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  return RELANCE_HOURS.workDays.includes(day) &&
         hour >= RELANCE_HOURS.start &&
         hour < RELANCE_HOURS.end;
}

/**
 * Détermine l'urgence d'une relance
 *
 * @param {Date} nextRelanceDate - Date de prochaine relance
 * @returns {string} 'urgent' | 'today' | 'soon' | 'scheduled'
 */
export function getRelanceUrgency(nextRelanceDate) {
  if (!nextRelanceDate) return null;

  const now = new Date();
  const hoursDiff = (nextRelanceDate - now) / (1000 * 60 * 60);

  if (hoursDiff <= 0) return 'urgent'; // En retard
  if (hoursDiff <= 24) return 'today'; // Aujourd'hui
  if (hoursDiff <= 72) return 'soon';  // Dans 3 jours
  return 'scheduled'; // Planifié
}
