const version = 3;
const name = "expand_company_profile_fields";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN group_name TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN school_name TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN branch_name TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN principal_name TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN contact_person TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN alt_phone TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN website TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN city TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN state TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN pincode TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN country TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN udise_no TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN affiliation_no TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN gstin TEXT DEFAULT '';
  `);
  db.exec(`
    ALTER TABLE Company_Profile ADD COLUMN tagline TEXT DEFAULT '';
  `);
}

module.exports = { version, name, up };