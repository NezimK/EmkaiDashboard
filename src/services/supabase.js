// Service pour récupérer les données depuis Supabase
// Multi-Tenant Support via client_id

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
function formatLeadFromDatabase(record, bienDetails = null) {
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

  // Normaliser le statut et le score
  const statut = normalizeStatus(record.status);
  const score = normalizeScore(record.score);

  // Debug: afficher le statut et score bruts et normalisés (seulement en dev)
  if (import.meta.env.DEV) {
    console.log(`🔍 Lead "${nom}" - Statut: "${record.status}" → "${statut}", Score: "${record.score}" → "${score}"`);
    console.log(`🏠 Lead "${nom}" - property_reference: "${record.property_reference}", bienDetails:`, bienDetails);
  }

  return {
    id: record.id,
    nom: nom,
    email: record.email || '',
    telephone: record.phone || '',
    score: score,
    statut: statut,
    summary: record.notes || '',
    stop_ai: record.pause_ai || false,
    phone: record.phone || '',
    budget: record.financing || 'Non défini',
    bien: bienDetails ? bienDetails.nom : (record.property_reference || 'Non défini'),
    bienDetails: bienDetails,
    secteur: record.source || 'Non défini',
    adresse: bienDetails?.adresse || null,
    property_reference: record.property_reference || null, // Ajouter pour debug
    delai: record.timeline || 'Non défini',
    conversation: conversation,
    agent_en_charge: record.assigned_agent || null,
    date_visite: record.visit_date || null,
    googleCalendarEventId: record.google_calendar_event_id || null,
    createdTime: record.created_at || new Date().toISOString(),
    // Champs additionnels Supabase
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
// FETCH FUNCTIONS
// ============================================================================

/**
 * Récupère les détails d'un bien depuis la table biens
 * SÉCURITÉ: Toujours filtrer par client_id pour isolation multi-tenant
 * @param {string} propertyReference - La référence du bien
 * @param {string} clientId - L'ID du client/tenant
 * @returns {Promise<Object|null>} Les détails du bien ou null
 */
async function fetchBienDetails(propertyReference, clientId) {
  // SÉCURITÉ: Exiger les deux paramètres
  if (!propertyReference || !clientId) {
    if (import.meta.env.DEV) {
      console.log('🏠 [fetchBienDetails] Paramètres manquants - propertyReference ou clientId');
    }
    return null;
  }

  // Nettoyer la référence (enlever espaces avant/après)
  const cleanRef = propertyReference.trim();

  if (import.meta.env.DEV) {
    console.log(`🏠 [fetchBienDetails] Recherche du bien: "${cleanRef}" pour client: ${clientId}`);
  }

  try {
    // Chercher avec ref_externe - TOUJOURS filtrer par client_id
    let { data, error } = await supabase
      .from('biens')
      .select('*')
      .eq('client_id', clientId)
      .eq('ref_externe', cleanRef)
      .limit(1);

    if (error) {
      console.warn(`⚠️ Erreur récupération bien ${cleanRef}:`, error.message);
      return null;
    }

    // Si pas trouvé avec ref_externe, essayer avec netty_id
    if (!data || data.length === 0) {
      if (import.meta.env.DEV) {
        console.log(`🏠 [fetchBienDetails] Pas trouvé avec ref_externe, essai avec netty_id...`);
      }
      const result = await supabase
        .from('biens')
        .select('*')
        .eq('client_id', clientId)
        .eq('netty_id', cleanRef)
        .limit(1);

      data = result.data;
      error = result.error;
    }

    // Retourner null si aucun bien trouvé (pas de fallback cross-tenant)
    if (!data || data.length === 0) {
      if (import.meta.env.DEV) {
        console.log(`🏠 [fetchBienDetails] Aucun bien trouvé pour ref: ${cleanRef} et client: ${clientId}`);
      }
      return null;
    }

    const formatted = formatBienFromDatabase(data[0]);
    if (import.meta.env.DEV) {
      console.log(`🏠 [fetchBienDetails] Bien formaté:`, formatted);
    }
    return formatted;
  } catch (error) {
    console.error('❌ Erreur fetchBienDetails:', error);
    return null;
  }
}

/**
 * Récupère tous les leads depuis Supabase pour un client spécifique
 * @param {string} clientId - L'ID du client/tenant (UUID)
 * @returns {Promise<Array>} Liste des leads formatés
 */
export async function fetchLeads(clientId) {
  if (!clientId) {
    throw new Error("L'identifiant du client est requis pour récupérer les leads");
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Récupérer les détails des biens pour chaque lead
    const leadsPromises = data.map(async (record) => {
      let bienDetails = null;
      if (record.property_reference) {
        bienDetails = await fetchBienDetails(record.property_reference, clientId);
      }
      return formatLeadFromDatabase(record, bienDetails);
    });

    return await Promise.all(leadsPromises);
  } catch (error) {
    console.error(`❌ Error fetching leads from Supabase for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Récupère un seul lead depuis Supabase par son ID
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead (UUID)
 * @returns {Promise<Object>} Le lead parsé
 */
export async function fetchSingleLead(clientId, leadId) {
  if (!clientId || !leadId) {
    throw new Error("L'identifiant du client et du lead sont requis");
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('client_id', clientId)
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    let bienDetails = null;
    if (data.property_reference) {
      bienDetails = await fetchBienDetails(data.property_reference, clientId);
    }

    return formatLeadFromDatabase(data, bienDetails);
  } catch (error) {
    console.error(`❌ Error fetching lead ${leadId} from Supabase:`, error);
    throw error;
  }
}

// ============================================================================
// CRM FUNCTIONS (Netty API)
// ============================================================================

/**
 * Récupère la configuration CRM du tenant
 * @param {string} clientId - L'ID du tenant
 * @returns {Promise<Object|null>} Config CRM { api_key, crm_user_id, crm_company_id }
 */
async function fetchTenantCrmConfig(clientId) {
  if (!clientId) return null;

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('api_key, crm_user_id, crm_company_id')
      .eq('id', clientId)
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur récupération config CRM tenant:', error.message);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.warn('⚠️ Erreur fetchTenantCrmConfig:', error.message);
    return null;
  }
}

/**
 * Récupère l'ID CRM (Netty) d'un utilisateur
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Promise<number|null>} L'ID Netty de l'utilisateur
 */
async function fetchUserCrmId(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('crm_user_id')
      .eq('id', userId)
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur récupération crm_user_id:', error.message);
      }
      return null;
    }

    return data?.crm_user_id || null;
  } catch (error) {
    console.warn('⚠️ Erreur fetchUserCrmId:', error.message);
    return null;
  }
}

/**
 * Récupère l'ID CRM (Netty) d'un lead
 * @param {string} leadId - L'ID du lead
 * @param {string} clientId - L'ID du tenant
 * @returns {Promise<number|null>} L'ID contact Netty du lead
 */
async function fetchLeadCrmId(leadId, clientId) {
  if (!leadId || !clientId) return null;

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('crm_contact_id')
      .eq('id', leadId)
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur récupération crm_contact_id:', error.message);
      }
      return null;
    }

    return data?.crm_contact_id || null;
  } catch (error) {
    console.warn('⚠️ Erreur fetchLeadCrmId:', error.message);
    return null;
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Met à jour un lead dans Supabase
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead à mettre à jour
 * @param {object} updates - Les champs à mettre à jour (format Supabase)
 * @returns {Promise<Object>} Le lead mis à jour
 */
export async function updateLead(clientId, leadId, updates) {
  if (!clientId) {
    throw new Error("L'identifiant du client est requis pour mettre à jour un lead");
  }

  try {
    // Ajouter updated_at automatiquement
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('leads')
      .update(updatesWithTimestamp)
      .eq('id', leadId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    let bienDetails = null;
    if (data.property_reference) {
      bienDetails = await fetchBienDetails(data.property_reference, clientId);
    }

    return formatLeadFromDatabase(data, bienDetails);
  } catch (error) {
    console.error('Error updating lead in Supabase:', error);
    throw error;
  }
}

/**
 * Assigne un agent à un lead
 * Met à jour dans Supabase ET synchronise avec l'API externe (CRM)
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead (contact_id pour l'API externe)
 * @param {string} agentName - Le nom de l'agent
 * @param {string} agentUserId - L'ID de l'agent (user_id pour l'API externe)
 */
export async function assignLeadToAgent(clientId, leadId, agentName, agentUserId = null) {
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 Assigning lead:', leadId, 'to agent:', agentName, 'for client:', clientId);
    }

    // 1. Mise à jour dans Supabase
    const result = await updateLead(clientId, leadId, {
      assigned_agent: agentName,
      assigned_date: new Date().toISOString(),
      status: 'EN_DECOUVERTE',
    });

    // 2. Synchronisation avec l'API externe (CRM Netty) si configurée
    if (agentUserId) {
      await syncContactAssignment(clientId, leadId, agentUserId);
    }

    if (import.meta.env.DEV) {
      console.log('✅ Lead assigned successfully:', result);
    }
    return result;
  } catch (error) {
    console.error('❌ Error assigning lead to agent:', error);
    throw error;
  }
}

/**
 * Synchronise l'assignation d'un contact avec l'API Netty
 * PUT /contacts/{crm_contact_id} avec linked_user_id
 * @param {string} clientId - L'ID du tenant
 * @param {string} leadId - L'ID du lead dans Supabase
 * @param {string} agentUserId - L'ID de l'agent dans Supabase
 */
async function syncContactAssignment(clientId, leadId, agentUserId) {
  try {
    // 1. Récupérer l'ID contact Netty du lead
    const crmContactId = await fetchLeadCrmId(leadId, clientId);
    if (!crmContactId) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Lead sans crm_contact_id - sync Netty ignorée');
      }
      return;
    }

    // 2. Récupérer la config CRM du tenant (api_key, crm_user_id par défaut)
    const tenantConfig = await fetchTenantCrmConfig(clientId);
    if (!tenantConfig?.api_key) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Tenant sans api_key Netty - sync CRM ignorée');
      }
      return;
    }

    // 3. Récupérer l'ID Netty de l'agent (ou fallback sur ID par défaut du tenant)
    const agentCrmId = await fetchUserCrmId(agentUserId) || tenantConfig.crm_user_id;
    if (!agentCrmId) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Aucun crm_user_id disponible - sync Netty ignorée');
      }
      return;
    }

    // 4. Appeler l'API Netty pour mettre à jour le contact
    const response = await fetch(`https://webapi.netty.fr/apiv1/contacts/${crmContactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-netty-api-key': tenantConfig.api_key,
      },
      body: JSON.stringify({
        data: {
          linked_user_id: { user_id: agentCrmId }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Erreur sync Netty (${response.status}):`, errorText);
      // On ne throw pas - l'assignation Supabase a réussi, le CRM est secondaire
    } else {
      // 5. Mettre à jour crm_linked_user_id dans la table leads (sync réussie)
      await supabase
        .from('leads')
        .update({ crm_linked_user_id: agentCrmId })
        .eq('id', leadId)
        .eq('client_id', clientId);

      if (import.meta.env.DEV) {
        console.log('✅ Contact synchronisé avec Netty (contact_id:', crmContactId, ', user_id:', agentCrmId, ')');
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur sync Netty:', error.message);
    // On ne throw pas - l'assignation Supabase est prioritaire
  }
}

/**
 * Désassigne un lead (retire l'agent et remet le statut à QUALIFIE)
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 */
export async function unassignLead(clientId, leadId) {
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 Unassigning lead:', leadId, 'for client:', clientId);
    }

    const result = await updateLead(clientId, leadId, {
      assigned_agent: null,
      assigned_date: null,
      status: 'QUALIFIE',
    });

    if (import.meta.env.DEV) {
      console.log('✅ Lead unassigned successfully:', result);
    }
    return result;
  } catch (error) {
    console.error('❌ Error unassigning lead:', error);
    throw error;
  }
}

/**
 * Change le statut d'un lead
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 * @param {string} newStatus - Le nouveau statut
 */
export async function updateLeadStatus(clientId, leadId, newStatus) {
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 Updating lead status:', leadId, 'to', newStatus, 'for client:', clientId);
    }

    // Normaliser le statut avant de l'envoyer
    const normalizedStatus = normalizeStatus(newStatus);

    const result = await updateLead(clientId, leadId, {
      status: normalizedStatus,
    });

    if (import.meta.env.DEV) {
      console.log('✅ Lead status updated successfully:', result);
    }
    return result;
  } catch (error) {
    console.error('❌ Error updating lead status:', error);
    throw error;
  }
}

/**
 * Marque tous les messages d'un lead comme lus
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 * @param {Array} conversation - La conversation à mettre à jour
 */
export async function markMessagesAsRead(clientId, leadId, conversation) {
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 Marking messages as read for lead:', leadId, 'for client:', clientId);
    }

    // Marquer tous les messages comme lus
    const updatedConversation = conversation.map(msg => ({
      ...msg,
      read: true,
    }));

    // Convertir en format n8n pour stockage
    const n8nFormat = updatedConversation.map(msg => {
      let role;
      if (msg.sender === 'bot') {
        role = 'assistant';
      } else if (msg.sender === 'agent') {
        role = 'agent';
      } else {
        role = 'user';
      }

      return {
        role: role,
        text: msg.message,
        time: msg.timestamp,
        read: msg.read,
      };
    });

    const result = await updateLead(clientId, leadId, {
      conversation_json: n8nFormat,
    });

    if (import.meta.env.DEV) {
      console.log('✅ Messages marked as read successfully');
    }
    return result;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Toggle le champ pause_ai pour mettre en pause/reprendre l'IA
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 * @param {boolean} stopValue - true pour mettre en pause l'IA, false pour la reprendre
 */
export async function toggleStopAI(clientId, leadId, stopValue) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔄 ${stopValue ? 'Pausing' : 'Resuming'} AI for lead:`, leadId, 'for client:', clientId);
    }

    const result = await updateLead(clientId, leadId, {
      pause_ai: stopValue,
    });

    if (import.meta.env.DEV) {
      console.log(`✅ AI ${stopValue ? 'paused' : 'resumed'} successfully`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error toggling pause_ai:', error);
    throw error;
  }
}

/**
 * Programme une visite pour un lead
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 * @param {string} visitDate - La date et heure de la visite (ISO string)
 */
export async function scheduleVisit(clientId, leadId, visitDate) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔄 Scheduling visit for lead:`, leadId, 'on', visitDate, 'for client:', clientId);
    }

    const result = await updateLead(clientId, leadId, {
      visit_date: visitDate,
      status: 'VISITE_PROGRAMMEE',
    });

    if (import.meta.env.DEV) {
      console.log(`✅ Visit scheduled successfully, new status:`, result.statut);
    }
    return result;
  } catch (error) {
    console.error('❌ Error scheduling visit:', error);
    throw error;
  }
}

/**
 * Annuler une visite programmée
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} leadId - L'ID du lead
 */
export async function cancelVisit(clientId, leadId) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔄 Canceling visit for lead:`, leadId, 'for client:', clientId);
    }

    const result = await updateLead(clientId, leadId, {
      visit_date: null,
      status: 'EN_DECOUVERTE',
      google_calendar_event_id: null,
    });

    if (import.meta.env.DEV) {
      console.log(`✅ Visit canceled successfully`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error canceling visit:', error);
    throw error;
  }
}

// ============================================================================
// WHATSAPP / N8N INTEGRATION
// ============================================================================

/**
 * Construit l'URL du webhook N8N pour un client donné
 * En développement, utilise le proxy Vite pour éviter les problèmes CORS
 * @param {string} clientId - L'ID du client/tenant
 * @param {string} type - Le type de webhook ('whatsapp' ou 'email')
 * @returns {string} L'URL complète du webhook
 */
function buildWebhookUrl(clientId, type = 'whatsapp') {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // En développement: utiliser le proxy Vite pour éviter CORS
    // /api/n8n est réécrit vers https://n8n.emkai.fr par vite.config.js
    return `/api/n8n/webhook-test/${type}-${clientId}`;
  }

  // En production: URL directe
  const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://n8n.emkai.fr/webhook-test';
  return `${baseUrl}/${type}-${clientId}`;
}

/**
 * Envoie un message WhatsApp de confirmation de rendez-vous via N8N
 * @param {string} clientId - L'ID du client/tenant
 * @param {Object} leadData - Les données du lead
 * @param {string} visitDate - Date et heure de la visite (ISO string)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendVisitConfirmationWhatsApp(clientId, leadData, visitDate) {
  // Construire l'URL du webhook avec le client_id
  const webhookUrl = buildWebhookUrl(clientId, 'whatsapp');

  if (!clientId) {
    console.warn('⚠️ client_id manquant pour le webhook WhatsApp');
    return { success: false, error: 'client_id manquant' };
  }

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

    // Payload pour N8N
    const payload = {
      phone: leadData.telephone,
      message: message,
      type: 'visit_confirmation',
      leadId: leadData.id,
      clientId: clientId,
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

    const result = await response.json();
    if (import.meta.env.DEV) {
      console.log('✅ Message WhatsApp de confirmation envoyé avec succès');
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du message WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Souscrit aux changements en temps réel sur la table leads
 * @param {string} clientId - L'ID du client/tenant
 * @param {Function} onInsert - Callback pour les nouveaux leads
 * @param {Function} onUpdate - Callback pour les leads mis à jour
 * @param {Function} onDelete - Callback pour les leads supprimés
 * @returns {Object} Subscription object (call .unsubscribe() to stop)
 */
export function subscribeToLeads(clientId, { onInsert, onUpdate, onDelete }) {
  if (import.meta.env.DEV) {
    console.log('🔄 Setting up real-time subscription for leads, client:', clientId);
  }

  const subscription = supabase
    .channel(`leads-${clientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `client_id=eq.${clientId}`,
      },
      async (payload) => {
        if (import.meta.env.DEV) {
          console.log('📥 New lead received:', payload.new.id);
        }
        if (onInsert) {
          let bienDetails = null;
          if (payload.new.property_reference) {
            bienDetails = await fetchBienDetails(payload.new.property_reference, clientId);
          }
          onInsert(formatLeadFromDatabase(payload.new, bienDetails));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `client_id=eq.${clientId}`,
      },
      async (payload) => {
        if (import.meta.env.DEV) {
          console.log('📝 Lead updated:', payload.new.id);
        }
        if (onUpdate) {
          let bienDetails = null;
          if (payload.new.property_reference) {
            bienDetails = await fetchBienDetails(payload.new.property_reference, clientId);
          }
          onUpdate(formatLeadFromDatabase(payload.new, bienDetails));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'leads',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => {
        if (import.meta.env.DEV) {
          console.log('🗑️ Lead deleted:', payload.old.id);
        }
        if (onDelete) {
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe((status) => {
      if (import.meta.env.DEV) {
        console.log('📡 Subscription status:', status);
      }
    });

  return subscription;
}

/**
 * Se désabonner des changements en temps réel
 * @param {Object} subscription - L'objet subscription retourné par subscribeToLeads
 */
export function unsubscribeFromLeads(subscription) {
  if (subscription) {
    if (import.meta.env.DEV) {
      console.log('🔌 Unsubscribing from leads channel');
    }
    supabase.removeChannel(subscription);
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
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// Ces fonctions maintiennent la compatibilité avec l'ancien code
// qui utilisait 'agency' au lieu de 'clientId'
// ============================================================================

// Alias pour fetchLeads (ancien nom: fetchLeadsFromAirtable)
export const fetchLeadsFromAirtable = fetchLeads;

// Alias pour updateLead (ancien nom: updateLeadInAirtable)
export const updateLeadInAirtable = updateLead;
