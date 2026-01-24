import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { getUserTokens, saveUserTokens } from './db.js';

// MSAL configuration
function getMsalConfig() {
  return {
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    },
  };
}

// Create MSAL client
function getMsalClient() {
  return new ConfidentialClientApplication(getMsalConfig());
}

// Scopes for Microsoft Graph API
const SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'Calendars.ReadWrite',
];

// Get authorization URL for Outlook
export function getOutlookAuthUrl(userId, userEmail, agency) {
  const msalClient = getMsalClient();

  // Store user info in state parameter
  const state = Buffer.from(JSON.stringify({ userId, userEmail, agency, provider: 'outlook' })).toString('base64');

  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
    state: state,
    prompt: 'consent',
  };

  return msalClient.getAuthCodeUrl(authCodeUrlParameters);
}

// Exchange authorization code for tokens
export async function exchangeOutlookCodeForTokens(code) {
  const msalClient = getMsalClient();

  const tokenRequest = {
    code: code,
    scopes: SCOPES,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  };

  const response = await msalClient.acquireTokenByCode(tokenRequest);

  return {
    access_token: response.accessToken,
    refresh_token: response.account ? response.account.homeAccountId : null,
    expiry_date: response.expiresOn ? new Date(response.expiresOn).getTime() : Date.now() + 3600000,
    id_token: response.idToken,
    account: response.account,
  };
}

// Get Graph client with valid token
async function getGraphClient(userId) {
  const userTokens = getUserTokens(userId, 'outlook');

  if (!userTokens) {
    throw new Error('User not authenticated with Outlook Calendar');
  }

  // Check if token is expired and refresh if needed
  const now = Date.now();
  let accessToken = userTokens.access_token;

  if (userTokens.expiry_date < now + 5 * 60 * 1000) {
    // Token is expired or will expire soon, refresh it
    accessToken = await refreshOutlookToken(userId, userTokens);
  }

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Refresh Outlook token
async function refreshOutlookToken(userId, userTokens) {
  const msalClient = getMsalClient();

  try {
    // For refresh, we need to use the silent flow with the account
    const silentRequest = {
      scopes: SCOPES,
      account: userTokens.account,
    };

    const response = await msalClient.acquireTokenSilent(silentRequest);

    // Save new tokens
    saveUserTokens(userId, userTokens.user_email, userTokens.agency, {
      access_token: response.accessToken,
      refresh_token: userTokens.refresh_token,
      expiry_date: response.expiresOn ? new Date(response.expiresOn).getTime() : Date.now() + 3600000,
      account: response.account,
    }, 'outlook');

    return response.accessToken;
  } catch (error) {
    console.error('Error refreshing Outlook token:', error);
    throw new Error('Failed to refresh Outlook token. Please reconnect.');
  }
}

// Create calendar event in Outlook
export async function createOutlookCalendarEvent(userId, eventDetails) {
  try {
    const client = await getGraphClient(userId);

    const event = {
      subject: eventDetails.title,
      body: {
        contentType: 'HTML',
        content: eventDetails.description || '',
      },
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: 'Europe/Paris',
      },
      reminderMinutesBeforeStart: 30,
      isReminderOn: true,
    };

    const response = await client.api('/me/events').post(event);

    return {
      success: true,
      eventId: response.id,
      eventLink: response.webLink,
    };
  } catch (error) {
    console.error('Error creating Outlook calendar event:', error);
    throw error;
  }
}

// Delete calendar event from Outlook
export async function deleteOutlookCalendarEvent(userId, eventId) {
  try {
    const client = await getGraphClient(userId);

    await client.api(`/me/events/${eventId}`).delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting Outlook calendar event:', error);
    throw error;
  }
}
