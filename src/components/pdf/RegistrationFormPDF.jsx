import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #000', paddingBottom: 10 },
  companyInfo: { flexDirection: 'column' },
  companyName: { fontSize: 18, fontWeight: 'bold' },
  logoBody: { width: 60, height: 60 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, textDecoration: 'underline' },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 150, fontWeight: 'bold' },
  value: { flex: 1, borderBottom: '1px dotted #000' },
  photoBox: { width: 100, height: 120, border: '1px solid #000', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }
});

export const RegistrationFormPDF = ({ student, company, isEmpty, localPhotoUrl }) => {
  const getVal = (val) => isEmpty ? '' : (val || '');
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.firm_name || 'School Name'}</Text>
            <Text>{company?.address || 'School Address'}</Text>
            <Text>Phone: {company?.phone || '-'}</Text>
          </View>
          {company?.logo_path && !isEmpty && (
            <View>
              {/* Note: This requires the logo to be accessible via URL or base64. 
                  In Electron, we might need to pass the base64 string directly */}
              {localPhotoUrl && <Image src={localPhotoUrl} style={styles.logoBody} />}
            </View>
          )}
        </View>

        <Text style={styles.title}>ADMISSION FORM</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Sr. No:</Text>
              <Text style={styles.value}>{getVal(student?.sr_no)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Financial Year:</Text>
              <Text style={styles.value}>{getVal(student?.year_label)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date of Admission:</Text>
              <Text style={styles.value}>{isEmpty ? '' : (student?.admission_date ? new Date(student.admission_date).toLocaleDateString() : '')}</Text>
            </View>
          </View>
          <View style={styles.photoBox}>
            {isEmpty || !localPhotoUrl ? (
              <Text style={{ color: '#ccc' }}>Affix Photo</Text>
            ) : (
              <Image src={localPhotoUrl} style={{ width: '100%', height: '100%' }} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Student's Surname:</Text>
            <Text style={styles.value}>{getVal(student?.surname)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student's Name:</Text>
            <Text style={styles.value}>{getVal(student?.student_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Father's First Name:</Text>
            <Text style={styles.value}>{getVal(student?.father_first_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{getVal(student?.dob)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Class Section:</Text>
            <Text style={styles.value}>{getVal(student?.class_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Religion:</Text>
            <Text style={styles.value}>{getVal(student?.religion)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Caste:</Text>
            <Text style={styles.value}>{getVal(student?.caste)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mother Tongue:</Text>
            <Text style={styles.value}>{getVal(student?.mother_tongue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Residential Address:</Text>
            <Text style={styles.value}>{getVal(student?.address)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Father's Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name in Full:</Text>
            <Text style={styles.value}>{getVal(student?.father_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Education:</Text>
            <Text style={styles.value}>{getVal(student?.father_education)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occupation:</Text>
            <Text style={styles.value}>{getVal(student?.father_occupation)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number:</Text>
            <Text style={styles.value}>{getVal(student?.emergency_contact_father)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Mother's Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name in Full:</Text>
            <Text style={styles.value}>{getVal(student?.mother_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Education:</Text>
            <Text style={styles.value}>{getVal(student?.mother_education)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occupation:</Text>
            <Text style={styles.value}>{getVal(student?.mother_occupation)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number:</Text>
            <Text style={styles.value}>{getVal(student?.emergency_contact_mother)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ borderTop: '1px solid #000', width: 200, paddingTop: 5, alignItems: 'center' }}>
            <Text>Parent's Signature</Text>
          </View>
          <View style={{ borderTop: '1px solid #000', width: 200, paddingTop: 5, alignItems: 'center' }}>
            <Text>Authority Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
