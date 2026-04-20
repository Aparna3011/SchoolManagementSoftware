import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function AttendanceDetails() {
  const { id } = useParams();

  const [student, setStudent] = useState({});
  const [summary, setSummary] = useState({});
  const [days, setDays] = useState([]);
  const [yearData, setYearData] = useState([]);

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function loadDetails() {
    const res = await window.api.attendance.getStudentFullDetails({
      enrollmentId: id,
      month,
    });

    if (!res) return;

    setStudent(res.student);
    setSummary(res.monthly);
    setDays(res.days);
    setYearData(res.yearly);
  }

  function getColor(status) {
    switch (status) {
      case "Present":
        return "bg-green-200";
      case "Absent":
        return "bg-red-200";
      case "Holiday":
        return "bg-blue-200";
      case "Weekend":
        return "bg-gray-200";
      default:
        return "bg-gray-100";
    }
  }

  return (
    <div>
      {/* ================= STUDENT CARD ================= */}
      <Card className="mb-6">
        <CardBody>
          <h2 className="text-xl font-bold">
            {student.student_name}
          </h2>
          <p className="text-sm text-gray-500">
            USIN: {student.usin}
          </p>

          <Badge
            variant={
              student.student_status === "Active"
                ? "success"
                : "warning"
            }
          >
            {student.student_status}
          </Badge>
        </CardBody>
      </Card>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardBody>
          <p className="text-sm text-gray-500">Attendance %</p>
          <h3 className="text-xl font-bold">{summary.percentage}%</h3>
        </CardBody></Card>

        <Card><CardBody>
          <p className="text-sm text-gray-500">Present</p>
          <h3 className="text-xl font-bold">{summary.present}</h3>
        </CardBody></Card>

        <Card><CardBody>
          <p className="text-sm text-gray-500">Absent</p>
          <h3 className="text-xl font-bold">{summary.absent}</h3>
        </CardBody></Card>

        <Card><CardBody>
          <p className="text-sm text-gray-500">Holidays</p>
          <h3 className="text-xl font-bold">{summary.holidays}</h3>
        </CardBody></Card>
      </div>

      {/* ================= MONTH GRID ================= */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Monthly View</h3>

        <div className="grid grid-cols-7 gap-2 text-center">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d}>{d}</div>
          ))}

          {days.map((d, i) => (
            <div
              key={i}
              className={`h-10 flex items-center justify-center rounded ${getColor(d.status)}`}
            >
              {new Date(d.date).getDate()}
            </div>
          ))}
        </div>
      </div>

      {/* ================= LEGEND ================= */}
      <div className="flex gap-4 mb-6 text-sm">
        <span><div className="w-4 h-4 bg-green-200 inline-block mr-1"></div>Present</span>
        <span><div className="w-4 h-4 bg-red-200 inline-block mr-1"></div>Absent</span>
        <span><div className="w-4 h-4 bg-blue-200 inline-block mr-1"></div>Holiday</span>
        <span><div className="w-4 h-4 bg-gray-200 inline-block mr-1"></div>Weekend</span>
      </div>

      {/* ================= YEAR GRID ================= */}
      <div>
        <h3 className="font-semibold mb-4">Yearly Overview</h3>

        <div className="grid grid-cols-3 gap-4">
          {yearData.map((m, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>{m.month}</CardTitle>
              </CardHeader>

              <CardBody>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {m.days.map((d, idx) => (
                    <div
                      key={idx}
                      className={`p-1 text-center rounded ${getColor(d.status)}`}
                    >
                      {d.day}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}