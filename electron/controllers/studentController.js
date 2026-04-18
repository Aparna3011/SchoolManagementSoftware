const StudentModel = require('../models/studentModel');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const { pathToFileURL } = require('url');

/**
 * Student Controller
 * 
 * Registers IPC handlers for Student operations.
 * Includes photo handling (save to AppData).
 * Routes: student:getAll, student:getById, student:generateUSIN,
 *         student:create, student:update, student:getStats, student:getRecent,
 *         student:savePhoto, student:printPdf
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

function resolvePhotoPrefix(fileName = '') {
  const normalized = fileName.toLowerCase();

  if (normalized.startsWith('logo_secondary_')) {
    return 'logo_secondary_';
  }
  if (normalized.startsWith('logo_')) {
    return 'logo_';
  }
  if (normalized.startsWith('father_profile_')) {
    return 'father_profile_';
  }
  if (normalized.startsWith('mother_profile_')) {
    return 'mother_profile_';
  }
  if (normalized.startsWith('student_profile_')) {
    return 'student_profile_';
  }
  if (normalized.startsWith('father_govt_proof_')) {
    return 'father_govt_proof_';
  }
  if (normalized.startsWith('mother_govt_proof_')) {
    return 'mother_govt_proof_';
  }
  if (normalized.startsWith('birth_certificate_')) {
    return 'birth_certificate_';
  }

  return 'student_profile_';
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

  ipcMain.handle('student:getEnrollments', async (_event, studentId) => {
    try {
      const enrollments = StudentModel.getEnrollments(studentId);
      return { success: true, data: enrollments };
    } catch (error) {
      console.error('[StudentController] getEnrollments error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('student:getFeesSummaryByYear', async (_event, studentId) => {
    try {
      const summary = StudentModel.getFeesSummaryByYear(studentId);
      return { success: true, data: summary };
    } catch (error) {
      console.error('[StudentController] getFeesSummaryByYear error:', error);
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

  ipcMain.handle('student:updateStatus', async (_event, { id, status }) => {
    try {
      const updated = StudentModel.updateStatus(id, status);
      return { success: true, data: updated };
    } catch (error) {
      console.error('[StudentController] updateStatus error:', error);
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
      const prefix = resolvePhotoPrefix(fileName);
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

  /**
   * Print a PDF (base64) directly to the default printer.
   */
  ipcMain.handle('student:printPdf', async (_event, { base64Pdf }) => {
    let printWindow = null;
    let tempFilePath = null;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const withTimeout = (promise, ms, timeoutMessage) =>
      Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(timeoutMessage)), ms);
        }),
      ]);

    try {
      if (!base64Pdf) {
        throw new Error('No PDF data provided for printing.');
      }

      const tempDir = app.getPath('temp');
      tempFilePath = path.join(tempDir, `admission_${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, Buffer.from(base64Pdf, 'base64'));

      printWindow = new BrowserWindow({
        width: 1200,
        height: 1600,
        show: false,
        webPreferences: {
          plugins: true,
          sandbox: false,
        },
      });

      const fileUrl = pathToFileURL(tempFilePath).toString();
      await withTimeout(
        printWindow.loadURL(fileUrl),
        8000,
        'Timed out while loading PDF into print window.',
      );

      // Give Chromium PDF viewer time to fully rasterize the first page.
      await wait(1800);

      const printWithOptions = (silent) =>
        withTimeout(
          new Promise((resolve, reject) => {
            printWindow.webContents.print(
              { silent, printBackground: true },
              (success, failureReason) => {
                if (!success) {
                  reject(new Error(failureReason || 'Failed to print PDF.'));
                  return;
                }
                resolve(true);
              },
            );
          }),
          10000,
          silent
            ? 'Timed out while sending silent print job to default printer.'
            : 'Timed out while opening print dialog.',
        );

      try {
        await printWithOptions(true);
      } catch (silentError) {
        console.warn('[StudentController] Silent print failed, opening print dialog fallback:', silentError.message);
        if (!printWindow.isVisible()) {
          printWindow.show();
        }
        await printWithOptions(false);
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('[StudentController] printPdf error:', error);
      return { success: false, error: error.message };
    } finally {
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.close();
      }
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (_error) {
          // Best-effort temp file cleanup.
        }
      }
    }
  });
}

module.exports = { registerStudentHandlers };
