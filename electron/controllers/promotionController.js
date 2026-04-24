const { ipcMain } = require('electron');
const PromotionModel = require('../models/promotionModel');

/**
 * Promotion Controller
 *
 * IPC handlers for student promotion.
 */

function registerPromotionHandlers() {
  ipcMain.handle('promotion:getStudentsForPromotion', async (event, filters) => {
    try {
      console.log('Promotion Controller - getStudentsForPromotion filters:', filters);
      if (!filters.classId || !filters.yearId) {
        console.error('Promotion Controller - Missing filters:', filters);
        throw new Error('Class and Academic Year are required.');
      }
      const students = PromotionModel.getStudentsForPromotion(filters.classId, filters.yearId);
      console.log(`Promotion Controller - Found ${students?.length || 0} students`);

      // Ensure we return a plain array of objects to avoid IPC serialization issues
      return students ? JSON.parse(JSON.stringify(students)) : [];
    } catch (error) {
      console.error('Error fetching students for promotion:', error);
      throw error;
    }
  });

  ipcMain.handle('promotion:getTargets', async (event, params) => {
    try {
      if (!params.currentClassId || !params.currentYearId) {
        throw new Error('Class and Academic Year are required.');
      }
      return PromotionModel.getTargets(params.currentClassId, params.currentYearId);
    } catch (error) {
      console.error('Error getting promotion targets:', error);
      throw error;
    }
  });

  ipcMain.handle('promotion:promoteBatch', async (event, payload) => {
    try {
      const result = PromotionModel.promoteBatch(payload);
      return {
        success: true,
        message: `Successfully promoted ${result.promotedCount} students.`,
        promotedCount: result.promotedCount
      };
    } catch (error) {
      console.error('Error promoting batch:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerPromotionHandlers };
