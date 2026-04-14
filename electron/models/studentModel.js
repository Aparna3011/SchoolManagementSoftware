const { getDatabase } = require('../database/connection');

/**
 * Student Model
 * 
 * Data access layer for the Students table.
 * Matches all fields from the paper admission form.
 */

const StudentModel = {
  /**
   * Get all students with optional filters.
   * @param {Object} [filters] - { search, class_id, year_id, is_active }
   * @returns {Array<Object>}
   */
  getAll(filters = {}) {
    const db = getDatabase();
    let query = `
      SELECT s.*, cm.class_name, cm.base_fee, fy.year_label
      FROM Students s
      LEFT JOIN Classes_Master cm ON s.class_id = cm.id
      LEFT JOIN Financial_Years fy ON s.year_id = fy.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (s.student_name LIKE ? OR s.sr_no LIKE ? OR s.father_name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.class_id) {
      query += ` AND s.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.year_id) {
      query += ` AND s.year_id = ?`;
      params.push(filters.year_id);
    }

    if (filters.is_active !== undefined) {
      query += ` AND s.is_active = ?`;
      params.push(filters.is_active ? 1 : 0);
    }

    query += ` ORDER BY s.id DESC`;

    return db.prepare(query).all(...params);
  },

  /**
   * Get a student by ID with joined class info.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT s.*, cm.class_name, cm.base_fee, fy.year_label
      FROM Students s
      LEFT JOIN Classes_Master cm ON s.class_id = cm.id
      LEFT JOIN Financial_Years fy ON s.year_id = fy.id
      WHERE s.id = ?
    `).get(id);
  },

  /**
   * Generate the next serial number.
   * @returns {string} e.g., "075"
   */
  getNextSrNo() {
    const db = getDatabase();
    const last = db.prepare(
      'SELECT sr_no FROM Students ORDER BY id DESC LIMIT 1'
    ).get();

    if (!last || !last.sr_no) return '001';

    const nextNum = parseInt(last.sr_no, 10) + 1;
    return String(nextNum).padStart(3, '0');
  },

  /**
   * Create a new student record.
   * @param {Object} data - All student fields.
   * @returns {Object} The newly created student.
   */
  create(data) {
    const db = getDatabase();
    const {
      sr_no, photo_path, surname, student_name, father_first_name,
      dob, class_id, religion, caste, address,
      father_name, father_education, father_occupation,
      mother_name, mother_education, mother_occupation,
      mother_tongue, emergency_contact_mother, emergency_contact_father,
      year_id, agreed_fee,
    } = data;

    const result = db.prepare(`
      INSERT INTO Students (
        sr_no, photo_path, surname, student_name, father_first_name,
        dob, class_id, religion, caste, address,
        father_name, father_education, father_occupation,
        mother_name, mother_education, mother_occupation,
        mother_tongue, emergency_contact_mother, emergency_contact_father,
        year_id, agreed_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sr_no || this.getNextSrNo(),
      photo_path || '',
      surname || '',
      student_name,
      father_first_name || '',
      dob || null,
      class_id || null,
      religion || '',
      caste || '',
      address || '',
      father_name || '',
      father_education || '',
      father_occupation || '',
      mother_name || '',
      mother_education || '',
      mother_occupation || '',
      mother_tongue || '',
      emergency_contact_mother || '',
      emergency_contact_father || '',
      year_id || null,
      agreed_fee || 0,
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a student record.
   * @param {number} id
   * @param {Object} data - Fields to update.
   * @returns {Object} The updated student.
   */
  update(id, data) {
    const db = getDatabase();

    // Build dynamic update query from provided fields
    const allowedFields = [
      'sr_no', 'photo_path', 'surname', 'student_name', 'father_first_name',
      'dob', 'class_id', 'religion', 'caste', 'address',
      'father_name', 'father_education', 'father_occupation',
      'mother_name', 'mother_education', 'mother_occupation',
      'mother_tongue', 'emergency_contact_mother', 'emergency_contact_father',
      'year_id', 'is_active', 'agreed_fee',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (setClauses.length === 0) return this.getById(id);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`
      UPDATE Students SET ${setClauses.join(', ')} WHERE id = ?
    `).run(...params);

    return this.getById(id);
  },

  /**
   * Get student count for dashboard stats.
   * @returns {{ total: number, active: number }}
   */
  getStats() {
    const db = getDatabase();
    const total = db.prepare('SELECT COUNT(*) as count FROM Students').get();
    const active = db.prepare('SELECT COUNT(*) as count FROM Students WHERE is_active = 1').get();
    return { total: total.count, active: active.count };
  },

  /**
   * Get recent registrations for dashboard.
   * @param {number} [limit=5]
   * @returns {Array<Object>}
   */
  getRecent(limit = 5) {
    const db = getDatabase();
    return db.prepare(`
      SELECT s.id, s.sr_no, s.student_name, s.surname, s.admission_date, cm.class_name
      FROM Students s
      LEFT JOIN Classes_Master cm ON s.class_id = cm.id
      ORDER BY s.id DESC
      LIMIT ?
    `).all(limit);
  },
};

module.exports = StudentModel;
