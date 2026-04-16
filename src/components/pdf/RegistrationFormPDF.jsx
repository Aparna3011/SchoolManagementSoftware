import { Document, Page, Text, View, StyleSheet, Image, Font, Checkbox } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1bMA86S__8EyM6p5f5I2k_vXNQ.ttf',
});

const styles = StyleSheet.create({
  // More side margin, tighter top/bottom so form uses full page height
  page: {
    paddingHorizontal: 50,
    paddingTop: 25,
    paddingBottom: 30,
    fontSize: 9.4,
    // border: '3px solid red',
    fontFamily: 'Helvetica',
    lineHeight: 1.22,
    color: '#1a1a1a',
    justifyContent: 'space-between',
  },
  leftAlignContent: { flex: 1 },
  centerAlignContent: { flex: 1, alignItems: 'center' },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
    borderBottomWidth: 1.8,
    borderBottomColor: '#5E5E5E',
    paddingBottom: 10,
  },
  groupName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#7f1d1d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    // backgroundColor: '#fee2e2',
    // padding: '2 6',
    borderRadius: 2,
    // alignSelf: 'flex-start',
    marginBottom: 3,
  },
  companyName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#b91c1c',
    letterSpacing: 1,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 9,
    paddingHorizontal: 12,
    textAlign: 'center',
    color: '#323943',
    marginTop: 1.5,
  },
  logo: {
    width: 120,
    // border: '1px solid #d1d5db',
    height: 120,
    objectFit: 'contain',
  },

  title: {
    fontSize: 12.8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    borderBottom: 1,
    width: 132,
    alignSelf: 'center',
  },


  metaTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 1,
    alignItems: 'flex-end',
  },
  metaTopField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  metaTopLabel: {
    width: 98,
    fontWeight: 'bold',
    fontSize: 8.1,
    color: '#374151',
  },
  metaTopValue: {
    flex: 1,
    borderBottom: '0.8px solid #9ca3af',
    minHeight: 14,
    paddingBottom: 2.5,
    marginLeft: 8,
    fontSize: 8.9,
  },
  // Meta
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaColumn: {
    flex: 1,
    gap: 4,
  },
  photoBox: {
    width: 78,
    height: 96,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  photoText: {
    fontSize: 7.4,
    color: '#9ca3af',
  },

  // Form layout
  sectionHeader: {
    fontSize: 9.1,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: '3 7',
    marginBottom: 5,
    borderRadius: 2,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5.5,
    alignItems: 'flex-end',
  },
  label: {
    width: 122,
    fontWeight: 'bold',
    fontSize: 8.1,
    color: '#374151',
  },

  // Better writable lines
  value: {
    flex: 1,
    borderBottom: '0.8px solid #9ca3af',
    minHeight: 14,
    paddingBottom: 2.5,
    marginLeft: 8,
    fontSize: 8.9,
  },
  valueTall: {
    flex: 1,
    borderBottom: '0.8px solid #9ca3af',
    minHeight: 17,
    paddingBottom: 2.5,
    marginLeft: 8,
    fontSize: 8.9,
  },
  checkboxLine: {
    flex: 1,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    minHeight: 14,
    paddingBottom: 2.5,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxBox: {
    width: 12,
    height: 12,
    border: '0.8px solid #6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTick: {
    width: 4,
    height: 7,
    borderRightWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: '#111827',
    transform: 'rotate(45deg)',
    marginTop: -1,
    color: '#111827',
  },
  checkboxLabel: {
    fontSize: 7.7,
    color: '#374151',
  },

  block: { marginBottom: 8 },

  // Instructions
  instructionSection: {
    marginTop: 8,
    padding: 6.5,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  instructionTitle: {
    fontSize: 8.4,
    fontWeight: 'bold',
    marginBottom: 2.5,
    color: '#b91c1c',
  },
  instructionText: {
    fontSize: 7.2,
    color: '#4b5563',
    marginBottom: 1.7,
  },
  nameField: {
    flex: 1,
    marginLeft: 8,
  },
  nameFieldLabel: {
    fontSize: 8.1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#55647C',
    marginTop: 2,
  },
  nameFieldValue: {
    borderBottom: '0.8px solid #9ca3af',
    minHeight: 14,
    paddingBottom: 2.5,
    fontSize: 8.9,
  },

  // Footer signatures - bigger lines for actual signing
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sigLine: {
    borderTop: '1px solid #333',
    width: 185,
    textAlign: 'center',
    paddingTop: 5,
    fontSize: 8.3,
    fontWeight: 'bold',
  },
});

export const RegistrationFormPDF = ({ student, company, isEmpty, localPhotoUrl }) => {
  const getVal = (val) => (isEmpty ? '' : (val || ''));
  const hasUpload = (val) => !isEmpty && typeof val === 'string' && val.trim().length > 0;

  const fatherProofUploaded = hasUpload(student?.father_govt_proof_path);
  const motherProofUploaded = hasUpload(student?.mother_govt_proof_path);
  const birthCertificateUploaded = hasUpload(student?.birth_certificate_path);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          {/* Header */}
          <View style={styles.headerContainer}>
            {company?.logo_base64_secondary && <Image src={company.logo_base64_secondary} style={styles.logo} />}
            <View style={company?.logo_base64_secondary ? styles.centerAlignContent : styles.leftAlignContent}>
              {!!company?.group_name && <Text style={styles.groupName}>{company.group_name}</Text>}
              <Text style={styles.companyName}>{company?.firm_name}</Text>
              <Text style={styles.addressText}>
                {company?.address}
              </Text>
              <Text style={styles.addressText}>Mob: {company?.phone}</Text>
              {!!company?.website && <Text style={styles.addressText}>Website: {company.website}</Text>}
              {!!company?.reg_no && <Text style={styles.addressText}>Reg. No: {company.reg_no}</Text>}
            </View>
            {company?.logo_base64_primary && <Image src={company.logo_base64_primary} style={styles.logo} />}
          </View>

          <Text style={styles.title}>Admission Form</Text>

          {/* Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaColumn}>
              <View style={styles.metaTopRow}>
                <View style={styles.metaTopField}>
                  <Text style={styles.metaTopLabel}>USIN:</Text>
                  <Text style={styles.metaTopValue}>{getVal(student?.usin)}</Text>
                </View>

                <View style={styles.metaTopField}>
                  <Text style={styles.metaTopLabel}>Date of Admission:</Text>
                  <Text style={styles.metaTopValue}>
                    {isEmpty ? '' : (student?.admission_date ? new Date(student.admission_date).toLocaleDateString() : '')}
                  </Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Father's Aadhaar:</Text>
                <Text style={styles.value}>{getVal(student?.father_aadhaar_no)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Mother's Aadhaar:</Text>
                <Text style={styles.value}>{getVal(student?.mother_aadhaar_no)}</Text>
              </View>
              <View style={[styles.row, { alignItems: 'center' }]}>
                <Text style={styles.label}>Documents:</Text>
                <View style={styles.checkboxLine}>
                  <View style={styles.checkboxItem}>
                    <View style={styles.checkboxBox}>
                      {fatherProofUploaded ? <View style={styles.checkboxTick} /> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>Father Proof</Text>
                  </View>
                  <View style={styles.checkboxItem}>
                    <View style={styles.checkboxBox}>
                      {motherProofUploaded ? <View style={styles.checkboxTick} /> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>Mother Proof</Text>
                  </View>
                  <View style={styles.checkboxItem}>
                    <View style={styles.checkboxBox}>
                      {birthCertificateUploaded ? <View style={styles.checkboxTick} /> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>Birth Certificate</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.photoBox}>
              {isEmpty || !localPhotoUrl ? (
                <Text style={styles.photoText}>Affix Photo</Text>
              ) : (
                <Image src={localPhotoUrl} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
              )}
            </View>
          </View>

          {/* Student info */}
          <View style={styles.block}>
            <Text style={styles.sectionHeader}>STUDENT INFORMATION</Text>
            <View style={styles.row}>
              <Text style={styles.label}> Name of the Student:</Text>

              <View style={styles.nameField}>
                <Text style={styles.nameFieldValue}>{getVal(student?.surname)}</Text>
                <Text style={styles.nameFieldLabel}>Surname</Text>
              </View>

              <View style={styles.nameField}>
                <Text style={styles.nameFieldValue}>{getVal(student?.student_name)}</Text>
                <Text style={styles.nameFieldLabel}>First</Text>
              </View>

              <View style={styles.nameField}>
                <Text style={styles.nameFieldValue}>{getVal(student?.father_first_name)}</Text>
                <Text style={styles.nameFieldLabel}>Middle</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 122 }]}>Nationality:</Text>
                <Text style={styles.valueTall}>{getVal(student?.nationality)}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 60 }]}>Mother  Tongue:</Text>
                <Text style={styles.value}>{getVal(student?.mother_tongue)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 122 }]}> Date of Birth ( dd / mm / yyyy ):</Text>
                <Text style={styles.value}>{student?.dob}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 58 }]}> Class:</Text>
                <Text style={styles.value}>{getVal(student?.class_name)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 122 }]}> Religion:</Text>
                <Text style={styles.value}>{getVal(student?.religion)}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 58 }]}>Caste:</Text>
                <Text style={styles.value}>{getVal(student?.caste)}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}> Residential Address:</Text>
              <Text style={styles.valueTall}>{getVal(student?.address)}</Text>
            </View>

          </View>

          {/* Parent details */}
          <View style={styles.block}>
            <Text style={styles.sectionHeader}>PARENTAL DETAILS</Text>
            <View style={styles.row}>
              <Text style={styles.label}> Name of the Father in full:</Text>
              <Text style={styles.value}>{getVal(student?.father_name)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 120 }]}> Father's Education:</Text>
                <Text style={styles.value}>{getVal(student?.father_education)}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 80 }]}> Father's Occupation:</Text>
                <Text style={styles.value}>{getVal(student?.father_occupation)}</Text>
              </View>
            </View>

            <View style={[styles.row, { marginTop: 3.5 }]}>
              <Text style={styles.label}> Name of the Mother in full:</Text>
              <Text style={styles.value}>{getVal(student?.mother_name)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 120 }]}>Mother's Education:</Text>
                <Text style={styles.value}>{getVal(student?.mother_education)}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 80 }]}>Mother's Occupation:</Text>
                <Text style={styles.value}>{getVal(student?.mother_occupation)}</Text>
              </View>
            </View>

          </View>

          {/* Emergency */}
          <View style={styles.block}>
            <Text style={styles.sectionHeader}>CONTACT IN EMERGENCY</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 74 }]}>Mob. Mother:</Text>
                <Text style={styles.value}>{getVal(student?.emergency_contact_mother)}</Text>
              </View>
              <View style={[styles.row, { flex: 1 }]}>
                <Text style={[styles.label, { width: 74 }]}>Mob. Father:</Text>
                <Text style={styles.value}>{getVal(student?.emergency_contact_father)}</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionSection}>
            <Text style={styles.instructionTitle}>GENERAL INSTRUCTIONS</Text>
            <Text style={styles.instructionText}>1) The School does not undertake any responsibility for admission to Higher Classes.</Text>
            <Text style={styles.instructionText}>2) Punctuality and Regularity in attendance be strictly observed.</Text>
            <Text style={styles.instructionText}>3) Fees once paid will not be refunded.</Text>
            <Text style={styles.instructionText}>4) Gathering is compulsory,fees will be applicable as per schedule, in case who is absent for gathering money will not be refunded.</Text>
            <Text style={styles.instructionText}>5) Picnic will not be compulsory. Picnic Fee will be charged seperately to students, who want to come for picnic. In case those who are absent for picnic money will not be refunded.</Text>
            <Text style={[styles.instructionText, { marginTop: 4, fontWeight: 'bold', color: '#111827' }]}>
              • I HAVE READ ABOVE INSTRUCTIONS AND AGREE TO ABIDE BY THEM.
            </Text>
          </View>
        </View>

        {/* Signature Footer pinned lower on page */}
        <View style={styles.footer}>
          <Text style={styles.sigLine}>Signature of Teacher</Text>
          <Text style={styles.sigLine}>Signature of the Parent</Text>
        </View>
      </Page>
    </Document>
  );
};