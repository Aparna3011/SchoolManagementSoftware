/**
 * Migration 003: Add father and mother Aadhaar number fields
 */

const version = 3;
const name = 'student_parent_aadhaar_fields';

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  const columns = [
    { name: 'father_aadhaar_no', definition: "TEXT DEFAULT ''" },
    { name: 'mother_aadhaar_no', definition: "TEXT DEFAULT ''" },
  ];

  const existingColumns = new Set(
    db.prepare('PRAGMA table_info(Students_Master)').all().map((row) => row.name),
  );

  for (const column of columns) {
    if (!existingColumns.has(column.name)) {
      db.exec(`ALTER TABLE Students_Master ADD COLUMN ${column.name} ${column.definition};`);
    }
  }
}

module.exports = { version, name, up };
