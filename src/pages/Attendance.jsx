import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { showError, showSuccess } from "../utils/toast";

export default function Attendance() {
  const { execute, loading } = useDatabase();

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState("classes");

  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA"),
  );

  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  // =========================
  // LOAD CLASSES
  // =========================
  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    const res = await execute(() => window.api.class.getAll());
    setClasses(res || []);
  }

  // =========================
  // CLICK CLASS → LOAD STUDENTS
  // =========================
  async function handleClassClick(classId) {
    if (!classId) return;

    setView("students");

   const res = await execute(() =>
  window.api.student.getAll({
    classId: classId,
  })
);

console.log("Students:", res);

if (!res) {
  showError("Failed to load students");
  return;
}

setStudents(res);

    setStudents(res.data || []);

    // Load attendance
    const attRes = await execute(() => window.api.attendance.getByDate(date));

    if (!attRes.success) {
      showError(attRes.error);
      return;
    }

    const map = {};
    attRes.data.forEach((a) => {
      map[a.enrollment_id] = {
        status: a.status,
        note: a.note,
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
      showError("No students found");
      return;
    }

    const payload = students.map((s) => ({
      enrollment_id: s.enrollment_id,
      attendance_date: date,
      status: attendance[s.enrollment_id]?.status || "Absent",
    }));

    const res = await execute(() => window.api.attendance.saveBulk(payload));

    if (!res.success) {
      showError(res.error);
      return;
    }

    showSuccess("Attendance saved successfully");
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
  useEffect(() => {
    if (!selectedClass) return;

    handleClassClick(selectedClass);
  }, [selectedClass]);

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Student Attendance</h1>
      </div>

      {/* =========================
          CLASS VIEW
      ========================= */}
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

      {/* =========================
          STUDENT VIEW
      ========================= */}
      {view === "students" && (
        <>
          {/* TOP BAR */}
          <div className="flex gap-4 mb-4">
            <Button onClick={() => setView("classes")}>← Back</Button>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
                    <th className="p-2 border">Roll</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Present</th>
                    <th className="p-2 border">Absent</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((s) => (
                    <tr key={s.enrollment_id}>
                      <td className="p-2 border">{s.roll_number}</td>
                      <td className="p-2 border">{s.student_name}</td>

                      {["Present", "Absent"].map((status) => (
                        <td key={status} className="text-center border">
                          <input
                            type="radio"
                            name={`att-${s.enrollment_id}`}
                            checked={
                              attendance[s.enrollment_id]?.status === status
                            }
                            onChange={() =>
                              handleStatus(s.enrollment_id, status)
                            }
                          />
                        </td>
                      ))}
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
