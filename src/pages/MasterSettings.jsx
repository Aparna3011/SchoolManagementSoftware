import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Calendar, GraduationCap } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';

/**
 * Master Settings Page
 * 
 * Two sections:
 * 1. Financial Years — add/edit years, set active
 * 2. Classes — add/edit classes with name, session time, base fee
 */

export default function MasterSettings() {
  const { execute } = useDatabase();

  // ---- Financial Year State ----
  const [years, setYears] = useState([]);
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [yearForm, setYearForm] = useState({ year_label: '', start_date: '', end_date: '', is_active: false });

  // ---- Class State ----
  const [classes, setClasses] = useState([]);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ class_name: '', session_time: '', base_fee: '', year_id: '' });

  useEffect(() => {
    loadYears();
    loadClasses();
  }, []);

  // ============ FINANCIAL YEARS ============

  async function loadYears() {
    const data = await execute(() => window.api.financialYear.getAll());
    if (data) setYears(data);
  }

  function openYearModal(year = null) {
    if (year) {
      setEditingYear(year);
      setYearForm({
        year_label: year.year_label,
        start_date: year.start_date || '',
        end_date: year.end_date || '',
        is_active: !!year.is_active,
      });
    } else {
      setEditingYear(null);
      setYearForm({ year_label: '', start_date: '', end_date: '', is_active: false });
    }
    setYearModalOpen(true);
  }

  async function handleYearSave() {
    if (!yearForm.year_label.trim()) return;

    if (editingYear) {
      await execute(() => window.api.financialYear.update(editingYear.id, yearForm));
    } else {
      await execute(() => window.api.financialYear.create(yearForm));
    }

    setYearModalOpen(false);
    loadYears();
  }

  async function handleSetActive(id) {
    await execute(() => window.api.financialYear.setActive(id));
    loadYears();
  }

  async function handleDeleteYear(id) {
    const result = await execute(() => window.api.financialYear.delete(id));
    if (result === undefined) {
      // result is the direct return from model - {success, message}
      // With our hook pattern, the data is returned
    }
    loadYears();
  }

  // ============ CLASSES ============

  async function loadClasses() {
    const data = await execute(() => window.api.class.getAll());
    if (data) setClasses(data);
  }

  function openClassModal(cls = null) {
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        class_name: cls.class_name,
        session_time: cls.session_time || '',
        base_fee: cls.base_fee?.toString() || '',
        year_id: cls.year_id?.toString() || '',
      });
    } else {
      setEditingClass(null);
      setClassForm({ class_name: '', session_time: '', base_fee: '', year_id: '' });
    }
    setClassModalOpen(true);
  }

  async function handleClassSave() {
    if (!classForm.class_name.trim() || !classForm.year_id) return;

    const payload = {
      ...classForm,
      base_fee: parseFloat(classForm.base_fee) || 0,
      year_id: parseInt(classForm.year_id, 10),
    };

    if (editingClass) {
      await execute(() => window.api.class.update(editingClass.id, payload));
    } else {
      await execute(() => window.api.class.create(payload));
    }

    setClassModalOpen(false);
    loadClasses();
  }

  async function handleDeleteClass(id) {
    await execute(() => window.api.class.delete(id));
    loadClasses();
  }

  // ---- Column defs ----

  const yearColumns = [
    { key: 'year_label', label: 'Year Label' },
    { key: 'start_date', label: 'Start Date', render: (v) => v || '-' },
    { key: 'end_date', label: 'End Date', render: (v) => v || '-' },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) =>
        v ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {!row.is_active && (
            <Button variant="ghost" size="sm" onClick={() => handleSetActive(row.id)} title="Set Active">
              <CheckCircle size={14} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openYearModal(row)} title="Edit">
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteYear(row.id)} title="Delete">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const classColumns = [
    { key: 'class_name', label: 'Class Name' },
    { key: 'session_time', label: 'Session Time', render: (v) => v || '-' },
    {
      key: 'base_fee',
      label: 'Base Fee',
      render: (v) => `₹${(v || 0).toLocaleString('en-IN')}`,
    },
    { key: 'year_label', label: 'Year' },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) =>
        v ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openClassModal(row)} title="Edit">
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(row.id)} title="Delete">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // Year options for class dropdown
  const yearOptions = years.map((y) => ({
    value: y.id.toString(),
    label: y.year_label + (y.is_active ? ' (Active)' : ''),
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Master Settings</h1>
        <p className="text-base text-slate-500 mt-1">Configure financial years and class definitions</p>
      </div>

      {/* Financial Years Section */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                Financial Years
              </div>
            </CardTitle>
            <Button variant="primary" size="sm" onClick={() => openYearModal()}>
              <Plus size={14} /> Add Year
            </Button>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <Table
              columns={yearColumns}
              data={years}
              emptyMessage="No financial years configured. Add one to get started."
            />
          </CardBody>
        </Card>
      </div>

      {/* Classes Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} />
              Classes
            </div>
          </CardTitle>
          <Button variant="primary" size="sm" onClick={() => openClassModal()}>
            <Plus size={14} /> Add Class
          </Button>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <Table
            columns={classColumns}
            data={classes}
            emptyMessage="No classes configured. Add a financial year first, then add classes."
          />
        </CardBody>
      </Card>

      {/* Financial Year Modal */}
      <Modal
        isOpen={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        title={editingYear ? 'Edit Financial Year' : 'Add Financial Year'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setYearModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleYearSave}>
              {editingYear ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Year Label"
            name="year_label"
            value={yearForm.year_label}
            onChange={(e) => setYearForm((p) => ({ ...p, year_label: e.target.value }))}
            placeholder="e.g., 26-27"
            required
            hint="Short label like '26-27' for the academic year 2026-2027"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="start_date"
              type="date"
              value={yearForm.start_date}
              onChange={(e) => setYearForm((p) => ({ ...p, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              name="end_date"
              type="date"
              value={yearForm.end_date}
              onChange={(e) => setYearForm((p) => ({ ...p, end_date: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={yearForm.is_active}
              onChange={(e) => setYearForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-900 cursor-pointer">
              Set as Active Year
            </label>
          </div>
        </div>
      </Modal>

      {/* Class Modal */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add Class'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setClassModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleClassSave}>
              {editingClass ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Class Name"
            name="class_name"
            value={classForm.class_name}
            onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))}
            placeholder="e.g., Nursery"
            required
          />
          <Input
            label="Session Time"
            name="session_time"
            value={classForm.session_time}
            onChange={(e) => setClassForm((p) => ({ ...p, session_time: e.target.value }))}
            placeholder="e.g., 9:00 AM - 12:00 PM"
          />
          <Input
            label="Base Fee (₹)"
            name="base_fee"
            type="number"
            value={classForm.base_fee}
            onChange={(e) => setClassForm((p) => ({ ...p, base_fee: e.target.value }))}
            placeholder="e.g., 15000"
          />
          <Select
            label="Financial Year"
            name="year_id"
            value={classForm.year_id}
            onChange={(e) => setClassForm((p) => ({ ...p, year_id: e.target.value }))}
            options={yearOptions}
            placeholder="Select year..."
            required
          />
        </div>
      </Modal>
    </div>
  );
}
