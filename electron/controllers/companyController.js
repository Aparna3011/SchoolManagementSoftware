const CompanyModel = require("../models/companyModel");
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Company Controller
 *
 * Registers IPC handlers for Company Profile operations.
 * Routes: company:get, company:update
 */

function filePathToDataUrl(photoPath) {
  try {
    if (!photoPath || !fs.existsSync(photoPath)) {
      return null;
    }

    const buffer = fs.readFileSync(photoPath);
    const base64 = buffer.toString("base64");

    const extRaw = path.extname(photoPath).slice(1).toLowerCase();
    const mimeByExt = {
      jpg: "jpeg",
      jpeg: "jpeg",
      png: "png",
      webp: "webp",
      gif: "gif",
      bmp: "bmp",
      svg: "svg+xml",
    };

    const mime = mimeByExt[extRaw] || "jpeg";
    return `data:image/${mime};base64,${base64}`;
  } catch (error) {
    console.error("[CompanyController] filePathToDataUrl error:", error);
    return null;
  }
}

function attachLogoBase64(profile) {
  if (!profile) return profile;

  return {
    ...profile,
    logo_base64_primary: filePathToDataUrl(profile.logo_path),
    logo_base64_secondary: filePathToDataUrl(profile.logo_path_secondary),
  };
}

function registerCompanyHandlers() {
  ipcMain.handle("company:get", async () => {
    try {
      const profile = CompanyModel.get();
      return { success: true, data: attachLogoBase64(profile) };
    } catch (error) {
      console.error("[CompanyController] get error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("company:update", async (_event, data) => {
    try {
      const updated = CompanyModel.update(data);
      return { success: true, data: attachLogoBase64(updated) };
    } catch (error) {
      console.error("[CompanyController] update error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerCompanyHandlers };
