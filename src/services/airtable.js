// Service pour récupérer les données depuis Airtable

const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'LEADS';

/**
 * Récupère tous les leads depuis Airtable
 */
export async function fetchLeadsFromAirtable() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();

    return data.records.map((record) => parseLeadFromAirtable(record));
  } catch (error) {
    console.error('Error fetching leads from Airtable:', error);
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

  // Log pour debug - voir tous les champs disponibles
  console.log('📊 Champs Airtable pour', nom, ':', fields);

  // Parser la conversation JSON
  let conversation = [];
  if (fields.Conversation_JSON) {
    try {
      const parsed = JSON.parse(fields.Conversation_JSON);
      console.log('🔍 [DEBUG] Raw Conversation_JSON for', nom, ':', parsed);
      console.log('🔍 [DEBUG] Number of messages in Conversation_JSON:', parsed.length);

      // Adapter le format n8n vers le format de l'app
      const filtered = parsed.filter((msg) => {
        // Filtrer les messages système (marqueurs de qualification)
        if (!msg.text) {
          console.log('⚠️ [FILTERED] Message without text:', msg);
          return false;
        }
        if (msg.text.includes('--- QUALIFICATION')) {
          console.log('⚠️ [FILTERED] Qualification marker:', msg.text.substring(0, 50));
          return false;
        }
        if (msg.text.includes('---')) {
          console.log('⚠️ [FILTERED] System marker:', msg.text.substring(0, 50));
          return false;
        }
        return true;
      });

      console.log('🔍 [DEBUG] Messages after filtering:', filtered.length);

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

        console.log('💬 [MESSAGE]', msg.role, '→', sender, ':', msg.text.substring(0, 50));

        return {
          sender: sender,
          message: msg.text,
          timestamp: msg.time,
          read: msg.read !== undefined ? msg.read : (sender !== 'lead'), // Les messages du prospect sont non lus par défaut
        };
      });

      console.log('✅ [DEBUG] Final conversation array length:', conversation.length);
    } catch (error) {
      console.error('❌ Error parsing conversation JSON for lead:', nom, error);
      conversation = [];
    }
  } else {
    console.log('⚠️ [DEBUG] No Conversation_JSON field for', nom);
  }

  // Mapper le statut Airtable vers le statut de l'app
  // Si le champ Statut est vide/undefined, le lead est considéré comme "EN_COURS"
  let statut = fields.Statut || 'EN_COURS';
  console.log('🔍 DEBUG Lead:', nom, '| Raw Statut from Airtable:', `"${fields.Statut}"`, '| Score:', fields.Score);

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

  console.log('✅ Mapped Statut:', statut);

  return {
    id: record.id,
    nom: nom,
    email: fields.Email || '',
    score: fields.Score || 'TIEDE',
    statut: statut,
    summary: fields.Notes || fields.Summary || '',
    stop_ai: fields.Stop_AI || false,
    phone: fields.Phone || '',
    contacted: statut === 'CONTACTE', // Calculé depuis le statut
    budget: fields.Financement || fields.Budget || 'Non défini',
    bien: fields.Bien_Associe || fields.Bien_associe || 'Non défini',
    secteur: fields.Source || 'Non défini',
    delai: fields.Délai || fields.Delai || 'Non défini',
    conversation: conversation,
    agent_en_charge: fields.Agent_en_charge || fields.agent_en_charge || null, // Agent assigné au lead
    createdTime: record.createdTime || new Date().toISOString(), // Timestamp de création depuis Airtable
  };
}

/**
 * Met à jour un lead dans Airtable
 */
export async function updateLeadInAirtable(leadId, updates) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${leadId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
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
 */
export async function assignLeadToAgent(leadId, agentName) {
  try {
    console.log('🔄 Assigning lead:', leadId, 'to agent:', agentName);

    // Date actuelle au format ISO
    const now = new Date().toISOString();

    const result = await updateLeadInAirtable(leadId, {
      Agent_en_charge: agentName,
      Date_prise_en_charge: now,
      Statut: 'En Découverte', // Changer le statut pour placer le dossier dans "En Découverte"
    });
    console.log('✅ Lead assigned successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error assigning lead to agent:', error);
    console.error('Error details:', {
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
 */
export async function unassignLead(leadId) {
  try {
    console.log('🔄 Unassigning lead:', leadId);

    const result = await updateLeadInAirtable(leadId, {
      Agent_en_charge: '', // Vider le champ agent
      Date_prise_en_charge: '', // Vider la date
      Statut: 'Qualifié', // Remettre le statut à Qualifié pour qu'il retourne dans "À Traiter"
    });
    console.log('✅ Lead unassigned successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error unassigning lead:', error);
    console.error('Error details:', {
      leadId,
      error: error.message,
      response: error.response
    });
    throw error;
  }
}

/**
 * Change le statut d'un lead
 */
export async function updateLeadStatus(leadId, newStatus) {
  try {
    console.log('🔄 Updating lead status:', leadId, 'to', newStatus);

    const result = await updateLeadInAirtable(leadId, {
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
 */
export async function markMessagesAsRead(leadId, conversation) {
  try {
    console.log('🔄 Marking messages as read for lead:', leadId);

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

    const result = await updateLeadInAirtable(leadId, {
      Conversation_JSON: JSON.stringify(n8nFormat),
    });

    console.log('✅ Messages marked as read successfully');
    return result;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    throw error;
  }
}
