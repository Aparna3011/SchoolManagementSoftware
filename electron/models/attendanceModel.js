const { getDatabase } = require("../database/connection");

const AttendanceModel = {
  // ✅ EXISTING (keep as it is)
  getStudentsByClass(classId) {
    const db = getDatabase();

    return db
      .prepare(
        `
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
    `,
      )
      .all(classId);
  },

  // 🔥 ADD THIS NEW FUNCTION
  getAttendanceWithStudents(date, classId, academicYearId) {
    const db = getDatabase();

    return db
      .prepare(
        `
      SELECT 
        se.id AS enrollment_id,
        se.roll_number,
        sm.usin,
        sm.student_name,
        a.status AS attendance_status,
        a.attendance_date AS attendance_date,
        sm.status AS student_status,
        a.status AS attendance_status
      FROM Student_Enrollments se
      JOIN Students_Master sm ON sm.id = se.student_id
      JOIN Academic_Years ay ON ay.id = se.academic_year_id

      left Outer JOIN Attendance a 
        ON a.enrollment_id = se.id
        AND a.attendance_date = ?

      WHERE se.class_id = ?
      AND se.academic_year_id = ?

      ORDER BY se.roll_number
    `,
      )
      .all(date, classId, academicYearId);
  },

  // ✅ EXISTING (keep as it is)
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
        stmt.run(r.enrollment_id, r.attendance_date, r.status);
      }
    });

    transaction(records);

    return { success: true };
  },

  // Attendance Overview

  getMonthlyOverview(classId, academicYearId, month) {
    const db = getDatabase();

    return db
      .prepare(
        `
    SELECT 
  se.id AS enrollment_id,
  sm.usin,
  sm.student_name,
  sm.status AS student_status,
  COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_days
FROM Student_Enrollments se
JOIN Students_Master sm ON sm.id = se.student_id
LEFT JOIN Attendance a 
  ON a.enrollment_id = se.id
  AND strftime('%Y-%m', a.attendance_date) = ?
WHERE se.class_id = ?
AND se.academic_year_id = ?
GROUP BY se.id;
  `,
      )
      .all(month, classId, academicYearId);
  },
};

module.exports = AttendanceModel;
