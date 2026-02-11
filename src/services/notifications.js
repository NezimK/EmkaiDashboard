// Service de notifications push pour IMMO Copilot PWA

/**
 * Vérifie si les notifications sont supportées
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Récupère le statut actuel des permissions de notification
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', or 'default'
};

/**
 * Demande la permission pour les notifications
 * @returns {Promise<string>} - 'granted', 'denied', ou 'default'
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Les notifications ne sont pas supportées sur ce navigateur');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return 'error';
  }
};

/**
 * Envoie une notification locale
 * @param {string} title - Titre de la notification
 * @param {Object} options - Options de la notification
 */
export const sendNotification = async (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.warn('Notifications non supportées');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permission de notification non accordée');
    return null;
  }

  const defaultOptions = {
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    vibrate: [100, 50, 100],
    tag: 'immo-copilot',
    renotify: true,
    ...options
  };

  try {
    // Utiliser le Service Worker pour les notifications si disponible (prod uniquement)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, defaultOptions);
    }
    // Fallback vers Notification API standard (dev ou pas de SW)
    return new Notification(title, defaultOptions);
  } catch (error) {
    // Dernier fallback
    return new Notification(title, defaultOptions);
  }
};

/**
 * Notification pour nouveau lead
 * @param {Object} lead - Données du lead
 */
export const notifyNewLead = (lead) => {
  const name = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Nouveau contact';
  return sendNotification('Nouveau Lead !', {
    body: `${name} - ${lead.email || 'Pas d\'email'}`,
    tag: `lead-${lead.id}`,
    data: { type: 'new-lead', leadId: lead.id }
  });
};

/**
 * Notification pour rappel de relance
 * @param {Object} lead - Données du lead
 */
export const notifyFollowUp = (lead) => {
  const name = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Contact';
  return sendNotification('Rappel de relance', {
    body: `Il est temps de relancer ${name}`,
    tag: `followup-${lead.id}`,
    data: { type: 'follow-up', leadId: lead.id }
  });
};

/**
 * Notification pour changement de statut
 * @param {Object} lead - Données du lead
 * @param {string} newStatus - Nouveau statut
 */
export const notifyStatusChange = (lead, newStatus) => {
  const name = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Contact';
  return sendNotification('Statut mis à jour', {
    body: `${name} est maintenant "${newStatus}"`,
    tag: `status-${lead.id}`,
    data: { type: 'status-change', leadId: lead.id }
  });
};

/**
 * Stocke la préférence de notification de l'utilisateur
 * @param {boolean} enabled - Activer ou désactiver
 */
export const setNotificationPreference = (enabled) => {
  localStorage.setItem('immo-copilot-notifications', JSON.stringify(enabled));
};

/**
 * Récupère la préférence de notification de l'utilisateur
 * @returns {boolean}
 */
export const getNotificationPreference = () => {
  const stored = localStorage.getItem('immo-copilot-notifications');
  return stored ? JSON.parse(stored) : true; // Activé par défaut
};