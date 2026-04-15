const version = 2;
const name = "expand_company_profile_fields";

/**
 * @param {import('better-sqlite3').Database} db
 */
function up(db) {
  // No-op in V2 schema. Company_Profile fields are defined in migration 001.
  return db;
}

module.exports = { version, name, up };