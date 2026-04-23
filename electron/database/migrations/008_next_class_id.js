/**
 * Migration 008: Add Next Class ID to Classes_Master
 *
 * This migration adds a self-referencing foreign key to Classes_Master
 * to allow mapping a class to its succeeding class for promotional logic.
 */

const version = 8;
const name = "add_next_class_id";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // Use a check to see if column exists before adding to prevent duplicate column errors
  const columns = db.prepare('PRAGMA table_info(Classes_Master)').all();
  const hasNextClassId = columns.some(col => col.name === 'next_class_id');

  if (!hasNextClassId) {
    db.exec(`
      ALTER TABLE Classes_Master
      ADD COLUMN next_class_id INTEGER REFERENCES Classes_Master(id) ON DELETE SET NULL;
    `);
  }
}

function down(db) {
  // SQLite does not support DROP COLUMN in versions before 3.35.0.
  // In a production environment, we would need to recreate the table.
  // For this specific field, we'll leave it as is since it's a non-destructive addition.
  throw new Error('Down migration not supported for adding columns in SQLite');
}

module.exports = { version, name, up, down };
