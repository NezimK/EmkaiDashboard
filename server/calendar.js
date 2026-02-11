import { google } from 'googleapis';
import crypto from 'crypto';
import { getUserTokens, saveUserTokens } from './db.js';

// SÉCURITÉ: Secret pour signer le state OAuth (doit être défini dans .env)
if (!process.env.STATE_SECRET) {
  console.error('❌ FATAL: STATE_SECRET is not defined in environment variables. Server cannot start.');
  process.exit(1);
}
const STATE_SECRET = process.env.STATE_SECRET;

// Create OAuth2 client
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * SÉCURITÉ: Crée un state OAuth signé avec HMAC pour prévenir les attaques CSRF
 * @param {Object} data - Les données à inclure dans le state
 * @returns {string} Le state encodé et signé en base64
 */
export function createSignedState(data) {
  const payload = JSON.stringify(data);
  const timestamp = Date.now();
  const dataWithTimestamp = JSON.stringify({ ...data, timestamp });

  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(dataWithTimestamp)
    .digest('hex');

  return Buffer.from(JSON.stringify({
    payload: dataWithTimestamp,
    signature
  })).toString('base64');
}

/**
 * SÉCURITÉ: Vérifie et décode un state OAuth signé
 * @param {string} state - Le state encodé en base64
 * @returns {Object} Les données décodées
 * @throws {Error} Si la signature est invalide ou le state a expiré
 */
export function verifySignedState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());

    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET)
      .update(decoded.payload)
      .digest('hex');

    if (expectedSignature !== decoded.signature) {
      throw new Error('Invalid state signature - possible CSRF attack');
    }

    const data = JSON.parse(decoded.payload);

    // Vérifier que le state n'a pas expiré (10 minutes max)
    const MAX_STATE_AGE = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - data.timestamp > MAX_STATE_AGE) {
      throw new Error('State expired');
    }

    return data;
  } catch (error) {
    console.error('State verification failed:', error.message);
    throw new Error('Invalid OAuth state');
  }
}

// Get authorization URL
export function getAuthUrl(userId, userEmail, agency) {
  const oauth2Client = getOAuth2Client();

  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  // SÉCURITÉ: Utiliser un state signé au lieu d'un simple base64
  const state = createSignedState({ userId, userEmail, agency });

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent' // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh access token if expired
async function refreshAccessToken(userId) {
  const userTokens = getUserTokens(userId);

  if (!userTokens) {
    throw new Error('No tokens found for user');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: userTokens.refresh_token
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Save new tokens
  saveUserTokens(userId, userTokens.user_email, userTokens.agency, {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || userTokens.refresh_token,
    expiry_date: credentials.expiry_date
  });

  return credentials;
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(userId) {
  const userTokens = getUserTokens(userId);

  if (!userTokens) {
    throw new Error('User not authenticated with Google Calendar');
  }

  const now = Date.now();

  // If token expires in less than 5 minutes, refresh it
  if (userTokens.expiry_date < now + 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(userId);
    return newTokens.access_token;
  }

  return userTokens.access_token;
}

// Create calendar event
export async function createCalendarEvent(userId, eventDetails) {
  try {
    const accessToken = await getValidAccessToken(userId);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventDetails.title,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: 'Europe/Paris',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 1440 }, // 24 hours
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(userId, eventId) {
  try {
    const accessToken = await getValidAccessToken(userId);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}
