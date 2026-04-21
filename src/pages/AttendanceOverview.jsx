import { useState, useEffect } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { useNavigate } from "react-router-dom";

export default function AttendanceOverview() {
  const navigate = useNavigate();
  const viewDetails = (enrollmentId) => {
    navigate(`/attendance-overview/details/${enrollmentId}`);
  };

  const { execute } = useDatabase();

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState("classes");

  // ✅ FIX: get today function
  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  // ✅ FIX: working days (excluding Sundays)
  function getWorkingDays(month) {
    const [year, m] = month.split("-");
    const date = new Date(year, m - 1, 1);

    let days = 0;

    while (date.getMonth() === m - 1) {
      const day = date.getDay();

      if (day !== 0) {
        days++;
      }

      date.setDate(date.getDate() + 1);
    }

    return days;
  }

  // =========================
  // LOAD DATA
  // =========================
  async function loadData() {
    if (!selectedClass || !selectedYear) return;

    const res = await execute(() =>
      window.api.attendance.getMonthlyOverview({
        classId: Number(selectedClass),
        academicYearId: selectedYear.id,
        month: date.slice(0, 7),
      }),
    );

    console.log("OVERVIEW ISSSSS" , res);

    if (!res) return;

    // ✅ Backend already sends correct percentage
    const fixedData = (res.data || res).map((s) => ({
      ...s,
      attendance_percentage: s.attendance_percentage,
    }));

    setStudents(fixedData);
  }

  // =========================
  // LOAD CLASSES
  // =========================
  useEffect(() => {
    async function loadClasses() {
      const data = await execute(() => window.api.class.getAll());
      if (!data) return;
      setClasses(data);
    }
    loadClasses();
  }, []);

  // =========================
  // LOAD YEARS
  // =========================
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

  // =========================
  // TRIGGER LOAD
  // =========================
  useEffect(() => {
    if (!selectedClass || !selectedYear) return;

    setView("students");
    loadData();
  }, [selectedClass, selectedYear, date]);

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = [
    {
      key: "usin",
      label: "Usin",
      width: "140px",
      render: (value) => (
        <span className="font-medium text-slate-700">{value}</span>
      ),
    },

    {
      key: "student_name",
      label: "Student",
      render: (value) => (
        <span className="font-semibold text-slate-800">{value}</span>
      ),
    },

    {
      key: "present_days",
      label: "Present Days",
      render: (value) => (
        <span className="text-slate-700 font-medium">{value ?? 0}</span>
      ),
    },

    {
      key: "attendance_percentage",
      label: "Attendance %",
      render: (value) => {
        const num = Number(value || 0);

        return (
          <span
            className={`font-semibold ${
              num < 75 ? "text-red-500" : "text-green-600"
            }`}
          >
            {num}%
          </span>
        );
      },
    },

    {
      key: "student_status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "Active" ? "success" : "warning"}>
          {value}
        </Badge>
      ),
    },

    {
      key: "actions",
      label: <div className="text-right w-full">Actions</div>,
      width: "160px",
      align: "right", // 👈 if your Table supports alignment
      headerAlign: "right",
      render: (_, row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => viewDetails(row.enrollment_id)}
            className="flex items-center gap-1"
          >
            <Eye size={14} />
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 items-center mb-6">
        {/* Year */}
        <select
          className="border p-2 rounded"
          value={selectedYear?.id || ""}
          onChange={(e) => {
            const year = years.find((y) => y.id == e.target.value);

            setSelectedYear(year);

            const today = getToday();

            if (today >= year.start_date && today <= year.end_date) {
              setDate(today);
            } else {
              setDate(year.start_date);
            }
          }}
        >
          <option value="">Select Year</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.year_label}
            </option>
          ))}
        </select>

        {/* Class */}
        <select
          className="border p-2 rounded"
          value={selectedClass || ""}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.class_name}
            </option>
          ))}
        </select>

        {/* Month */}
        <Input
          type="month"
          value={date.slice(0, 7)}
          onChange={(e) => setDate(e.target.value + "-01")}
        />
      </div>

      {/* TABLE */}
      {view === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview ({students.length})</CardTitle>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            <Table
              columns={columns}
              data={students}
              emptyMessage="No students found"
              onRowClick={(row) => viewDetails(row.enrollment_id)}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
