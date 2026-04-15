const version = 2;
const name = "add_agreed_fee";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // Add agreed_fee column to Students table
  db.exec(`
    ALTER TABLE Students ADD COLUMN agreed_fee REAL DEFAULT 0;
  `);
}

module.exports = { version, name, up };
