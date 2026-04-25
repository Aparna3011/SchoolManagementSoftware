import { useState, useEffect } from "react";
import { Save, CircleX } from "lucide-react";
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
import {TabIndexHandler} from "../components/ui/TabIndexHandler";

export default function Attendance() {
  const { execute, loading } = useDatabase();

  const [academicYear, setAcademicYear] = useState(null);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return (
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")
    );
  });

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const getToday = () => {
    const today = new Date();
    return (
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")
    );
  };

  // Check if date is in the future (strictly after today)
  const isFutureDate = (dateString) => {
    // Parse dates in YYYY-MM-DD format to avoid timezone issues
    const selectedDate = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create tomorrow's date to check if selected date is truly in the future
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Date validation:", {
      selectedDate: selectedDate.toISOString(),
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      isFuture: selectedDate >= tomorrow,
    });

    return selectedDate >= tomorrow;
  };

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState("classes");

  async function loadData() {
    console.log("Loading data with:", { date, selectedClass, selectedYear });

    // Validate that both academic year and class are selected
    if (!selectedClass || !selectedYear) {
      // console.log('Missing class or year, clearing students');
      setStudents([]);
      return;
    }

    // Check if selected date is in the future
    if (isFutureDate(date)) {
      toast.error("Cannot mark attendance for future dates");
      setStudents([]);
      return;
    }

    // Check if date is within academic year range
    const selectedDate = new Date(date + "T00:00:00");
    const startDate = new Date(selectedYear.start_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("Date range check:", {
      selectedDate: selectedDate.toISOString(),
      startDate: startDate.toISOString(),
      today: today.toISOString(),
    });

    if (selectedDate < startDate) {
      toast.error("Selected date is before the academic year start date");
      setStudents([]);
      return;
    }

    // Ensure date is not after today (allow today)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate >= tomorrow) {
      toast.error("Cannot mark attendance for future dates");
      setStudents([]);
      return;
    }

    const res = await execute(() =>
      window.api.attendance.getByFilters({
        date,
        classId: Number(selectedClass),
        academicYearId: selectedYear?.id,
      }),
    );

    if (!res) {
      toast.error("Failed to load students");
      setStudents([]);
      return;
    }

    // ✅ Handle both formats
    if (Array.isArray(res)) {
      setStudents(res);
    } else if (res.success) {
      setStudents(res.data || []);
    } else {
      toast.error(res?.error || "Failed to load students");
      setStudents([]);
    }

    console.log("Attendance Response:", res);
    console.log("Selected Year ID:", selectedYear?.id);
  }

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

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
    console.log("Saving attendance with:", {
      date,
      selectedClass,
      selectedYear,
      studentsLength: students.length,
    });

    if (!students.length) {
      toast.error("No students found");
      return;
    }

    // Validate that both academic year and class are selected
    if (!selectedClass || !selectedYear) {
      toast.error("Please select both academic year and class");
      return;
    }

    // Check if selected date is in the future (strictly after today)
    if (isFutureDate(date)) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    // Check if date is within academic year range
    const selectedDate = new Date(date);
    const startDate = new Date(selectedYear.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Allow today but not future dates
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Save date validation:", {
      selectedDate: selectedDate.toISOString(),
      startDate: startDate.toISOString(),
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
    });

    // if (selectedDate < startDate) {
    //   toast.error("Selected date is before the academic year start date");
    //   return;
    // }

    // if (selectedDate >= tomorrow) {
    //   toast.error("Cannot mark attendance for future dates");
    //   return;
    // }

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

    // Reload data to reflect changes
    loadData();
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
  }, [selectedClass, selectedYear, date]);

  useEffect(() => {
    async function loadYears() {
      const all = await execute(() => window.api.financialYear.getAll());

      const active = await execute(() => window.api.financialYear.getActive());

      if (!all) return;

      setYears(all);

      if (active) {
        setSelectedYear(active);

        const today = getToday();

        // Always try to set today's date first, fallback to academic year start date
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
      key: "status",
      label: "Present/Absent",
      render: (value, row) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            tabIndex={0}
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
      key: "usin",
      label: "USIN",
    },
    {
      key: "roll_number",
      label: "Roll No",
    },
    {
      key: "student_name",
      label: "Name",
    },
  ];

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Student Attendance
        </h1>
        <p className="text-slate-600 mt-1">
          Track and manage student attendance
        </p>
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

                // Reset date to today when year changes, fallback to academic year start date
                const today = getToday();
                if (
                  year &&
                  today >= year.start_date &&
                  today <= year.end_date
                ) {
                  setDate(today);
                } else if (year) {
                  setDate(year.start_date);
                }
              }}
              options={years.map((y) => ({ value: y.id, label: y.year_label }))}
            />

            {/* Class */}
            <Select
              label="Class"
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              options={classes.map((c) => ({
                value: c.id,
                label: c.class_name,
              }))}
            />

            {/* Date - Allow dates from academic year start to today */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-900">Date</label>
              <input
                type="date"
                value={date}
                min={selectedYear?.start_date}
                max={getToday()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {selectedYear && (
                <span className="text-xs text-slate-500">
                  Valid: {formatDateDMY(selectedYear.start_date)} to{" "}
                  {formatDateDMY(selectedYear.end_date)}
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {view === "students" && selectedClass && selectedYear ? (
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
            <TabIndexHandler>
            <Table
              columns={columns}
              data={students}
              emptyMessage="No students found for the selected class"
            />
            </TabIndexHandler>
          </CardBody>

          <CardFooter>
            <Button onClick={handleSave} disabled={loading}>
              <Save size={16} />
              Save Attendance
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex justify-center items-center">
            <div className="text-center">
              <CircleX size={80} className="mx-auto mb-2 " />
              <h1 className="text-slate-600">
                No Students Found for Academic Year:{" "}
                {selectedYear?.year_label || "—"} and Class:{" "}
                {classes.find((c) => c.id === selectedClass)?.class_name || "—"}
              </h1>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
