import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, IndianRupee, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';

/**
 * Dashboard Page
 * 
 * Displays summary stats and recent registrations.
 */

export default function Dashboard() {
  const navigate = useNavigate();
  const { execute } = useDatabase();

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    todayCollection: 0,
    pendingFees: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    const [studentStats, paymentStats, recent] = await Promise.all([
      execute(() => window.api.student.getStats()),
      execute(() => window.api.payment.getStats()),
      execute(() => window.api.student.getRecent(5)),
    ]);

    if (studentStats) {
      setStats((prev) => ({
        ...prev,
        totalStudents: studentStats.total,
        activeStudents: studentStats.active,
      }));
    }

    if (paymentStats) {
      setStats((prev) => ({
        ...prev,
        todayCollection: paymentStats.today_collection,
        pendingFees: paymentStats.pending_total,
      }));
    }

    if (recent) {
      setRecentStudents(recent);
    }

    setLoading(false);
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Active Students',
      value: stats.activeStudents,
      icon: GraduationCap,
      color: 'success',
    },
    {
      label: "Today's Collection",
      value: `₹${stats.todayCollection.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'warning',
    },
    {
      label: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString('en-IN')}`,
      icon: AlertCircle,
      color: 'danger',
    },
  ];

  const recentColumns = [
    { key: 'sr_no', label: 'Sr. No', width: '80px' },
    {
      key: 'student_name',
      label: 'Student Name',
      render: (val, row) => (
        <span className="font-medium">{row.surname ? `${row.surname} ${val}` : val}</span>
      ),
    },
    { key: 'class_name', label: 'Class' },
    {
      key: 'admission_date',
      label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-',
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Dashboard</h1>
          <p className="text-base text-slate-500 mt-1">Welcome to School Management System</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Dashboard</h1>
        <p className="text-base text-slate-500 mt-1">Welcome to School Management System</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color === 'primary' ? 'bg-indigo-50 text-indigo-600' : stat.color === 'success' ? 'bg-emerald-50 text-emerald-600' : stat.color === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <stat.icon size={24} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              <Button variant="primary" className="w-full" onClick={() => navigate('/registration')}>
                <UserPlusIcon /> New Registration
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/fees')}>
                <IndianRupee size={16} /> Record Payment
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/master-settings')}>
                <GraduationCap size={16} /> Manage Classes
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Recent Registrations */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/registration')}>
                View All <ArrowRight size={14} />
              </Button>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table
                columns={recentColumns}
                data={recentStudents}
                emptyMessage="No students registered yet. Start by adding a new registration."
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline icon helper (avoids importing twice)
 */
function UserPlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
