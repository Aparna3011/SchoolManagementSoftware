/**
 * Generate a USIN in format: [SCHOOL_CODE][START_YEAR][CLASS_SHORT_CODE][0001]
 * Example: SV2026PG0001
 */
function generateUSIN(db, academicYearId, classId) {
  const company = db
    .prepare('SELECT school_code FROM Company_Profile WHERE id = 1')
    .get();
  const year = db
    .prepare('SELECT start_year FROM Academic_Years WHERE id = ?')
    .get(academicYearId);
  const classMaster = db
    .prepare('SELECT short_code FROM Classes_Master WHERE id = ?')
    .get(classId);

  if (!company?.school_code) {
    throw new Error('School code is not configured in company profile.');
  }
  if (!year?.start_year) {
    throw new Error('Academic year is invalid or missing start year.');
  }
  if (!classMaster?.short_code) {
    throw new Error('Class is invalid or missing short code.');
  }

  const prefix = `${company.school_code}${year.start_year}${classMaster.short_code}`;

  const lastRecord = db
    .prepare(
      `
      SELECT usin
      FROM Students_Master
      WHERE usin LIKE ?
      ORDER BY usin DESC
      LIMIT 1
    `,
    )
    .get(`${prefix}%`);

  let nextSeq = 1;
  if (lastRecord?.usin) {
    const lastSeqString = lastRecord.usin.slice(-4);
    nextSeq = Number.parseInt(lastSeqString, 10) + 1;
  }

  if (nextSeq > 9999) {
    throw new Error(`USIN limit reached for prefix ${prefix}.`);
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

module.exports = { generateUSIN };
