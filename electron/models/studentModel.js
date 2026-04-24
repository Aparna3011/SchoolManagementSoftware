const { getDatabase } = require('../database/connection');
const { generateUSIN } = require('../database/utils/usin');

function getTargetYearId(db, requestedYearId) {
  if (requestedYearId) {
    return Number.parseInt(requestedYearId, 10);
  }
  const active = db.prepare('SELECT id FROM Academic_Years WHERE is_active = 1').get();
  return active?.id || null;
}

function normalizeStudentStatus(status) {
  const allowedStatuses = ['Active', 'Alumni', 'Transferred'];
  if (!status || !allowedStatuses.includes(status)) {
    throw new Error('Invalid student status. Allowed values: Active, Alumni, Transferred.');
  }
  return status;
}

const StudentModel = {
  getAll(filters = {}) {
    const db = getDatabase();
    const yearId = getTargetYearId(db, filters.year_id);

    let query = `
      SELECT
        sm.*,
        sm.residential_address AS address,
        se.id AS enrollment_id,
        se.academic_year_id,
        se.class_id,
        se.section_id,
        se.roll_number,
        se.agreed_annual_fee,
        cm.class_name,
        cm.short_code,
        ay.year_label
      FROM Students_Master sm
      LEFT JOIN Student_Enrollments se ON se.id = (
        SELECT se2.id
        FROM Student_Enrollments se2
        WHERE se2.student_id = sm.id
        ${yearId ? 'AND se2.academic_year_id = ?' : ''}
        ORDER BY se2.id DESC
        LIMIT 1
      )
      LEFT JOIN Classes_Master cm ON se.class_id = cm.id
      LEFT JOIN Academic_Years ay ON se.academic_year_id = ay.id
      WHERE 1=1
    `;

    const params = [];
    if (yearId) {
      params.push(yearId);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query += ' AND (sm.student_name LIKE ? OR sm.usin LIKE ? OR sm.father_name LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.class_id) {
      query += ' AND se.class_id = ?';
      params.push(Number.parseInt(filters.class_id, 10));
    }

    if (filters.status) {
      query += ' AND sm.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY sm.id DESC';

    return db.prepare(query).all(...params);
  },

  getById(id, options = {}) {
    const db = getDatabase();
    const yearId = getTargetYearId(db, options.year_id);

    if (yearId) {
      return db.prepare(`
      SELECT
        sm.*,
        sm.residential_address AS address,
        se.id AS enrollment_id,
        se.academic_year_id,
        se.class_id,
        se.section_id,
        se.roll_number,
        se.agreed_annual_fee,
        cm.class_name,
        cm.short_code,
        ay.year_label
      FROM Students_Master sm
      LEFT JOIN Student_Enrollments se ON se.id = (
        SELECT se2.id
        FROM Student_Enrollments se2
        WHERE se2.student_id = sm.id AND se2.academic_year_id = ?
        ORDER BY se2.id DESC
        LIMIT 1
      )
      LEFT JOIN Classes_Master cm ON se.class_id = cm.id
      LEFT JOIN Academic_Years ay ON se.academic_year_id = ay.id
      WHERE sm.id = ?
    `).get(yearId, id);
    }

    return db.prepare(`
      SELECT
        sm.*,
        sm.residential_address AS address,
        se.id AS enrollment_id,
        se.academic_year_id,
        se.class_id,
        se.section_id,
        se.roll_number,
        se.agreed_annual_fee,
        cm.class_name,
        cm.short_code,
        ay.year_label
      FROM Students_Master sm
      LEFT JOIN Student_Enrollments se ON se.id = (
        SELECT se2.id
        FROM Student_Enrollments se2
        WHERE se2.student_id = sm.id
        ORDER BY se2.id DESC
        LIMIT 1
      )
      LEFT JOIN Classes_Master cm ON se.class_id = cm.id
      LEFT JOIN Academic_Years ay ON se.academic_year_id = ay.id
      WHERE sm.id = ?
    `).get(id);
  },

  generateUSIN(academicYearId, classId) {
    const db = getDatabase();
    return generateUSIN(db, academicYearId, classId);
  },

  create(data) {
    const db = getDatabase();
    const {
      photo_path,
      surname,
      student_name,
      dob,
      gender,
      religion,
      caste,
      nationality,
      blood_group,
      mother_tongue,
      address,
      father_first_name,
      father_name,
      father_education,
      father_occupation,
      father_aadhaar_no,
      father_govt_proof_path,
      emergency_contact_father,
      mother_name,
      mother_education,
      mother_occupation,
      mother_aadhaar_no,
      mother_govt_proof_path,
      emergency_contact_mother,
      birth_certificate_path,
      status,
      academic_year_id,
      class_id,
      section_id,
      roll_number,
      agreed_annual_fee,
    } = data;

    if (!student_name?.trim()) {
      throw new Error('Student name is required.');
    }
    if (!academic_year_id) {
      throw new Error('Academic year is required.');
    }
    if (!class_id) {
      throw new Error('Class is required.');
    }

    const insertMaster = db.prepare(`
      INSERT INTO Students_Master (
        usin,
        admission_date,
        photo_path,
        surname,
        student_name,
        dob,
        gender,
        religion,
        caste,
        nationality,
        blood_group,
        mother_tongue,
        residential_address,
        father_name,
        father_education,
        father_occupation,
        father_aadhaar_no,
        father_govt_proof_path,
        emergency_contact_father,
        mother_name,
        mother_education,
        mother_occupation,
        mother_aadhaar_no,
        mother_govt_proof_path,
        emergency_contact_mother,
        birth_certificate_path,
        status
      ) VALUES (?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEnrollment = db.prepare(`
      INSERT INTO Student_Enrollments (
        student_id,
        academic_year_id,
        class_id,
        section_id,
        roll_number,
        agreed_annual_fee,
        status
      ) VALUES (?, ?, ?, ?, ?, ?,'active')
    `);

    const run = db.transaction(() => {
      const usin = generateUSIN(
        db,
        Number.parseInt(academic_year_id, 10),
        Number.parseInt(class_id, 10),
      );

      const parentName = father_name || father_first_name || '';

      const masterResult = insertMaster.run(
        usin,
        photo_path || '',
        surname || '',
        student_name.trim(),
        dob || null,
        gender || '',
        religion || '',
        caste || '',
        nationality || '',
        blood_group || '',
        mother_tongue || '',
        address || '',
        parentName,
        father_education || '',
        father_occupation || '',
        father_aadhaar_no || '',
        father_govt_proof_path || '',
        emergency_contact_father || '',
        mother_name || '',
        mother_education || '',
        mother_occupation || '',
        mother_aadhaar_no || '',
        mother_govt_proof_path || '',
        emergency_contact_mother || '',
        birth_certificate_path || '',
        status || 'Active',
      );

      insertEnrollment.run(
        masterResult.lastInsertRowid,
        Number.parseInt(academic_year_id, 10),
        Number.parseInt(class_id, 10),
        section_id ? Number.parseInt(section_id, 10) : null,
        roll_number ? Number.parseInt(roll_number, 10) : null,
        agreed_annual_fee ? Number.parseFloat(agreed_annual_fee) : 0,
      );

      return masterResult.lastInsertRowid;
    });

    const studentId = run();
    return this.getById(studentId, { year_id: academic_year_id });
  },

  update(id, data) {
    const db = getDatabase();

    const masterFields = [
      'photo_path',
      'surname',
      'student_name',
      'dob',
      'gender',
      'religion',
      'caste',
      'nationality',
      'blood_group',
      'mother_tongue',
      'father_name',
      'father_education',
      'father_occupation',
      'father_aadhaar_no',
      'father_govt_proof_path',
      'emergency_contact_father',
      'mother_name',
      'mother_education',
      'mother_occupation',
      'mother_aadhaar_no',
      'mother_govt_proof_path',
      'emergency_contact_mother',
      'birth_certificate_path',
      'status',
    ];

    const masterSet = [];
    const masterParams = [];
    for (const field of masterFields) {
      if (data[field] !== undefined) {
        masterSet.push(`${field} = ?`);
        masterParams.push(data[field]);
      }
    }
    if (data.address !== undefined) {
      masterSet.push('residential_address = ?');
      masterParams.push(data.address);
    }

    if (masterSet.length > 0) {
      masterParams.push(id);
      db.prepare(`UPDATE Students_Master SET ${masterSet.join(', ')} WHERE id = ?`).run(...masterParams);
    }

    const enrollmentFields = {
      academic_year_id: data.academic_year_id,
      class_id: data.class_id,
      section_id: data.section_id,
      roll_number: data.roll_number,
      agreed_annual_fee: data.agreed_annual_fee,
    };

    const hasEnrollmentUpdate = Object.values(enrollmentFields).some((v) => v !== undefined);

    if (hasEnrollmentUpdate) {
      const yearId = getTargetYearId(db, data.academic_year_id);
      const enrollment = db.prepare(`
        SELECT id
        FROM Student_Enrollments
        WHERE student_id = ? ${yearId ? 'AND academic_year_id = ?' : ''}
        ORDER BY id DESC
        LIMIT 1
      `).get(...(yearId ? [id, yearId] : [id]));

      if (!enrollment) {
        throw new Error('Enrollment not found for the student.');
      }

      db.prepare(`
        UPDATE Student_Enrollments
        SET academic_year_id = COALESCE(?, academic_year_id),
            class_id = COALESCE(?, class_id),
            section_id = COALESCE(?, section_id),
            roll_number = COALESCE(?, roll_number),
            agreed_annual_fee = COALESCE(?, agreed_annual_fee)
        WHERE id = ?
      `).run(
        enrollmentFields.academic_year_id ?? null,
        enrollmentFields.class_id ?? null,
        enrollmentFields.section_id ?? null,
        enrollmentFields.roll_number ?? null,
        enrollmentFields.agreed_annual_fee ?? null,
        enrollment.id,
      );
    }

    return this.getById(id, { year_id: data.academic_year_id });
  },

  getStats() {
    const db = getDatabase();
    const total = db.prepare('SELECT COUNT(*) as count FROM Students_Master').get();
    const active = db.prepare("SELECT COUNT(*) as count FROM Students_Master WHERE status = 'Active'").get();
    return { total: total.count, active: active.count };
  },

  getRecent(limit = 5) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        sm.id,
        sm.usin,
        sm.student_name,
        sm.surname,
        sm.admission_date,
        cm.class_name
      FROM Students_Master sm
      LEFT JOIN Student_Enrollments se ON se.id = (
        SELECT se2.id
        FROM Student_Enrollments se2
        WHERE se2.student_id = sm.id
        ORDER BY se2.id DESC
        LIMIT 1
      )
      LEFT JOIN Classes_Master cm ON se.class_id = cm.id
      ORDER BY sm.id DESC
      LIMIT ?
    `).all(limit);
  },

  getEnrollments(studentId) {
    const db = getDatabase();

    return db.prepare(`
      SELECT
        se.id,
        se.student_id,
        se.academic_year_id,
        se.class_id,
        se.section_id,
        se.roll_number,
        se.agreed_annual_fee,
        ay.year_label,
        cm.class_name,
        cm.short_code
      FROM Student_Enrollments se
      JOIN Academic_Years ay ON ay.id = se.academic_year_id
      JOIN Classes_Master cm ON cm.id = se.class_id
      WHERE se.student_id = ?
      ORDER BY ay.id DESC, se.id DESC
    `).all(studentId);
  },

  getFeesSummaryByYear(studentId) {
    const db = getDatabase();

    return db.prepare(`
      SELECT
        se.id AS enrollment_id,
        se.student_id,
        se.academic_year_id,
        ay.year_label,
        se.class_id,
        cm.class_name,
        se.roll_number,
        COALESCE(se.agreed_annual_fee, 0) AS total_fee,
        COALESCE(p.total_paid, 0) AS total_paid,
        CASE
          WHEN COALESCE(se.agreed_annual_fee, 0) - COALESCE(p.total_paid, 0) > 0
          THEN COALESCE(se.agreed_annual_fee, 0) - COALESCE(p.total_paid, 0)
          ELSE 0
        END AS pending_balance
      FROM Student_Enrollments se
      JOIN Academic_Years ay ON ay.id = se.academic_year_id
      JOIN Classes_Master cm ON cm.id = se.class_id
      LEFT JOIN (
        SELECT
          enrollment_id,
          SUM(amount_paid) AS total_paid
        FROM Payments
        WHERE status = 'Active'
        GROUP BY enrollment_id
      ) p ON p.enrollment_id = se.id
      WHERE se.student_id = ?
      ORDER BY ay.id DESC, se.id DESC
    `).all(studentId);
  },

  updateStatus(studentId, status) {
    const db = getDatabase();
    const normalizedStatus = normalizeStudentStatus(status);

    const result = db.prepare('UPDATE Students_Master SET status = ? WHERE id = ?').run(normalizedStatus, studentId);
    if (result.changes === 0) {
      throw new Error('Student not found.');
    }

    return this.getById(studentId);
  },
};

module.exports = StudentModel;
