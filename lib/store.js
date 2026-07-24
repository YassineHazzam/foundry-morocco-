/**
 * Foundry MLS — data layer.
 * Uses Neon Postgres (JSONB documents) when STORAGE_DATABASE_URL is set,
 * otherwise falls back to a local JSON file (data/db.json) for dev.
 * Same API either way, so code never changes between local and Vercel.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { seedCities, seedListings } = require('./seed');

// On Vercel the project filesystem is read-only — only /tmp is writable.
// /tmp is ephemeral (resets on cold starts), so it's a demo-mode fallback:
// set STORAGE_DATABASE_URL (Neon) for real persistence in production.
const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const usePg = !!process.env.STORAGE_DATABASE_URL;

let pool = null;
if (usePg) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.STORAGE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

/* ---------- password helpers (no native deps) ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

/* ---------- local JSON backend ---------- */
function readLocal() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return null;
  }
}
function writeLocal(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

/* ---------- init ---------- */
async function initialize() {
  if (usePg) {
    await pool.query(`CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, data JSONB NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, data JSONB NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS cities (id TEXT PRIMARY KEY, data JSONB NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL)`);
    // Seed cities if empty
    const c = await pool.query('SELECT COUNT(*) FROM cities');
    if (parseInt(c.rows[0].count, 10) === 0) {
      for (const city of seedCities) {
        await pool.query('INSERT INTO cities (id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING', [city.slug, JSON.stringify(city)]);
      }
    }
    // Seed listings if empty
    const l = await pool.query('SELECT COUNT(*) FROM listings');
    if (parseInt(l.rows[0].count, 10) === 0) {
      for (const listing of seedListings) {
        await pool.query('INSERT INTO listings (id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING', [listing.id, JSON.stringify(listing)]);
      }
    }
    // Ensure admin exists
    const a = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(a.rows[0].count, 10) === 0) {
      const user = process.env.ADMIN_USER || 'admin';
      const pass = process.env.ADMIN_PASSWORD || 'foundry2026';
      await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [user, hashPassword(pass)]);
    }
  } else {
    let db = readLocal();
    if (!db) {
      db = {
        listings: seedListings,
        leads: [],
        cities: seedCities,
        admins: [{ username: process.env.ADMIN_USER || 'admin', password_hash: hashPassword(process.env.ADMIN_PASSWORD || 'foundry2026') }]
      };
      writeLocal(db);
    }
  }
}

/* ---------- listings ---------- */
async function getListings() {
  if (usePg) {
    const r = await pool.query('SELECT data FROM listings');
    return r.rows.map(x => x.data);
  }
  return (readLocal() || {}).listings || [];
}

async function getListing(idOrSlug) {
  const all = await getListings();
  return all.find(l => l.id === idOrSlug || l.slug === idOrSlug) || null;
}

async function saveListing(listing) {
  if (usePg) {
    await pool.query(
      `INSERT INTO listings (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [listing.id, JSON.stringify(listing)]
    );
  } else {
    const db = readLocal();
    const i = db.listings.findIndex(l => l.id === listing.id);
    if (i >= 0) db.listings[i] = listing; else db.listings.push(listing);
    writeLocal(db);
  }
  return listing;
}

async function deleteListing(id) {
  if (usePg) {
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
  } else {
    const db = readLocal();
    db.listings = db.listings.filter(l => l.id !== id);
    writeLocal(db);
  }
}

/* ---------- leads ---------- */
async function getLeads() {
  if (usePg) {
    const r = await pool.query('SELECT data FROM leads');
    return r.rows.map(x => x.data).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  return ((readLocal() || {}).leads || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function saveLead(lead) {
  if (usePg) {
    await pool.query('INSERT INTO leads (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data', [lead.id, JSON.stringify(lead)]);
  } else {
    const db = readLocal();
    db.leads.push(lead);
    writeLocal(db);
  }
  return lead;
}

/* ---------- cities ---------- */
async function getCities() {
  if (usePg) {
    const r = await pool.query('SELECT data FROM cities');
    return r.rows.map(x => x.data);
  }
  return (readLocal() || {}).cities || [];
}

async function getCity(slug) {
  const all = await getCities();
  return all.find(c => c.slug === slug) || null;
}

/* ---------- admin auth ---------- */
async function checkAdmin(username, password) {
  if (usePg) {
    const r = await pool.query('SELECT password_hash FROM admins WHERE username = $1', [username]);
    if (!r.rows.length) return false;
    return verifyPassword(password, r.rows[0].password_hash);
  }
  const db = readLocal();
  const admin = (db.admins || []).find(a => a.username === username);
  return admin ? verifyPassword(password, admin.password_hash) : false;
}

module.exports = {
  initialize,
  getListings, getListing, saveListing, deleteListing,
  getLeads, saveLead,
  getCities, getCity,
  checkAdmin
};
