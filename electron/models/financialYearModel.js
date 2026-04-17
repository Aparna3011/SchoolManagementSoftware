const { getDatabase } = require('../database/connection');

/**
 * Academic Year Model
 *
 * Data access layer for the Academic_Years table.
 */

const FinancialYearModel = {
  normalizeYearPayload(data) {
    const yearLabel = data.year_label?.trim();
    const startDate = data.start_date?.trim() || null;
    const endDate = data.end_date?.trim() || null;

    let parsedStartYear = null;
    if (data.start_year !== undefined && data.start_year !== null && data.start_year !== '') {
      parsedStartYear = Number.parseInt(data.start_year, 10);
    } else if (startDate) {
      parsedStartYear = Number.parseInt(startDate.slice(0, 4), 10);
    }

    if (!yearLabel) {
      throw new Error('Year label is required.');
    }
    if (!startDate) {
      throw new Error('Start date is required.');
    }
    if (!endDate) {
      throw new Error('End date is required.');
    }
    if (!Number.isInteger(parsedStartYear)) {
      throw new Error('Start year is required.');
    }
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('End date must be after start date.');
    }

    return {
      year_label: yearLabel,
      start_year: parsedStartYear,
      start_date: startDate,
      end_date: endDate,
      is_active: !!data.is_active,
    };
  },

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
    const payload = this.normalizeYearPayload(data);

    // If setting as active, deactivate all others first
    if (payload.is_active) {
      db.prepare('UPDATE Academic_Years SET is_active = 0').run();
    }

    const result = db.prepare(`
      INSERT INTO Academic_Years (year_label, start_year, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      payload.year_label,
      payload.start_year,
      payload.start_date,
      payload.end_date,
      payload.is_active ? 1 : 0,
    );

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
    const current = this.getById(id);
    if (!current) {
      throw new Error('Academic year not found.');
    }

    const merged = {
      year_label: data.year_label ?? current.year_label,
      start_year: data.start_year ?? current.start_year,
      start_date: data.start_date ?? current.start_date,
      end_date: data.end_date ?? current.end_date,
      is_active: data.is_active !== undefined ? data.is_active : !!current.is_active,
    };

    const payload = this.normalizeYearPayload(merged);

    // If setting as active, deactivate all others first
    if (payload.is_active) {
      db.prepare('UPDATE Academic_Years SET is_active = 0').run();
    }

    db.prepare(`
      UPDATE Academic_Years
      SET year_label = ?,
          start_year = ?,
          start_date = ?,
          end_date = ?,
          is_active = ?
      WHERE id = ?
    `).run(
      payload.year_label,
      payload.start_year,
      payload.start_date,
      payload.end_date,
      payload.is_active ? 1 : 0,
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
