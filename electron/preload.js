const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script
 * 
 * Exposes a safe API to the renderer process via contextBridge.
 * The renderer accesses these methods through `window.api`.
 * 
 * Pattern: window.api.<domain>.<method>(args)
 * Each method returns: { success: boolean, data?: any, error?: string }
 */

contextBridge.exposeInMainWorld('api', {
  // ============ COMPANY PROFILE ============
  company: {
    get: () => ipcRenderer.invoke('company:get'),
    update: (data) => ipcRenderer.invoke('company:update', data),
  },

  // ============ FINANCIAL YEARS ============
  financialYear: {
    getAll: () => ipcRenderer.invoke('financialYear:getAll'),
    getActive: () => ipcRenderer.invoke('financialYear:getActive'),
    create: (data) => ipcRenderer.invoke('financialYear:create', data),
    update: (id, data) => ipcRenderer.invoke('financialYear:update', { id, data }),
    setActive: (id) => ipcRenderer.invoke('financialYear:setActive', id),
    delete: (id) => ipcRenderer.invoke('financialYear:delete', id),
  },

  // ============ CLASSES ============
  class: {
    getAll: () => ipcRenderer.invoke('class:getAll'),
    getById: (id) => ipcRenderer.invoke('class:getById', id),
    create: (data) => ipcRenderer.invoke('class:create', data),
    update: (id, data) => ipcRenderer.invoke('class:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('class:delete', id),
  },

  // ============ STUDENTS ============
  student: {
    getAll: (filters) => ipcRenderer.invoke('student:getAll', filters),
    getById: (id) => ipcRenderer.invoke('student:getById', id),
    getEnrollments: (studentId) => ipcRenderer.invoke('student:getEnrollments', studentId),
    getFeesSummaryByYear: (studentId) => ipcRenderer.invoke('student:getFeesSummaryByYear', studentId),
    generateUSIN: (academic_year_id, class_id) =>
      ipcRenderer.invoke('student:generateUSIN', { academic_year_id, class_id }),
    create: (data) => ipcRenderer.invoke('student:create', data),
    update: (id, data) => ipcRenderer.invoke('student:update', { id, data }),
    updateStatus: (id, status) => ipcRenderer.invoke('student:updateStatus', { id, status }),
    getStats: () => ipcRenderer.invoke('student:getStats'),
    getRecent: (limit) => ipcRenderer.invoke('student:getRecent', limit),
    savePhoto: (base64Data, fileName) =>
      ipcRenderer.invoke('student:savePhoto', { base64Data, fileName }),
    getPhoto: (photoPath) => ipcRenderer.invoke('student:getPhoto', photoPath),
    deletePhoto: (photoPath) => ipcRenderer.invoke('student:deletePhoto', photoPath),
    printPdf: (base64Pdf) => ipcRenderer.invoke('student:printPdf', { base64Pdf }),
  },

  // ============ PAYMENTS ============
  payment: {
    getByEnrollment: (enrollmentId) => ipcRenderer.invoke('payment:getByEnrollment', enrollmentId),
    create: (data) => ipcRenderer.invoke('payment:create', data),
    cancel: (id) => ipcRenderer.invoke('payment:cancel', id),
    getLedger: (enrollmentId) => ipcRenderer.invoke('payment:getLedger', enrollmentId),
    getStats: () => ipcRenderer.invoke('payment:getStats'),
    generateReceiptNo: () => ipcRenderer.invoke('payment:generateReceiptNo'),
  },

  attendance: {
    getByFilters: (payload) =>
      ipcRenderer.invoke("attendance:getByFilters", payload),
     saveBulk: (records) =>
      ipcRenderer.invoke("attendance:saveBulk", records),

     //Attendance Overview
     getMonthlyOverview: (data) =>
    ipcRenderer.invoke("attendance:getMonthlyOverview", data),
  },

    // ============ ATTENDANCE SETTINGS ============

  weekly: {
    getAll: () => ipcRenderer.invoke("weekly:getAll"),
    update: (data) => ipcRenderer.invoke("weekly:update", data),
  },

  holiday: {
    getAll: (yearId) => ipcRenderer.invoke("holiday:getAll", yearId),
    create: (data) => ipcRenderer.invoke("holiday:create", data),
    delete: (id) => ipcRenderer.invoke("holiday:delete", id),
    update: (id, data) => ipcRenderer.invoke("holiday:update", { id, data }),
  },

});
