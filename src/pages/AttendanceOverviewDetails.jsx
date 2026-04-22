import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import CalanderView from "../components/ui/CalanderView";
import { User, BadgeCheck, School } from "lucide-react";

export default function AttendanceDetails() {
  const { id } = useParams();

  const [student, setStudent] = useState({});
  const [summary, setSummary] = useState({});
  const [days, setDays] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calander, setcalander] = useState([]);
  const [yearData, setYearData] = useState([]);
  const [weeklyOffs, setWeeklyOffs] = useState([]);

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function loadDetails() {
    const res =
      await window.api.attendanceOverviewDetails.getStudentFullDetails({
        enrollmentId: Number(id),
      });

    console.log("FULL DATA:", res);

    if (!res) return;

    setStartDate(res.student.start_date); // Convert to 0-based index
    setEndDate(res.student.end_date);

    setStudent(res.student || {});
    setSummary(res.summary || {});
    setWeeklyOffs(res.weeklyOffs || []);
    setcalander(res.calendar || {});

    // 🔥 Convert calendar → monthly days
    const daysArray = Object.keys(res.calendar || {}).map((date) => {
      const map = {
        P: "Present",
        A: "Absent",
        H: "Holiday",
        W: "Weekend",
      };

      return {
        date,
        status: map[res.calendar[date]] || "Absent",
      };
    });

    setDays(daysArray);
  }

  function getColor(status) {
    switch (status) {
      case "P":
        return "bg-green-100 text-green-700";
      case "A":
        return "bg-red-100 text-red-700";
      case "H":
        return "bg-blue-100 text-blue-700";
      case "W":
        return "bg-gray-200 text-gray-600";
      case "WD":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-400";
    }
  }
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Details</h1>
      </div>
      {/* ================= STUDENT CARD ================= */}
      <div className="grid grid-cols-6 gap-5">
        <Card className="col-span-2">
          <CardBody className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <User size={14} /> Student
              </p>
              <h2 className="text-xl font-semibold text-gray-800">
                {student.student_name || "-"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                USIN: {student.usin || "-"}
              </p>

              <p className="text-sm text-gray-500 flex items-center gap-1">
                Class: {student.class_name || "-"}
              </p>
            </div>

            {/* STATUS */}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                student.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {student.status || "Unknown"}
            </span>
          </CardBody>
        </Card>
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> */}
        <Card className="text-center flex justify-center items-center bg-blue-50">
          <CardBody>
            {" "}
            <p className="text-gray-500 text-sm">Attendance %</p>
            <h3 className="text-2xl font-bold text-blue-600">
              {summary.percentage}
            </h3>
          </CardBody>
        </Card>

        <Card className="text-center flex justify-center items-center bg-blue-50">
          <CardBody>
            <p className="text-gray-500 text-sm">Present</p>
            <h3 className="text-2xl font-bold text-green-600">
              {summary.present}
            </h3>
          </CardBody>
        </Card>

        <Card className="text-center flex justify-center items-center bg-blue-50">
          <CardBody>
            <p className="text-gray-500 text-sm">Absent</p>
            <h3 className="text-2xl font-bold text-red-600">
              {summary.absent}
            </h3>
          </CardBody>
        </Card>

        <Card className="text-center flex justify-center items-center bg-blue-50">
          <CardBody>
            <p className="text-gray-500 text-sm">Working Days</p>
            <h3 className="text-2xl font-bold text-blue-500">
              {summary.workingDays}
            </h3>
          </CardBody>
        </Card>
        {/* </div> */}
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      {/* ================= WEEKLY SCHEDULE ================= */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>

        <CardBody className="flex px-5 justify-between ">
          {weekDays.map((d, i) => {
            const isOff = weeklyOffs.includes(i);

            return (
              <div
                key={i}
                className={`h-15 w-30 rounded-full flex items-center justify-center text-xl ${
                  isOff
                    ? "bg-red-200 text-red-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {d}
              </div>
            );
          })}
        </CardBody>
        <CardFooter>
          <Legend color="bg-green-100" label="Working" />
          <Legend color="bg-red-100" label="Weekend" />
           <Legend color="bg-blue-100" label="Holiday" /> 
           <Legend color="bg-gray-200" label="Weekend" /> 
        </CardFooter>
      </Card> */}

      {/* ================= MONTHLY CALENDAR =================
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
        </CardHeader>

        <CardBody>
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2">
            {weekDays.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => (
              <div
                key={i}
                className={`h-10 flex items-center justify-center rounded text-sm ${getColor(d.status)}`}
              >
                {new Date(d.date).getDate()}
              </div>
            ))}
          </div>
        </CardBody>
      </Card> */}

      {/* ================= LEGEND ================= */}
      {/* <Card>
        
      </Card> */}

      {/* ================= YEARLY CALENDAR ================= */}

      <CalanderView
        startDate={startDate}
        endDate={endDate}
        attendanceData={calander}
      />
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color}`}></div>
      <span>{label}</span>
    </div>
  );
}
