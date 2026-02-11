import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { getAuthUrl, exchangeCodeForTokens, createCalendarEvent, deleteCalendarEvent, verifySignedState } from './calendar.js';
import { getOutlookAuthUrl, exchangeOutlookCodeForTokens, createOutlookCalendarEvent, deleteOutlookCalendarEvent, verifyOutlookSignedState } from './outlookCalendar.js';
import { saveUserTokens, getUserTokens, deleteUserTokens, getConnectedProviders } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// SÉCURITÉ: Secret JWT pour authentification des requêtes calendar
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in environment variables. Server cannot start.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware - SÉCURITÉ: CORS restreint aux origines autorisées
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// =============================================================================
// SÉCURITÉ: Middleware d'authentification JWT
// =============================================================================

/**
 * Middleware pour vérifier le token JWT sur les endpoints protégés
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};

// =============================================================================
// HELPERS: Templates HTML pour les callbacks OAuth
// =============================================================================

function renderOAuthCallbackPage(provider, success) {
  const isGoogle = provider === 'google';
  const color = isGoogle ? '#C5A065' : '#0078D4';
  const colorDark = isGoogle ? '#B08F55' : '#106EBE';
  const providerName = isGoogle ? 'Google Calendar' : 'Outlook Calendar';

  if (success) {
    return `<!DOCTYPE html><html><head><title>Connexion réussie</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0F0F0F}
.container{background:#1A1A1A;padding:40px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;max-width:400px;border:1px solid rgba(197,160,101,0.2)}
.icon{width:70px;height:70px;background:linear-gradient(135deg,${color} 0%,${colorDark} 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;color:${isGoogle ? 'black' : 'white'};font-size:36px;font-weight:bold;box-shadow:0 4px 20px ${color}4D}
h1{color:#FFF;margin:0 0 12px;font-size:26px}p{color:#9CA3AF;margin:0 0 20px;line-height:1.6}
.hl{color:${color};font-weight:600}
.btn{background:linear-gradient(135deg,${color} 0%,${colorDark} 100%);color:${isGoogle ? 'black' : 'white'};border:none;padding:14px 28px;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;display:inline-block;transition:all .3s;box-shadow:0 4px 12px ${color}33}
.btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px ${color}66}</style></head>
<body><div class="container"><div class="icon">✓</div><h1>Connexion réussie !</h1>
<p>Votre <span class="hl">${providerName}</span> a été connecté avec succès.</p>
<p style="font-size:14px;color:#6B7280">Cette fenêtre va se fermer automatiquement...</p>
<button class="btn" onclick="window.close()">Fermer</button></div>
<script>setTimeout(()=>{window.close()},3000)</script></body></html>`;
  }

  return `<!DOCTYPE html><html><head><title>Erreur de connexion</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:linear-gradient(135deg,#f87171 0%,#dc2626 100%)}
.container{background:white;padding:40px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);text-align:center;max-width:400px}
.icon{width:60px;height:60px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:white;font-size:30px}
h1{color:#1f2937;margin:0 0 10px;font-size:24px}p{color:#6b7280;margin:0 0 20px}</style></head>
<body><div class="container"><div class="icon">✕</div><h1>Erreur de connexion</h1>
<p>Une erreur s'est produite lors de la connexion à ${providerName}.</p>
<p style="font-size:14px">Veuillez réessayer.</p></div></body></html>`;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Get Google OAuth URL - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/google/url', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { userEmail, agency } = req.body;

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

    // SÉCURITÉ: Vérifier et décoder le state signé (protection CSRF)
    let userId, userEmail, agency;
    try {
      const stateData = verifySignedState(state);
      userId = stateData.userId;
      userEmail = stateData.userEmail;
      agency = stateData.agency;
    } catch (stateError) {
      console.error('Invalid OAuth state:', stateError.message);
      return res.status(400).send('Invalid or expired OAuth state. Please try again.');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens to database
    saveUserTokens(userId, userEmail, agency, tokens);

    // Redirect back to frontend with success
    res.send(renderOAuthCallbackPage('google', true));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(renderOAuthCallbackPage('google', false));
  }
});

// Check connection status - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/google/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

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

// Disconnect Google Calendar - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/google/disconnect', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

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

// Create calendar event - SÉCURITÉ: Protégé par JWT
app.post('/api/calendar/event', authenticateToken, async (req, res) => {
  try {
    const { eventDetails } = req.body;
    // SÉCURITÉ: Utiliser l'ID du token JWT, pas celui du body
    const userId = req.user.id || req.user.userId;

    if (!userId || !eventDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await createCalendarEvent(userId, eventDetails);

    res.json(result);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Delete calendar event - SÉCURITÉ: Protégé par JWT
app.post('/api/calendar/event/delete', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    // SÉCURITÉ: Utiliser l'ID du token JWT, pas celui du body
    const userId = req.user.id || req.user.userId;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await deleteCalendarEvent(userId, eventId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// ============================================================================
// OUTLOOK CALENDAR ENDPOINTS
// ============================================================================

// Get Outlook OAuth URL - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/outlook/url', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { userEmail, agency } = req.body;

    if (!userId || !userEmail || !agency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const authUrl = await getOutlookAuthUrl(userId, userEmail, agency);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    res.status(500).json({ error: 'Failed to generate Outlook auth URL' });
  }
});

// Outlook OAuth callback handler
app.get('/api/auth/outlook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    // SÉCURITÉ: Vérifier et décoder le state signé (protection CSRF)
    let userId, userEmail, agency;
    try {
      const stateData = verifyOutlookSignedState(state);
      userId = stateData.userId;
      userEmail = stateData.userEmail;
      agency = stateData.agency;
    } catch (stateError) {
      console.error('Invalid Outlook OAuth state:', stateError.message);
      return res.status(400).send('Invalid or expired OAuth state. Please try again.');
    }

    // Exchange code for tokens
    const tokens = await exchangeOutlookCodeForTokens(code);

    // Save tokens to database with 'outlook' provider
    saveUserTokens(userId, userEmail, agency, tokens, 'outlook');

    // Redirect back with success page
    res.send(renderOAuthCallbackPage('outlook', true));
  } catch (error) {
    console.error('Error in Outlook OAuth callback:', error);
    res.status(500).send(renderOAuthCallbackPage('outlook', false));
  }
});

// Check Outlook connection status - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/outlook/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const tokens = getUserTokens(userId, 'outlook');

    res.json({ connected: !!tokens });
  } catch (error) {
    console.error('Error checking Outlook connection status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Disconnect Outlook Calendar - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/outlook/disconnect', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    deleteUserTokens(userId, 'outlook');

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Outlook:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Create Outlook calendar event - SÉCURITÉ: Protégé par JWT
app.post('/api/calendar/outlook/event', authenticateToken, async (req, res) => {
  try {
    const { eventDetails } = req.body;
    // SÉCURITÉ: Utiliser l'ID du token JWT, pas celui du body
    const userId = req.user.id || req.user.userId;

    if (!userId || !eventDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await createOutlookCalendarEvent(userId, eventDetails);

    res.json(result);
  } catch (error) {
    console.error('Error creating Outlook event:', error);
    res.status(500).json({ error: 'Failed to create Outlook calendar event' });
  }
});

// Delete Outlook calendar event - SÉCURITÉ: Protégé par JWT
app.post('/api/calendar/outlook/event/delete', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    // SÉCURITÉ: Utiliser l'ID du token JWT, pas celui du body
    const userId = req.user.id || req.user.userId;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await deleteOutlookCalendarEvent(userId, eventId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting Outlook event:', error);
    res.status(500).json({ error: 'Failed to delete Outlook calendar event' });
  }
});

// ============================================================================
// UNIFIED CALENDAR STATUS
// ============================================================================

// Get all connected calendar providers for a user - SÉCURITÉ: Protégé par JWT
app.post('/api/auth/calendar/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const providers = getConnectedProviders(userId);

    res.json(providers);
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ error: 'Failed to check calendar status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
