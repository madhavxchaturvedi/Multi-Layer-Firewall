// utils/db.js
// SQLite persistence layer — bans, suspiciousIPs, and config survive restarts

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/waf.db')
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS banned_ips (
    ip TEXT PRIMARY KEY,
    reason TEXT,
    banned_at INTEGER,
    permanent INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS suspicious_ips (
    ip TEXT PRIMARY KEY,
    score INTEGER DEFAULT 0,
    hits TEXT DEFAULT '[]',
    last_seen INTEGER
  );

  CREATE TABLE IF NOT EXISTS allowlist (
    ip TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS disabled_rules (
    rule_id TEXT PRIMARY KEY,
    disabled_at INTEGER
  );
`)

// ── Ban operations ────────────────────────────────────────────────────────────
const stmts = {
  insertBan:      db.prepare('INSERT OR REPLACE INTO banned_ips (ip, reason, banned_at, permanent) VALUES (?, ?, ?, ?)'),
  deleteBan:      db.prepare('DELETE FROM banned_ips WHERE ip = ?'),
  getAllBans:      db.prepare('SELECT * FROM banned_ips'),
  getBan:         db.prepare('SELECT * FROM banned_ips WHERE ip = ?'),

  insertSuspicious: db.prepare('INSERT OR REPLACE INTO suspicious_ips (ip, score, hits, last_seen) VALUES (?, ?, ?, ?)'),
  deleteSuspicious: db.prepare('DELETE FROM suspicious_ips WHERE ip = ?'),
  getAllSuspicious: db.prepare('SELECT * FROM suspicious_ips'),
  getSuspicious:    db.prepare('SELECT * FROM suspicious_ips WHERE ip = ?'),

  insertAllowlist:  db.prepare('INSERT OR IGNORE INTO allowlist (ip) VALUES (?)'),
  deleteAllowlist:  db.prepare('DELETE FROM allowlist WHERE ip = ?'),
  getAllAllowlist:  db.prepare('SELECT ip FROM allowlist'),
  inAllowlist:     db.prepare('SELECT ip FROM allowlist WHERE ip = ?'),

  setConfig:       db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)'),
  getConfig:       db.prepare('SELECT value FROM config WHERE key = ?'),

  disableRule:     db.prepare('INSERT OR IGNORE INTO disabled_rules (rule_id, disabled_at) VALUES (?, ?)'),
  enableRule:      db.prepare('DELETE FROM disabled_rules WHERE rule_id = ?'),
  getDisabledRules: db.prepare('SELECT rule_id FROM disabled_rules'),
}

module.exports = { db, stmts }
