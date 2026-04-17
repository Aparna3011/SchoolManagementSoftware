const { getDatabase } = require('../database/connection');

/**
 * Attendance Model
 *
 * Handles Attendance table operations
 */

const AttendanceModel = {
  /**
   * Get attendance by date
   * @param {string} date
   */
  getByDateAndClass(date, classId) {
  const db = getDatabase();

  return db.prepare(`
    SELECT a.*
    FROM Attendance a
    JOIN Student_Enrollments se ON se.id = a.enrollment_id
    WHERE a.attendance_date = ?
    AND se.class_id = ?
  `).all(date, classId);
},
  /**
   * Save or Update Attendance (Bulk)
   * @param {Array} records
   */
  saveBulk(records) {
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO Attendance (enrollment_id, attendance_date, status)
      VALUES (?, ?, ?)
      ON CONFLICT(enrollment_id, attendance_date)
      DO UPDATE SET
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((data) => {
      for (const r of data) {
        stmt.run(
          r.enrollment_id,
          r.attendance_date,
          r.status,
        );
      }
    });

    transaction(records);

    return { success: true };
  },
};

module.exports = AttendanceModel;
