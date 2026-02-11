/**
 * Service API pour les leads
 * Passe par le backend sécurisé (JWT + service_role_key) au lieu du client Supabase direct
 */

import { authApi } from './authApi';
import { formatLeadFromDatabase } from './supabase';

/**
 * Récupère tous les leads du tenant (extrait du JWT côté backend)
 * @returns {Promise<Array>} Liste des leads formatés
 */
export async function fetchLeads() {
  const response = await authApi.fetchWithAuth('/api/leads');
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération des leads');
  }

  return data.leads.map(lead => formatLeadFromDatabase(lead));
}

/**
 * Récupère un lead spécifique
 * @param {string} leadId - L'ID du lead
 * @returns {Promise<Object>} Le lead formaté
 */
export async function fetchSingleLead(leadId) {
  const response = await authApi.fetchWithAuth(`/api/leads/${leadId}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération du lead');
  }

  return formatLeadFromDatabase(data.lead);
}

/**
 * Met à jour un lead (générique)
 * @param {string} leadId - L'ID du lead
 * @param {Object} updates - Les champs à mettre à jour
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function updateLead(leadId, updates) {
  const response = await authApi.fetchWithAuth(`/api/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de la mise à jour du lead');
  }

  return formatLeadFromDatabase(data.lead);
}

/**
 * Assigne un lead à un agent
 * @param {string} leadId - L'ID du lead
 * @param {string} agentName - Le nom de l'agent
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function assignLeadToAgent(leadId, agentName) {
  const response = await authApi.fetchWithAuth(`/api/leads/${leadId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ agentName }),
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.error || 'Erreur lors de l\'assignation');
    if (response.status === 409) error.code = 'ALREADY_ASSIGNED';
    throw error;
  }

  return formatLeadFromDatabase(data.lead);
}

/**
 * Désassigne un lead
 * @param {string} leadId - L'ID du lead
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function unassignLead(leadId) {
  const response = await authApi.fetchWithAuth(`/api/leads/${leadId}/unassign`, {
    method: 'POST',
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de la désassignation');
  }

  return formatLeadFromDatabase(data.lead);
}

/**
 * Change le statut d'un lead
 * @param {string} leadId - L'ID du lead
 * @param {string} newStatus - Le nouveau statut
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function updateLeadStatus(leadId, newStatus) {
  return updateLead(leadId, { status: newStatus });
}

/**
 * Active/désactive l'IA pour un lead
 * @param {string} leadId - L'ID du lead
 * @param {boolean} stopValue - true pour mettre en pause, false pour reprendre
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function toggleStopAI(leadId, stopValue) {
  const response = await authApi.fetchWithAuth(`/api/leads/${leadId}/toggle-ai`, {
    method: 'POST',
    body: JSON.stringify({ stopAi: stopValue }),
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors du toggle IA');
  }

  return formatLeadFromDatabase(data.lead);
}

/**
 * Marque tous les messages d'un lead comme lus
 * @param {string} leadId - L'ID du lead
 * @param {Array} conversation - La conversation au format app
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function markMessagesAsRead(leadId, conversation) {
  // Marquer tous les messages comme lus
  const updatedConversation = conversation.map(msg => ({
    ...msg,
    read: true,
  }));

  // Convertir en format n8n pour stockage
  const n8nFormat = updatedConversation.map(msg => {
    let role;
    if (msg.sender === 'bot') role = 'assistant';
    else if (msg.sender === 'agent') role = 'agent';
    else role = 'user';

    return {
      role,
      text: msg.message,
      time: msg.timestamp,
      read: msg.read,
    };
  });

  return updateLead(leadId, { conversation_json: n8nFormat });
}

/**
 * Programme une visite pour un lead
 * @param {string} leadId - L'ID du lead
 * @param {string} visitDate - La date et heure (ISO string)
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function scheduleVisit(leadId, visitDate) {
  return updateLead(leadId, {
    visit_date: visitDate,
    status: 'VISITE_PROGRAMMEE',
  });
}

/**
 * Annule une visite programmée
 * @param {string} leadId - L'ID du lead
 * @returns {Promise<Object>} Le lead mis à jour formaté
 */
export async function cancelVisit(leadId) {
  const updatedLead = await updateLead(leadId, {
    visit_date: null,
    status: 'EN_DECOUVERTE',
  });

  // Nettoyer les calendar event IDs séparément (non-bloquant)
  updateLead(leadId, {
    google_calendar_event_id: null,
    outlook_calendar_event_id: null,
  }).catch(() => {});

  return updatedLead;
}
