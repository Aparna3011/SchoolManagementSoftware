import { useEffect, useState } from 'react';
import { Search, IndianRupee, FileText, XCircle, AlertCircle, Download, Eye, Printer, RefreshCw } from 'lucide-react';
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FeesReceiptPDF } from '../components/pdf/FeesReceiptPDF';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function Fees() {
  const { execute, loading } = useDatabase();
  const isDevMode = import.meta.env.DEV;

  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [searched, setSearched] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_mode: 'Cash',
  });
  const [nextReceiptNo, setNextReceiptNo] = useState('');

  const [previewPayment, setPreviewPayment] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [printingPaymentId, setPrintingPaymentId] = useState(null);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
  }, [previewPdfUrl]);



  function clearPreview() {
    setPreviewPayment(null);
    setPreviewPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

  async function handleSearch(e) {
    e?.preventDefault();

    if (!searchTerm.trim()) return;

    const results = await execute(() =>
      window.api.student.getAll({ search: searchTerm }),
    );

    if (results) {
      setStudents(results.filter((s) => s.enrollment_id));
    }

    setSearched(true);
    setSelectedStudent(null);
    setLedger(null);
    clearPreview();

    if (!companyProfile) {
      const profile = await execute(() => window.api.company.get());
      if (profile) setCompanyProfile(profile);
    }
  }

  function requestCancelPayment(paymentId) {
    setCancelPaymentId(paymentId);
    setConfirmOpen(true);
  }

  async function confirmCancelPayment() {
    if (!cancelPaymentId || !selectedStudent?.enrollment_id) return;

    try {
      setCancelLoading(true);
      await execute(() => window.api.payment.cancel(cancelPaymentId));
      await loadLedger(selectedStudent.enrollment_id);
    } finally {
      setCancelLoading(false);
      setConfirmOpen(false);
      setCancelPaymentId(null);
    }
  }
  async function selectStudent(student) {
    setSelectedStudent(student);

    console.log('student information', student)
    clearPreview();
    await loadLedger(student.id);
  }

  async function loadLedger(studentId) {
    if (!studentId) return;
    const data = await execute(() => window.api.payment.getLedger(studentId));
    console.log('Ledger data loaded:', data);
    if (data) setLedger(data);
  }

  async function openPaymentModal() {
    if (!selectedStudent?.enrollment_id) return;

    const receiptNo = await execute(() => window.api.payment.generateReceiptNo());
    if (receiptNo) setNextReceiptNo(receiptNo);

    setPaymentForm({ amount_paid: '', payment_mode: 'Cash' });
    setPaymentModalOpen(true);
  }

  async function handlePayment() {
    if (!paymentForm.amount_paid || !selectedStudent?.enrollment_id) return;

    const amount = parseFloat(paymentForm.amount_paid);
    if (isNaN(amount) || amount <= 0) return;

    await execute(() =>
      window.api.payment.create({
        enrollment_id: selectedStudent.enrollment_id,
        amount_paid: amount,
        payment_mode: paymentForm.payment_mode,
      }),
    );

    setPaymentModalOpen(false);
    await loadLedger(selectedStudent.enrollment_id);
  }

  async function handleCancelPayment(paymentId) {
    if (!confirm('Are you sure you want to cancel this receipt? This action cannot be undone.')) return;

    await execute(() => window.api.payment.cancel(paymentId));
    await loadLedger(selectedStudent.enrollment_id);
  }

  async function handlePreviewReceipt(paymentRow) {

    console.log('Generating preview for payment:', paymentRow);
    if (!isDevMode || !paymentRow || !selectedStudent) return;

    try {
      setPreviewLoading(true);
      setPreviewPayment(paymentRow);

      const blob = await pdf(
        <FeesReceiptPDF
          payment={paymentRow}
          student={selectedStudent}
          company={companyProfile}
          ledger={ledger}
        />,
      ).toBlob();

      const nextUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (err) {
      console.error('Failed to generate receipt preview:', err);
      setPreviewPdfUrl('');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDirectPrintReceipt(paymentRow) {
    if (!paymentRow || !selectedStudent) return;

    try {
      setPrintingPaymentId(paymentRow.id);

      const blob = await pdf(
        <FeesReceiptPDF
          payment={paymentRow}
          student={selectedStudent}
          company={companyProfile}
          ledger={ledger}
        />,
      ).toBlob();

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = btoa(binary);

      const printed = await execute(() => window.api.student.printPdf(base64Pdf));
      if (!printed) {
        throw new Error('Failed to send receipt to printer.');
      }
    } catch (err) {
      console.error('Failed to print receipt directly:', err);
    } finally {
      setPrintingPaymentId(null);
    }
  }

  const paymentColumns = [
    { key: 'receipt_no', label: 'Receipt No.' },
    {
      key: 'amount_paid',
      label: 'Amount',
      render: (v) => `₹${(v || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '-'),
    },
    { key: 'payment_mode', label: 'Mode' },
    {
      key: 'status',
      label: 'Status',
      render: (v) =>
        v === 'Active'
          ? <Badge variant="success">Active</Badge>
          : <Badge variant="danger">Cancelled</Badge>,
    },
    {
      key: 'actions',
      label: '',
      width: '220px',
      render: (_, row) =>
        row.status === 'Active' ? (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDirectPrintReceipt(row)}
              title="Print Receipt"
              disabled={printingPaymentId === row.id}
            >
              {printingPaymentId === row.id
                ? <RefreshCw size={14} className="animate-spin" />
                : <Printer size={14} />}
            </Button>

            <PDFDownloadLink
              document={<FeesReceiptPDF payment={row} student={selectedStudent} company={companyProfile} ledger={ledger} />}
              fileName={`receipt_${row.receipt_no?.replace(/\//g, '_')}.pdf`}
              className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Download Receipt PDF"
            >
              {({ loading: preparing }) => (preparing ? <AlertCircle size={14} className="animate-spin" /> : <Download  size={14} />)}
            </PDFDownloadLink>

            {isDevMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreviewReceipt(row)}
                title="Preview Receipt (Dev)"
              >
                {previewLoading && previewPayment?.id === row.id
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Eye size={14} />}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => requestCancelPayment(row.id)} title="Cancel Receipt">
              <XCircle size={14} />
            </Button>
          </div>
        ) : null,
    },
  ];

  const paymentModeOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Fees Management</h1>
        <p className="text-base text-slate-500 mt-1">Search students, view ledgers, and record payments</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <Input
                label="Search Student"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, USIN, or father's name..."
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              <Search size={16} /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {searched ? `Results (${students.length})` : 'Students'}
              </CardTitle>
            </CardHeader>
            <CardBody style={{ padding: 0, maxHeight: '500px', overflowY: 'auto' }}>
              {!searched ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Search size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">Search for a student to view their fee ledger</p>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <AlertCircle size={32} className="mb-3 opacity-50" />
                  <p className="text-base font-semibold text-slate-700">No students found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div>
                  {students.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 transition-colors ${selectedStudent?.id === s.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                      onClick={() => selectStudent(s)}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="font-medium text-sm">
                          {s.surname ? `${s.surname} ${s.student_name}` : s.student_name}
                        </div>
                        <div className="text-xs text-muted">
                          {s.usin} • {s.class_name || 'No class'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          {!selectedStudent ? (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                  <FileText size={40} className="mb-4 opacity-50" />
                  <p className="text-lg font-semibold text-slate-700 mb-1">Select a Student</p>
                  <p className="text-sm text-center max-w-xs">
                    Search and select a student from the list to view their fee ledger
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                    <IndianRupee size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total Fee</div>
                    <div className="text-2xl font-bold text-slate-900 leading-none">
                      ₹{(ledger?.total_fee || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <IndianRupee size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total Paid</div>
                    <div className="text-2xl font-bold text-slate-900 leading-none">
                      ₹{(ledger?.total_paid || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-500 mb-1">Balance</div>
                    <div className="text-2xl font-bold text-slate-900 leading-none">
                      ₹{(ledger?.balance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Payment History - {selectedStudent.surname} {selectedStudent.student_name}
                  </CardTitle>
                  <Button variant="success" size="sm" onClick={openPaymentModal}>
                    <IndianRupee size={14} /> Accept Payment
                  </Button>
                </CardHeader>
                <CardBody style={{ padding: 0 }}>
                  <Table
                    columns={paymentColumns}
                    data={ledger?.payments || []}
                    emptyMessage="No payments recorded yet."
                  />
                </CardBody>
              </Card>

              {isDevMode && previewPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Receipt Preview (Development) - {previewPayment.receipt_no}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={previewLoading}
                        onClick={() => handlePreviewReceipt(previewPayment)}
                      >
                        <RefreshCw size={14} className={previewLoading ? 'animate-spin' : ''} />
                        {previewLoading ? 'Refreshing...' : 'Refresh Preview'}
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={clearPreview}>
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="w-full min-h-130">
                      {previewLoading && (
                        <div className="w-full h-130 flex items-center justify-center text-slate-500">
                          Generating receipt preview...
                        </div>
                      )}

                      {!previewLoading && previewPdfUrl && (
                        <iframe
                          title="Receipt PDF Preview"
                          src={previewPdfUrl}
                          className="w-full h-180 border border-slate-200 rounded-md"
                        />
                      )}

                      {!previewLoading && !previewPdfUrl && (
                        <div className="w-full h-130 flex items-center justify-center text-slate-500">
                          Preview could not be generated.
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Accept Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handlePayment} disabled={loading}>
              <IndianRupee size={16} /> Record Payment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex p-4 mb-4 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg gap-3">
            <FileText size={18} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Receipt: {nextReceiptNo}</div>
              <div className="text-xs text-amber-700/80">Auto-generated. Cannot be changed.</div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-md">
            <div className="font-medium text-sm">
              {selectedStudent?.surname} {selectedStudent?.student_name}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              USIN: {selectedStudent?.usin}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Balance: ₹{(ledger?.balance || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <Input
            label="Amount (₹)"
            name="amount_paid"
            type="number"
            value={paymentForm.amount_paid}
            onChange={(e) => setPaymentForm((p) => ({ ...p, amount_paid: e.target.value }))}
            placeholder="Enter amount..."
            required
          />

          <Select
            label="Payment Mode"
            name="payment_mode"
            value={paymentForm.payment_mode}
            onChange={(e) => setPaymentForm((p) => ({ ...p, payment_mode: e.target.value }))}
            options={paymentModeOptions}
          />
        </div>
      </Modal>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Cancel Receipt?"
        message="Are you sure you want to cancel this receipt? This action cannot be undone."
        confirmText="Yes, Cancel Receipt"
        cancelText="Keep Receipt"
        confirmVariant="danger"
        loading={cancelLoading}
        onCancel={() => {
          if (cancelLoading) return;
          setConfirmOpen(false);
          setCancelPaymentId(null);
        }}
        onConfirm={confirmCancelPayment}
      />
    </div>
  );
}