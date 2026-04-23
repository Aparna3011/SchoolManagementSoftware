const ClassModel = require('../models/classModel');
const { ipcMain } = require('electron');

/**
 * Class Controller
 * 
 * Registers IPC handlers for Classes_Master operations.
 * Routes: class:getAll, class:getById, class:create, class:update, class:delete
 */

function registerClassHandlers() {
  ipcMain.handle('class:getAll', async () => {
    try {
      const classes = ClassModel.getAll();
      return { success: true, data: classes };
    } catch (error) {
      console.error('[ClassController] getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('class:getUnassignedNextClasses', async () => {
    try {
      const classes = ClassModel.getUnassignedNextClasses();
      return { success: true, data: classes };
    } catch (error) {
      console.error('[ClassController] getUnassignedNextClasses error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('class:getById', async (_event, id) => {
    try {
      const classItem = ClassModel.getById(id);
      return { success: true, data: classItem };
    } catch (error) {
      console.error('[ClassController] getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('class:create', async (_event, data) => {
    try {
      const created = ClassModel.create(data);
      return { success: true, data: created };
    } catch (error) {
      console.error('[ClassController] create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('class:update', async (_event, { id, data }) => {
    try {
      const updated = ClassModel.update(id, data);
      return { success: true, data: updated };
    } catch (error) {
      console.error('[ClassController] update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('class:delete', async (_event, id) => {
    try {
      const result = ClassModel.delete(id);
      return result;
    } catch (error) {
      console.error('[ClassController] delete error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerClassHandlers };
