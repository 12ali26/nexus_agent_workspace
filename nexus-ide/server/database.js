const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// NEXUS Database — SQLite
// Local-first data store for datasets, canvas state, project info.
// In Electron this becomes a file in the user's app data directory.
// On EC2 this lives at /home/ubuntu/.nexus/nexus.db.
const DB_DIR = path.join(process.env.HOME || '/tmp', '.nexus')
const DB_PATH = path.join(DB_DIR, 'nexus.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    name TEXT NOT NULL,
    source TEXT DEFAULT 'file',
    columns TEXT NOT NULL,
    rows TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS canvas_state (
    project_id TEXT PRIMARY KEY,
    blocks TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS installed_extensions (
    project_id TEXT,
    extension_id TEXT,
    PRIMARY KEY (project_id, extension_id)
  );
`)

module.exports = db
