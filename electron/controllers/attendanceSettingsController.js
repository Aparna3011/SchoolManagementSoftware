const { ipcMain } = require("electron");
const AttendanceSettingsModel = require("../models/attendanceSettingsModel");

function registerAttendanceSettingsHandlers() {
  // ================= WEEKLY =================

  ipcMain.handle("weekly:getAll", async () => {
    try {
      const data = AttendanceSettingsModel.getWeekly();
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("weekly:update", async (_e, rows) => {
    try {
      return AttendanceSettingsModel.updateWeekly(rows);
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  // ================= HOLIDAYS =================

  ipcMain.handle("holiday:getAll", async (_e, academicYearId) => {
    try {
      const data = AttendanceSettingsModel.getHolidays(academicYearId);
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("holiday:create", async (_e, payload) => {
    try {
      return AttendanceSettingsModel.createHoliday(payload);
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  //to edit holiday

  ipcMain.handle("holiday:update", async (_e, { id, data }) => {
    try {
      return AttendanceSettingsModel.updateHoliday(id, data);
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  //to delete holiday

  ipcMain.handle("holiday:delete", async (_e, id) => {
    try {
      return AttendanceSettingsModel.deleteHoliday(id);
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  // 🔥 OPTIONAL (VERY USEFUL)
  ipcMain.handle("holiday:isHoliday", async (_e, { date, academicYearId }) => {
    try {
      const data = AttendanceSettingsModel.isHoliday(date, academicYearId);
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerAttendanceSettingsHandlers };
