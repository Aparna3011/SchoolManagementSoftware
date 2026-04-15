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
  firm_name,
  group_name,
  school_name,
  branch_name,
  address,
  city,
  state,
  pincode,
  country,
  phone,
  alt_phone,
  email,
  website,
  registration_no,
  udise_no,
  affiliation_no,
  gstin,
  principal_name,
  contact_person,
  tagline,
  logo_path
} = data;

    db.prepare(`
  UPDATE Company_Profile
  SET firm_name = COALESCE(?, firm_name),
      group_name = COALESCE(?, group_name),
      school_name = COALESCE(?, school_name),
      branch_name = COALESCE(?, branch_name),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pincode = COALESCE(?, pincode),
      country = COALESCE(?, country),
      phone = COALESCE(?, phone),
      alt_phone = COALESCE(?, alt_phone),
      email = COALESCE(?, email),
      website = COALESCE(?, website),
      registration_no = COALESCE(?, registration_no),
      udise_no = COALESCE(?, udise_no),
      affiliation_no = COALESCE(?, affiliation_no),
      gstin = COALESCE(?, gstin),
      principal_name = COALESCE(?, principal_name),
      contact_person = COALESCE(?, contact_person),
      tagline = COALESCE(?, tagline),
      logo_path = COALESCE(?, logo_path),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`).run(
  firm_name,
  group_name,
  school_name,
  branch_name,
  address,
  city,
  state,
  pincode,
  country,
  phone,
  alt_phone,
  email,
  website,
  registration_no,
  udise_no,
  affiliation_no,
  gstin,
  principal_name,
  contact_person,
  tagline,
  logo_path
);

    return this.get();
  },
};

module.exports = CompanyModel;
