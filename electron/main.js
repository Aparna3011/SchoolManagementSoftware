const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { getDatabase, closeDatabase } = require("./database/connection");
const { runMigrations } = require("./database/migrations/runner");

// Controllers
const { registerCompanyHandlers } = require("./controllers/companyController");
const {
  registerFinancialYearHandlers,
} = require("./controllers/financialYearController");
const { registerClassHandlers } = require("./controllers/classController");
const { registerStudentHandlers } = require("./controllers/studentController");
const { registerPaymentHandlers } = require("./controllers/paymentController");

let mainWindow = null;

/**
 * Initialize the database and run pending migrations.
 */
function initializeDatabase() {
  const db = getDatabase();
  runMigrations(db);
  console.log("[Main] Database initialized.");
}

/**
 * Create the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "School Management System",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Load Vite dev server in development, dist/index.html in production
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Show window when ready to prevent white flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Register all IPC handlers from controllers.
 */
function registerAllHandlers() {
  registerCompanyHandlers();
  registerFinancialYearHandlers();
  registerClassHandlers();
  registerStudentHandlers();
  registerPaymentHandlers();
  console.log("[Main] All IPC handlers registered.");
}

// ============ APP LIFECYCLE ============

app.whenReady().then(() => {
  initializeDatabase();
  registerAllHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  closeDatabase();
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
