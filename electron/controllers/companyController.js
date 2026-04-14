const CompanyModel = require('../models/companyModel');
const { ipcMain } = require('electron');

/**
 * Company Controller
 * 
 * Registers IPC handlers for Company Profile operations.
 * Routes: company:get, company:update
 */

function registerCompanyHandlers() {
  ipcMain.handle('company:get', async () => {
    try {
      const profile = CompanyModel.get();
      return { success: true, data: profile };
    } catch (error) {
      console.error('[CompanyController] get error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('company:update', async (_event, data) => {
    try {
      const updated = CompanyModel.update(data);
      return { success: true, data: updated };
    } catch (error) {
      console.error('[CompanyController] update error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerCompanyHandlers };
