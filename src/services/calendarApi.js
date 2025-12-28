// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get Google OAuth URL
export async function getGoogleAuthUrl(userId, userEmail, agency) {
  try {
    const response = await fetch(`${API_URL}/api/auth/google/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, userEmail, agency }),
    });

    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }

    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
}

// Check Google Calendar connection status
export async function checkGoogleCalendarStatus(userId) {
  try {
    const response = await fetch(`${API_URL}/api/auth/google/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return false;
  }
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(userId) {
  try {
    const response = await fetch(`${API_URL}/api/auth/google/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    throw error;
  }
}

// Create calendar event
export async function createGoogleCalendarEvent(userId, eventDetails) {
  try {
    const response = await fetch(`${API_URL}/api/calendar/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, eventDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Delete calendar event
export async function deleteGoogleCalendarEvent(userId, eventId) {
  try {
    const response = await fetch(`${API_URL}/api/calendar/event/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, eventId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete event');
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}
