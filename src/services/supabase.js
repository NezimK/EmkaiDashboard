// Service Supabase - Client + helpers de formatage
// Les opérations CRUD sur les leads sont dans leadsApi.js (via backend sécurisé)

import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalise le statut vers le format uniforme de l'app
 */
function normalizeStatus(status) {
  if (!status) return 'PRE_QUALIFICATION';

  const statusMapping = {
    // New = Lead en pré-qualification par l'IA
    'New': 'PRE_QUALIFICATION',
    'new': 'PRE_QUALIFICATION',
    'NEW': 'PRE_QUALIFICATION',
    // In_Progress = Lead en pré-qualification par l'IA
    'In_Progress': 'PRE_QUALIFICATION',
    'in_progress': 'PRE_QUALIFICATION',
    'IN_PROGRESS': 'PRE_QUALIFICATION',
    'PRE_QUALIFICATION': 'PRE_QUALIFICATION',
    'pre_qualification': 'PRE_QUALIFICATION',
    // Qualified = Lead qualifié prêt à être traité par un agent
    'Qualified': 'QUALIFIE',
    'qualified': 'QUALIFIE',
    'QUALIFIED': 'QUALIFIE',
    'Qualifié': 'QUALIFIE',
    'QUALIFIE': 'QUALIFIE',
    'qualifie': 'QUALIFIE',
    // En découverte = Lead pris en charge par un agent
    'En Découverte': 'EN_DECOUVERTE',
    'En découverte': 'EN_DECOUVERTE',
    'EN_DECOUVERTE': 'EN_DECOUVERTE',
    'en_decouverte': 'EN_DECOUVERTE',
    // Visite programmée
    'Visite Programmée': 'VISITE_PROGRAMMEE',
    'Visite programmée': 'VISITE_PROGRAMMEE',
    'VISITE_PROGRAMMEE': 'VISITE_PROGRAMMEE',
    'visite_programmee': 'VISITE_PROGRAMMEE',
    // Archivé
    'Archivé': 'ARCHIVE',
    'ARCHIVE': 'ARCHIVE',
    'archive': 'ARCHIVE',
  };

  return statusMapping[status] || status;
}

/**
 * Normalise le score vers le format uniforme de l'app
 */
function normalizeScore(score) {
  if (!score) return 'TIEDE';

  const scoreMapping = {
    // HOT = Chaud
    'HOT': 'CHAUD',
    'hot': 'CHAUD',
    'Hot': 'CHAUD',
    'CHAUD': 'CHAUD',
    'chaud': 'CHAUD',
    'Chaud': 'CHAUD',
    // WARM = Tiède
    'WARM': 'TIEDE',
    'warm': 'TIEDE',
    'Warm': 'TIEDE',
    'TIEDE': 'TIEDE',
    'tiede': 'TIEDE',
    'Tiède': 'TIEDE',
    // COLD = Froid
    'COLD': 'FROID',
    'cold': 'FROID',
    'Cold': 'FROID',
    'FROID': 'FROID',
    'froid': 'FROID',
    'Froid': 'FROID',
  };

  return scoreMapping[score] || score;
}

/**
 * Formate un lead depuis Supabase vers le format de l'app
 */
export function formatLeadFromDatabase(record, bienDetails = null) {
  // Construire le nom complet
  const nom = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Sans nom';

  // Parser la conversation JSON
  let conversation = [];
  if (record.conversation_json) {
    try {
      const parsed = typeof record.conversation_json === 'string'
        ? JSON.parse(record.conversation_json)
        : record.conversation_json;

      // Filtrer les messages système
      const filtered = parsed.filter((msg) => {
        if (!msg.text) return false;
        if (msg.text.includes('--- QUALIFICATION')) return false;
        if (msg.text.includes('---')) return false;
        return true;
      });

      conversation = filtered.map((msg) => {
        // Mapper les roles n8n vers les senders de l'app
        let sender;
        if (msg.role === 'assistant') {
          sender = 'bot';
        } else if (msg.role === 'agent') {
          sender = 'agent';
        } else {
          sender = 'lead';
        }

        return {
          sender: sender,
          message: msg.text,
          timestamp: msg.time,
          read: msg.read !== undefined ? msg.read : (sender !== 'lead'),
        };
      });
    } catch (error) {
      console.error('❌ Error parsing conversation JSON for lead:', nom, error);
      conversation = [];
    }
  }

  // Normaliser le statut et le score (gérer les deux noms de colonnes possibles)
  const statut = normalizeStatus(record.status || record.statut);
  const score = normalizeScore(record.score);

  // Gérer le bien : soit passé en paramètre, soit injecté par le backend dans record.bien
  const resolvedBien = bienDetails || (record.bien ? formatBienFromDatabase(record.bien) : null);

  return {
    id: record.id,
    nom: nom,
    email: record.email || '',
    telephone: record.phone || '',
    score: score,
    statut: statut,
    summary: record.notes || '',
    stop_ai: record.pause_ai ?? record.stop_ai ?? false,
    phone: record.phone || '',
    budget: record.financing || 'Non défini',
    bien: resolvedBien ? resolvedBien.nom : (record.property_reference || 'Non défini'),
    bienDetails: resolvedBien,
    secteur: record.source || 'Non défini',
    adresse: resolvedBien?.adresse || null,
    property_reference: record.property_reference || null,
    delai: record.timeline || 'Non défini',
    conversation: conversation,
    agent_en_charge: record.assigned_agent || record.agent_en_charge || null,
    date_visite: record.visit_date || record.date_visite || null,
    googleCalendarEventId: record.google_calendar_event_id || null,
    outlookCalendarEventId: record.outlook_calendar_event_id || null,
    createdTime: record.created_at || new Date().toISOString(),
    client_id: record.client_id,
    thread_id: record.thread_id,
    project: record.project,
  };
}

