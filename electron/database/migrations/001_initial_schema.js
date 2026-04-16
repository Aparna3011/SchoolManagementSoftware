/**
 * Migration 001: V2 Enterprise Schema
 *
 * Implements Enrollment-Based Architecture.
 * Students_Master holds permanent data.
 * Student_Enrollments handles yearly class/roll number assignments.
 */

const version = 1;
const name = "initial_schema_v2";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // ==========================================
  // 1. SYSTEM & INFRASTRUCTURE (MASTER TABLES)
  // ==========================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS Company_Profile (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      school_code TEXT DEFAULT '', -- Used for USIN generation
      group_name TEXT DEFAULT '',
      firm_name TEXT NOT NULL DEFAULT '',
      tagline TEXT DEFAULT '',   
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      udise_no TEXT DEFAULT '',
      logo_path TEXT DEFAULT '',
      logo_path_secondary TEXT DEFAULT '',
      reg_no TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    INSERT OR IGNORE INTO Company_Profile (id, school_code, group_name, firm_name)
    VALUES (1, 'TEST', 'Group of Institutions', 'School');
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Academic_Years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_label TEXT NOT NULL UNIQUE, -- e.g., '2026-2027'
      start_year INTEGER NOT NULL,     -- e.g., 2026 (Used for USIN)
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Classes_Master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE, -- e.g., 'PG', 'UKG', '1ST'
      base_fee REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      section_name TEXT NOT NULL, -- e.g., 'A', 'B'
      max_capacity INTEGER DEFAULT 40,
      FOREIGN KEY(class_id) REFERENCES Classes_Master(id) ON DELETE CASCADE
    );
  `);

  // ==========================================
  // 2. PEOPLE (THE IMMUTABLE RECORD)
  // ==========================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS Students_Master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usin TEXT UNIQUE NOT NULL, -- e.g., SV2026PG0012
      admission_date DATE DEFAULT CURRENT_DATE,
      photo_path TEXT DEFAULT '',
      
      -- Student Details
      surname TEXT DEFAULT '',
      student_name TEXT NOT NULL,
      dob DATE,
      gender TEXT DEFAULT '',
      religion TEXT DEFAULT '',
      caste TEXT DEFAULT '',
      nationality TEXT DEFAULT '',
      blood_group TEXT DEFAULT '',
      mother_tongue TEXT DEFAULT '',
      residential_address TEXT DEFAULT '',
      
      -- Father Details
      father_name TEXT DEFAULT '',
      father_education TEXT DEFAULT '',
      father_occupation TEXT DEFAULT '',
      father_govt_proof_path TEXT DEFAULT '',
      emergency_contact_father TEXT DEFAULT '',
      
      -- Mother Details
      mother_name TEXT DEFAULT '',
      mother_education TEXT DEFAULT '',
      mother_occupation TEXT DEFAULT '',
      mother_govt_proof_path TEXT DEFAULT '',
      emergency_contact_mother TEXT DEFAULT '',
      birth_certificate_path TEXT DEFAULT '',
      
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Alumni', 'Transferred')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==========================================
  // 3. TRANSACTIONS (THE LIFECYCLE)
  // ==========================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS Student_Enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER,
      roll_number INTEGER,
      agreed_annual_fee REAL DEFAULT 0,
      
      FOREIGN KEY(student_id) REFERENCES Students_Master(id),
      FOREIGN KEY(academic_year_id) REFERENCES Academic_Years(id),
      FOREIGN KEY(class_id) REFERENCES Classes_Master(id),
      FOREIGN KEY(section_id) REFERENCES Sections(id),
      
      -- CRITICAL LOGIC: A student can only be enrolled ONCE per academic year
      UNIQUE(student_id, academic_year_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER NOT NULL,
      receipt_no TEXT NOT NULL UNIQUE,
      amount_paid REAL NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      payment_mode TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Cancelled')),
      FOREIGN KEY(enrollment_id) REFERENCES Student_Enrollments(id)
    );
  `);

  // ==========================================
  // 4. INDEXES (FOR SPEED)
  // ==========================================
  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_usin ON Students_Master(usin);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_name ON Students_Master(student_name);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_enrollments_lookup ON Student_Enrollments(academic_year_id, class_id, section_id);`);
}

module.exports = { version, name, up };