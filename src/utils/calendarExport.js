/**
 * Utilitaires pour exporter les visites vers différents calendriers
 */

/**
 * Génère une URL pour Google Calendar
 */
export const generateGoogleCalendarUrl = (lead, visitDate) => {
  const startDate = new Date(visitDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 heure

  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
  };

  const description = [
    `📱 Téléphone: ${lead.phone || 'Non renseigné'}`,
    `💰 Budget: ${lead.budget || 'Non défini'}`,
    `🏠 Bien recherché: ${lead.bien || 'Non défini'}`,
    `📍 Secteur: ${lead.secteur || 'Non défini'}`,
    `⏰ Délai: ${lead.delai || 'Non défini'}`,
    ``,
    `📝 Notes: ${lead.summary || 'Aucune note'}`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🏠 Visite - ${lead.nom}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: description,
    location: lead.secteur || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Génère une URL pour Outlook Calendar
 */
export const generateOutlookCalendarUrl = (lead, visitDate) => {
  const startDate = new Date(visitDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

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

/**
 * Génère un fichier ICS (compatible avec Apple Calendar, Outlook, etc.)
 */
export const generateICSFile = (lead, visitDate) => {
  const startDate = new Date(visitDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatICSDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const description = `Téléphone: ${lead.phone || 'Non renseigné'}\\nBudget: ${lead.budget || 'Non défini'}\\nBien recherché: ${lead.bien || 'Non défini'}\\nSecteur: ${lead.secteur || 'Non défini'}\\nDélai: ${lead.delai || 'Non défini'}\\n\\nNotes: ${lead.summary || 'Aucune note'}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IMMO Copilot//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `UID:${lead.id}@immocopilot`,
    `SUMMARY:Visite - ${lead.nom}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${lead.secteur || ''}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
};

/**
 * Ouvre Apple Calendar avec le fichier ICS
 */
export const openAppleCalendar = (lead, visitDate) => {
  const icsContent = generateICSFile(lead, visitDate);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Créer un lien temporaire avec le protocole webcal
  const link = document.createElement('a');
  link.href = url;
  link.download = `visite-${lead.nom.replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Nettoyer après un court délai
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Types de calendriers supportés
 */
export const CALENDAR_TYPES = [
  {
    id: 'google',
    name: 'Google Calendar',
    icon: '📅',
    color: 'bg-blue-500',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '📧',
    color: 'bg-blue-600',
  },
];

/**
 * Exporte vers le calendrier sélectionné
 */
export const exportToCalendar = (calendarType, lead, visitDate) => {
  switch (calendarType) {
    case 'google':
      window.open(generateGoogleCalendarUrl(lead, visitDate), '_blank');
      break;
    case 'outlook':
      window.open(generateOutlookCalendarUrl(lead, visitDate), '_blank');
      break;
    default:
      console.error('Type de calendrier non supporté:', calendarType);
  }
};
