/**
 * Migration 001: Initial Schema
 *
 * Creates all base tables for the School Management System:
 * - Company_Profile (singleton)
 * - Financial_Years
 * - Classes_Master
 * - Students (matches paper admission form fields)
 * - Payments (with cancel-only policy)
 */

const version = 1;
const name = "initial_schema";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // ============ MASTER TABLES ============

  db.exec(`
    CREATE TABLE IF NOT EXISTS Company_Profile (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      firm_name TEXT NOT NULL DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      logo_path TEXT DEFAULT '',
      registration_no TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default company profile row
  db.exec(`
    INSERT OR IGNORE INTO Company_Profile (id, firm_name)
    VALUES (1, 'School Management System');
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Financial_Years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_label TEXT NOT NULL UNIQUE,
      start_date DATE,
      end_date DATE,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Classes_Master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT NOT NULL,
      session_time TEXT DEFAULT '',
      base_fee REAL DEFAULT 0,
      year_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(year_id) REFERENCES Financial_Years(id)
    );
  `);

  // ============ TRANSACTION TABLES ============

  db.exec(`
    CREATE TABLE IF NOT EXISTS Students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sr_no TEXT,
      photo_path TEXT DEFAULT '',
      surname TEXT DEFAULT '',
      student_name TEXT NOT NULL,
      father_first_name TEXT DEFAULT '',
      dob DATE,
      class_id INTEGER,
      religion TEXT DEFAULT '',
      caste TEXT DEFAULT '',
      address TEXT DEFAULT '',
      father_name TEXT DEFAULT '',
      father_education TEXT DEFAULT '',
      father_occupation TEXT DEFAULT '',
      mother_name TEXT DEFAULT '',
      mother_education TEXT DEFAULT '',
      mother_occupation TEXT DEFAULT '',
      mother_tongue TEXT DEFAULT '',
      emergency_contact_mother TEXT DEFAULT '',
      emergency_contact_father TEXT DEFAULT '',
      admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      year_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES Classes_Master(id),
      FOREIGN KEY(year_id) REFERENCES Financial_Years(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      invoice_no TEXT NOT NULL UNIQUE,
      amount_paid REAL NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      payment_mode TEXT DEFAULT 'Cash',
      balance_remaining REAL DEFAULT 0,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES Students(id)
    );
  `);

  // ============ INDEXES ============

  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_sr_no ON Students(sr_no);`);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_students_name ON Students(student_name);`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_students_class ON Students(class_id);`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_payments_student ON Payments(student_id);`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_payments_invoice ON Payments(invoice_no);`,
  );
}

module.exports = { version, name, up };
