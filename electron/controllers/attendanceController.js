const AttendanceModel = require("../models/attendanceModel");
const { ipcMain } = require("electron");

function registerAttendanceHandlers() {
  ipcMain.handle(
    "attendance:getByFilters",
    async (_event, { date, classId }) => {
      try {
        const data = AttendanceModel.getAttendance(date, classId);
        return { success: true, data };
      } catch (error) {
        console.error("[AttendanceController] get error:", error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("attendance:saveBulk", async (_event, records) => {
    try {
      AttendanceModel.saveBulk(records);

      return { success: true }; // ✅ MUST RETURN
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAttendanceHandlers };
