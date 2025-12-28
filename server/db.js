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
export function saveUserTokens(userId, userEmail, agency, tokens) {
  const db = readDB();

  db.users[userId] = {
    user_id: userId,
    user_email: userEmail,
    agency: agency,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    updated_at: Date.now()
  };

  writeDB(db);
  return db.users[userId];
}

// Get user tokens
export function getUserTokens(userId) {
  const db = readDB();
  return db.users[userId] || null;
}

// Delete user tokens (for disconnection)
export function deleteUserTokens(userId) {
  const db = readDB();

  if (db.users[userId]) {
    delete db.users[userId];
    writeDB(db);
    return true;
  }

  return false;
}

// Initialize DB on module load
initDB();
