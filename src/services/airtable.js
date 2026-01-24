// Service pour récupérer les données depuis Airtable
// Multi-Agency Support: Each agency has its own Airtable base

const TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'LEADS';

/**
 * Configuration des agences - Chaque agence a son propre token et base Airtable
 */
const AGENCY_CONFIG = {
  AGENCY_A: {
    token: import.meta.env.VITE_AIRTABLE_TOKEN_AGENCY_A,
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID_AGENCY_A,
  },
  AGENCY_B: {
    token: import.meta.env.VITE_AIRTABLE_TOKEN_AGENCY_B,
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID_AGENCY_B,
  },
};

/**
 * Récupère la configuration Airtable pour une agence donnée
 */
function getAgencyConfig(agency) {
  const config = AGENCY_CONFIG[agency];
  if (!config) {
    throw new Error(`Configuration non trouvée pour l'agence: ${agency}`);
  }
  if (!config.token || !config.baseId) {
    throw new Error(`Configuration incomplète pour l'agence ${agency}. Vérifiez vos variables d'environnement.`);
  }
  return config;
}

/**
 * Récupère tous les leads depuis Airtable pour une agence spécifique
 * @param {string} agency - L'identifiant de l'agence (AGENCY_A ou AGENCY_B)
 */
/**
 * Récupère un seul lead depuis Airtable par son ID
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead (record ID)
 * @returns {Promise<Object>} Le lead parsé
 */
export async function fetchSingleLead(agency, leadId) {
  if (!agency || !leadId) {
    throw new Error('L\'identifiant de l\'agence et du lead sont requis');
  }

  try {
    const { token, baseId } = getAgencyConfig(agency);

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_NAME}/${leadId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const record = await response.json();
    return await parseLeadFromAirtable(record, token, baseId);
  } catch (error) {
    console.error(`❌ Error fetching lead ${leadId} from Airtable:`, error);
    throw error;
  }
}

export async function fetchLeadsFromAirtable(agency) {
  if (!agency) {
    throw new Error('L\'identifiant de l\'agence est requis pour récupérer les leads');
  }

  try {
    const { token, baseId } = getAgencyConfig(agency);

    // Utiliser filterByFormula pour exclure les leads archivés et récupérer les champs liés
    const params = new URLSearchParams({
      view: 'Grid view', // Vue par défaut
    });

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_NAME}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();

    // Parser les leads et récupérer les informations des biens associés
    const leadsPromises = data.records.map((record) => {
      return parseLeadFromAirtable(record, token, baseId);
    });

    return await Promise.all(leadsPromises);
  } catch (error) {
    console.error(`❌ Error fetching leads from Airtable for agency ${agency}:`, error);
    throw error;
  }
}

/**
 * Récupère les détails d'un bien depuis la table Biens
 * @param {string} bienReference - La référence du bien (champ Reference dans la table Biens)
 * @param {string} token - Token Airtable
 * @param {string} baseId - Base ID Airtable
 * @returns {Promise<Object|null>} Les détails du bien ou null
 */
