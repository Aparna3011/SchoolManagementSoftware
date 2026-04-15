const { getDatabase } = require('../database/connection');

/**
 * Academic Year Model
 *
 * Data access layer for the Academic_Years table.
 */

const FinancialYearModel = {
  /**
   * Get all academic years ordered by ID descending.
   * @returns {Array<Object>}
   */
  getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Academic_Years ORDER BY id DESC').all();
  },

  /**
   * Get an academic year by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Academic_Years WHERE id = ?').get(id);
  },

  /**
   * Get the currently active academic year.
   * @returns {Object|undefined}
   */
  getActive() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Academic_Years WHERE is_active = 1').get();
  },

  /**
   * Create a new academic year.
   * @param {Object} data - { year_label, start_year, is_active }
   * @returns {Object} The newly created row.
   */
  create(data) {
    const db = getDatabase();
    const { year_label, start_year, is_active } = data;

    if (!year_label) {
      throw new Error('Year label is required.');
    }
    if (!start_year) {
      throw new Error('Start year is required.');
    }

    // If setting as active, deactivate all others first
    if (is_active) {
      db.prepare('UPDATE Academic_Years SET is_active = 0').run();
    }

    const result = db.prepare(`
      INSERT INTO Academic_Years (year_label, start_year, is_active)
      VALUES (?, ?, ?)
    `).run(year_label, Number.parseInt(start_year, 10), is_active ? 1 : 0);

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update an academic year.
   * @param {number} id
   * @param {Object} data - Fields to update.
   * @returns {Object} The updated row.
   */
  update(id, data) {
    const db = getDatabase();
    const { year_label, start_year, is_active } = data;

    // If setting as active, deactivate all others first
    if (is_active) {
      db.prepare('UPDATE Academic_Years SET is_active = 0').run();
    }

    db.prepare(`
      UPDATE Academic_Years
      SET year_label = COALESCE(?, year_label),
          start_year = COALESCE(?, start_year),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      year_label,
      start_year !== undefined && start_year !== '' ? Number.parseInt(start_year, 10) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id,
    );

    return this.getById(id);
  },

  /**
   * Set a year as active (deactivates all others).
   * @param {number} id
   * @returns {Object} The activated row.
   */
  setActive(id) {
    const db = getDatabase();
    db.prepare('UPDATE Academic_Years SET is_active = 0').run();
    db.prepare('UPDATE Academic_Years SET is_active = 1 WHERE id = ?').run(id);
    return this.getById(id);
  },

  /**
   * Delete an academic year (only if no enrollments are linked).
   * @param {number} id
   * @returns {{ success: boolean, message?: string }}
   */
  delete(id) {
    const db = getDatabase();

    const enrollmentCount = db.prepare(
      'SELECT COUNT(*) as count FROM Student_Enrollments WHERE academic_year_id = ?'
    ).get(id);

    if (enrollmentCount.count > 0) {
      return { success: false, message: 'Cannot delete: enrollments are linked to this year.' };
    }

    db.prepare('DELETE FROM Academic_Years WHERE id = ?').run(id);
    return { success: true };
  },
};

module.exports = FinancialYearModel;
