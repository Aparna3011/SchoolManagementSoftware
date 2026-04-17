const FinancialYearModel = require('../models/financialYearModel');
const { ipcMain } = require('electron');

/**
 * Academic Year Controller
 *
 * Registers IPC handlers for Academic Year operations.
 * Routes: financialYear:getAll, financialYear:getActive, financialYear:create,
 *         financialYear:update, financialYear:setActive, financialYear:delete
 */

function registerFinancialYearHandlers() {
  ipcMain.handle('financialYear:getAll', async () => {
    try {
      const years = FinancialYearModel.getAll();
      return { success: true, data: years };
    } catch (error) {
      console.error('[FinancialYearController] getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('financialYear:getActive', async () => {
    try {
      const year = FinancialYearModel.getActive();
      return { success: true, data: year };
    } catch (error) {
      console.error('[FinancialYearController] getActive error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('financialYear:create', async (_event, data) => {
    try {
      const created = FinancialYearModel.create(data);
      return { success: true, data: created };
    } catch (error) {
      console.error('[FinancialYearController] create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('financialYear:update', async (_event, { id, data }) => {
    try {
      const updated = FinancialYearModel.update(id, data);
      return { success: true, data: updated };
    } catch (error) {
      console.error('[FinancialYearController] update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('financialYear:setActive', async (_event, id) => {
    try {
      const activated = FinancialYearModel.setActive(id);
      return { success: true, data: activated };
    } catch (error) {
      console.error('[FinancialYearController] setActive error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('financialYear:delete', async (_event, id) => {
    try {
      const result = FinancialYearModel.delete(id);
      return result;
    } catch (error) {
      console.error('[FinancialYearController] delete error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerFinancialYearHandlers };
