import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  sheet: {
    flexDirection: 'row',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000',
  },

  copyContainer: {
    width: '50%',
    height: '100%',
    paddingHorizontal: 18,
    justifyContent:'center',
    paddingTop: 14,
    paddingBottom: 12,
  },
  copyDivider: {
    width: 1,
    backgroundColor: '#9ca3af',
  },

  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    color: '#000',
    fontSize: 9,
  },

  headerWrap: {
    borderWidth: 1,
    borderColor: '#000',
    // marginBottom: 6,
    padding: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 55,
    // border:'1px solid #000',
    height: 55,
    objectFit: 'contain',
  },
  centerHeader: {
    flex: 1,
    paddingHorizontal: 6,
    alignItems: 'left',
  },
  groupName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  companyMeta: {
    fontSize: 8.5,
    color: '#000',
    // textAlign: 'center',
    marginTop: 1,
  },

  titleBar: {
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    paddingVertical: 3,
    // marginBottom: 6,
    backgroundColor: '#AAAAAA',
  },
  titleText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },

  lineRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 24,
  },
  lineCellLabel: {
    width: 86,
    borderRightWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 6,
    paddingTop: 5,
    fontWeight: 'bold',
    color: '#000',
  },
  lineCellValue: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 5,
  },

  splitRow: {
    flexDirection: 'row',
  },
  splitCol: {
    flex: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    minHeight: 24,
    paddingHorizontal: 6,
    paddingTop: 5,
  },
  splitColLeft: {
    borderRightWidth: 0,
  },
  splitLabel: {
    fontWeight: 'bold',
    color: '#000',
  },
  splitValue: {
    marginTop: 1,
  },

  summaryWrap: {
    borderWidth: 1,
    borderColor: '#000',
    // marginTop: 6,
  },
  summaryTitle: {
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: '#000',
    minHeight: 40,
  },
  summaryCellLast: {
    borderRightWidth: 0,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  payModeWrap: {
    // marginTop: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  payModeTitle: {
    borderBottomWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    paddingVertical: 3,
  },
  payModeRow: {
    flexDirection: 'row',
    minHeight: 24,
  },
  payModeCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 5,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  payModeCellLast: {
    borderRightWidth: 0,
  },
  payModeLabel: {
    fontWeight: 'bold',
    color: '#000',
  },

  totalRow: {
    // marginTop: 6,
    borderWidth: 1,
    borderColor: '#000',
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  totalLabel: {
    fontWeight: 'bold',
    width: 54,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  wordsRow: {
    // marginTop: 6,
    borderWidth: 1,
    borderColor: '#000',
    minHeight: 28,
    paddingHorizontal: 6,
    paddingTop: 5,
  },
  wordsLabel: {
    fontWeight: 'bold',
    color: '#000',
  },

  signatureRow: {
    paddingTop: 80,
     paddingBottom: 15,
    flexDirection: 'row',
     borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'space-between',
    gap: 8,
  },
  sigBlock: {
    flex: 1,
    alignItems: 'center',
  },
  sigLine: {
    width: '90%',
    borderTopWidth: 1,
    borderColor: '#000',
    marginBottom: 3,
  },
  sigText: {
    fontSize: 8.5,
    color: '#000',
  },
});

function formatDate(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function amount(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeText(v, fallback = '-') {
  const s = String(v ?? '').trim();
  return s || fallback;
}

function getAcademicYear(student) {
  const v = String(student?.year_label || '').trim();
  return v || '----';
}

function getStudentName(student) {
  const a = String(student?.surname || '').trim();
  const b = String(student?.student_name || '').trim();
  return `${a} ${b}`.trim() || '-';
}

function getContactLine(student) {
  const mother = String(student?.emergency_contact_mother || '').trim();
  const father = String(student?.emergency_contact_father || '').trim();
  if (mother && father) return `${mother} & ${father}`;
  if (mother) return mother;
  if (father) return father;
  return '-';
}

function ReceiptCopy({ payment, student, company, ledger, copy }) {
  const totalFee = Number(ledger?.total_fee || 0);
  const totalPaid = Number(ledger?.total_paid || 0);
  const balance = Number(ledger?.balance || 0);
  const paidNow = Number(payment?.amount_paid || 0);

  return (
    <View style={styles.copyContainer}>
      <View style={styles.topLine}>
        <Text>Fee Receipt</Text>
        <Text>{copy === 1 ? 'Office Copy' : 'Student Copy'}</Text>
      </View>
      <View style={{ border: '1px solid #000' }}>

        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            {/* {company?.logo_base64_secondary ? <Image src={company.logo_base64_secondary} style={styles.logo} /> : <View style={styles.logo} />} */}

            <View style={styles.centerHeader}>
              {!!company?.group_name && <Text style={styles.groupName}>{company.group_name}</Text>}
              <Text style={styles.companyName}>{safeText(company?.firm_name, 'School Name')}</Text>
              <Text style={styles.companyMeta}>{safeText(company?.address, 'School Address')}</Text>
              <Text style={styles.companyMeta}>
                {safeText(company?.email, '-')} | {safeText(company?.phone, '-')}
              </Text>
              {!!company?.website && <Text style={styles.companyMeta}>Website: {company.website}</Text>}
              {!!company?.reg_no && <Text style={styles.companyMeta}>Reg No: {company.reg_no}</Text>}
            </View>

            {company?.logo_base64_primary ? <Image src={company.logo_base64_primary} style={styles.logo} /> : <View style={styles.logo} />}
          </View>
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>FEE RECEIPT ({getAcademicYear(student)})</Text>
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.splitCol, styles.splitColLeft]}>
            <Text style={styles.splitLabel}>Receipt No</Text>
            <Text style={styles.splitValue}>{safeText(payment?.receipt_no)}</Text>
          </View>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>Date</Text>
            <Text style={styles.splitValue}>{formatDate(payment?.payment_date)}</Text>
          </View>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineCellLabel}>Name</Text>
          <Text style={styles.lineCellValue}>{getStudentName(student)}</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineCellLabel}>Class</Text>
          <Text style={styles.lineCellValue}>{safeText(student?.class_name)}</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineCellLabel}>USIN</Text>
          <Text style={styles.lineCellValue}>{safeText(student?.usin)}</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineCellLabel}>Parent Contact</Text>
          <Text style={styles.lineCellValue}>{getContactLine(student)}</Text>
        </View>

        {/* <Text style={styles.summaryTitle}>Overview</Text> */}

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>OVERVIEW</Text>
        </View>



        <View style={styles.summaryWrap}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Fee Applied</Text>
              <Text style={styles.summaryValue}>INR {amount(totalFee)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Paid Now</Text>
              <Text style={styles.summaryValue}>INR {amount(paidNow)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>INR {amount(totalPaid)}</Text>
            </View>
            <View style={[styles.summaryCell, styles.summaryCellLast]}>
              <Text style={styles.summaryLabel}>Total Due</Text>
              <Text style={styles.summaryValue}>INR {amount(balance)}</Text>
            </View>
          </View>
        </View>

          {/* <Text style={styles.payModeTitle}>PAY MODE INFORMATION</Text> */}
                  <View style={styles.titleBar}>
          <Text style={styles.titleText}>PAY MODE INFORMATION</Text>
        </View>
        <View style={styles.payModeWrap}>
          <View style={styles.payModeRow}>
            <View style={styles.payModeCell}>
              <Text style={styles.payModeLabel}>Pay Mode</Text>
              <Text>{safeText(payment?.payment_mode, 'Cash')}</Text>
            </View>
            <View style={[styles.payModeCell, styles.payModeCellLast]}>
              <Text style={styles.payModeLabel}>Reference</Text>
              <Text>{safeText(payment?.reference_no || payment?.transaction_id || '')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{amount(paidNow)}</Text>
        </View>

        <View style={styles.wordsRow}>
          <Text style={styles.wordsLabel}>Total in Words:</Text>
          <Text>{safeText(payment?.amount_in_words || '')}</Text>
        </View>

        <View style={styles.signatureRow}>
          {/* <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Staff Sign</Text>
          </View> */}
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Parent Sign</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Signature & Stamp</Text>
          </View>
        </View>


      </View>
    </View>
  );
}

export const FeesReceiptPDF = ({ payment, student, company, ledger }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.sheet}>
        <ReceiptCopy payment={payment} student={student} company={company} ledger={ledger} copy={1} />
        <View style={styles.copyDivider} />
        <ReceiptCopy payment={payment} student={student} company={company} ledger={ledger} copy={2} />
      </Page>
    </Document>
  );
};