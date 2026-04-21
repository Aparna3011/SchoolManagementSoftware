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
  //attendance overview details monthly overview

  getMonthlyOverview(classId, academicYearId, month) {
    const db = getDatabase();

    // 🔹 Students
    const students = db
      .prepare(
        `
    SELECT 
      se.id AS enrollment_id,
      sm.usin,
      sm.student_name,
      sm.status AS student_status
    FROM Student_Enrollments se
    JOIN Students_Master sm ON sm.id = se.student_id
    WHERE se.class_id = ?
    AND se.academic_year_id = ?
  `,
      )
      .all(classId, academicYearId);

    // 🔹 Attendance
    const attendance = db
      .prepare(
        `
    SELECT enrollment_id, attendance_date, status
    FROM Attendance
    WHERE strftime('%Y-%m', attendance_date) = ?
  `,
      )
      .all(month);

    // 🔹 Holidays (RANGE BASED ✅)
    const holidays = db
      .prepare(
        `
    SELECT start_date, end_date
    FROM Holiday_Calendar
    WHERE academic_year_id = ?
  `,
      )
      .all(academicYearId);

    // 🔹 Weekly OFF days (is_working = 0 ✅)
    const weeklyOffs = db
      .prepare(
        `
    SELECT day_of_week 
    FROM Weekly_Schedule 
    WHERE is_working = 0
  `,
      )
      .all()
      .map((d) => Number(d.day_of_week));

    // 🔹 Month range
    const [year, m] = month.split("-");
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0);

    let workingDays = 0;

    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10);
      const day = current.getDay();

      // ✅ Holiday RANGE check
      const isHoliday = holidays.some(
        (h) => dateStr >= h.start_date && dateStr <= h.end_date,
      );

      const isWeeklyOff = weeklyOffs.includes(day);

      if (!isHoliday && !isWeeklyOff) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    // 🔥 Final result
    return students.map((s) => {
      const studentAttendance = attendance.filter(
        (a) => a.enrollment_id === s.enrollment_id,
      );

      const present_days = studentAttendance.filter(
        (a) => a.status === "Present",
      ).length;

      const percentage = workingDays
        ? ((present_days / workingDays) * 100).toFixed(2)
        : 0;

      return {
        ...s,
        present_days,
        working_days: workingDays,
        attendance_percentage: percentage,
      };
    });
  },

  //attendance overview details yearly overview

  getStudentYearlyDetails(enrollmentId) {
    const db = getDatabase();

    // 🔹 Student Info
    const student = db
      .prepare(
        `
    SELECT 
      se.id,
      se.class_id,
      sm.student_name,
      sm.usin,
      sm.status,
      cm.class_name,
      ay.start_date,
      ay.end_date,
      ay.id as academic_year_id
    FROM Student_Enrollments se
    JOIN Students_Master sm ON sm.id = se.student_id
    JOIN Academic_Years ay ON ay.id = se.academic_year_id
    JOIN Classes_Master cm ON cm.id = se.class_id  
    WHERE se.id = ?
  `,
      )
      .get(enrollmentId);

    // 🔹 Attendance (till today only)
    const attendance = db
      .prepare(
        `
    SELECT attendance_date, status
    FROM Attendance
    WHERE enrollment_id = ?
    AND attendance_date <= date('now')
  `,
      )
      .all(enrollmentId);

    // 🔹 Holidays (full year)
    const holidays = db
      .prepare(
        `
    SELECT start_date, end_date
    FROM Holiday_Calendar
    WHERE academic_year_id = ?
  `,
      )
      .all(student.academic_year_id);

    // 🔹 Weekly Off
    const weeklyOffs = db
      .prepare(
        `
    SELECT day_of_week FROM Weekly_Schedule
    WHERE is_working = 0
  `,
      )
      .all()
      .map((d) => Number(d.day_of_week));

    // 🔥 FAST LOOKUP
    const attendanceMap = {};
    attendance.forEach((a) => {
      attendanceMap[a.attendance_date] = a.status;
    });

    let present = 0;
    let absent = 0;
    let workingDays = 0;
    let holidayCount = 0;

    const calendar = {};

    const today = new Date();
    const academicEnd = new Date(student.end_date);
    const start = new Date(student.start_date);

    // =========================
    // ✅ 1. FULL YEAR CALENDAR
    // =========================
    // FULL YEAR CALENDAR
    let calDate = new Date(start);

    while (calDate <= academicEnd) {
      const dateStr = calDate.toLocaleDateString("en-CA");
      const day = calDate.getDay();

      const isHoliday = holidays.some(
        (h) => dateStr >= h.start_date && dateStr <= h.end_date,
      );

      const isWeeklyOff = weeklyOffs.includes(day);

      if (isWeeklyOff) {
        calendar[dateStr] = "W";
      } else if (isHoliday) {
        calendar[dateStr] = "H";
        holidayCount++;
      } else {
        calendar[dateStr] = "WD";
      }

      calDate.setDate(calDate.getDate() + 1);
    }

    // =========================
    // ✅ 2. CALCULATION (till today only)
    // =========================
    const end = today < academicEnd ? today : academicEnd;

    let calcDate = new Date(start);

    while (calcDate <= end) {
      const dateStr = calcDate.toLocaleDateString("en-CA"); // ✅ FIXED
      const day = calcDate.getDay();

      const isHoliday = holidays.some(
        (h) => dateStr >= h.start_date && dateStr <= h.end_date,
      );

      const isWeeklyOff = weeklyOffs.includes(day);

      if (!isHoliday && !isWeeklyOff) {
        workingDays++;

        const status = attendanceMap[dateStr];

        if (status === "Present") {
          present++;
          calendar[dateStr] = "P"; // override
        } else if (status === "Absent") {
          absent++;
          calendar[dateStr] = "A"; // override
        } else {
          calendar[dateStr] = "WD";
        }
      }

      calcDate.setDate(calcDate.getDate() + 1);
    }

    // =========================
    // ✅ 3. PERCENTAGE
    // =========================
    const percentage = workingDays
      ? Math.round((present / workingDays) * 100)
      : 0;

    return {
      student,
      summary: {
        present,
        absent,
        holidays: holidayCount, // full year
        workingDays, // till today
        percentage,
      },
      weeklyOffs,
      calendar, // full year calendar
    };
  },
};

module.exports = AttendanceModel;
