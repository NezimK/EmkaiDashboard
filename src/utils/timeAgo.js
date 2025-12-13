/**
 * Formatte un timestamp en "il y a X temps" en français
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Format lisible (ex: "Il y a 10 min", "Hier à 14h")
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Il y a moins d'une minute
    if (diffMinutes < 1) {
      return 'À l\'instant';
    }

    // Il y a moins d'une heure
    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    }

    // Il y a moins de 24h
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    }

    // Hier
    if (diffDays === 1) {
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `Hier à ${hour}h${minute}`;
    }

    // Il y a moins de 7 jours
    if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }

    // Plus ancien - afficher la date
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `Le ${day}/${month}`;
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return '';
  }
}
