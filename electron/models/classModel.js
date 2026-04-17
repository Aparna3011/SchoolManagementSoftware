const { getDatabase } = require('../database/connection');

/**
 * Class Model
 * 
 * Data access layer for the Classes_Master table.
 */

const ClassModel = {
  /**
   * Get all classes.
   * @returns {Array<Object>}
   */
  getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Classes_Master ORDER BY class_name ASC').all();
  },

  /**
   * Get a class by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Classes_Master WHERE id = ?').get(id);
  },

  /**
   * Create a new class.
   * @param {Object} data - { class_name, short_code, base_fee }
   * @returns {Object} The newly created row.
   */
  create(data) {
    const db = getDatabase();
    const { class_name, short_code, base_fee } = data;

    if (!class_name?.trim()) {
      throw new Error('Class name is required.');
    }
    if (!short_code?.trim()) {
      throw new Error('Class short code is required.');
    }

    const result = db.prepare(`
      INSERT INTO Classes_Master (class_name, short_code, base_fee)
      VALUES (?, ?, ?)
    `).run(class_name.trim(), short_code.trim().toUpperCase(), base_fee || 0);

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
    const { class_name, short_code, base_fee, is_active } = data;

    db.prepare(`
      UPDATE Classes_Master
      SET class_name = COALESCE(?, class_name),
          short_code = COALESCE(?, short_code),
          base_fee = COALESCE(?, base_fee),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      class_name ? class_name.trim() : null,
      short_code ? short_code.trim().toUpperCase() : null,
      base_fee,
      is_active,
      id,
    );

    return this.getById(id);
  },

  /**
   * Delete a class (only if no students are linked).
   * @param {number} id
   * @returns {{ success: boolean, message?: string }}
   */
  delete(id) {
    const db = getDatabase();

    const enrollmentCount = db.prepare(
      'SELECT COUNT(*) as count FROM Student_Enrollments WHERE class_id = ?'
    ).get(id);

    if (enrollmentCount.count > 0) {
      return { success: false, message: 'Cannot delete: students are enrolled in this class.' };
    }

    db.prepare('DELETE FROM Classes_Master WHERE id = ?').run(id);
    return { success: true };
  },
};

module.exports = ClassModel;
