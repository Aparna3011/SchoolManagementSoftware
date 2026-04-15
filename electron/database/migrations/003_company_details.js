const version = 3;
const name = "expand_company_profile_fields";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // Ensure group_name exists for databases created before migration 001 included it.
  try {
    db.exec(`ALTER TABLE Company_Profile ADD COLUMN group_name TEXT DEFAULT '';`);
  } catch (_error) {
    // Ignore duplicate-column errors on already up-to-date databases.
  }
}

module.exports = { version, name, up };