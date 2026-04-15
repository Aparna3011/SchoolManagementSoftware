const StudentModel = require('../models/studentModel');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Student Controller
 * 
 * Registers IPC handlers for Student operations.
 * Includes photo handling (save to AppData).
 * Routes: student:getAll, student:getById, student:generateUSIN,
 *         student:create, student:update, student:getStats, student:getRecent,
 *         student:savePhoto
 */

/**
 * Get the photos directory path in AppData.
 * Creates the directory if it doesn't exist.
 * @returns {string}
 */
function getPhotosDir() {
  const photosDir = path.join(app.getPath('userData'), 'Photos');
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }
  return photosDir;
}

function registerStudentHandlers() {
  ipcMain.handle('student:getAll', async (_event, filters) => {
    try {
      const students = StudentModel.getAll(filters);
      return { success: true, data: students };
    } catch (error) {
      console.error('[StudentController] getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:getById', async (_event, id) => {
    try {
      const student = StudentModel.getById(id);
      return { success: true, data: student };
    } catch (error) {
      console.error('[StudentController] getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:generateUSIN', async (_event, { academic_year_id, class_id }) => {
    try {
      const usin = StudentModel.generateUSIN(academic_year_id, class_id);
      return { success: true, data: usin };
    } catch (error) {
      console.error('[StudentController] generateUSIN error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:create', async (_event, data) => {
    try {
      const created = StudentModel.create(data);
      return { success: true, data: created };
    } catch (error) {
      console.error('[StudentController] create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:update', async (_event, { id, data }) => {
    try {
      const updated = StudentModel.update(id, data);
      return { success: true, data: updated };
    } catch (error) {
      console.error('[StudentController] update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:getStats', async () => {
    try {
      const stats = StudentModel.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[StudentController] getStats error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:getRecent', async (_event, limit) => {
    try {
      const recent = StudentModel.getRecent(limit);
      return { success: true, data: recent };
    } catch (error) {
      console.error('[StudentController] getRecent error:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Save a photo (base64 encoded) to the AppData/Photos directory.
   * Returns the saved file path.
   */
  ipcMain.handle('student:savePhoto', async (_event, { base64Data, fileName }) => {
    try {
      const photosDir = getPhotosDir();
      const ext = path.extname(fileName) || '.jpg';
      const isLogo = fileName && fileName.startsWith('logo_');
      const prefix = isLogo ? 'logo_' : 'student_';
      const safeName = `${prefix}${Date.now()}${ext}`;
      const filePath = path.join(photosDir, safeName);

      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');

      fs.writeFileSync(filePath, buffer);

      return { success: true, data: filePath };
    } catch (error) {
      console.error('[StudentController] savePhoto error:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Read a photo from the file system and return as base64.
   */
  ipcMain.handle('student:getPhoto', async (_event, photoPath) => {
    try {
      if (!photoPath || !fs.existsSync(photoPath)) {
        return { success: true, data: null };
      }
      const buffer = fs.readFileSync(photoPath);
      const base64 = buffer.toString('base64');
      const ext = path.extname(photoPath).slice(1) || 'jpg';
      return { success: true, data: `data:image/${ext};base64,${base64}` };
    } catch (error) {
      console.error('[StudentController] getPhoto error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerStudentHandlers };
