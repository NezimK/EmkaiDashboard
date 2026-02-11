import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'tokens.json');

// =============================================================================
// SÉCURITÉ: Chiffrement AES-256 pour les tokens OAuth
// =============================================================================

// Clé de chiffrement (doit être 32 bytes = 64 caractères hex)
// IMPORTANT: Définir TOKEN_ENCRYPTION_KEY dans .env en production
if (!process.env.TOKEN_ENCRYPTION_KEY) {
  console.error('❌ FATAL: TOKEN_ENCRYPTION_KEY is not defined in environment variables. Server cannot start.');
  process.exit(1);
}
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
const IV_LENGTH = 16;

/**
 * Chiffre une chaîne avec AES-256-CBC
 * @param {string} text - Texte à chiffrer
 * @returns {string} Texte chiffré au format "iv:encrypted" en hex
 */
function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt token - refusing to store in plaintext');
  }
}

/**
 * Déchiffre une chaîne chiffrée avec AES-256-CBC
 * @param {string} text - Texte chiffré au format "iv:encrypted"
 * @returns {string} Texte déchiffré
 */
function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt token - data may be corrupted or key mismatch');
  }
}

/**
 * Vérifie si une chaîne est déjà chiffrée (format iv:encrypted)
 */
function isEncrypted(text) {
  if (!text || typeof text !== 'string') return false;
  const parts = text.split(':');
  return parts.length === 2 && parts[0].length === 32 && /^[a-f0-9]+$/i.test(parts[0]);
}

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
// SÉCURITÉ: Les tokens sont chiffrés avant stockage
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

  // SÉCURITÉ: Chiffrer les tokens sensibles avant stockage
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  // Store encrypted tokens under provider key
  db.users[userId][provider] = {
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    expiry_date: tokens.expiry_date,
    account: tokens.account || null, // For Outlook MSAL
    updated_at: Date.now()
  };

  // Keep backward compatibility - store at root level for google
  if (provider === 'google') {
    db.users[userId].access_token = encryptedAccessToken;
    db.users[userId].refresh_token = encryptedRefreshToken;
    db.users[userId].expiry_date = tokens.expiry_date;
    db.users[userId].updated_at = Date.now();
  }

  writeDB(db);
  return db.users[userId];
}

// Get user tokens
// SÉCURITÉ: Les tokens sont déchiffrés après lecture
// provider: 'google' (default) or 'outlook'
export function getUserTokens(userId, provider = 'google') {
  const db = readDB();
  const user = db.users[userId];

  if (!user) return null;

  // Check for provider-specific tokens first
  if (user[provider]) {
    // SÉCURITÉ: Déchiffrer les tokens avant de les retourner
    return {
      ...user[provider],
      access_token: decrypt(user[provider].access_token),
      refresh_token: decrypt(user[provider].refresh_token),
      user_id: user.user_id,
      user_email: user.user_email,
      agency: user.agency,
    };
  }

  // Backward compatibility for google tokens stored at root
  if (provider === 'google' && user.access_token) {
    // SÉCURITÉ: Déchiffrer les tokens du niveau racine aussi
    return {
      ...user,
      access_token: decrypt(user.access_token),
      refresh_token: decrypt(user.refresh_token),
    };
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
