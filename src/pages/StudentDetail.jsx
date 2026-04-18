import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign, GraduationCap, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';

function toCurrency(value) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function fullName(student) {
  if (!student) {
    return '-';
  }
  return student.surname ? `${student.surname} ${student.student_name}` : student.student_name;
}

function normalizeDue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount : 0;
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [feesSummary, setFeesSummary] = useState([]);

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const totalFee = useMemo(
    () => feesSummary.reduce((sum, row) => sum + Number(row.total_fee || 0), 0),
    [feesSummary],
  );

  const totalPaid = useMemo(
    () => feesSummary.reduce((sum, row) => sum + Number(row.total_paid || 0), 0),
    [feesSummary],
  );

  const totalDue = useMemo(
    () => feesSummary.reduce((sum, row) => sum + normalizeDue(row.pending_balance), 0),
    [feesSummary],
  );

  async function loadStudentDetail() {
    setLoading(true);

    try {
      const id = Number.parseInt(studentId, 10);
      if (!id) {
        throw new Error('Invalid student id.');
      }

      const [studentResponse, enrollmentsResponse, feesResponse] = await Promise.all([
        window.api.student.getById(id),
        window.api.student.getEnrollments(id),
        window.api.student.getFeesSummaryByYear(id),
      ]);

      if (!studentResponse.success) {
        throw new Error(studentResponse.error || 'Failed to load student details.');
      }

      console.log('Enrollments response:', enrollmentsResponse);
      console.log('Fees summary response:', feesResponse);
      console.log('Student response:', studentResponse);

      if (!enrollmentsResponse.success) {
        throw new Error(enrollmentsResponse.error || 'Failed to load enrollment history.');
      }

      if (!feesResponse.success) {
        throw new Error(feesResponse.error || 'Failed to load fees summary.');
      }

      setStudent(studentResponse.data || null);
      setEnrollments(enrollmentsResponse.data || []);
      setFeesSummary(feesResponse.data || []);
    } catch (error) {
      console.error('[StudentDetail] loadStudentDetail error:', error);
      toast.error(error.message || 'Failed to load student detail.');
      setStudent(null);
      setEnrollments([]);
      setFeesSummary([]);
    } finally {
      setLoading(false);
    }
  }

  const enrollmentColumns = [
    {
      key: 'year_label',
      label: 'Academic Year',
      render: (value) => value || '-',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value) => value || '-',
    },
    {
      key: 'roll_number',
      label: 'Roll No.',
      render: (value) => value ?? '-',
    },
    {
      key: 'agreed_annual_fee',
      label: 'Agreed Annual Fee',
      render: (value) => toCurrency(value),
    },
  ];

  const feesColumns = [
    {
      key: 'year_label',
      label: 'Academic Year',
      render: (value) => value || '-',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value) => value || '-',
    },
    {
      key: 'total_fee',
      label: 'Total Fee',
      render: (value) => toCurrency(value),
    },
    {
      key: 'total_paid',
      label: 'Total Paid',
      render: (value) => toCurrency(value),
    },
    {
      key: 'pending_balance',
      label: 'Pending',
      render: (value) => {
        const pending = normalizeDue(value);
        return (
          <Badge variant={pending > 0 ? 'danger' : 'success'}>
            {toCurrency(pending)}
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Student Detail</h1>
          <p className="text-base text-slate-500 mt-1">
            Master profile, enrollments, and year-wise fee history.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          <ArrowLeft size={16} /> Back to Students
        </Button>  
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="p-8 text-center text-slate-500">Loading student detail...</div>
          </CardBody>
        </Card>
      ) : !student ? (
        <Card>
          <CardBody>
            <div className="p-8 text-center text-slate-500">Student not found.</div>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <User size={15} /> Student
              </div>
              <div className="text-lg font-semibold text-slate-900">{fullName(student)}</div>
              <div className="text-xs text-slate-500 mt-1">USIN: {student.usin || '-'}</div>
              <div className="mt-2">
                <Badge
                  variant={
                    student.status === 'Active'
                      ? 'success'
                      : student.status === 'Alumni'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {student.status || 'Unknown'}
                </Badge>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <GraduationCap size={15} /> Enrollments
              </div>
              <div className="text-2xl font-bold text-slate-900">{enrollments.length}</div>
              <div className="text-xs text-slate-500 mt-1">Across all academic years</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <CircleDollarSign size={15} /> Total Pending
              </div>
              <div className="text-2xl font-bold text-slate-900">{toCurrency(totalDue)}</div>
              <div className="text-xs text-slate-500 mt-1">Historical pending dues</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Master Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Date of Birth</div>
                  <div className="font-medium text-slate-900">{student.dob || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Gender</div>
                  <div className="font-medium text-slate-900">{student.gender || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Admission Date</div>
                  <div className="font-medium text-slate-900">{student.admission_date || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Father Name</div>
                  <div className="font-medium text-slate-900">{student.father_name || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Mother Name</div>
                  <div className="font-medium text-slate-900">{student.mother_name || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Contact (Father)</div>
                  <div className="font-medium text-slate-900">{student.emergency_contact_father || '-'}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-slate-500">Address</div>
                  <div className="font-medium text-slate-900">{student.address || '-'}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table
                columns={enrollmentColumns}
                data={enrollments}
                emptyMessage="No enrollment history found."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-wise Fee Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Fee</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalFee)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Paid</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalPaid)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Pending</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalDue)}</div>
                </div>
              </div>

              <Table
                columns={feesColumns}
                data={feesSummary}
                emptyMessage="No fee summary found for this student."
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
