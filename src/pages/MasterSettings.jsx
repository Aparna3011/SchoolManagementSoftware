import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Calendar, GraduationCap } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { render } from '@react-pdf/renderer';

/**
 * Master Settings Page
 * 
 * Two sections:
 * 1. Academic Years — add/edit years, set active
 * 2. Classes — add/edit classes with name, short code, base fee
 */

export default function MasterSettings() {
  const { execute } = useDatabase();

  // ---- Financial Year State ----
  const [years, setYears] = useState([]);
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [yearForm, setYearForm] = useState({
    year_label: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  // ---- Class State ----
  const [classes, setClasses] = useState([]);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ class_name: '', short_code: '', base_fee: '' });

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
      setYearForm({
        year_label: '',
        start_date: '',
        end_date: '',
        is_active: false,
      });
    }
    setYearModalOpen(true);
  }

  async function handleYearSave() {
    if (!yearForm.year_label.trim() || !yearForm.start_date || !yearForm.end_date) return;

    const payload = {
      ...yearForm,
      start_year: Number.parseInt(yearForm.start_date.slice(0, 4), 10),
    };

    if (editingYear) {
      await execute(() => window.api.financialYear.update(editingYear.id, payload));
    } else {
      await execute(() => window.api.financialYear.create(payload));
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
    console.log('classes' , data)
    if (data) setClasses(data);
  }

  function openClassModal(cls = null) {
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        class_name: cls.class_name,
        short_code: cls.short_code || '',
        base_fee: cls.base_fee?.toString() || '',
      });
    } else {
      setEditingClass(null);
      setClassForm({ class_name: '', short_code: '', base_fee: '' });
    }
    setClassModalOpen(true);
  }

  async function handleClassSave() {
    if (!classForm.class_name.trim() || !classForm.short_code.trim()) return;

    const payload = {
      ...classForm,
      base_fee: parseFloat(classForm.base_fee) || 0,
      short_code: classForm.short_code.trim().toUpperCase(),
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
    {
      key: 'start_date',
      label: 'Start Date',
      render: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '-'),
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '-'),
    },
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
    { key: 'short_code', label: 'Code' },
    { key: 'next_class_id', label: 'Next Class' ,
       render: (v) =>
        <select
            value={v || ""}
            onChange={(e) => setNextClassId(Number(e.target.value))}
          >
            <option value="">Alumini</option>

            {classes
              //.filter((c) => c.id !== id) // avoid self
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
          </select>
    },
    {
      key: 'base_fee',
      label: 'Base Fee',
      render: (v) => `₹${(v || 0).toLocaleString('en-IN')}`,
    },
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Master Settings</h1>
        <p className="text-base text-slate-500 mt-1">Configure academic years and class definitions</p>
      </div>

      {/* Financial Years Section */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                Academic Years
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
              emptyMessage="No academic years configured. Add one to get started."
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
              emptyMessage="No classes configured yet."
          />
        </CardBody>
      </Card>

      {/* Financial Year Modal */}
      <Modal
        isOpen={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        title={editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
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
            hint="Example: 2026-2027"
          />
          <Input
            label="Start Date"
            name="start_date"
            type="date"
            value={yearForm.start_date}
            onChange={(e) => setYearForm((p) => ({ ...p, start_date: e.target.value }))}
            required
          />
          <Input
            label="End Date"
            name="end_date"
            type="date"
            value={yearForm.end_date}
            onChange={(e) => setYearForm((p) => ({ ...p, end_date: e.target.value }))}
            required
          />
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
            label="Class Code"
            name="short_code"
            value={classForm.short_code}
            onChange={(e) => setClassForm((p) => ({ ...p, short_code: e.target.value.toUpperCase() }))}
            placeholder="e.g., PG, UKG, 1ST"
            required
          />
          <Input
            label="Base Fee (₹)"
            name="base_fee"
            type="number"
            value={classForm.base_fee}
            onChange={(e) => setClassForm((p) => ({ ...p, base_fee: e.target.value }))}
            placeholder="e.g., 15000"
          />
        </div>
      </Modal>
    </div>
  );
}
