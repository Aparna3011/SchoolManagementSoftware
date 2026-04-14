import { useState, useEffect } from 'react';
import { Search, IndianRupee, FileText, XCircle, AlertCircle } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FeesReceiptPDF } from '../components/pdf/FeesReceiptPDF';

/**
 * Fees Page
 * 
 * Search student → View Ledger → Accept Payment → View History
 */

export default function Fees() {
  const { execute, loading } = useDatabase();

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [searched, setSearched] = useState(false);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_mode: 'Cash',
  });
  const [nextInvoiceNo, setNextInvoiceNo] = useState('');

  // ============ SEARCH ============

  async function handleSearch(e) {
    e?.preventDefault();

    if (!searchTerm.trim()) return;

    const results = await execute(() =>
      window.api.student.getAll({ search: searchTerm })
    );

    if (results) {
      setStudents(results);
    }
    setSearched(true);
    setSelectedStudent(null);
    setLedger(null);

    // Load company profile for receipt PDFs if not already loaded
    if (!companyProfile) {
      const profile = await execute(() => window.api.company.get());
      if (profile) setCompanyProfile(profile);
    }
  }

  // ============ SELECT STUDENT ============

  async function selectStudent(student) {
    setSelectedStudent(student);
    await loadLedger(student.id);
  }

  async function loadLedger(studentId) {
    const data = await execute(() => window.api.payment.getLedger(studentId));
    if (data) setLedger(data);
  }

  // ============ PAYMENT ============

  async function openPaymentModal() {
    const invoiceNo = await execute(() => window.api.payment.generateInvoiceNo());
    if (invoiceNo) setNextInvoiceNo(invoiceNo);

    setPaymentForm({ amount_paid: '', payment_mode: 'Cash' });
    setPaymentModalOpen(true);
  }

  async function handlePayment() {
    if (!paymentForm.amount_paid || !selectedStudent) return;

    const amount = parseFloat(paymentForm.amount_paid);
    if (isNaN(amount) || amount <= 0) return;

    const balanceAfter = (ledger?.balance || 0) - amount;

    await execute(() =>
      window.api.payment.create({
        student_id: selectedStudent.id,
        amount_paid: amount,
        payment_mode: paymentForm.payment_mode,
        balance_remaining: Math.max(0, balanceAfter),
      })
    );

    setPaymentModalOpen(false);
    await loadLedger(selectedStudent.id);
  }

  // ============ CANCEL PAYMENT ============

  async function handleCancelPayment(paymentId) {
    if (!confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')) return;

    await execute(() => window.api.payment.cancel(paymentId));
    await loadLedger(selectedStudent.id);
  }

  // ---- Column defs ----

  const studentColumns = [
    { key: 'sr_no', label: 'Sr. No', width: '80px' },
    {
      key: 'student_name',
      label: 'Student Name',
      render: (val, row) => (
        <span className="font-medium">{row.surname ? `${row.surname} ${val}` : val}</span>
      ),
    },
    { key: 'class_name', label: 'Class' },
    { key: 'father_name', label: "Father's Name", render: (v) => v || '-' },
  ];

  const paymentColumns = [
    { key: 'invoice_no', label: 'Invoice No.' },
    {
      key: 'amount_paid',
      label: 'Amount',
      render: (v) => `₹${(v || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-',
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
      width: '120px',
      render: (_, row) =>
        row.status === 'Active' ? (
          <div className="flex gap-2 justify-end">
            <PDFDownloadLink
              document={<FeesReceiptPDF payment={row} student={selectedStudent} company={companyProfile} />}
              fileName={`receipt_${row.invoice_no?.replace(/\//g, '_')}.pdf`}
              className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Print Receipt"
            >
              {({ loading }) => (loading ? <AlertCircle size={14} className="animate-spin" /> : <FileText size={14} />)}
            </PDFDownloadLink>
            <Button variant="ghost" size="sm" onClick={() => handleCancelPayment(row.id)} title="Cancel Invoice">
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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Fees Management</h1>
        <p className="text-base text-slate-500 mt-1">Search students, view ledgers, and record payments</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <Input
                label="Search Student"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, Sr. No, or father's name..."
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              <Search size={16} /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Search Results */}
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
                          Sr. {s.sr_no} • {s.class_name || 'No class'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Ledger + Payments */}
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
              {/* Ledger Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600">
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
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
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
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-600">
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

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Payment History — {selectedStudent.surname} {selectedStudent.student_name}
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
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
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
          {/* Invoice info */}
          <div className="flex p-4 mb-4 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg gap-3">
            <FileText size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Invoice: {nextInvoiceNo}</div>
              <div className="text-xs text-amber-700/80">Auto-generated. Cannot be changed.</div>
            </div>
          </div>

          {/* Student info */}
          <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-md">
            <div className="font-medium text-sm">
              {selectedStudent?.surname} {selectedStudent?.student_name}
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
    </div>
  );
}
