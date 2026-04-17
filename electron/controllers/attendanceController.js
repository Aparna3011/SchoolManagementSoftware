const AttendanceModel = require('../models/attendanceModel');
const { ipcMain } = require('electron');

function registerAttendanceHandlers() {
  ipcMain.handle('attendance:getByDate', async (_event, date) => {
    try {
      const data = AttendanceModel.getByDate(date);
      return { success: true, data };
    } catch (error) {
      console.error('[AttendanceController] get error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('attendance:saveBulk', async (_event, records) => {
    try {
      AttendanceModel.saveBulk(records);
      return { success: true };
    } catch (error) {
      console.error('[AttendanceController] save error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAttendanceHandlers };
