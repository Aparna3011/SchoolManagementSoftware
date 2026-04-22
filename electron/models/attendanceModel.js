const { getDatabase } = require("../database/connection");

function isHolidayDate(dateStr, holidays) {
  return holidays.some((h) => {
    const start = String(h.start_date).slice(0, 10);
    const end = String(h.end_date).slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });
}

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

    // =========================
    // 🔹 Students
    // =========================
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

    // =========================
    // 🔹 Attendance (RAW)
    // =========================
    const attendanceRaw = db
      .prepare(
        `
    SELECT id, enrollment_id, attendance_date, status
    FROM Attendance
    WHERE strftime('%Y-%m', attendance_date) = ?
  `,
      )
      .all(month);

    // =========================
    // 🔥 REMOVE DUPLICATES
    // =========================
    const attendanceMap = {};

    attendanceRaw.forEach((a) => {
      const key = `${a.enrollment_id}_${a.attendance_date}`;
      if (!attendanceMap[key] || a.id > attendanceMap[key].id) {
        attendanceMap[key] = a;
      }
    });

    const attendanceLookup = {};
    Object.values(attendanceMap).forEach((a) => {
      attendanceLookup[`${a.enrollment_id}_${a.attendance_date}`] = a.status;
    });

    // =========================
    // 🔹 Holidays
    // =========================
    const holidays = db
      .prepare(
        `
    SELECT start_date, end_date
    FROM Holiday_Calendar
    WHERE academic_year_id = ?
  `,
      )
      .all(academicYearId);

    // =========================
    // 🔹 Weekly OFF
    // =========================
    const weeklyOffs = db
      .prepare(
        `
    SELECT day_of_week FROM Weekly_Schedule
    WHERE is_working = 0
  `,
      )
      .all()
      .map((d) => Number(d.day_of_week));

    // =========================
    // 🔹 Academic Year
    // =========================
    const academic = db
      .prepare(
        `
    SELECT start_date, end_date
    FROM Academic_Years
    WHERE id = ?
  `,
      )
      .get(academicYearId);

    const [year, m] = month.split("-");

    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 0);

    const academicStart = new Date(academic.start_date + "T00:00:00");
    const academicEnd = new Date(academic.end_date + "T23:59:59");

    const today = new Date();

    // ✅ CORRECT RANGES
    const start = new Date(Math.max(monthStart, academicStart));
    const fullEnd = new Date(Math.min(monthEnd, academicEnd)); // full month range
    const calcEnd = new Date(Math.min(fullEnd, today)); // till today

    // =========================
    // 🔹 TOTAL DAYS
    // =========================
    const totalDays = Math.floor((fullEnd - start) / (1000 * 60 * 60 * 24)) + 1;

    // =========================
    // 🔹 HOLIDAYS (FULL MONTH)
    // =========================
    let holidayCount = 0;
    let hDate = new Date(start);

    while (hDate <= fullEnd) {
      const dateStr = hDate.toLocaleDateString("en-CA");
      const day = hDate.getDay();

     const isHoliday = isHolidayDate(dateStr, holidays);

      const isWeeklyOff = weeklyOffs.includes(day);

      if (isHoliday && !isWeeklyOff) {
        holidayCount++;
      }

      hDate.setDate(hDate.getDate() + 1);
    }

    // =========================
    // 🔥 FINAL RESULT
    // =========================
    return students.map((s) => {
      let workingDays = 0;
      let present = 0;
      let absent = 0;

      let current = new Date(start);

      while (current <= calcEnd) {
        const dateStr = current.toLocaleDateString("en-CA");
        const day = current.getDay();

       const isHoliday = isHolidayDate(dateStr, holidays);

        const isWeeklyOff = weeklyOffs.includes(day);

        if (!isHoliday && !isWeeklyOff) {
          workingDays++;

          const key = `${s.enrollment_id}_${dateStr}`;
          const status = attendanceLookup[key];

          if (status === "Present") present++;
          else if (status === "Absent") absent++;
        }

        current.setDate(current.getDate() + 1);
      }

      const percentage = workingDays
        ? Math.round((present / workingDays) * 100)
        : 0;

      return {
        ...s,
        total_days: totalDays,
        working_days: workingDays,
        present_days: present,
        absent_days: absent,
        holidays: holidayCount,
        attendance_percentage: percentage,
      };
    });
  },
  //attendance overview details yearly overview

