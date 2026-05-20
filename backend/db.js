/**
 * db.js — SQLite via sql.js (pure WASM, no native compilation required)
 *
 * Works on Node 18–24+ on any platform (macOS arm64, Linux, Windows)
 * without Xcode CLT / node-gyp / C++ toolchain.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'docuflow.db');

let _db = null;

function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function dbRun(sql, params = []) {
  _db.run(sql, params);
  persist();
}

function dbGet(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function dbAll(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

const wrapper = {
  prepare(sql) {
    return {
      run(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        dbRun(sql, params);
      },
      get(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return dbGet(sql, params);
      },
      all(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return dbAll(sql, params);
      },
    };
  },
  run: dbRun,
  get: dbGet,
  all: dbAll,
  exec(sql) { _db.run(sql); persist(); },
};

async function initDb() {
  const sqlJs = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new sqlJs.Database(fileBuffer);
  } else {
    db = new sqlJs.Database();
  }
  _db = db;

  // Schema
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT DEFAULT '',
      owner_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      shared_with_id TEXT NOT NULL,
      permission TEXT NOT NULL DEFAULT 'view',
      shared_at TEXT DEFAULT (datetime('now')),
      UNIQUE(document_id, shared_with_id),
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (shared_with_id) REFERENCES users(id)
    );
  `);
  persist();

  // Seed users
  const seedUsers = [
    { id: uuidv4(), email: 'alice@docuflow.dev', name: 'Alice Johnson', password: 'password123' },
    { id: uuidv4(), email: 'bob@docuflow.dev',   name: 'Bob Smith',     password: 'password123' },
    { id: uuidv4(), email: 'carol@docuflow.dev', name: 'Carol White',   password: 'password123' },
  ];
  for (const u of seedUsers) {
    const exists = dbGet('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!exists) {
      dbRun('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
        [u.id, u.email, u.name, u.password]);
    }
  }

  // Seed welcome doc for alice
  const alice = dbGet('SELECT id FROM users WHERE email = ?', ['alice@docuflow.dev']);
  if (alice) {
    const hasDoc = dbGet('SELECT id FROM documents WHERE owner_id = ?', [alice.id]);
    if (!hasDoc) {
      dbRun('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)', [
        uuidv4(),
        'Welcome to DocuFlow',
        JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to DocuFlow \uD83D\uDC4B' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'This is a lightweight collaborative document editor. You can:' }] },
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create and edit rich-text documents' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Upload .txt and .md files to import content' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Share documents with other users' }] }] },
              ],
            },
            { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Get started by creating a new document!' }] },
          ],
        }),
        alice.id,
      ]);
    }
  }

  persist();
  console.log('Database ready:', DB_PATH);
  return wrapper;
}

module.exports = { initDb, db: wrapper };
