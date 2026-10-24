const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const file = process.env.DB_PATH || './data/bot.db';
fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new Database(file);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS settings (guild_id TEXT, key TEXT, value TEXT, PRIMARY KEY (guild_id, key));
CREATE TABLE IF NOT EXISTS levels (
  guild_id TEXT, user_id TEXT, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0, last_msg INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);`);

const qGet = db.prepare('SELECT value FROM settings WHERE guild_id = ? AND key = ?');
const qSet = db.prepare('INSERT INTO settings (guild_id, key, value) VALUES (?, ?, ?) ON CONFLICT(guild_id, key) DO UPDATE SET value = excluded.value');
const qDel = db.prepare('DELETE FROM settings WHERE guild_id = ? AND key = ?');

module.exports = {
  db,
  get: (g, k, def = null) => qGet.get(g, k)?.value ?? def,
  set: (g, k, v) => qSet.run(g, k, String(v)),
  del: (g, k) => qDel.run(g, k),
  getJSON: (g, k, def) => { try { const v = qGet.get(g, k)?.value; return v ? JSON.parse(v) : def; } catch { return def; } },
  setJSON: (g, k, v) => qSet.run(g, k, JSON.stringify(v)),
};
