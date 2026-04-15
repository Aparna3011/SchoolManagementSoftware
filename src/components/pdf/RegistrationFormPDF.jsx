import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registering a cleaner font pair
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1bMA86S__8EyM6p5f5I2k_vXNQ.ttf' 
});

const styles = StyleSheet.create({
  // Strictly set for A4, adjusted padding to fit all data comfortably
  page: { padding: 35, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5, color: '#1a1a1a' },
  
  // Header Section
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottom: 2, borderBottomColor: '#333', paddingBottom: 10 },
  motto: { fontSize: 9, marginBottom: 4, textAlign: 'center', width: '100%', fontStyle: 'italic' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#b91c1c', letterSpacing: 1 },
  addressText: { fontSize: 9, color: '#4b5563', marginTop: 2 },
  logo: { width: 65, height: 65, objectFit: 'contain' },

  // Metadata Section (Sr No, Year, Photo)
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metaColumn: { flex: 1, gap: 4 },
  photoBox: { width: 85, height: 105, border: '1px solid #d1d5db', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  photoText: { fontSize: 8, color: '#9ca3af' },

  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 2, borderBottom: 1, width: 150, alignSelf: 'center' },

  // Field Layout
  sectionHeader: { fontSize: 10, fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '4 8', marginBottom: 8, borderRadius: 2, color: '#111827' },
  row: { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  label: { width: 130, fontWeight: 'bold', fontSize: 9, color: '#374151' },
  value: { flex: 1, borderBottom: '0.5px solid #d1d5db', paddingBottom: 2, marginLeft: 10, fontSize: 10 },
  
  // Instructions
  instructionSection: { marginTop: 15, padding: 8, backgroundColor: '#fef2f2', borderRadius: 4 },
  instructionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#b91c1c' },
  instructionText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },

  // Signatures
  footer: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sigLine: { borderTop: '1px solid #333', width: 160, textAlign: 'center', paddingTop: 6, fontSize: 9, fontWeight: 'bold' }
});

export const RegistrationFormPDF = ({ student, company, isEmpty, localPhotoUrl }) => {
  const getVal = (val) => isEmpty ? '' : (val || '');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* <Text style={styles.motto}>|| बालदेवो भव ||</Text> */}
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            {/* <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Reg. No: {company?.reg_no || 'Mah./13402/1-4-1998'}</Text> */}
            <Text style={styles.companyName}>{company?.firm_name || 'RAINBOW PLAY SCHOOL'}</Text>
            <Text style={styles.addressText}>{company?.address || '2118, D, Janwadkar\'s Complex, Shukrawar Peth, Kolhapur - 416 002'}</Text>
            <Text style={styles.addressText}>Mob: {company?.phone || '9653104744'}</Text>
          </View>
          {company?.logo_base64 && <Image src={company.logo_base64} style={styles.logo} />}
        </View>

        <Text style={styles.title}>Admission Form</Text>

        {/* Top Metadata */}
        <View style={styles.metaContainer}>
          <View style={styles.metaColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Sr. No:</Text>
              <Text style={styles.value}>{getVal(student?.sr_no)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date of Admission:</Text>
              <Text style={styles.value}>{isEmpty ? '' : (student?.admission_date ? new Date(student.admission_date).toLocaleDateString() : '')}</Text>
            </View>
          </View>
          <View style={styles.photoBox}>
            {isEmpty || !localPhotoUrl ? <Text style={styles.photoText}>Affix Photo</Text> : <Image src={localPhotoUrl} style={{ width: '100%', height: '100%', borderRadius: 4 }} />}
          </View>
        </View>

        {/* 1-5: Student Details (Restored exactly to original) */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHeader}>STUDENT INFORMATION</Text>
          <View style={styles.row}><Text style={styles.label}>1. Name of the Student:</Text><Text style={styles.value}>{getVal(student?.surname)} {getVal(student?.student_name)} {getVal(student?.father_first_name)}</Text></View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 130 }]}>2. Date of Birth:</Text><Text style={styles.value}>{getVal(student?.dob)}</Text></View>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 60 }]}>3. Class:</Text><Text style={styles.value}>{getVal(student?.class_name)}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 130 }]}>4. Religion:</Text><Text style={styles.value}>{getVal(student?.religion)}</Text></View>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 60 }]}>Caste:</Text><Text style={styles.value}>{getVal(student?.caste)}</Text></View>
          </View>
          <View style={styles.row}><Text style={styles.label}>5. Residential Address:</Text><Text style={styles.value}>{getVal(student?.address)}</Text></View>
        </View>

        {/* 6-12: Parent Details (Restored Missing Information) */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHeader}>PARENTAL DETAILS</Text>
          <View style={styles.row}><Text style={styles.label}>6. Name of the Father in full:</Text><Text style={styles.value}>{getVal(student?.father_name)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>7. Father's Education:</Text><Text style={styles.value}>{getVal(student?.father_education)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>8. Father's Occupation:</Text><Text style={styles.value}>{getVal(student?.father_occupation)}</Text></View>
          
          <View style={[styles.row, { marginTop: 6 }]}><Text style={styles.label}>9. Name of the Mother in full:</Text><Text style={styles.value}>{getVal(student?.mother_name)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>10. Mother's Education:</Text><Text style={styles.value}>{getVal(student?.mother_education)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>11. Mother's Occupation:</Text><Text style={styles.value}>{getVal(student?.mother_occupation)}</Text></View>
          
          <View style={[styles.row, { marginTop: 6 }]}><Text style={styles.label}>12. Mother Tongue:</Text><Text style={styles.value}>{getVal(student?.mother_tongue)}</Text></View>
        </View>

        {/* 13: Emergency Contacts */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHeader}>CONTACT IN EMERGENCY</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 80 }]}>Mob. Mother:</Text><Text style={styles.value}>{getVal(student?.emergency_contact_mother)}</Text></View>
            <View style={[styles.row, { flex: 1 }]}><Text style={[styles.label, { width: 80 }]}>Mob. Father:</Text><Text style={styles.value}>{getVal(student?.emergency_contact_father)}</Text></View>
          </View>
        </View>

        {/* Instructions Section (Exactly as original form) */}
        <View style={styles.instructionSection}>
          <Text style={styles.instructionTitle}>GENERAL INSTRUCTIONS</Text>
          <Text style={styles.instructionText}>1) The School does not undertake any responsibility for admission to Higher Classes.</Text>
          <Text style={styles.instructionText}>2) Punctuality and Regularity in attendance be strictly observed.</Text>
          <Text style={styles.instructionText}>3) Fees once paid will not be refunded.</Text>
          <Text style={styles.instructionText}>4) Gathering is compulsory, in case who is absent for gathering money will not be refunded.</Text>
          <Text style={styles.instructionText}>5) Picnic will not be compulsory. Picnic Fee will be charged seperately to students, who want to come for picnic. In case those who are absent for picnic money will not be refunded.</Text>
          
          <Text style={[styles.instructionText, { marginTop: 6, fontWeight: 'bold', color: '#111827' }]}>• I HAVE READ ABOVE INSTRUCTIONS AND AGREE TO ABIDE BY THEM.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.sigLine}>Signature of Teacher</Text>
          <Text style={styles.sigLine}>Signature of the Parent</Text>
        </View>
      </Page>
    </Document>
  );
};