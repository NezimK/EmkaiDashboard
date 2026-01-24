import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'tokens.json');

// Initialize database file if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
}

// Read database
function readDB() {
  initDB();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Save or update user tokens
// provider: 'google' (default) or 'outlook'
export function saveUserTokens(userId, userEmail, agency, tokens, provider = 'google') {
  const db = readDB();

  // Create user object if it doesn't exist
  if (!db.users[userId]) {
    db.users[userId] = {
      user_id: userId,
      user_email: userEmail,
      agency: agency,
    };
  }

  // Store tokens under provider key
  db.users[userId][provider] = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    account: tokens.account || null, // For Outlook MSAL
    updated_at: Date.now()
  };

  // Keep backward compatibility - store at root level for google
  if (provider === 'google') {
    db.users[userId].access_token = tokens.access_token;
    db.users[userId].refresh_token = tokens.refresh_token;
    db.users[userId].expiry_date = tokens.expiry_date;
    db.users[userId].updated_at = Date.now();
  }

  writeDB(db);
  return db.users[userId];
}

// Get user tokens
// provider: 'google' (default) or 'outlook'
export function getUserTokens(userId, provider = 'google') {
  const db = readDB();
  const user = db.users[userId];

  if (!user) return null;

  // Check for provider-specific tokens first
  if (user[provider]) {
    return {
      ...user[provider],
      user_id: user.user_id,
      user_email: user.user_email,
      agency: user.agency,
    };
  }

  // Backward compatibility for google tokens stored at root
  if (provider === 'google' && user.access_token) {
    return user;
  }

  return null;
}

// Delete user tokens (for disconnection)
// provider: 'google' (default) or 'outlook'
export function deleteUserTokens(userId, provider = 'google') {
  const db = readDB();

  if (db.users[userId]) {
    // Delete provider-specific tokens
    if (db.users[userId][provider]) {
      delete db.users[userId][provider];
    }

    // Backward compatibility for google
    if (provider === 'google') {
      delete db.users[userId].access_token;
      delete db.users[userId].refresh_token;
      delete db.users[userId].expiry_date;
    }

    // If no more tokens, delete user entirely
    const hasGoogle = db.users[userId].google || db.users[userId].access_token;
    const hasOutlook = db.users[userId].outlook;

    if (!hasGoogle && !hasOutlook) {
      delete db.users[userId];
    }

    writeDB(db);
    return true;
  }

  return false;
}

// Check which calendar providers are connected for a user
export function getConnectedProviders(userId) {
  const db = readDB();
  const user = db.users[userId];

  if (!user) return { google: false, outlook: false };

  return {
    google: !!(user.google || user.access_token),
    outlook: !!user.outlook,
  };
}

// Initialize DB on module load
initDB();
