const { getDatabase } = require('../database/connection');

/**
 * Company Profile Model
 * 
 * Data access layer for the Company_Profile table.
 * This is a singleton table (always id=1).
 */

const CompanyModel = {
  /**
   * Get the company profile.
   * @returns {Object} The company profile row.
   */
  get() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Company_Profile WHERE id = 1').get();
  },

  /**
   * Update the company profile.
   * @param {Object} data - Fields to update.
   * @returns {Object} The updated company profile.
   */
  update(data) {
    const db = getDatabase();
    const { firm_name, address, phone, email, logo_path, registration_no } = data;

    db.prepare(`
      UPDATE Company_Profile
      SET firm_name = COALESCE(?, firm_name),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          logo_path = COALESCE(?, logo_path),
          registration_no = COALESCE(?, registration_no),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(firm_name, address, phone, email, logo_path, registration_no);

    return this.get();
  },
};

module.exports = CompanyModel;
