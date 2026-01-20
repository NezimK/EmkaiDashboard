// Service pour envoyer des messages WhatsApp via n8n
// Multi-Tenant Support: Webhooks are built dynamically using client_id

/**
 * Construit l'URL du webhook N8N pour un client donné
 * En développement, utilise le proxy Vite pour éviter les problèmes CORS
 * @param {string} clientId - L'ID du client/tenant (UUID)
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
 * Envoie un message WhatsApp via n8n
 * @param {string} clientId - L'ID du client/tenant (UUID)
 * @param {string} leadId - L'ID du lead dans Supabase
 * @param {string} phoneNumber - Le numéro de téléphone du destinataire
 * @param {string} message - Le message à envoyer
 * @param {string} agentName - Le nom de l'agent qui envoie le message
 * @returns {Promise<Object>} - La réponse du webhook
 */
export async function sendWhatsAppMessage(clientId, leadId, phoneNumber, message, agentName) {
  if (!clientId) {
    throw new Error("L'identifiant du client est requis pour envoyer un message");
  }

  const webhookUrl = buildWebhookUrl(clientId, 'whatsapp');

  try {
    console.log(`📤 Sending WhatsApp message for client: ${clientId}`);
    console.log(`📱 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message.substring(0, 50)}...`);
    console.log(`🔗 Webhook URL: ${webhookUrl}`);

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
        clientId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ WhatsApp message sent successfully for client: ${clientId}`);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Envoie un email via n8n
 * @param {string} clientId - L'ID du client/tenant (UUID)
 * @param {string} leadId - L'ID du lead dans Supabase
 * @param {string} email - L'adresse email du destinataire
 * @param {string} subject - Le sujet de l'email
 * @param {string} message - Le contenu de l'email
 * @param {string} agentName - Le nom de l'agent qui envoie l'email
 * @returns {Promise<Object>} - La réponse du webhook
 */
export async function sendEmail(clientId, leadId, email, subject, message, agentName) {
  if (!clientId) {
    throw new Error("L'identifiant du client est requis pour envoyer un email");
  }

  const webhookUrl = buildWebhookUrl(clientId, 'email');

  try {
    console.log(`📧 Sending email for client: ${clientId}`);
    console.log(`📬 To: ${email}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`🔗 Webhook URL: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        email,
        subject,
        message,
        agentName,
        clientId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Email sent successfully for client: ${clientId}`);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`❌ Error sending email for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Vérifie si l'envoi de messages WhatsApp est configuré pour un client
 * @param {string} clientId - L'ID du client/tenant (UUID)
 * @returns {boolean} - true si configuré (client_id valide), false sinon
 */
export function isWhatsAppConfigured(clientId) {
  // Tant qu'on a un client_id valide (UUID), WhatsApp est considéré comme configuré
  // car l'URL du webhook sera construite dynamiquement
  if (!clientId) return false;

  // Vérifier que c'est un UUID valide (format simple)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(clientId);
}

/**
 * Vérifie si l'envoi d'emails est configuré pour un client
 * @param {string} clientId - L'ID du client/tenant (UUID)
 * @returns {boolean} - true si configuré (client_id valide), false sinon
 */
export function isEmailConfigured(clientId) {
  return isWhatsAppConfigured(clientId); // Même logique
}