/**
 * Formate les détails d'un bien depuis Supabase
 */
function formatBienFromDatabase(record) {
  if (!record) return null;

  // Construire l'adresse complète avec adresse, code_postal et ville
  let adresseComplete = null;
  if (record.adresse || record.code_postal || record.ville) {
    const parts = [];
    if (record.adresse) parts.push(record.adresse);
    if (record.code_postal || record.ville) {
      const codeVille = [record.code_postal, record.ville].filter(Boolean).join(' ');
      if (codeVille) parts.push(codeVille);
    }
    adresseComplete = parts.join(', ');
  }

  return {
    id: record.id,
    nom: record.ref_externe || record.titre || 'Bien sans référence',
    adresse: adresseComplete,
    type: record.type_bien || null,
    prix: record.prix_vente || record.loyer || null,
    surface: record.surface || null,
    nbPieces: record.nb_pieces || null,
  };
}

// ============================================================================
// WHATSAPP / N8N INTEGRATION
// ============================================================================

/**
 * Construit l'URL du webhook N8N partagé (multi-tenant)
 * En développement, utilise le proxy Vite pour éviter les problèmes CORS
 * @param {string} type - Le type de webhook ('bot-qualification-multitenant', 'response-dashboard-multitenant')
 * @returns {string} L'URL complète du webhook
 */
function buildWebhookUrl(type = 'response-dashboard-multitenant') {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // En développement: utiliser le proxy Vite pour éviter CORS
    // /api/n8n est réécrit vers https://n8n.emkai.fr par vite.config.js
    return `/api/n8n/webhook/${type}`;
  }

  // En production: URL directe vers webhook partagé
  const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://n8n.emkai.fr';
  return `${baseUrl}/webhook/${type}`;
}

/**
 * Envoie un message WhatsApp de confirmation de rendez-vous via N8N
 * @param {string} clientId - L'ID du client/tenant
 * @param {Object} leadData - Les données du lead
 * @param {string} visitDate - Date et heure de la visite (ISO string)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendVisitConfirmationWhatsApp(clientId, leadData, visitDate) {
  if (!clientId) {
    console.warn('⚠️ client_id manquant pour le webhook WhatsApp');
    return { success: false, error: 'client_id manquant' };
  }

  // Construire l'URL du webhook partagé
  const webhookUrl = buildWebhookUrl('response-dashboard-multitenant');

  try {
    // Formater la date en français
    const dateObj = new Date(visitDate);
    const formattedDate = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Message WhatsApp de confirmation
    const message = `✅ *Confirmation de votre visite*

Bonjour ${leadData.nom},

Nous avons le plaisir de confirmer votre rendez-vous de visite immobilière.

📆 *Date :* ${formattedDate}
🕐 *Heure :* ${formattedTime}
${leadData.adresse ? `📍 *Adresse :* ${leadData.adresse}` : ''}
${leadData.adresse ? `
🗺️ *Itinéraire :* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(leadData.adresse)}` : ''}

À très bientôt ! 🤝`;

    // Payload pour N8N avec tenant_id
    const payload = {
      tenant_id: clientId,
      phone: leadData.telephone,
      message: message,
      type: 'visit_confirmation',
      leadId: leadData.id,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook error: ${response.status}`);
    }

    // Le webhook n8n peut retourner une réponse vide ou non-JSON
    let result = null;
    const responseText = await response.text();
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { raw: responseText };
      }
    }

    if (import.meta.env.DEV) {
      console.log('✅ Message WhatsApp de confirmation envoyé avec succès');
    }
    return { success: true, data: result };
  } catch (error) {
    if (import.meta.env.DEV) console.error("❌ Erreur lors de l'envoi du message WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Envoie un email de réinitialisation de mot de passe via le backend
 * @param {string} email - L'email de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function resetPassword(email) {
  if (!email) {
    throw new Error("L'email est requis pour réinitialiser le mot de passe");
  }

  try {
    if (import.meta.env.DEV) {
      console.log('🔑 Sending password reset email to:', email);
    }

    // Utiliser le proxy Vite en dev (/api/auth -> localhost:3000)
    // En production, utiliser l'URL absolue du backend
    const isDev = import.meta.env.DEV;
    const apiUrl = isDev
      ? '/api/auth/forgot-password'
      : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/forgot-password`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error('❌ Password reset error:', data.error);
      }
      throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email');
    }

    if (import.meta.env.DEV) {
      console.log('✅ Password reset email sent successfully');
    }
    return { success: true, message: data.message };
  } catch (error) {
    if (import.meta.env.DEV) console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}
