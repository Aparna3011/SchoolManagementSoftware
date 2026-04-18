const version = 6;
const name = 'academic_year_date_fields';

/**
 * @param {import('better-sqlite3').Database} db
 */

function up(db) {
  const existingColumns = new Set(
    db.prepare('PRAGMA table_info(Academic_Years)').all().map((row) => row.name),
  );

  if (!existingColumns.has('start_date')) {
    db.exec('ALTER TABLE Academic_Years ADD COLUMN start_date DATE;');
  }

  if (!existingColumns.has('end_date')) {
    db.exec('ALTER TABLE Academic_Years ADD COLUMN end_date DATE;');
  }

  const years = db.prepare('SELECT id, start_year, start_date, end_date FROM Academic_Years').all();
  const fillDates = db.prepare('UPDATE Academic_Years SET start_date = ?, end_date = ? WHERE id = ?');

  for (const year of years) {
    if (year.start_date && year.end_date) continue;

    const startYearNumber = Number.parseInt(year.start_year, 10);
    if (!startYearNumber) continue;

    const startDate = year.start_date || `${startYearNumber}-04-01`;
    const endDate = year.end_date || `${startYearNumber + 1}-03-31`;
    fillDates.run(startDate, endDate, year.id);
  }
}

module.exports = { version, name, up };