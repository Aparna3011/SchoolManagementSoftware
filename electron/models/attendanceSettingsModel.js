const { getDatabase } = require("../database/connection");

const AttendanceSettingsModel = {
  // ================= WEEKLY =================

  getWeekly() {
    const db = getDatabase();
    return db.prepare(`SELECT * FROM Weekly_Schedule`).all();
  },

  updateWeekly(rows) {
    const db = getDatabase();

    const stmt = db.prepare(`
      UPDATE Weekly_Schedule
      SET is_working = ?
      WHERE id = ?
    `);

    const trx = db.transaction((data) => {
      data.forEach((r) => stmt.run(r.is_working, r.id));
    });

    trx(rows);

    return { success: true };
  },

  // ================= HOLIDAYS =================

  getHolidays(academicYearId) {
    const db = getDatabase();

    return db
      .prepare(
        `
      SELECT *
      FROM Holiday_Calendar
      WHERE academic_year_id = ?
      ORDER BY start_date
    `,
      )
      .all(academicYearId);
  },
  createHoliday(data) {
    const db = getDatabase();

    const result = db
      .prepare(
        `
    INSERT INTO Holiday_Calendar 
    (start_date, end_date, name, description, academic_year_id)
    VALUES (?, ?, ?, ?, ?)
  `,
      )
      .run(
        data.start_date,
        data.end_date,
        data.name || "",
        data.description || "",
        data.academicYearId,
      );

    return {
      success: result.changes > 0,
      id: result.lastInsertRowid,
    };
  },

  updateHoliday(id, data) {
    const db = getDatabase();

    if (!id) {
      throw new Error("Holiday ID is required");
    }

    const result = db
      .prepare(
        `
    UPDATE Holiday_Calendar
    SET 
      start_date = ?,
      end_date = ?,
      name = ?,
      description = ?
    WHERE id = ?
  `,
      )
      .run(
        data.start_date,
        data.end_date,
        data.name || "",
        data.description || "",
        id,
      );

    return {
      success: result.changes > 0,
      data: result, // ✅ important
    };
  },

  deleteHoliday(id) {
    const db = getDatabase();

    db.prepare(
      `
      DELETE FROM Holiday_Calendar
      WHERE id = ?
    `,
    ).run(id);

    return { success: true };
  },

  // 🔥 IMPORTANT (FOR ATTENDANCE LOGIC)
  isHoliday(date, academicYearId) {
    const db = getDatabase();

    return db
      .prepare(
        `
      SELECT *
      FROM Holiday_Calendar
      WHERE ? BETWEEN start_date AND end_date
      AND academic_year_id = ?
    `,
      )
      .get(date, academicYearId);
  },
};

module.exports = AttendanceSettingsModel;
