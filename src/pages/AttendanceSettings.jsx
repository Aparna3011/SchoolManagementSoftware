import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
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

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    description: "",
  });

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
    if (data) setYears(data);
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

    setHolidays(res.data || res); // 🔥 handles both cases
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
    setForm({ start_date: "", end_date: "", description: "" });
    setModalOpen(true);
  }

  async function saveHoliday() {
    if (!form.start_date || !form.end_date) {
      toast.error("Select dates");
      return;
    }

    await execute(() =>
      window.api.holiday.create({
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description,
        academicYearId: selectedYear.id,
      }),
    );

    setModalOpen(false);
    loadHolidays();
  }

  async function deleteHoliday(id) {
    await execute(() => window.api.holiday.delete(id));
    loadHolidays();
  }

  // ================= TABLE =================

  const holidayColumns = [
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "description", label: "Description" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => deleteHoliday(row.id)}>
          <Trash2 size={14} />
        </Button>
      ),
    },
  ];

  // ================= UI =================

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Settings</h1>
      </div>

      {/* YEAR SELECT */}
      <div className="mb-6">
        
      </div>

      {/* WEEKLY SCHEDULE */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <Button size="sm" onClick={saveWeekly}>
            Save
          </Button>
        </CardHeader>

        <CardBody>
          <div className="grid grid-cols-7 gap-4 text-center">
            {weekly.map((d) => (
              <div key={d.id}>
                <p className="font-medium">{d.day_name}</p>
                <input
                  type="checkbox"
                  checked={d.is_working === 1}
                  onChange={() => toggleDay(d.id)}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* HOLIDAYS */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Calendar size={16} /> Holidays
            </div>
          </CardTitle>

         <div className="flex gap-10">
             <select
          className="border p-2 rounded"
          value={selectedYear?.id || ""}
          onChange={(e) =>
            setSelectedYear(years.find((y) => y.id == e.target.value))
          }
        >
          <option value="">Select Academic Year</option>
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
