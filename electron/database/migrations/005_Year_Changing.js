const { amountToWordsINR } = require('../utils/amountInWords');

const version = 5;
const name = 'academic_year_date_fields';

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  const existingColumns = new Set(
    db.prepare('PRAGMA table_info(Academic_Years)').all().map((row) => row.name),
  );

  if (!existingColumns.has('start_date') || !existingColumns.has('end_date')) {
    db.exec("ALTER TABLE Academic_Years ADD COLUMN start_date DATE ; ALTER TABLE Academic_Years ADD COLUMN end_date DATE ;");
  }
 
}

module.exports = { version, name, up };