import { useState, useEffect } from "react";
import { Save, CheckCircle, CircleX, RotateCcw } from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Input } from "../components/ui/Input";

export default function Promotion() {
  const { execute, loading } = useDatabase();

  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const [targets, setTargets] = useState({
    targetClass: null,
    targetYear: null,
  });
  const [students, setStudents] = useState([]);
  const [commonFee, setCommonFee] = useState("");

  // Initial Load: Years and Classes
  useEffect(() => {
    async function init() {
      const [allYears, allClasses] = await Promise.all([
        execute(() => window.api.financialYear.getAll()),
        execute(() => window.api.class.getAll()),
      ]);

      if (allYears) {
        setYears(allYears);

        // 🔥 AUTO SELECT ACTIVE YEAR
        const activeYear = allYears.find((y) => y.is_active === 1);

        if (activeYear) {
          setSelectedYear(activeYear);
        }
      }

      if (allClasses) setClasses(allClasses);
    }

    init();
  }, []);

  // Update targets when source filters change
  useEffect(() => {
    async function updateTargets() {
      if (!selectedYear || !selectedClass) return;

      const res = await window.api.promotion.getTargets({
        currentYearId: selectedYear.id,
        currentClassId: selectedClass,
      });

      if (res) {
        setTargets({
          targetClass: res.targetClass,
          targetYear: res.targetYear,
        });
      } else {
        setTargets({ targetClass: null, targetYear: null });
      }
    }
    updateTargets();
  }, [selectedYear, selectedClass]);

  const handleTargetYearChange = (yearId) => {
    const year = years.find((y) => y.id == yearId);
    setTargets((prev) => ({ ...prev, targetYear: year }));
  };

  const handleTargetClassChange = (classId) => {
    const cls = classes.find((c) => c.id == classId);
    setTargets((prev) => ({ ...prev, targetClass: cls }));
  };
  useEffect(() => {
    async function loadStudents() {
      if (!selectedYear?.id || !selectedClass) {
        setStudents([]);
        return;
      }

      try {
        const res = await window.api.promotion.getStudentsForPromotion({
          yearId: selectedYear.id,
          classId: selectedClass,
        });

        if (Array.isArray(res)) {
          // Initialize with default fees from target class if available
          const baseFee = targets.targetClass?.base_fee || 0;
          const initializedStudents = res.map((s) => ({
            ...s,
            promotion_status: targets.targetClass ? "Promoted" : "Alumni",
            fee: s.class_base_fee || baseFee,
          }));
          setStudents(initializedStudents);
        } else {
          console.error("Expected array but received:", res);
          setStudents([]);
        }
      } catch (error) {
        console.error("Error loading students:", error);
        setStudents([]);
      }
    }
    loadStudents();
  }, [selectedYear, selectedClass, targets.targetClass]);

  const handleStatusChange = (studentId, status) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, promotion_status: status } : s,
      ),
    );
  };

  const handleFeeChange = (studentId, fee) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, fee: parseFloat(fee) || 0 } : s,
      ),
    );
  };

  const handleCommonFeeChange = (fee) => {
    setCommonFee(fee);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        fee: parseFloat(fee) || 0,
      })),
    );
  };

  const markAllPromoted = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, promotion_status: "Promoted" })),
    );
  };

  async function handleSave() {
    if (!students.length) {
      toast.error("No students to promote");
      return;
    }
    if (!targets.targetYear) {
      toast.error("Target academic year not found");
      return;
    }

    try {
      const promotions = students.map((s) => ({
        student_id: s.student_id,
        status: s.promotion_status,
        fee: s.fee,
        currentClassId: selectedClass, // used if status is 'Repeat'
        currentYearId: selectedYear.id,
      }));
      // ✅ Prevent invalid promotion when no next class
      if (!targets.targetClass) {
        const hasInvalid = students.some(
          (s) => s.promotion_status !== "Alumni",
        );

        if (hasInvalid) {
          toast.error("No next class available. Only Alumni allowed.");
          return;
        }
      }

      const payload = {
        targetYearId: targets.targetYear.id,
        targetClassId:
          targets.targetClass?.id === "ALUMNI" ? null : targets.targetClass?.id,
        promotions,
      };

      const res = await window.api.promotion.promoteBatch(payload);
      console.log("Payload being sent:", payload);

      if (res?.success) {
        toast.success(res.message);
        setStudents([]); // Clear list after success
        console.log("Payload being sent:", payload);
      } else {
        toast.error(res?.error || "Failed to promote students");
      }
    } catch (error) {
      console.error("Promotion save error:", error);
      toast.error(
        error.message || "An unexpected error occurred while saving promotions",
      );
    }
  }

  const columns = [
    {
      key: "status",
      label: "Promotion Status",
      render: (_, row) => (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={row.promotion_status === "Promoted"}
              onChange={(e) => {
                if (!targets.targetClass) {
                  handleStatusChange(row.student_id, "Alumni");
                } else {
                  handleStatusChange(
                    row.student_id,
                    e.target.checked ? "Promoted" : "Repeat",
                  );
                }
              }}
              className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {/* <span className="text-sm font-medium">
              {row.promotion_status === "Promoted" ? "Promoted" : "Repeat"}
            </span> */}
          </div>
        </div>
      ),
    },

    { key: "usin", label: "USIN" },
    { key: "student_name", label: "Student Name" },
    {
      key: "fee",
      label: "Annual Fee",
      render: (_, row) => (
        <div className="flex justify-center">
          <Input
            type="number"
            value={row.fee}
            onChange={(e) => handleFeeChange(row.student_id, e.target.value)}
            className="w-32 text-center"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Promotion
          </h1>
          <p className="text-slate-500 mt-1">
            Promote students to the next academic year and class
          </p>
        </div>
      </div>

      <Card className="mb-8 border-slate-200 shadow-sm">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Academic Year"
               value={selectedYear?.id || ""} 
              onChange={(e) => {
                const value = e.target.value;

                if (!value) {
                  setSelectedYear(null); // ✅ clear properly
                } else {
                  setSelectedYear(years.find((y) => y.id == value));
                }
              }}
              options={years.map((y) => ({ value: y.id, label: y.year_label }))}
              required
            />
            <Select
              label="Class"
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              options={classes.map((c) => ({
                value: c.id,
                label: c.class_name,
              }))}
              required
            />
          </div>
        </CardBody>
      </Card>

      {students.length > 0 ? (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <CardTitle className="text-lg">Promotion List</CardTitle>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-lg border border-slate-200 shadow-sm">
                  <Input
                    label="Common Fee"
                    type="number"
                    value={commonFee}
                    onChange={(e) => handleCommonFeeChange(e.target.value)}
                    className="w-32"
                    placeholder="Enter Fee"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-lg border border-slate-200 shadow-sm">
                  <Select
                    label="Next Year"
                    value={targets.targetYear?.id || ""}
                    options={years.map((y) => ({
                      value: y.id,
                      label: y.year_label,
                    }))}
                    onChange={(e) => handleTargetYearChange(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-lg border border-slate-200 shadow-sm">
                  <Select
                    label="Next Class"
                    value={
                      targets.targetClass ? targets.targetClass.id : "ALUMNI" // ✅ fallback
                    }
                    options={[
                      { value: "ALUMNI", label: "Alumni (No Next Class)" }, // ✅ always show
                      ...classes.map((c) => ({
                        value: c.id,
                        label: c.class_name,
                      })),
                    ]}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "ALUMNI") {
                        handleTargetClassChange(null);

                        // force all students to Alumni
                        setStudents((prev) =>
                          prev.map((s) => ({
                            ...s,
                            promotion_status: "Alumni",
                          })),
                        );
                      } else {
                        handleTargetClassChange(value);
                      }
                    }}
                    className="w-40"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={markAllPromoted}
                variant="secondary"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                Mark All Promoted
              </Button>
            </div>
            <Table
              columns={columns}
              data={students}
              emptyMessage="No students found for the selected criteria"
            />
          </CardBody>
          <CardFooter>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="shadow-sm"
              >
                <Save size={16} />
                Save Promotion
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody className=" flex  justify-center  align-center">
              <div className="">
                <CircleX size={80} />
                <h1>
                  No Students Found for the Academic year:
                  {selectedYear?.year_label} and Class:{" "}
                  {classes.find((c) => c.id === selectedClass)?.class_name}{" "}
                </h1>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
