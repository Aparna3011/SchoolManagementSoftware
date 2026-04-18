/**
 * Migration 003: Add father and mother Aadhaar number fields
 */

const version = 4;
const name = 'Added-the-attendence-note-field';

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  
  // ==========================================
  // 4. ATTENDANCE
  // ==========================================

  // EXISTING TABLES ABOVE...

 db.exec(`
 CREATE TABLE IF NOT EXISTS Attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  enrollment_id INTEGER NOT NULL,

  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,

  status TEXT DEFAULT 'Present'
    CHECK(status IN ('Present','Absent')),

  note TEXT DEFAULT '',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(enrollment_id)
    REFERENCES Student_Enrollments(id)
    ON DELETE CASCADE,

  UNIQUE(enrollment_id, attendance_date)
);
`);
}

module.exports = { version, name, up };

