const path = require('path');
const fs = require('fs');

/**
 * Migration Runner
 * 
 * Automatically discovers and runs pending database migrations.
 * Tracks applied migrations in a `_migrations` table.
 * 
 * Usage:
 *   const { runMigrations } = require('./runner');
 *   runMigrations(db);
 * 
 * Adding a new migration:
 *   1. Create a file: electron/database/migrations/002_your_migration_name.js
 *   2. Export: { version: 2, name: 'your_migration_name', up(db) { ... } }
 *   3. The runner will auto-detect and apply it on next app launch.
 */

/**
 * Ensure the _migrations tracking table exists.
 * @param {import('better-sqlite3').Database} db
 */
function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Get a sorted list of all migration files from the migrations directory.
 * @returns {Array<{ version: number, name: string, up: Function }>}
 */
function discoverMigrations() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => /^\d{3}_.*\.js$/.test(f) && f !== 'runner.js')
    .sort();

  return files.map(file => {
    const migration = require(path.join(migrationsDir, file));
    return migration;
  });
}

/**
 * Get the set of already-applied migration versions.
 * @param {import('better-sqlite3').Database} db
 * @returns {Set<number>}
 */
function getAppliedVersions(db) {
  const rows = db.prepare('SELECT version FROM _migrations').all();
  return new Set(rows.map(r => r.version));
}

/**
 * Run all pending migrations in order.
 * @param {import('better-sqlite3').Database} db
 */
function runMigrations(db) {
  ensureMigrationsTable(db);

  const allMigrations = discoverMigrations();
  const appliedVersions = getAppliedVersions(db);

  const pending = allMigrations.filter(m => !appliedVersions.has(m.version));

  if (pending.length === 0) {
    console.log('[Migrations] Database is up to date.');
    return;
  }

  console.log(`[Migrations] ${pending.length} pending migration(s) found.`);

  const insertMigration = db.prepare(
    'INSERT INTO _migrations (version, name) VALUES (?, ?)'
  );

  for (const migration of pending) {
    console.log(`[Migrations] Applying: ${migration.version} - ${migration.name}`);

    const runInTransaction = db.transaction(() => {
      migration.up(db);
      insertMigration.run(migration.version, migration.name);
    });

    runInTransaction();
    console.log(`[Migrations] Applied: ${migration.version} - ${migration.name}`);
  }

  console.log('[Migrations] All migrations applied successfully.');
}

module.exports = { runMigrations };
