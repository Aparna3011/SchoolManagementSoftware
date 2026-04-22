import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";

export default function Attendance() {
  const { execute, loading } = useDatabase();

  const [academicYear, setAcademicYear] = useState(null);
  const [date, setDate] = useState(() =>
    new Date().toISOString().split("T")[0],
  );

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const getToday = () => new Date().toISOString().split("T")[0];

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState("classes");

  async function loadData() {
    if (!selectedClass) return;

    const res = await execute(() =>
      window.api.attendance.getByFilters({
        date,
        classId: Number(selectedClass),
        academicYearId: selectedYear?.id,
      }),
    );
    console.log("Attendance Response:", res);
    console.log("Selected Year ID:", selectedYear?.id);

    if (!res) return;

    setStudents(res);
  }

  // =========================
  // HANDLE STATUS
  // =========================
  function handleStatus(id, status) {
    setStudents((prev) =>
      prev.map((s) =>
        s.enrollment_id === id ? { ...s, attendance_status: status } : s,
      ),
    );
  }

  // =========================
  // SAVE
  // =========================
  async function handleSave() {
    if (!students.length) {
      toast.error("No students found");
      return;
    }

    const payload = students.map((s) => ({
      enrollment_id: s.enrollment_id,
      attendance_date: date,
      status: s.attendance_status || "Absent",
    }));

    console.log("Payload:", payload);

    const res = await window.api.attendance.saveBulk(payload);

    console.log("Response:", res);

    if (!res || !res.success) {
      toast.error(res?.error || "Failed to save attendance");
      return;
    }

    toast.success("Attendance saved successfully");
  }

  // =========================
  // MARK ALL PRESENT
  // =========================
  function markAllPresent() {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        attendance_status: "Present",
      })),
    );
  }

  //Classes
  useEffect(() => {
    async function loadClasses() {
      const data = await execute(() => window.api.class.getAll());

      if (!data) return;

      setClasses(data);
    }

    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedYear) return;

    setView("students");
    loadData();
  }, [selectedClass, date, selectedYear]);

  useEffect(() => {
    async function loadYears() {
      const all = await execute(() => window.api.financialYear.getAll());

      const active = await execute(() => window.api.financialYear.getActive());

      if (!all) return;

      setYears(all);

      if (active) {
        setSelectedYear(active);

        const today = getToday();

        if (today >= active.start_date && today <= active.end_date) {
          setDate(today);
        } else {
          setDate(active.start_date);
        }
      }
    }

    loadYears();
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  console.log("data in students", students);

  // Define table columns
  const columns = [
    {
      key: 'status',
      label: 'Present/Absent',
      render: (value, row) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={row.attendance_status === "Present"}
            onChange={(e) =>
              handleStatus(
                row.enrollment_id,
                e.target.checked ? "Present" : "Absent",
              )
            }
            className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
        </div>
      ),
    },
    {
      key: 'usin',
      label: 'USIN',
    },
    {
      key: 'roll_number',
      label: 'Roll No',
    },
    {
      key: 'student_name',
      label: 'Name',
    },
  ];

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Attendance</h1>
        <p className="text-slate-600 mt-1">Track and manage student attendance</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Academic Year (Financial Year) */}
            <Select
              label="Academic Year"
              value={selectedYear?.id || ""}
              onChange={(e) => {
                const year = years.find((y) => y.id == e.target.value);
                setSelectedYear(year);

                const today = getToday();
                if (year && today >= year.start_date && today <= year.end_date) {
                  setDate(today);
                } else if (year) {
                  setDate(year.start_date);
                }
              }}
              options={years.map(y => ({ value: y.id, label: y.year_label }))}
            />

            {/* Class */}
            <Select
              label="Class"
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classes.map(c => ({ value: c.id, label: c.class_name }))}
            />

            {/* Date */}
            <Input
              label="Date"
              type="date"
              value={date}
              min={selectedYear?.start_date}
              max={selectedYear?.end_date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* STUDENT VIEW */}
      {view === "students" && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>

          <CardBody>
            <div className="mb-4 flex justify-end">
              <Button onClick={markAllPresent} variant="secondary" size="sm">
                Mark All Present
              </Button>
            </div>

            <Table
              columns={columns}
              data={students}
              emptyMessage="No students found for the selected class"
            />
          </CardBody>

          <CardFooter>
            <Button onClick={handleSave} disabled={loading}>
              <Save size={16} />
              Save Attendance
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
