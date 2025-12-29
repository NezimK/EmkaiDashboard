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
export async function fetchLeadsFromAirtable(agency) {
  if (!agency) {
    throw new Error('L\'identifiant de l\'agence est requis pour récupérer les leads');
  }

  try {
    const { token, baseId } = getAgencyConfig(agency);

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_NAME}`,
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

    return data.records.map((record) => parseLeadFromAirtable(record));
  } catch (error) {
    console.error(`❌ Error fetching leads from Airtable for agency ${agency}:`, error);
    throw error;
  }
}

/**
 * Parse un record Airtable en format lead pour l'app
 */
function parseLeadFromAirtable(record) {
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
  // Si le champ Statut est vide/undefined, le lead est considéré comme "EN_COURS"
  let statut = fields.Statut || 'EN_COURS';

  // Normaliser les statuts de différentes variantes vers le format uniforme de l'app
  const statusMapping = {
    'Qualifié': 'QUALIFIE',
    'Contacté': 'CONTACTE',
    'CONTACTE': 'CONTACTE',
    'En-cours': 'EN_COURS',
    'En_cours': 'EN_COURS',
    'En_Cours': 'EN_COURS',
    'EN_COURS': 'EN_COURS',
    'En Découverte': 'EN_DECOUVERTE',
    'En découverte': 'EN_DECOUVERTE',
    'EN_DECOUVERTE': 'EN_DECOUVERTE',
    'RDV Pris': 'RDV_PRIS',
    'RDV pris': 'RDV_PRIS',
    'RDV_PRIS': 'RDV_PRIS',
    'Visite Programmée': 'VISITE_PROGRAMMEE',
    'Visite programmée': 'VISITE_PROGRAMMEE',
    'VISITE_PROGRAMMEE': 'VISITE_PROGRAMMEE',
    'Archivé': 'ARCHIVE',
    'Archivé': 'ARCHIVE',
    'ARCHIVE': 'ARCHIVE'
  };

  if (statusMapping[statut]) {
    statut = statusMapping[statut];
  }

  return {
    id: record.id,
    nom: nom,
    email: fields.Email || '',
    score: fields.Score || 'TIEDE',
    statut: statut,
    summary: fields.Notes || fields.Summary || '',
    stop_ai: fields.PAUSE_IA || false,
    phone: fields.Phone || '',
    contacted: statut === 'CONTACTE', // Calculé depuis le statut
    budget: fields.Financement || fields.Budget || 'Non défini',
    bien: fields.Bien_Associe || fields.Bien_associe || 'Non défini',
    secteur: fields.Source || 'Non défini',
    delai: fields.Délai || fields.Delai || 'Non défini',
    conversation: conversation,
    agent_en_charge: fields.Agent_en_charge || fields.agent_en_charge || null, // Agent assigné au lead
    date_visite: fields.date_visite || null, // Date et heure de la visite programmée
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

    const result = await updateLeadInAirtable(agency, leadId, {
      date_visite: visitDate,
      Statut: 'Visite Programmée', // Changer automatiquement le statut
    });

    console.log(`✅ Visit scheduled successfully`);
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
      Statut: 'Qualifié', // Remettre au statut Qualifié
    });

    console.log(`✅ Visit canceled successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error canceling visit:', error);
    throw error;
  }
}
