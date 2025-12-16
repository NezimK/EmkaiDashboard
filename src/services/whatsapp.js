// Service pour envoyer des messages WhatsApp via n8n
// Multi-Agency Support: Each agency has its own n8n webhook

/**
 * Configuration des webhooks n8n par agence
 */
const WEBHOOK_CONFIG = {
  AGENCY_A: {
    url: import.meta.env.VITE_N8N_WEBHOOK_AGENCY_A,
  },
  AGENCY_B: {
    url: import.meta.env.VITE_N8N_WEBHOOK_AGENCY_B,
  },
};

/**
 * Récupère l'URL du webhook pour une agence donnée
 */
function getWebhookUrl(agency) {
  const config = WEBHOOK_CONFIG[agency];
  if (!config) {
    throw new Error(`Configuration webhook non trouvée pour l'agence: ${agency}`);
  }
  if (!config.url) {
    throw new Error(`URL webhook non configurée pour l'agence ${agency}. Vérifiez vos variables d'environnement.`);
  }
  return config.url;
}

/**
 * Envoie un message WhatsApp via n8n
 * @param {string} agency - L'identifiant de l'agence (AGENCY_A ou AGENCY_B)
 * @param {string} leadId - L'ID du lead dans Airtable
 * @param {string} phoneNumber - Le numéro de téléphone du destinataire
 * @param {string} message - Le message à envoyer
 * @param {string} agentName - Le nom de l'agent qui envoie le message
 * @returns {Promise<Object>} - La réponse du webhook
 */
export async function sendWhatsAppMessage(agency, leadId, phoneNumber, message, agentName) {
  if (!agency) {
    throw new Error('L\'identifiant de l\'agence est requis pour envoyer un message');
  }

  try {
    const webhookUrl = getWebhookUrl(agency);

    console.log(`📤 Sending WhatsApp message for agency: ${agency}`);
    console.log(`📱 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message.substring(0, 50)}...`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        phoneNumber,
        message,
        agentName,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ WhatsApp message sent successfully for agency: ${agency}`);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message for agency ${agency}:`, error);
    throw error;
  }
}

/**
 * Vérifie si l'envoi de messages WhatsApp est configuré pour une agence
 * @param {string} agency - L'identifiant de l'agence
 * @returns {boolean} - true si configuré, false sinon
 */
export function isWhatsAppConfigured(agency) {
  try {
    const url = getWebhookUrl(agency);
    return !!url && url !== 'https://votre-n8n.com/webhook/immocope-send-message' && url !== 'https://votre-n8n.com/webhook/realagency-send-message';
  } catch (error) {
    return false;
  }
}
