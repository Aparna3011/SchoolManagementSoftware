import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  sheet: {
    flexDirection: 'row',
    fontSize: 10,
    fontFamily: 'Helvetica',
    // border: '1px solid red',
  },
  copyContainer: { width: '50%', 
    height: '100%',
     padding: 30,
     paddingBottom: 0,
    // border: '1px solid blue', 
  },
  copyDivider: { width: 1, backgroundColor: '#5C6675' },
  header: { alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #000', paddingBottom: 10 },
  companyName: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  subText: { fontSize: 10, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginVertical: 15, textDecoration: 'underline' },
  row: { flexDirection: 'row', marginBottom: 8 },
  colHalf: { width: '50%', flexDirection: 'row' },
  label: { width: 80, fontWeight: 'bold' },
  value: { flex: 1, borderBottom: '1px dotted #000' },
  amountBox: { marginTop: 20, borderWidth: 1, borderColor: '#000', padding: 10 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  amountLabel: { fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#000', fontWeight: 'bold', fontSize: 12 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signLine: { borderTop: '1px solid #000', width: 150, paddingTop: 5, textAlign: 'center' }
});

function ReceiptCopy({ payment, student, company, ledger }) {
  return (
    <View style={styles.copyContainer}>
      <View style={styles.header}>
        {!!company?.group_name && <Text style={styles.subText}>{company.group_name}</Text>}
        <Text style={styles.companyName}>{company?.firm_name || 'School Name'}</Text>
        <Text style={styles.subText}>{company?.address || 'School Address'}</Text>
        <Text style={styles.subText}>Phone: {company?.phone || '-'} | Email: {company?.email || '-'}</Text>
      </View>

      <Text style={styles.title}>FEE RECEIPT</Text>

      <View style={styles.row}>
        <View style={styles.colHalf}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.value}>{payment?.receipt_no}</Text>
        </View>
        <View style={styles.colHalf}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString() : ''}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.colHalf}>
          <Text style={styles.label}>USIN:</Text>
          <Text style={styles.value}>{student?.usin || '-'}</Text>
        </View>
        <View style={styles.colHalf}>
          <Text style={styles.label}>Year:</Text>
          <Text style={styles.value}>{student?.year_label || '-'}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.colHalf}>
          <Text style={styles.label}>Student Name:</Text>
          <Text style={styles.value}>{student?.surname || ''} {student?.student_name}</Text>
        </View>
        <View style={styles.colHalf}>
          <Text style={styles.label}>Class:</Text>
          <Text style={styles.value}>{student?.class_name}</Text>
        </View>
      </View>

      <View style={styles.amountBox}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Paid Amount:</Text>
          <Text>Rs. {(payment?.amount_paid || 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Payment Mode:</Text>
          <Text>{payment?.payment_mode || 'Cash'}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Remaining Balance:</Text>
          <Text>Rs. {(ledger?.balance ?? 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.signLine}>
          <Text>Parent's Sign</Text>
        </View>
        <View style={styles.signLine}>
          <Text>Authorized Signatory</Text>
        </View>
      </View>
    </View>
  );
}

export const FeesReceiptPDF = ({ payment, student, company, ledger }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.sheet}>
        <ReceiptCopy payment={payment} student={student} company={company} ledger={ledger} />
        <View style={styles.copyDivider} />
        <ReceiptCopy payment={payment} student={student} company={company} ledger={ledger} />
      </Page>
    </Document>
  );
};
