import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";

export default function AttendanceSettings() {
  const { execute } = useDatabase();

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [weekly, setWeekly] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    name: "",
    description: "",
  });

  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  // ================= LOAD DATA =================

  useEffect(() => {
    loadYears();
    loadWeekly();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadHolidays();
    }
  }, [selectedYear]);

  async function loadYears() {
    const data = await execute(() => window.api.financialYear.getAll());
    if (!data) return;

    setYears(data);

    const active = data.find((y) => y.is_active === 1);
    if (active) setSelectedYear(active);
  }

  async function loadWeekly() {
    const data = await execute(() => window.api.weekly.getAll());
    if (data) setWeekly(data.data || data);
  }

  async function loadHolidays() {
    if (!selectedYear) return;

    const res = await execute(() => window.api.holiday.getAll(selectedYear.id));

    console.log("HOLIDAY RESPONSE:", res);

    if (!res) return;

    setHolidays(res.data || res);
  }

  // ================= WEEKLY =================

  function toggleDay(id) {
    setWeekly((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, is_working: d.is_working ? 0 : 1 } : d,
      ),
    );
  }

  async function saveWeekly() {
    await execute(() => window.api.weekly.update(weekly));
    toast.success("Weekly schedule saved");
  }

  // ================= HOLIDAYS =================

  function openModal() {
    setForm({
      start_date: "",
      end_date: "",
      name: "",
      description: "",
    });
    setEditingId(null);
    setModalOpen(true);
  }

  async function saveHoliday() {
    if (!form.start_date || !form.end_date) {
      toast.error("Select dates");
      return;
    }

    const payload = {
      academicYearId: selectedYear.id,
      start_date: form.start_date, // already correct format
      end_date: form.end_date,
      name: form.name,
      description: form.description,
    };

    let res;

    if (editingId) {
      res = await execute(() => window.api.holiday.update(editingId, payload));

      console.log("UPDATE RESPONSE:", res);

      const result = res?.data || res;

      if (!result || result.success === false) {
        toast.error("Failed to update holiday");
        return;
      }

      toast.success("Holiday updated");
    } else {
      res = await execute(() => window.api.holiday.create(payload));

      console.log("CREATE RESPONSE:", res);

      const result = res?.data ?? res;

      if (result?.success === false) {
        toast.error("Failed to create holiday");
        return;
      }

      toast.success("Holiday created");
    }

    setModalOpen(false);
    setEditingId(null);
    await loadHolidays();
  }

  function editHoliday(row) {
    setForm({
      start_date: row.start_date,
      end_date: row.end_date,
      name: row.name,
      description: row.description,
    });

    setEditingId(row.id);
    setModalOpen(true);
  }

  async function deleteHoliday(id) {
    await execute(() => window.api.holiday.delete(id));
    loadHolidays();
  }

  // ================= TABLE =================

  const holidayColumns = [
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => editHoliday(row)}>
            <Edit2 size={14} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteHoliday(row.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // ================= UI =================

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Settings</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* WEEKLY */}
        <Card className="col-span-1">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Weekly Schedule</CardTitle>
            <Button size="sm" onClick={saveWeekly}>
              Save
            </Button>
          </CardHeader>

          <CardBody>
            <div className="flex flex-col gap-3">
              {weekly.map((day) => (
                <div
                  key={day.id}
                  className="flex justify-between items-center px-4 py-3 shadow-sm"
                >
                  <span className="font-medium">{day.day_name}</span>

                  <input
                    type="checkbox"
                    checked={day.is_working === 1}
                    onChange={() => toggleDay(day.id)}
                    className="w-5 h-5"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* HOLIDAYS */}
        <Card className="col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar size={16} /> Holidays
            </CardTitle>

            <div className="flex items-center gap-3">
              <select
                className="border p-2 rounded"
                value={selectedYear?.id || ""}
                onChange={(e) =>
                  setSelectedYear(years.find((y) => y.id == e.target.value))
                }
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.year_label}
                  </option>
                ))}
              </select>

              <Button size="sm" onClick={openModal}>
                <Plus size={14} /> Add Holiday
              </Button>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            <Table
              columns={holidayColumns}
              data={holidays}
              emptyMessage="No holidays added"
            />
          </CardBody>
        </Card>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Holiday"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveHoliday}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Academic Year
            </label>

            <select
              className="border p-2 rounded w-full"
              value={selectedYear?.id || ""}
              onChange={(e) =>
                setSelectedYear(years.find((y) => y.id == e.target.value))
              }
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year_label}
                </option>
              ))}
            </select>
          </div>

          {/* <Input
            label="Academic Year"
            type="text"
            value={selectedYear ? selectedYear.year_label : ""}
          /> */}

          <Input
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, start_date: e.target.value }))
            }
          />

          <Input
            label="End Date"
            type="date"
            value={form.end_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, end_date: e.target.value }))
            }
          />

          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Diwali"
          />

          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="e.g. Diwali Holiday"
          />
        </div>
      </Modal>
    </div>
  );
}