async function fetchBienDetails(bienReference, token, baseId) {
  if (!bienReference) return null;

  try {
    // Requête avec filterByFormula pour trouver le bien par son champ Reference
    const filterFormula = `{Reference}="${bienReference}"`;
    const url = `https://api.airtable.com/v0/${baseId}/Biens?filterByFormula=${encodeURIComponent(filterFormula)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`⚠️ Erreur lors de la récupération du bien ${bienReference}:`, response.status);
      return null;
    }

    const data = await response.json();

    // Vérifier si un bien a été trouvé
    if (!data.records || data.records.length === 0) {
      console.warn(`⚠️ Aucun bien trouvé avec la référence: ${bienReference}`);
      return null;
    }

    // Prendre le premier bien trouvé
    const bienRecord = data.records[0];

    return {
      nom: bienRecord.fields.Reference || bienRecord.fields.Nom || bienRecord.fields.Name || 'Bien sans référence',
      adresse: bienRecord.fields.Adresse || bienRecord.fields.Address || null,
      type: bienRecord.fields.Type || null,
      prix: bienRecord.fields.Prix || null,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des détails du bien:', error);
    return null;
  }
}

/**
 * Parse un record Airtable en format lead pour l'app
 * @param {Object} record - Record Airtable
 * @param {string} token - Token Airtable
 * @param {string} baseId - Base ID
 * @returns {Promise<Object>} Lead parsé avec détails du bien
 */
async function parseLeadFromAirtable(record, token, baseId) {
  const fields = record.fields;

  // Construire le nom complet (Prénom + Nom)
  const nom = `${fields.Prénom || ''} ${fields.Nom || ''}`.trim() || 'Sans nom';

  // Parser la conversation JSON
  let conversation = [];
  if (fields.Conversation_JSON) {
    try {
      const parsed = JSON.parse(fields.Conversation_JSON);

      // Adapter le format n8n vers le format de l'app
      const filtered = parsed.filter((msg) => {
        // Filtrer les messages système (marqueurs de qualification)
        if (!msg.text) return false;
        if (msg.text.includes('--- QUALIFICATION')) return false;
        if (msg.text.includes('---')) return false;
        return true;
      });

      conversation = filtered.map((msg) => {
        // Mapper les roles n8n vers les senders de l'app
        let sender;
        if (msg.role === 'assistant') {
          sender = 'bot'; // Sarah (IA)
        } else if (msg.role === 'agent') {
          sender = 'agent'; // Agent immobilier
        } else {
          sender = 'lead'; // Le prospect
        }

        return {
          sender: sender,
          message: msg.text,
          timestamp: msg.time,
          read: msg.read !== undefined ? msg.read : (sender !== 'lead'), // Les messages du prospect sont non lus par défaut
        };
      });
    } catch (error) {
      console.error('❌ Error parsing conversation JSON for lead:', nom, error);
      conversation = [];
    }
  }

  // Mapper le statut Airtable vers le statut de l'app
  // Si le champ Statut est vide/undefined, le lead est considéré comme "PRE_QUALIFICATION"
  let statut = fields.Statut || 'PRE_QUALIFICATION';

  // Normaliser les statuts de différentes variantes vers le format uniforme de l'app
  const statusMapping = {
    'Qualifié': 'QUALIFIE',
    'New': 'PRE_QUALIFICATION',
    'In_Progress': 'PRE_QUALIFICATION',
    'PRE_QUALIFICATION': 'PRE_QUALIFICATION',
    'En Découverte': 'EN_DECOUVERTE',
    'En découverte': 'EN_DECOUVERTE',
    'EN_DECOUVERTE': 'EN_DECOUVERTE',
    'Visite Programmée': 'VISITE_PROGRAMMEE',
    'Visite programmée': 'VISITE_PROGRAMMEE',
    'VISITE_PROGRAMMEE': 'VISITE_PROGRAMMEE',
    'Archivé': 'ARCHIVE',
    'Archivé': 'ARCHIVE',
    'ARCHIVE': 'ARCHIVE'
  };

  const originalStatut = statut;
  if (statusMapping[statut]) {
    statut = statusMapping[statut];
  }

  // Debug log pour tracer les conversions de statut
  if (originalStatut !== statut) {
    console.log(`🔄 Status mapping: "${originalStatut}" → "${statut}" for lead ${fields.Prénom} ${fields.Nom}`);
  }

  // Récupérer les détails du bien associé (si présent)
  let bienDetails = null;
  if (fields.Bien_Associe) {
    // Le champ Bien_Associe contient une référence (ex: "REF-001")
    // Il peut être soit un string direct, soit un array contenant le string
    const bienReference = Array.isArray(fields.Bien_Associe)
      ? fields.Bien_Associe[0]
      : fields.Bien_Associe;

    if (bienReference) {
      bienDetails = await fetchBienDetails(bienReference, token, baseId);
    }
  }

  return {
    id: record.id,
    nom: nom,
    email: fields.Email || '',
    telephone: fields.Phone || '',
    score: fields.Score || 'TIEDE',
    statut: statut,
    summary: fields.Notes || fields.Summary || '',
    stop_ai: fields.PAUSE_IA || false,
    phone: fields.Phone || '',
    budget: fields.Financement || fields.Budget || 'Non défini',
    bien: bienDetails ? bienDetails.nom : (fields.Bien_Associe || 'Non défini'),
    bienDetails: bienDetails, // Détails complets du bien (nom, adresse, type, prix)
    secteur: fields.Source || 'Non défini', // Portail source (ex: LeBonCoin)
    adresse: bienDetails?.adresse || null, // Adresse du bien
    delai: fields.Délai || fields.Delai || 'Non défini',
    conversation: conversation,
    agent_en_charge: fields.Agent_en_charge || fields.agent_en_charge || null, // Agent assigné au lead
    date_visite: fields.date_visite || null, // Date et heure de la visite programmée
    googleCalendarEventId: fields.Google_Calendar_Event_ID || null, // ID de l'événement Google Calendar
    createdTime: record.createdTime || new Date().toISOString(), // Timestamp de création depuis Airtable
  };
}

/**
 * Met à jour un lead dans Airtable
 * @param {string} agency - L'identifiant de l'agence (AGENCY_A ou AGENCY_B)
 * @param {string} leadId - L'ID du lead à mettre à jour
 * @param {object} updates - Les champs à mettre à jour
 */
export async function updateLeadInAirtable(agency, leadId, updates) {
  if (!agency) {
    throw new Error('L\'identifiant de l\'agence est requis pour mettre à jour un lead');
  }

  try {
    const { token, baseId } = getAgencyConfig(agency);

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_NAME}/${leadId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: updates,
          typecast: true, // Force Airtable à accepter les valeurs Single Select
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error details:', errorData);
      throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return parseLeadFromAirtable(data);
  } catch (error) {
    console.error('Error updating lead in Airtable:', error);
    throw error;
  }
}

/**
 * Assigne un agent à un lead (met à jour le champ Agent_en_charge)
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 * @param {string} agentName - Le nom de l'agent
 */
export async function assignLeadToAgent(agency, leadId, agentName) {
  try {
    console.log('🔄 Assigning lead:', leadId, 'to agent:', agentName, 'for agency:', agency);

    // Date actuelle au format ISO
    const now = new Date().toISOString();

    const result = await updateLeadInAirtable(agency, leadId, {
      Agent_en_charge: agentName,
      Date_prise_en_charge: now,
      Statut: 'En Découverte', // Changer le statut pour placer le dossier dans "En Découverte"
    });
    console.log('✅ Lead assigned successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error assigning lead to agent:', error);
    console.error('Error details:', {
      agency,
      leadId,
      agentName,
      error: error.message,
      response: error.response
    });
    throw error;
  }
}

/**
 * Désassigne un lead (retire l'agent et remet le statut à QUALIFIE)
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 */
export async function unassignLead(agency, leadId) {
  try {
    console.log('🔄 Unassigning lead:', leadId, 'for agency:', agency);

    const result = await updateLeadInAirtable(agency, leadId, {
      Agent_en_charge: '', // Vider le champ agent
      Date_prise_en_charge: '', // Vider la date
      Statut: 'Qualifié', // Remettre le statut à Qualifié pour qu'il retourne dans "À Traiter"
    });
    console.log('✅ Lead unassigned successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error unassigning lead:', error);
    console.error('Error details:', {
      agency,
      leadId,
      error: error.message,
      response: error.response
    });
    throw error;
  }
}

/**
 * Change le statut d'un lead
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 * @param {string} newStatus - Le nouveau statut
 */
export async function updateLeadStatus(agency, leadId, newStatus) {
  try {
    console.log('🔄 Updating lead status:', leadId, 'to', newStatus, 'for agency:', agency);

    const result = await updateLeadInAirtable(agency, leadId, {
      Statut: newStatus,
    });
    console.log('✅ Lead status updated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error updating lead status:', error);
    throw error;
  }
}

/**
 * Marque tous les messages d'un lead comme lus
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 * @param {Array} conversation - La conversation à mettre à jour
 */
export async function markMessagesAsRead(agency, leadId, conversation) {
  try {
    console.log('🔄 Marking messages as read for lead:', leadId, 'for agency:', agency);

    // Marquer tous les messages comme lus
    const updatedConversation = conversation.map(msg => ({
      ...msg,
      read: true
    }));

    // Convertir en format n8n pour Airtable
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
        read: msg.read
      };
    });

    const result = await updateLeadInAirtable(agency, leadId, {
      Conversation_JSON: JSON.stringify(n8nFormat),
    });

    console.log('✅ Messages marked as read successfully');
    return result;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Toggle le champ Stop_AI pour mettre en pause/reprendre l'IA
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 * @param {boolean} stopValue - true pour mettre en pause l'IA, false pour la reprendre
 */
export async function toggleStopAI(agency, leadId, stopValue) {
  try {
    console.log(`🔄 ${stopValue ? 'Pausing' : 'Resuming'} AI for lead:`, leadId, 'for agency:', agency);

    const result = await updateLeadInAirtable(agency, leadId, {
      PAUSE_IA: stopValue,
    });

    console.log(`✅ AI ${stopValue ? 'paused' : 'resumed'} successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error toggling Stop_AI:', error);
    throw error;
  }
}

