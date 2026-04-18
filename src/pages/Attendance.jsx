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
// import { toast.error, toast.error } from "../utils/toast";

export default function Attendance() {
  const { execute, loading } = useDatabase();

  const [academicYear, setAcademicYear] = useState(null);
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA"),
  );
  const getToday = () => new Date().toISOString().split("T")[0];

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState("classes");

  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  async function loadData() {
    if (!selectedClass) return;

    const students = await execute(() =>
      window.api.student.getAll({
        class_id: selectedClass,
      }),
    );

    if (!students) return;

    setStudents(students);

    const att = await execute(() =>
      window.api.attendance.getByFilters({
        date,
        classId: Number(selectedClass),
      }),
    );

    if (!att) return;

    const map = {};

    att.forEach((a) => {
      map[a.enrollment_id] = {
        status: a.status,
      };
    });

    setAttendance(map);
  }

  // =========================
  // HANDLE STATUS
  // =========================
  function handleStatus(id, status) {
    setAttendance((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
      },
    }));
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
      status: attendance[s.enrollment_id]?.status || "Absent",
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
    const updated = {};
    students.forEach((s) => {
      updated[s.enrollment_id] = { status: "Present" };
    });
    setAttendance(updated);
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
    if (!selectedClass) return;

    setView("students");
    loadData();
  }, [selectedClass, date]);

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

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

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Student Attendance</h1>
      </div>

      {/* CLASS DROPDOWN */}
      {/* <select
        className="border p-2 rounded mb-4"
        value={selectedClass || ""}
        onChange={(e) => setSelectedClass(e.target.value)}
      >
        <option value="">Select Class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.class_name}
          </option>
        ))}
      </select> */}
      <div className="flex gap-4 items-center mb-6">
        {/* Academic Year (Financial Year) */}
        <select
          className="border p-2 rounded"
          value={selectedYear?.id || ""}
          onChange={(e) => {
            const year = years.find((y) => y.id == e.target.value);
            setSelectedYear(year);
            setDate(year.start_date);
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

        {/* Date */}
        <Input
          type="date"
          value={date}
          min={academicYear?.start_date}
          max={academicYear?.end_date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* <div className="flex gap-4 mb-4">
        <Input
          type="date"
          value={date}
          min={academicYear?.start_date}
          max={academicYear?.end_date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div> */}

      {/* STUDENT VIEW */}
      {view === "students" && (
        <>
          <div className="flex gap-4 mb-4">
            <Button onClick={() => setView("classes")}>← Back</Button>
          </div>
          {/* TABLE */}
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>

            <CardBody>
              <div className="mb-3">
                <Button onClick={markAllPresent}>Mark All Present</Button>
              </div>

              <table className="w-full border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border text-center  w-24">
                      Present/Absent
                    </th>
                    <th className="p-2 border">Name</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((s) => (
                    <tr key={s.enrollment_id}>
                      {/* Present Checkbox */}
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          // disabled={!isEditing}
                          checked={
                            attendance[s.enrollment_id]?.status === "Present"
                          }
                          onChange={(e) =>
                            handleStatus(
                              s.enrollment_id,
                              e.target.checked ? "Present" : "Absent",
                            )
                          }
                        />
                      </td>

                      {/* Name */}
                      <td className="p-2 border">{s.student_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>

            <CardFooter>
              <Button onClick={handleSave} disabled={loading}>
                <Save size={16} />
                Save Attendance
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
