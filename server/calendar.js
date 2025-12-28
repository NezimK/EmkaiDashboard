import { google } from 'googleapis';
import { getUserTokens, saveUserTokens } from './db.js';

// Create OAuth2 client
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Get authorization URL
export function getAuthUrl(userId, userEmail, agency) {
  const oauth2Client = getOAuth2Client();

  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  // Store user info in state parameter
  const state = Buffer.from(JSON.stringify({ userId, userEmail, agency })).toString('base64');

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