/**
 * Programme une visite pour un lead
 * @param {string} agency - L'identifiant de l'agence
 * @param {string} leadId - L'ID du lead
 * @param {string} visitDate - La date et heure de la visite (ISO string)
 */
export async function scheduleVisit(agency, leadId, visitDate) {
  try {
    console.log(`🔄 Scheduling visit for lead:`, leadId, 'on', visitDate, 'for agency:', agency);

    const updates = {
      date_visite: visitDate,
      Statut: 'Visite Programmée', // Changer automatiquement le statut
    };

    console.log('📝 Updating lead with:', updates);

    const result = await updateLeadInAirtable(agency, leadId, updates);

    console.log(`✅ Visit scheduled successfully, new status:`, result.statut);
    return result;
  } catch (error) {
    console.error('❌ Error scheduling visit:', error);
    throw error;
  }
}

/**
 * Annuler une visite programmée
 */
export async function cancelVisit(agency, leadId) {
  try {
    console.log(`🔄 Canceling visit for lead:`, leadId, 'for agency:', agency);

    const result = await updateLeadInAirtable(agency, leadId, {
      date_visite: null,
      Statut: 'En Découverte', // Remettre au statut En Découverte
      Google_Calendar_Event_ID: null, // Supprimer l'ID de l'événement Google Calendar
    });

    console.log(`✅ Visit canceled successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error canceling visit:', error);
    throw error;
  }
}

/**
 * Envoie un message WhatsApp de confirmation de rendez-vous via N8N
 * @param {string} agency - L'identifiant de l'agence (AGENCY_A ou AGENCY_B)
 * @param {Object} leadData - Les données du lead
 * @param {string} leadData.nom - Nom du prospect
 * @param {string} leadData.telephone - Téléphone du prospect
 * @param {string} leadData.adresse - Adresse du bien (depuis table Biens)
 * @param {string} leadData.bien - Nom du bien
 * @param {Object} leadData.bienDetails - Détails complets du bien (optionnel)
 * @param {string} visitDate - Date et heure de la visite (ISO string)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendVisitConfirmationWhatsApp(agency, leadData, visitDate) {
  const webhookUrl = agency === 'AGENCY_A'
    ? import.meta.env.VITE_N8N_WEBHOOK_AGENCY_A
    : import.meta.env.VITE_N8N_WEBHOOK_AGENCY_B;

  if (!webhookUrl) {
    console.warn('⚠️ N8N webhook URL not configured for WhatsApp');
    return { success: false, error: 'Webhook URL not configured' };
  }

  try {
    // Formater la date en français
    const dateObj = new Date(visitDate);
    const formattedDate = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formater le prix
    const prixFormate = leadData.bienDetails?.prix
      ? `${parseInt(leadData.bienDetails.prix).toLocaleString('fr-FR')} €`
      : 'Sur demande';

    // Nom de l'agence
    const agencyName = agency === 'AGENCY_A' ? 'Immocope' : 'RealAgency';

    // Message WhatsApp de confirmation
    const message = `✅ *Confirmation de votre visite*

Bonjour ${leadData.nom},

Nous avons le plaisir de confirmer votre rendez-vous au : ${leadData.adresse ? `📍 ${leadData.adresse}` : ''} .

📆 Date : ${formattedDate}
🕐 Heure : ${formattedTime}
${leadData.adresse ? `📍 Lieu : ${leadData.adresse}` : ''}

${leadData.adresse ? `🗺️ Voir l'itinéraire : https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(leadData.adresse)}` : ''}

À très bientôt ! 🤝

---
${agencyName}`;

    // Payload pour N8N
    const payload = {
      phone: leadData.telephone,
      message: message,
      type: 'visit_confirmation',
      leadId: leadData.id // Ajouter le record ID du lead
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
    console.log('✅ Message WhatsApp de confirmation envoyé avec succès');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', error);
    return { success: false, error: error.message };
  }
}
