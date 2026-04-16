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
    const {
      school_code,
      group_name,
      firm_name,
      tagline,
      address,
      phone,
      email,
      website,
      gstin,
      udise_no,
      reg_no,
      logo_path,
      logo_path_secondary,
    } = data;

    db.prepare(`
      UPDATE Company_Profile
      SET school_code = COALESCE(?, school_code),
          group_name = COALESCE(?, group_name),
          firm_name = COALESCE(?, firm_name),
          tagline = COALESCE(?, tagline),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          website = COALESCE(?, website),
          gstin = COALESCE(?, gstin),
          udise_no = COALESCE(?, udise_no),
          reg_no = COALESCE(?, reg_no),
          logo_path = COALESCE(?, logo_path),
          logo_path_secondary = COALESCE(?, logo_path_secondary),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      school_code,
      group_name,
      firm_name,
      tagline,
      address,
      phone,
      email,
      website,
      gstin,
      udise_no,
      reg_no,
      logo_path,
      logo_path_secondary,
    );

    return this.get();
  },
};

module.exports = CompanyModel;
