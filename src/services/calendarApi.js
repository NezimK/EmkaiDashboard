/**
 * @fileoverview Service API pour la gestion de Google Calendar
 * @module services/calendarApi
 *
 * @description
 * Interface de communication avec le backend Express pour Google Calendar OAuth2.
 * Gère l'authentification, la création/suppression d'événements et la vérification du statut.
 *
 * @author IMMO Copilot Team
 * @version 1.0.0
 */

// ============================================================
// CONFIGURATION
// ============================================================

// Backend API URL (configurable via .env)
// Fusionné avec saas-backend sur le port 3000
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

// Import authApi pour les requêtes authentifiées
import { authApi } from './authApi';

// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * Obtenir l'URL d'authentification Google OAuth2
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} agency - Identifiant de l'agence (AGENCY_A ou AGENCY_B)
 * @returns {Promise<string>} URL d'autorisation Google OAuth
 * @throws {Error} Si la requête échoue
 */
export async function getGoogleAuthUrl(userId, userEmail, agency) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/google/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userEmail, agency }),
    });

    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }

    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
}

/**
 * Vérifier si Google Calendar est connecté pour un utilisateur
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
export async function checkGoogleCalendarStatus(userId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/google/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return false;
  }
}

/**
 * Déconnecter Google Calendar pour un utilisateur
 * Supprime les tokens OAuth stockés dans le backend
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<boolean>} true si la déconnexion réussit
 * @throws {Error} Si la déconnexion échoue
 */
export async function disconnectGoogleCalendar(userId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/google/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    throw error;
  }
}

// ============================================================
// CALENDAR EVENTS
// ============================================================

/**
 * Créer un événement dans Google Calendar
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {Object} eventDetails - Détails de l'événement
 * @param {string} eventDetails.title - Titre de l'événement
 * @param {string} eventDetails.description - Description de l'événement
 * @param {string} eventDetails.startDateTime - Date/heure de début (ISO 8601)
 * @param {string} eventDetails.endDateTime - Date/heure de fin (ISO 8601)
 * @returns {Promise<Object>} Objet contenant eventId et eventLink
 * @throws {Error} Si la création échoue
 */
export async function createGoogleCalendarEvent(userId, eventDetails) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Mettre à jour un événement Google Calendar existant
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} eventId - Identifiant de l'événement Google Calendar
 * @param {Object} eventDetails - Nouveaux détails de l'événement
 * @returns {Promise<Object>} Objet contenant eventId et eventLink
 * @throws {Error} Si la mise à jour échoue
 */
export async function updateGoogleCalendarEvent(userId, eventId, eventDetails) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/event/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventId, eventDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Supprimer un événement de Google Calendar
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} eventId - Identifiant de l'événement Google Calendar
 * @returns {Promise<boolean>} true si la suppression réussit
 * @throws {Error} Si la suppression échoue
 */
export async function deleteGoogleCalendarEvent(userId, eventId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/event/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete event');
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

// ============================================================
// OUTLOOK CALENDAR
// ============================================================

/**
 * Obtenir l'URL d'authentification Outlook OAuth2
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} agency - Identifiant de l'agence
 * @returns {Promise<string>} URL d'autorisation Microsoft OAuth
 * @throws {Error} Si la requête échoue
 */
export async function getOutlookAuthUrl(userId, userEmail, agency) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/outlook/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userEmail, agency }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Outlook auth URL');
    }

    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Outlook auth URL:', error);
    throw error;
  }
}

/**
 * Vérifier si Outlook Calendar est connecté pour un utilisateur
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
export async function checkOutlookCalendarStatus(userId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/outlook/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to check Outlook status');
    }

    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking Outlook calendar status:', error);
    return false;
  }
}

/**
 * Déconnecter Outlook Calendar pour un utilisateur
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<boolean>} true si la déconnexion réussit
 * @throws {Error} Si la déconnexion échoue
 */
export async function disconnectOutlookCalendar(userId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/outlook/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Outlook');
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting Outlook calendar:', error);
    throw error;
  }
}

/**
 * Créer un événement dans Outlook Calendar
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {Object} eventDetails - Détails de l'événement
 * @returns {Promise<Object>} Objet contenant eventId et eventLink
 * @throws {Error} Si la création échoue
 */
export async function createOutlookCalendarEvent(userId, eventDetails) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/outlook/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Outlook event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Outlook calendar event:', error);
    throw error;
  }
}

/**
 * Mettre à jour un événement Outlook Calendar existant
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} eventId - Identifiant de l'événement Outlook
 * @param {Object} eventDetails - Nouveaux détails de l'événement
 * @returns {Promise<Object>} Objet contenant eventId et eventLink
 * @throws {Error} Si la mise à jour échoue
 */
export async function updateOutlookCalendarEvent(userId, eventId, eventDetails) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/outlook/event/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventId, eventDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update Outlook event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating Outlook calendar event:', error);
    throw error;
  }
}

/**
 * Supprimer un événement de Outlook Calendar
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} eventId - Identifiant de l'événement Outlook
 * @returns {Promise<boolean>} true si la suppression réussit
 * @throws {Error} Si la suppression échoue
 */
export async function deleteOutlookCalendarEvent(userId, eventId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/calendar/outlook/event/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, eventId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete Outlook event');
    }

    return true;
  } catch (error) {
    console.error('Error deleting Outlook calendar event:', error);
    throw error;
  }
}

// ============================================================
// UNIFIED STATUS
// ============================================================

/**
 * Vérifier le statut de tous les calendriers connectés
 *
 * @async
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<Object>} { google: boolean, outlook: boolean }
 */
export async function checkAllCalendarStatus(userId) {
  try {
    const token = await authApi.getValidToken();
    const response = await fetch(`${API_URL}/api/auth/calendar/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to check calendar status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking all calendar status:', error);
    return { google: false, outlook: false };
  }
}
