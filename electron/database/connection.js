const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

/**
 * Database Connection Singleton
 * 
 * Manages a single SQLite connection for the entire application.
 * Database file is stored in the app's userData directory.
 */

let db = null;

/**
 * Get or create the database connection.
 * @returns {Database} The SQLite database instance.
 */
function getDatabase() {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'school.db');
  console.log('[Database] Path:', dbPath);

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('[Database] Connection established.');
  return db;
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Connection closed.');
  }
}

module.exports = { getDatabase, closeDatabase };
