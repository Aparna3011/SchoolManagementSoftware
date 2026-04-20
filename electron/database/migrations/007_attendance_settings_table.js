/**
 * Migration 003: Add father and mother Aadhaar number fields
 */

const version = 7;
const name = "attendance_settings_table_fields";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // ==========================================
  // 7. ATTENDANCE SETTINGS
  // ==========================================

  // EXISTING TABLES ABOVE...
  // Weekly_Schedule will hold the working days of the week for attendance purposes.

  db.exec(`
  CREATE TABLE IF NOT EXISTS Weekly_Schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER UNIQUE,              -- 0=Sunday, 1=Monday, ..., 6=Saturday
  day_name TEXT UNIQUE,              -- Monday, Tuesday...
  is_working INTEGER DEFAULT 1       -- 1 = working, 0 = holiday
  );
`);

  //Holiday_Calendar will store specific dates that are holidays, even if they fall on a working day.
  db.exec(`
  CREATE TABLE IF NOT EXISTS Holiday_Calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id INTEGER,       
  name TEXT DEFAULT '',

  start_date DATE NOT NULL,       -- Holiday start
  end_date DATE NOT NULL,         -- Holiday end

  description TEXT DEFAULT '',


  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (academic_year_id) REFERENCES Academic_Years(id)
);
`);
  db.exec(`
 INSERT INTO Weekly_Schedule (day_of_week, day_name, is_working)
 VALUES 
 (0, 'Sunday', 0),
  (1, 'Monday', 1),
   (2, 'Tuesday', 1),
    (3, 'Wednesday', 1),
     (4, 'Thursday', 1),
      (5, 'Friday', 1),
       (6, 'Saturday', 0);
`);
}

module.exports = { version, name, up };
