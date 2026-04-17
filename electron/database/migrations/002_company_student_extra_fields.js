/**
 * Migration 002: Add secondary company logo and student document fields
 */

const version = 2;
const name = 'company_student_extra_fields';

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  const tableColumns = {
    Company_Profile: [
      { name: 'logo_path_secondary', definition: "TEXT DEFAULT ''" },
    ],
    Students_Master: [
      { name: 'nationality', definition: "TEXT DEFAULT ''" },
      { name: 'father_aadhaar_no', definition: "TEXT DEFAULT ''" },
      { name: 'father_govt_proof_path', definition: "TEXT DEFAULT ''" },
      { name: 'mother_aadhaar_no', definition: "TEXT DEFAULT ''" },
      { name: 'mother_govt_proof_path', definition: "TEXT DEFAULT ''" },
      { name: 'birth_certificate_path', definition: "TEXT DEFAULT ''" },
    ],
  };

  for (const [table, columns] of Object.entries(tableColumns)) {
    const existingColumns = new Set(
      db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name),
    );

    for (const column of columns) {
      if (!existingColumns.has(column.name)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.definition};`);
      }
    }
  }
}

module.exports = { version, name, up };