//   getStudentYearlyDetails(enrollmentId) {
//     const db = getDatabase();

//     // 🔹 Student Info
//     const student = db
//       .prepare(
//         `
//     SELECT 
//       se.id,
//       se.class_id,
//       sm.student_name,
//       sm.usin,
//       sm.status,
//       cm.class_name,
//       ay.start_date,
//       ay.end_date,
//       ay.id as academic_year_id
//     FROM Student_Enrollments se
//     JOIN Students_Master sm ON sm.id = se.student_id
//     JOIN Academic_Years ay ON ay.id = se.academic_year_id
//     JOIN Classes_Master cm ON cm.id = se.class_id  
//     WHERE se.id = ?
//   `,
//       )
//       .get(enrollmentId);

//     // 🔹 Attendance (till today only)
//     const attendance = db
//       .prepare(
//         `
//     SELECT attendance_date, status
//     FROM Attendance
//     WHERE enrollment_id = ?
//     AND attendance_date <= date('now')
//   `,
//       )
//       .all(enrollmentId);

//     // 🔹 Holidays (full year)
//     const holidays = db
//       .prepare(
//         `
//     SELECT start_date, end_date
//     FROM Holiday_Calendar
//     WHERE academic_year_id = ?
//   `,
//       )
//       .all(student.academic_year_id);

//     // 🔹 Weekly Off
//     const weeklyOffs = db
//       .prepare(
//         `
//     SELECT day_of_week FROM Weekly_Schedule
//     WHERE is_working = 0
//   `,
//       )
//       .all()
//       .map((d) => Number(d.day_of_week));

//     // 🔥 FAST LOOKUP
//     const attendanceMap = {};
//     attendance.forEach((a) => {
//       attendanceMap[a.attendance_date] = a.status;
//     });

//     let present = 0;
//     let absent = 0;
//     let workingDays = 0;
//     let holidayCount = 0;

//     const calendar = {};

//     const today = new Date();
//     const academicEnd = new Date(student.end_date);
//     const start = new Date(student.start_date);

//     // =========================
//     // ✅ 1. FULL YEAR CALENDAR
//     // =========================
//     // FULL YEAR CALENDAR
//     let calDate = new Date(start);

//     while (calDate <= academicEnd) {
//       const dateStr = calDate.toLocaleDateString("en-CA");
//       const day = calDate.getDay();

//       const isHoliday = isHolidayDate(dateStr, holidays);

//       const isWeeklyOff = weeklyOffs.includes(day);

//       if (isWeeklyOff) {
//         calendar[dateStr] = "W";
//       } else if (isHoliday) {
//         calendar[dateStr] = "H";
//         holidayCount++;
//       } else {
//         calendar[dateStr] = "WD";
//       }

//       calDate.setDate(calDate.getDate() + 1);
//     }

//     // =========================
//     // ✅ 2. CALCULATION (till today only)
//     // =========================
//     const end = today < academicEnd ? today : academicEnd;

//     let calcDate = new Date(start);

//     while (calcDate <= end) {
//       const dateStr = calcDate.toLocaleDateString("en-CA"); // ✅ FIXED
//       const day = calcDate.getDay();

// const isHoliday = isHolidayDate(dateStr, holidays);
//       const isWeeklyOff = weeklyOffs.includes(day);

//       if (!isHoliday && !isWeeklyOff) {
//         workingDays++;

//         const status = attendanceMap[dateStr];

//         if (status === "Present") {
//           present++;
//           calendar[dateStr] = "P"; // override
//         } else if (status === "Absent") {
//           absent++;
//           calendar[dateStr] = "A"; // override
//         } else {
//           calendar[dateStr] = "WD";
//         }
//       }

//       calcDate.setDate(calcDate.getDate() + 1);
//     }

//     // =========================
//     // ✅ 3. PERCENTAGE
//     // =========================
//     const percentage = workingDays
//       ? Math.round((present / workingDays) * 100)
//       : 0;

//     return {
//       student,
//       summary: {
//         present,
//         absent,
//         holidays: holidayCount, // full year
//         workingDays, // till today
//         percentage,
//       },
//       weeklyOffs,
//       calendar, // full year calendar
//     };
//   },
};

module.exports = AttendanceModel;
