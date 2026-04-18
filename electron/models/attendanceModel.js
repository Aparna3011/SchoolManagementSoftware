const { getDatabase } = require('../database/connection');

const AttendanceModel = {
  getStudentsByClass(classId) {
    const db = getDatabase();

    return db.prepare(`
      SELECT 
        se.id AS enrollment_id,
        se.roll_number,
        sm.student_name
      FROM Student_Enrollments se
      JOIN Students_Master sm ON sm.id = se.student_id
      JOIN Academic_Years ay ON ay.id = se.academic_year_id
      WHERE se.class_id = ?
      AND ay.is_active = 1
      ORDER BY se.roll_number
      LIMIT 50
    `).all(classId);
  },

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