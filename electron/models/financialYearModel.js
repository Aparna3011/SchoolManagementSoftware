const { getDatabase } = require('../database/connection');

/**
 * Financial Year Model
 * 
 * Data access layer for the Financial_Years table.
 */

const FinancialYearModel = {
  /**
   * Get all financial years ordered by ID descending.
   * @returns {Array<Object>}
   */
  getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Financial_Years ORDER BY id DESC').all();
  },

  /**
   * Get a financial year by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Financial_Years WHERE id = ?').get(id);
  },

  /**
   * Get the currently active financial year.
   * @returns {Object|undefined}
   */
  getActive() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Financial_Years WHERE is_active = 1').get();
  },

  /**
   * Create a new financial year.
   * @param {Object} data - { year_label, start_date, end_date, is_active }
   * @returns {Object} The newly created row.
   */
  create(data) {
    const db = getDatabase();
    const { year_label, start_date, end_date, is_active } = data;

    // If setting as active, deactivate all others first
    if (is_active) {
      db.prepare('UPDATE Financial_Years SET is_active = 0').run();
    }

    const result = db.prepare(`
      INSERT INTO Financial_Years (year_label, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?)
    `).run(year_label, start_date || null, end_date || null, is_active ? 1 : 0);

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a financial year.
   * @param {number} id
   * @param {Object} data - Fields to update.
   * @returns {Object} The updated row.
   */
  update(id, data) {
    const db = getDatabase();
    const { year_label, start_date, end_date, is_active } = data;

    // If setting as active, deactivate all others first
    if (is_active) {
      db.prepare('UPDATE Financial_Years SET is_active = 0').run();
    }

    db.prepare(`
      UPDATE Financial_Years
      SET year_label = COALESCE(?, year_label),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(year_label, start_date, end_date, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

    return this.getById(id);
  },

  /**
   * Set a year as active (deactivates all others).
   * @param {number} id
   * @returns {Object} The activated row.
   */
  setActive(id) {
    const db = getDatabase();
    db.prepare('UPDATE Financial_Years SET is_active = 0').run();
    db.prepare('UPDATE Financial_Years SET is_active = 1 WHERE id = ?').run(id);
    return this.getById(id);
  },

  /**
   * Delete a financial year (only if no classes or students are linked).
   * @param {number} id
   * @returns {{ success: boolean, message?: string }}
   */
  delete(id) {
    const db = getDatabase();

    const classCount = db.prepare(
      'SELECT COUNT(*) as count FROM Classes_Master WHERE year_id = ?'
    ).get(id);

    if (classCount.count > 0) {
      return { success: false, message: 'Cannot delete: classes are linked to this year.' };
    }

    db.prepare('DELETE FROM Financial_Years WHERE id = ?').run(id);
    return { success: true };
  },
};

module.exports = FinancialYearModel;
