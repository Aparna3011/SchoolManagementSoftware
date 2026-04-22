const { getDatabase } = require("../database/connection");
function isHolidayDate(dateStr, holidays) {
  return holidays.some((h) => {
    const start = String(h.start_date).slice(0, 10);
    const end = String(h.end_date).slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });
}
//attendance overview details yearly overview
const AttendanceoverviewdetailsModel = {
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

    // ✅ FIXED DATES (NO TIMEZONE SHIFT)
    const start = new Date(student.start_date);
    const academicEnd = new Date(student.end_date);

    // ✅ FINAL RANGE
    // const end = new Date(Math.min(today, academicEnd));

    // =========================
    // ✅ 1. FULL YEAR CALENDAR
    // =========================
    // FULL YEAR CALENDAR
    let calDate = new Date(start);

    while (calDate <= academicEnd) {
      const dateStr = calDate.toISOString().slice(0, 10); // ✅ FIXED
      const day = calDate.getDay();

      const isHoliday = isHolidayDate(dateStr, holidays);
      const isWeeklyOff = weeklyOffs.includes(day);

      if (isWeeklyOff) {
        calendar[dateStr] = "W";
      } else if (isHoliday) {
        calendar[dateStr] = "H";
        holidayCount++; // ✅ full year holidays
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
      const dateStr = calcDate.toISOString().slice(0, 10); // ✅ FIXED
      const day = calcDate.getDay();

      const isHoliday = isHolidayDate(dateStr, holidays);
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

module.exports = AttendanceoverviewdetailsModel;
