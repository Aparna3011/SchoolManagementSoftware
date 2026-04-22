import { useState, useEffect } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { Eye } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";
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

    console.log("OVERVIEW ISSSSS", res);

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
      key: "monthly_overview",
      label: (
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>TD</span>
          <span className="text-purple-600">WD</span>
          <span className="text-green-600">PD</span>
          <span className="text-red-600">AD</span>
          <span className="text-blue-600">HD</span>
        </div>
      ),
      render: (_, row) => (
        <span className="text-slate-700 flex justify-between font-medium text-sm">
          <span>{row.total_days}</span>
          <span className="text-purple-600">{row.working_days}</span>
          <span className="text-green-600">{row.present_days}</span>
          <span className="text-red-600">{row.absent_days}</span>
          <span className="text-blue-600">{row.holidays || 0}</span>
        </span>
      ),
    },

    {
      key: "spacer",
      label: "",
      width: "20px",
      render: () => <div className="w-full"></div>,
    },

    {
      key: "attendance_percentage",
      label: "Attendance %",
      align: "right",
      headerAlign: "right",
      render: (value) => {
        const num = Number(value || 0);

        return (
          <span
            className={`font-semibold text-sm ${
              num < 75 ? "text-red-600" : "text-green-600"
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
      align: "right",
      headerAlign: "right",
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
      align: "right",
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
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Attendance Overview</h1>
        <p className="text-slate-600 mt-1">Monthly attendance summary for students</p>
      </div>

      {/* FILTERS CARD */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Year */}
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

            {/* Month */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-900">
                Month
              </label>
              <input
                type="month"
                value={date.slice(0, 7)}
                min={selectedYear?.start_date?.slice(0, 7)}
                max={selectedYear?.end_date?.slice(0, 7)}
                onChange={(e) => setDate(e.target.value + "-01")}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {selectedYear && (
                <span className="text-xs text-slate-500">
                  Valid: {selectedYear.start_date?.slice(0, 7)} to {selectedYear.end_date?.slice(0, 7)}
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TABLE */}
      {view === "students" && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview ({students.length} Students)</CardTitle>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            <Table
              columns={columns}
              data={students}
              emptyMessage="No students found for the selected class and month"
              onRowClick={(row) => viewDetails(row.enrollment_id)}
            />
          </CardBody>

          <CardFooter className="bg-slate-50">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">Legend:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">TD</span>
                <span className="text-slate-500">= Total Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600">WD</span>
                <span className="text-slate-500">= Working Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">PD</span>
                <span className="text-slate-500">= Present Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">AD</span>
                <span className="text-slate-500">= Absent Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">HD</span>
                <span className="text-slate-500">= Holiday Days</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
