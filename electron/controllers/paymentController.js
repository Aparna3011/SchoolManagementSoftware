const PaymentModel = require('../models/paymentModel');
const { ipcMain } = require('electron');

/**
 * Payment Controller
 * 
 * Registers IPC handlers for Payment operations.
 * Routes: payment:getByStudent, payment:create, payment:cancel,
 *         payment:getLedger, payment:getStats, payment:generateInvoiceNo
 */

function registerPaymentHandlers() {
  ipcMain.handle('payment:getByStudent', async (_event, studentId) => {
    try {
      const payments = PaymentModel.getByStudent(studentId);
      return { success: true, data: payments };
    } catch (error) {
      console.error('[PaymentController] getByStudent error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:create', async (_event, data) => {
    try {
      const created = PaymentModel.create(data);
      return { success: true, data: created };
    } catch (error) {
      console.error('[PaymentController] create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:cancel', async (_event, id) => {
    try {
      const cancelled = PaymentModel.cancel(id);
      return { success: true, data: cancelled };
    } catch (error) {
      console.error('[PaymentController] cancel error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:getLedger', async (_event, studentId) => {
    try {
      const ledger = PaymentModel.getLedger(studentId);
      return { success: true, data: ledger };
    } catch (error) {
      console.error('[PaymentController] getLedger error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:getStats', async () => {
    try {
      const stats = PaymentModel.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[PaymentController] getStats error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:generateInvoiceNo', async () => {
    try {
      const invoiceNo = PaymentModel.generateInvoiceNo();
      return { success: true, data: invoiceNo };
    } catch (error) {
      console.error('[PaymentController] generateInvoiceNo error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerPaymentHandlers };
