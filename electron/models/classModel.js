const { getDatabase } = require('../database/connection');

/**
 * Class Model
 * 
 * Data access layer for the Classes_Master table.
 */

const ClassModel = {
  /**
   * Get all classes, optionally filtered by year.
   * @param {number} [yearId] - Filter by financial year ID.
   * @returns {Array<Object>}
   */
  getAll(yearId) {
    const db = getDatabase();

    if (yearId) {
      return db.prepare(`
        SELECT c.*, fy.year_label
        FROM Classes_Master c
        LEFT JOIN Financial_Years fy ON c.year_id = fy.id
        WHERE c.year_id = ?
        ORDER BY c.class_name ASC
      `).all(yearId);
    }

    return db.prepare(`
      SELECT c.*, fy.year_label
      FROM Classes_Master c
      LEFT JOIN Financial_Years fy ON c.year_id = fy.id
      ORDER BY c.class_name ASC
    `).all();
  },

  /**
   * Get a class by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT c.*, fy.year_label
      FROM Classes_Master c
      LEFT JOIN Financial_Years fy ON c.year_id = fy.id
      WHERE c.id = ?
    `).get(id);
  },

  /**
   * Create a new class.
   * @param {Object} data - { class_name, session_time, base_fee, year_id }
   * @returns {Object} The newly created row.
   */
  create(data) {
    const db = getDatabase();
    const { class_name, session_time, base_fee, year_id } = data;

    const result = db.prepare(`
      INSERT INTO Classes_Master (class_name, session_time, base_fee, year_id)
      VALUES (?, ?, ?, ?)
    `).run(class_name, session_time || '', base_fee || 0, year_id);

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a class.
   * @param {number} id
   * @param {Object} data - Fields to update.
   * @returns {Object} The updated row.
   */
  update(id, data) {
    const db = getDatabase();
    const { class_name, session_time, base_fee, year_id, is_active } = data;

    db.prepare(`
      UPDATE Classes_Master
      SET class_name = COALESCE(?, class_name),
          session_time = COALESCE(?, session_time),
          base_fee = COALESCE(?, base_fee),
          year_id = COALESCE(?, year_id),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(class_name, session_time, base_fee, year_id, is_active, id);

    return this.getById(id);
  },

  /**
   * Delete a class (only if no students are linked).
   * @param {number} id
   * @returns {{ success: boolean, message?: string }}
   */
  delete(id) {
    const db = getDatabase();

    const studentCount = db.prepare(
      'SELECT COUNT(*) as count FROM Students WHERE class_id = ?'
    ).get(id);

    if (studentCount.count > 0) {
      return { success: false, message: 'Cannot delete: students are enrolled in this class.' };
    }

    db.prepare('DELETE FROM Classes_Master WHERE id = ?').run(id);
    return { success: true };
  },
};

module.exports = ClassModel;
