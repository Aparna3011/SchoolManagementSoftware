const { getDatabase } = require("../database/connection");
const ClassModel = require("./classModel");
const FinancialYearModel = require("./financialYearModel");

/**
 * Promotion Model
 *
 * Handles logic for promoting students to the next academic year and class.
 */

const PromotionModel = {
  /**
   * Get students for a specific class and academic year.
   * Reuses studentModel.getAll logic but focused on promotion.
   * @param {number} classId
   * @param {number} yearId
   * @returns {Array<Object>}
   */
  getStudentsForPromotion(classId, yearId) {
    console.log(
      `Promotion Model - Fetching students for Class: ${classId}, Year: ${yearId}`,
    );
    const db = getDatabase();
    const query = `
      SELECT
        sm.id as student_id,
        sm.student_name,
        sm.usin,
        se.id as enrollment_id,
        se.agreed_annual_fee,
        cm.base_fee as class_base_fee
      FROM Students_Master sm
      JOIN Student_Enrollments se ON sm.id = se.student_id
      JOIN Classes_Master cm ON se.class_id = cm.id
      WHERE se.class_id = ? AND se.academic_year_id = ? AND se.status = 'active'
    `;
    const stmt = db.prepare(query);
    const results = stmt.all(classId, yearId);
    console.log(
      `Promotion Model - Query returned ${results?.length || 0} results`,
    );
    return results;
  },

  /**
   * Get the target class and target year for promotion.
   * @param {number} currentClassId
   * @param {number} currentYearId
   * @returns {Object|null} { targetClass, targetYear }
   */
  getTargets(currentClassId, currentYearId) {
    const targetClass = ClassModel.getNextClass(currentClassId);

    // Find next year: the one with the smallest start_year that is > current year's start_year
    const db = getDatabase();
    const currentYear = FinancialYearModel.getById(currentYearId);
    if (!currentYear) return null;

    const targetYear = db
      .prepare(
        `
      SELECT * FROM Academic_Years
      WHERE start_year > ?
      ORDER BY start_year ASC
      LIMIT 1
    `,
      )
      .get(currentYear.start_year);

    return {
      targetClass,
      targetYear,
    };
  },

  /**
   * Execute bulk promotion.
   * @param {Object} params - { targetYearId, targetClassId, promotions: Array<{ student_id, status, fee }> }
   * @returns {Object} { success: boolean, promotedCount: number }
   */
  promoteBatch({ targetYearId, targetClassId, promotions }) {
    const db = getDatabase();

    const insertEnrollment = db.prepare(`
  INSERT INTO Student_Enrollments (
    student_id,
    academic_year_id,
    class_id,
    agreed_annual_fee,
    status
  ) VALUES (?, ?, ?, ?, ?)
`);

    const updateOld = db.prepare(`
  UPDATE Student_Enrollments
  SET status = ?
WHERE student_id = ? AND academic_year_id = ?
`);

    const transaction = db.transaction(() => {
      let count = 0;
      for (const p of promotions) {
        // 🔥 NO NEXT CLASS → INACTIVE
        if (!targetClassId) {
          updateOld.run("inactive", p.student_id, p.currentYearId);
          continue;
        }

        // ✅ PROMOTED
        if (p.status === "Promoted") {
          updateOld.run("promoted", p.student_id, p.currentYearId);

          insertEnrollment.run(
            p.student_id,
            targetYearId,
            targetClassId,
            p.fee || 0,
            "active",
          );

          count++;
          continue;
        }

        // ✅ REPEAT
        if (p.status === "Repeat") {
          updateOld.run("repeat", p.student_id, p.currentYearId);

          insertEnrollment.run(
            p.student_id,
            targetYearId,
            p.currentClassId,
            p.fee || 0,
            "active",
          );

          count++;
          continue;
        }
      }

      return count;
    });

    const result = transaction();

    return { success: true, promotedCount: result };
  },
};

module.exports = PromotionModel;
