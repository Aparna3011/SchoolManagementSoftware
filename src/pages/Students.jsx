import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, UserCheck, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const STATUS_TABS = ['Active', 'Alumni', 'Transferred', 'All'];

function toCurrency(value) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function normalizeDue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount : 0;
}

export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [statusFilter]);

  const counts = useMemo(() => {
    const totals = {
      total: students.length,
      withLatestDue: 0,
      withOverallDue: 0,
    };

    for (const row of students) {
      if (normalizeDue(row.latest_due) > 0) {
        totals.withLatestDue += 1;
      }
      if (normalizeDue(row.total_due) > 0) {
        totals.withOverallDue += 1;
      }
    }

    return totals;
  }, [students]);

  async function loadStudents() {
    setLoading(true);

    try {
      const filters = {};
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      if (statusFilter !== 'All') {
        filters.status = statusFilter;
      }

      const studentsResponse = await window.api.student.getAll(filters);
      if (!studentsResponse.success) {
        throw new Error(studentsResponse.error || 'Failed to load students.');
      }

      const studentRows = studentsResponse.data || [];

      const dueRows = await Promise.all(
        studentRows.map(async (student) => {
          const summaryResponse = await window.api.student.getFeesSummaryByYear(student.id);
          const summaryRows = summaryResponse.success ? (summaryResponse.data || []) : [];

          const totalDue = summaryRows.reduce(
            (sum, entry) => sum + normalizeDue(entry.pending_balance),
            0,
          );

          let latestDue = 0;
          if (student.enrollment_id) {
            const ledgerResponse = await window.api.payment.getLedger(student.enrollment_id);
            if (ledgerResponse.success) {
              latestDue = normalizeDue(ledgerResponse.data?.balance);
            }
          }

          return {
            ...student,
            latest_due: latestDue,
            total_due: totalDue,
          };
        }),
      );

      setStudents(dueRows);
    } catch (error) {
      console.error('[Students] loadStudents error:', error);
      toast.error(error.message || 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSearchSubmit(event) {
    event.preventDefault();
    await loadStudents();
  }

  function onViewStudent(studentId) {
    navigate(`/students/${studentId}`);
  }

  function requestAlumniTransition(student) {
    setSelectedStudent(student);
    setConfirmOpen(true);
  }

  async function confirmAlumniTransition() {
    if (!selectedStudent?.id) {
      return;
    }

    setStatusUpdating(true);
    try {
      const response = await window.api.student.updateStatus(selectedStudent.id, 'Alumni');
      if (!response.success) {
        throw new Error(response.error || 'Failed to update status.');
      }

      toast.success('Student marked as Alumni.');
      setConfirmOpen(false);
      setSelectedStudent(null);
      await loadStudents();
    } catch (error) {
      console.error('[Students] confirmAlumniTransition error:', error);
      toast.error(error.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  const columns = [
    { key: 'usin', label: 'USIN', width: '130px' },
    {
      key: 'student_name',
      label: 'Student',
      render: (value, row) => {
        const fullName = row.surname ? `${row.surname} ${value}` : value;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-900">{fullName}</span>
            <div className="flex flex-wrap gap-1.5">
              {/* <Badge variant={normalizeDue(row.latest_due) > 0 ? 'danger' : 'success'}>
                Latest Due: {toCurrency(row.latest_due)}
              </Badge> */}
              <Badge variant={normalizeDue(row.total_due) > 0 ? 'danger' : 'success'}>
                Total Due: {toCurrency(row.total_due)}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: 'year_label',
      label: 'Latest Year',
      render: (value) => value || '-',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value) => value || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge
          variant={
            value === 'Active'
              ? 'success'
              : value === 'Alumni'
                ? 'warning'
                : 'neutral'
          }
        >
          {value || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '240px',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => onViewStudent(row.id)}>
            <Eye size={14} /> Details
          </Button>
          {row.status === 'Active' && (
            <Button variant="warning" size="sm" onClick={() => requestAlumniTransition(row)}>
              <UserCheck size={14} /> Mark Alumni
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Students Master</h1>
        <p className="text-base text-slate-500 mt-1">
          Latest enrollment, dues, and alumni status in one place.
        </p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={onSearchSubmit} className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <Input
                label="Search Student"
                name="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, USIN, or father's name..."
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              <Search size={16} /> Search
            </Button>
          </form>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {STATUS_TABS.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-sm text-slate-500 mb-1">Students Listed</div>
          <div className="text-2xl font-bold text-slate-900">{counts.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-sm text-slate-500 mb-1">With Latest Due</div>
          <div className="text-2xl font-bold text-slate-900">{counts.withLatestDue}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-sm text-slate-500 mb-1">With Total Due</div>
          <div className="text-2xl font-bold text-slate-900">{counts.withOverallDue}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'All' ? 'All Students' : `${statusFilter} Students`} ({students.length})
          </CardTitle>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-slate-400">
              <Users size={32} className="mb-3 opacity-60" />
              <p className="text-sm font-medium">No students found for the selected filters.</p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={students}
              onRowClick={(row) => onViewStudent(row.id)}
              emptyMessage="No students found."
            />
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Mark Student as Alumni?"
        message="This student will move out of Active list and be tracked under Alumni history."
        confirmText="Mark Alumni"
        cancelText="Cancel"
        confirmVariant="warning"
        loading={statusUpdating}
        onCancel={() => {
          if (statusUpdating) {
            return;
          }
          setConfirmOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={confirmAlumniTransition}
      />
    </div>
  );
}