const AttendanceoverviewdetailsModel = require("../models/attendanceoverviewdetailsModel");
const { ipcMain } = require("electron");
//yearly overview handler can be added similarly
function registerAttendanceOverviewDetailsHandlers() {
  ipcMain.handle("attendanceoverviewDetails:getStudentFullDetails", async (_e, payload) => {
    try {
      const data = AttendanceoverviewdetailsModel.getStudentYearlyDetails(
        payload.enrollmentId,
      );

      return data; // ⚠️ NOT { success: true }
    } catch (err) {
      console.error(err);
      return null;
    }
  });
}

module.exports = { registerAttendanceOverviewDetailsHandlers };