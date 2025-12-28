import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAuthUrl, exchangeCodeForTokens, createCalendarEvent, deleteCalendarEvent } from './calendar.js';
import { saveUserTokens, getUserTokens, deleteUserTokens } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Get Google OAuth URL
app.post('/api/auth/google/url', (req, res) => {
  try {
    const { userId, userEmail, agency } = req.body;

    if (!userId || !userEmail || !agency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const authUrl = getAuthUrl(userId, userEmail, agency);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// OAuth callback handler
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    // Decode state to get user info
    const { userId, userEmail, agency } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens to database
    saveUserTokens(userId, userEmail, agency, tokens);

    // Redirect back to frontend with success
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connexion réussie</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #0F0F0F;
            }
            .container {
              background: #1A1A1A;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.5);
              text-align: center;
              max-width: 400px;
              border: 1px solid rgba(197, 160, 101, 0.2);
            }
            .success-icon {
              width: 70px;
              height: 70px;
              background: linear-gradient(135deg, #C5A065 0%, #B08F55 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              color: black;
              font-size: 36px;
              font-weight: bold;
              box-shadow: 0 4px 20px rgba(197, 160, 101, 0.3);
            }
            h1 {
              color: #FFFFFF;
              margin: 0 0 12px;
              font-size: 26px;
              font-weight: bold;
            }
            p {
              color: #9CA3AF;
              margin: 0 0 20px;
              line-height: 1.6;
            }
            .highlight {
              color: #C5A065;
              font-weight: 600;
            }
            .button {
              background: linear-gradient(135deg, #C5A065 0%, #B08F55 100%);
              color: black;
              border: none;
              padding: 14px 28px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(197, 160, 101, 0.2);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(197, 160, 101, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Connexion réussie !</h1>
            <p>Votre <span class="highlight">Google Calendar</span> a été connecté avec succès.</p>
            <p style="font-size: 14px; color: #6B7280;">Cette fenêtre va se fermer automatiquement...</p>
            <button class="button" onclick="window.close()">Fermer</button>
          </div>
          <script>
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erreur de connexion</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            .error-icon {
              width: 60px;
              height: 60px;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              color: white;
              font-size: 30px;
            }
            h1 {
              color: #1f2937;
              margin: 0 0 10px;
              font-size: 24px;
            }
            p {
              color: #6b7280;
              margin: 0 0 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✕</div>
            <h1>Erreur de connexion</h1>
            <p>Une erreur s'est produite lors de la connexion à Google Calendar.</p>
            <p style="font-size: 14px;">Veuillez réessayer.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Check connection status
app.post('/api/auth/google/status', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const tokens = getUserTokens(userId);

    res.json({ connected: !!tokens });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Disconnect Google Calendar
app.post('/api/auth/google/disconnect', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    deleteUserTokens(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Create calendar event
app.post('/api/calendar/event', async (req, res) => {
  try {
    const { userId, eventDetails } = req.body;

    if (!userId || !eventDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await createCalendarEvent(userId, eventDetails);

    res.json(result);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create calendar event', message: error.message });
  }
});

// Delete calendar event
app.post('/api/calendar/event/delete', async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await deleteCalendarEvent(userId, eventId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event', message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
