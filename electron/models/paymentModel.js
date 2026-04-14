const { getDatabase } = require('../database/connection');

/**
 * Payment Model
 * 
 * Data access layer for the Payments table.
 * Handles invoice numbering, part payments, and cancellation.
 */

const PaymentModel = {
  /**
   * Get all payments for a student.
   * @param {number} studentId
   * @returns {Array<Object>}
   */
  getByStudent(studentId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM Payments
      WHERE student_id = ?
      ORDER BY created_at DESC
    `).all(studentId);
  },

  /**
   * Get a payment by ID.
   * @param {number} id
   * @returns {Object|undefined}
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM Payments WHERE id = ?').get(id);
  },

  /**
   * Generate the next invoice number.
   * Format: RK/{year_label}/{seq}
   * @returns {string} e.g., "RK/26-27/001"
   */
  generateInvoiceNo() {
    const db = getDatabase();

    // Get active financial year
    const activeYear = db.prepare(
      'SELECT * FROM Financial_Years WHERE is_active = 1'
    ).get();

    const yearLabel = activeYear ? activeYear.year_label : 'XX-XX';

    // Get the last invoice number for this year
    const prefix = `RK/${yearLabel}/`;
    const last = db.prepare(`
      SELECT invoice_no FROM Payments
      WHERE invoice_no LIKE ?
      ORDER BY id DESC
      LIMIT 1
    `).get(`${prefix}%`);

    let nextSeq = 1;
    if (last) {
      const parts = last.invoice_no.split('/');
      nextSeq = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  },

  /**
   * Record a payment.
   * @param {Object} data - { student_id, amount_paid, payment_mode, balance_remaining }
   * @returns {Object} The newly created payment.
   */
  create(data) {
    const db = getDatabase();
    const { student_id, amount_paid, payment_mode, balance_remaining } = data;

    const invoice_no = this.generateInvoiceNo();

    const result = db.prepare(`
      INSERT INTO Payments (student_id, invoice_no, amount_paid, payment_mode, balance_remaining)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      student_id,
      invoice_no,
      amount_paid,
      payment_mode || 'Cash',
      balance_remaining || 0,
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Cancel a payment (invoices can never be deleted, only cancelled).
   * @param {number} id
   * @returns {Object} The cancelled payment.
   */
  cancel(id) {
    const db = getDatabase();
    db.prepare("UPDATE Payments SET status = 'Cancelled' WHERE id = ?").run(id);
    return this.getById(id);
  },

  /**
   * Get the fee ledger for a student.
   * @param {number} studentId
   * @returns {{ total_fee: number, total_paid: number, balance: number, payments: Array }}
   */
  getLedger(studentId) {
    const db = getDatabase();

    // Get student's class fee
    const student = db.prepare(`
      SELECT s.*, cm.base_fee
      FROM Students s
      LEFT JOIN Classes_Master cm ON s.class_id = cm.id
      WHERE s.id = ?
    `).get(studentId);

    const totalFee = student ? (student.base_fee || 0) : 0;

    // Sum active payments
    const paid = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total_paid
      FROM Payments
      WHERE student_id = ? AND status = 'Active'
    `).get(studentId);

    const payments = this.getByStudent(studentId);

    return {
      total_fee: totalFee,
      total_paid: paid.total_paid,
      balance: totalFee - paid.total_paid,
      payments,
    };
  },

  /**
   * Get today's collection stats for dashboard.
   * @returns {{ today_collection: number, pending_total: number }}
   */
  getStats() {
    const db = getDatabase();

    const today = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM Payments
      WHERE payment_date = CURRENT_DATE AND status = 'Active'
    `).get();

    const pending = db.prepare(`
      SELECT COALESCE(SUM(p.balance_remaining), 0) as total
      FROM (
        SELECT student_id, balance_remaining
        FROM Payments
        WHERE status = 'Active'
        AND id IN (SELECT MAX(id) FROM Payments WHERE status = 'Active' GROUP BY student_id)
      ) p
    `).get();

    return {
      today_collection: today.total,
      pending_total: pending.total,
    };
  },
};

module.exports = PaymentModel;
