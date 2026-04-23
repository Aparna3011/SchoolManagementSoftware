import React from "react";
import { Plus } from "lucide-react";

const AttendanceCalendar = ({ startDate, endDate, attendanceData }) => {
  // const year = parseInt(startDate.slice(0, 4)); // "2026"
  // const startMonth = parseInt(startDate.slice(5, 7) - 1); // "04"

  // // const year = 2026;
  // // Starting from March (Month index 2)
  // // const startMonth = 2;
  // const months = Array.from({ length: 12 }, (_, i) => (startMonth + i) % 12);

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const months = [];

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
    });

    current.setMonth(current.getMonth() + 1);
  }

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Status Color Mapping
  const statusColors = {
    P: "bg-green-100 text-green-800 border-green-200", // Present
    A: "bg-red-100 text-red-700 border-red-200", // Absent
    W: "bg-gray-200 text-gray-700 border-gray-300", // Weekends
    H: "bg-blue-100 text-blue-700 border-blue-200", // Holiday
    WD: "bg-transparent text-gray-600 border-gray-50", //workingdays
    //  OOR: "bg-gray-100 text-gray-300 border-gray-200", // Out of Range
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            ATTENDANCE DASHBOARD
          </h1>
          <p className="text-gray-500 font-medium">
            Academic Year {formatDateDMY(startDate)} to {formatDateDMY(endDate)}
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm font-bold text-gray-700">
            {start.getFullYear()}
          </div>
          <button className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md">
            <Plus size={20} />
          </button>
        </div> */}
      </header>

      {/* Responsive Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
        {months.map(({ year, month }) => {
          {
            /* const displayYear = monthIndex < startMonth ? year + 1 : year; */
          }
          const displayYear = year;
          const monthIndex = month;
          const daysInMonth = getDaysInMonth(displayYear, monthIndex);
          const firstDay = getFirstDayOfMonth(displayYear, monthIndex);
          const monthName = new Date(displayYear, monthIndex).toLocaleString(
            "default",
            { month: "long" },
          );

          return (
            <div
              key={`${displayYear}-${monthIndex}`}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                {monthName}{" "}
                <span className="text-gray-400 text-sm font-normal">
                  {displayYear}
                </span>
              </h3>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span
                    key={d}
                    className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty slots for start of month */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Actual Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  {
                    /* const dateStr = `${displayYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const status = attendanceData[dateStr];

                  const date = new Date(displayYear, monthIndex, day); */
                  }

                  const dateObj = new Date(displayYear, monthIndex, day);

                  // ✅ SAME FORMAT AS BACKEND (IMPORTANT FIX)
                  const dateStr = dateObj.toLocaleDateString("en-CA");

                  const status = attendanceData[dateStr];
                  const date = dateObj;

                  {
                    /* const isOutOfRange =
                    date < new Date(startDate) || date > new Date(endDate); */
                  }

                  const isOutOfRange = date < start || date > end;

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-xs font-medium rounded-md border
    ${
      isOutOfRange
        ? "bg-gray-100 text-gray-300 border-transparent"
        : status
          ? statusColors[status]
          : "bg-green-50 text-green-700 border-green-200"
    }
  `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend Section */}
      <div className="mt-10 flex gap-6 p-4 bg-white rounded-lg border border-gray-200 w-fit">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>{" "}
          Present
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>{" "}
          Absent
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>{" "}
          Holiday
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>{" "}
          Weekend
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
