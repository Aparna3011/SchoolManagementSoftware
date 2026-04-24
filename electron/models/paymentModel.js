const { getDatabase } = require("../database/connection");
const { amountToWordsINR } = require("../database/utils/amountInWords");

function getActiveAcademicYear(db) {
  return db.prepare("SELECT * FROM Academic_Years WHERE is_active = 1").get();
}

const PaymentModel = {
  getByEnrollment(enrollmentId) {
    const db = getDatabase();
    return db
      .prepare(
        `
      SELECT *
      FROM Payments
      WHERE enrollment_id = ?
      ORDER BY id DESC
    `,
      )
      .all(enrollmentId);
  },
  getByStudent(studentId) {
    const db = getDatabase();
    return db
      .prepare(
        `
      SELECT *
        FROM Payments pay
      INNER JOIN Student_Enrollments se on pay.enrollment_id = se.id
      WHERE  se.student_id = ?
      ORDER BY id DESC
    `,
      )
      .all(studentId);
  },

  getById(id) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM Payments WHERE id = ?").get(id);
  },

  generateReceiptNo() {
    const db = getDatabase();
    const activeYear = getActiveAcademicYear(db);
    const yearLabel = activeYear?.year_label || "XX-XX";

    const prefix = `RK/${yearLabel}/`;
    const last = db
      .prepare(
        `
      SELECT receipt_no
      FROM Payments
      WHERE receipt_no LIKE ?
      ORDER BY id DESC
      LIMIT 1
    `,
      )
      .get(`${prefix}%`);

    let nextSeq = 1;
    if (last?.receipt_no) {
      const parts = last.receipt_no.split("/");
      nextSeq = Number.parseInt(parts[2], 10) + 1;
    }

    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  },

  create(data) {
    const db = getDatabase();
    const { enrollment_id, amount_paid, payment_mode } = data;

    if (!enrollment_id) {
      throw new Error("Enrollment is required to record payment.");
    }

    const amountNumber = Number(amount_paid);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Amount paid must be a valid number greater than zero.");
    }

    const receipt_no = this.generateReceiptNo();
    const amount_in_words = amountToWordsINR(amountNumber);

    const result = db
      .prepare(
        `
    INSERT INTO Payments (enrollment_id, receipt_no, amount_paid, payment_mode, amount_in_words)
    VALUES (?, ?, ?, ?, ?)
  `,
      )
      .run(
        enrollment_id,
        receipt_no,
        amountNumber,
        payment_mode || "Cash",
        amount_in_words,
      );

    return this.getById(result.lastInsertRowid);
  },

  cancel(id) {
    const db = getDatabase();
    db.prepare("UPDATE Payments SET status = 'Cancelled' WHERE id = ?").run(id);
    return this.getById(id);
  },

  getLedger(studentId) {
    console.log("studentId", studentId);
    const db = getDatabase();

    const enrollment = db
      .prepare(
        `
      SELECT
        se.*,
        sm.usin,
        sm.surname,
        sm.student_name,
        cm.class_name,
        ay.year_label
      FROM Student_Enrollments se
      JOIN Students_Master sm ON se.student_id = sm.id
      JOIN Classes_Master cm ON se.class_id = cm.id
      JOIN Academic_Years ay ON se.academic_year_id = ay.id
      WHERE se.student_id = ?
    `,
      )
      .all(studentId);

    // console.log('totalenrollments',enrollment)

    if (!enrollment) {
      return {
        total_fee: 0,
        total_paid: 0,
        balance: 0,
        payments: [],
        enrollment: null,
      };
    }

    const paid = db
      .prepare(
        `
      SELECT COALESCE(SUM(pay.amount_paid), 0) AS total_paid
      FROM Payments pay
      INNER JOIN Student_Enrollments se on pay.enrollment_id = se.id
      WHERE  se.student_id = ? AND pay.status = 'Active'
    `,
      )
      .get(studentId);

    const payments = this.getByStudent(studentId);

    const totalFee = enrollment.reduce(
      (sum, e) => sum + (e.agreed_annual_fee || 0),
      0,
    );

    const totalPaid = paid.total_paid || 0;

    return {
      total_fee: totalFee,
      total_paid: totalPaid,
      balance: totalFee - totalPaid,
      payments,
      enrollment,
    };
  },

  getStats() {
    const db = getDatabase();

    const today = db
      .prepare(
        `
      SELECT COALESCE(SUM(amount_paid), 0) AS total
      FROM Payments
      WHERE payment_date = CURRENT_DATE AND status = 'Active'
    `,
      )
      .get();

    const pendingByStatus = db
      .prepare(
        `
      SELECT
        sm.status,
        COALESCE(SUM(
          CASE
            WHEN se.agreed_annual_fee - COALESCE(p.total_paid, 0) > 0
            THEN se.agreed_annual_fee - COALESCE(p.total_paid, 0)
            ELSE 0
          END
        ), 0) AS total
      FROM Student_Enrollments se
      LEFT JOIN (
        SELECT enrollment_id, SUM(amount_paid) AS total_paid
        FROM Payments
        WHERE status = 'Active'
        GROUP BY enrollment_id
      ) p ON p.enrollment_id = se.id
      JOIN Students_Master sm ON sm.id = se.student_id
      WHERE sm.status IN ('Active', 'Alumni')
      GROUP BY sm.status
    `,
      )
      .all();

    const pending = db
      .prepare(
        `
      SELECT COALESCE(SUM(
        CASE
          WHEN se.agreed_annual_fee - COALESCE(p.total_paid, 0) > 0
          THEN se.agreed_annual_fee - COALESCE(p.total_paid, 0)
          ELSE 0
        END
      ), 0) AS total
      FROM Student_Enrollments se
      LEFT JOIN (
        SELECT enrollment_id, SUM(amount_paid) AS total_paid
        FROM Payments
        WHERE status = 'Active'
        GROUP BY enrollment_id
      ) p ON p.enrollment_id = se.id
      JOIN Students_Master sm ON sm.id = se.student_id
      WHERE sm.status = 'Active'
    `,
      )
      .get();

    const statusMap = pendingByStatus.reduce((acc, row) => {
      acc[row.status] = row.total;
      return acc;
    }, {});

    const pendingActiveTotal = statusMap.Active || 0;
    const pendingAlumniTotal = statusMap.Alumni || 0;

    return {
      today_collection: today.total,
      pending_total: pending.total,
      pending_active_total: pendingActiveTotal,
      pending_alumni_total: pendingAlumniTotal,
      pending_combined_total: pendingActiveTotal + pendingAlumniTotal,
    };
  },
};

module.exports = PaymentModel;
