const AttendanceModel = require("../models/attendanceModel");
const { ipcMain } = require("electron");

function registerAttendanceHandlers() {
  ipcMain.handle(
    "attendance:getByFilters",
    async (_event, { date,  classId, academicYearId, }) => { //academic year add 
      try {
        const data = AttendanceModel.getAttendanceWithStudents(
          date, 
          //academic year add
          classId,
          academicYearId
        );
        // console.log("Data from Model:", data);

         console.log("DB DATA:", data);
        return { success: true, data };
      } catch (error) {
        console.error("[AttendanceController] get error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("attendance:saveBulk", async (_event, records) => {
    try {
      AttendanceModel.saveBulk(records);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAttendanceHandlers };