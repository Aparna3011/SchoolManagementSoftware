const { amountToWordsINR } = require('../utils/amountInWords');

const version = 5
const name = 'payment_amount_in_words';

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  const existingColumns = new Set(
    db.prepare('PRAGMA table_info(Payments)').all().map((row) => row.name),
  );

  if (!existingColumns.has('amount_in_words')) {
    db.exec("ALTER TABLE Payments ADD COLUMN amount_in_words TEXT DEFAULT '';");
  }

  const rows = db.prepare(`
    SELECT id, amount_paid
    FROM Payments
    WHERE amount_in_words IS NULL OR TRIM(amount_in_words) = ''
  `).all();

  const updateStmt = db.prepare(`
    UPDATE Payments
    SET amount_in_words = ?
    WHERE id = ?
  `);

  for (const row of rows) {
    updateStmt.run(amountToWordsINR(row.amount_paid), row.id);
  }
}

module.exports = { version, name, up };