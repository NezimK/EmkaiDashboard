/**
 * @fileoverview Utilitaires pour l'export manuel de visites vers les calendriers
 * @module utils/calendarExport
 *
 * @description
 * Fonctions de fallback pour export manuel vers Outlook.
 * Note : Google Calendar utilise maintenant l'OAuth automatique (voir services/calendarApi.js)
 *
 * @author IMMO Copilot Team
 * @version 2.0.0
 */

// ============================================================
// EXPORT OUTLOOK (FALLBACK)
// ============================================================

/**
 * Génère une URL pour Outlook Calendar
 *
 * @param {Object} lead - Données du lead
 * @param {Date} visitDate - Date de la visite
 * @returns {string} URL pour Outlook Calendar
 */
export const generateOutlookCalendarUrl = (lead, visitDate) => {
  const startDate = new Date(visitDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 heure

  const formatOutlookDate = (date) => {
    return date.toISOString();
  };

  const description = `Téléphone: ${lead.phone || 'Non renseigné'}%0ABudget: ${lead.budget || 'Non défini'}%0ABien recherché: ${lead.bien || 'Non défini'}%0ASecteur: ${lead.secteur || 'Non défini'}%0ADélai: ${lead.delai || 'Non défini'}%0A%0ANotes: ${lead.summary || 'Aucune note'}`;

  const params = new URLSearchParams({
    subject: `🏠 Visite - ${lead.nom}`,
    startdt: formatOutlookDate(startDate),
    enddt: formatOutlookDate(endDate),
    body: description,
    location: lead.secteur || '',
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// ============================================================
// EXPORT PRINCIPAL
// ============================================================

/**
 * Exporte vers le calendrier sélectionné
 *
 * @param {string} calendarType - Type de calendrier ('outlook')
 * @param {Object} lead - Données du lead
 * @param {Date} visitDate - Date de la visite
 *
 * Note : 'google' n'est plus supporté ici car géré automatiquement via OAuth
 */
export const exportToCalendar = (calendarType, lead, visitDate) => {
  switch (calendarType) {
    case 'outlook':
      window.open(generateOutlookCalendarUrl(lead, visitDate), '_blank');
      break;
    default:
      console.error('Type de calendrier non supporté:', calendarType);
  }
};
