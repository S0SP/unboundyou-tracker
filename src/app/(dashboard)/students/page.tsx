"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Filter,
  UserPlus,
  X,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Student } from "@/types";

// Validation schema for Student Enrollment Form
const enrollmentSchema = z.object({
  studentName: z.string().min(2, "Student Name must be at least 2 characters."),
  grade: z.string().min(1, "Please select a grade."),
  board: z.string().min(1, "Please select a board."),
  parentName: z.string().min(2, "Parent Name must be at least 2 characters."),
  parentEmail: z.string().email("Please enter a valid email address."),
  parentWhatsApp: z
    .string()
    .min(10, "Parent WhatsApp must contain at least 10 digits.")
    .regex(/^\+?[0-9\s\-]+$/, "Invalid phone format. Use numbers only."),
  mentor: z.string().min(2, "Mentor Name must be at least 2 characters."),
  academicCoordinator: z
    .string()
    .min(2, "Academic Coordinator must be at least 2 characters."),
  subjects: z.array(z.string()).min(1, "Please allocate at least one subject."),
});

type EnrollmentInput = z.infer<typeof enrollmentSchema>;

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedHealth, setSelectedHealth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Active");

  // Load initial params if redirected from dashboard
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setEnrollOpen(true);
    }
    const healthParam = searchParams.get("health");
    if (healthParam) {
      setSelectedHealth(healthParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentInput>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentName: "",
      grade: "",
      board: "",
      parentName: "",
      parentEmail: "",
      parentWhatsApp: "",
      mentor: "",
      academicCoordinator: "",
      subjects: [],
    },
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to load students directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onEnrollSubmit = async (data: EnrollmentInput) => {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.error) {
        setEnrollOpen(false);
        reset();
        loadStudents();
      } else {
        alert(`Failed to enroll student: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error enrolling student: ${err.message}`);
    }
  };

  // Filter students array based on client selections
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mentor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchGrade = !selectedGrade || s.grade === selectedGrade;
    const matchBoard = !selectedBoard || s.board === selectedBoard;
    const matchHealth = !selectedHealth || s.healthStatus === selectedHealth;
    const matchStatus = !selectedStatus || s.status === selectedStatus;

    return matchSearch && matchGrade && matchBoard && matchHealth && matchStatus;
  });

  const grades = ["6", "7", "8", "9", "10", "11", "12"];
  const boards = ["CBSE", "ICSE", "IGCSE", "IB", "State Board"];
  const healthStates = ["Excellent", "Needs Attention", "At Risk"];
  const statuses = ["Active", "Completed", "Paused"];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Student Directory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search, filter, and access all active academic journey profiles.
          </p>
        </div>
        <button
          onClick={() => setEnrollOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-btn shadow-premium-md btn-transition text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student name, UUID, mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-input text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Quick Clear */}
          {(selectedGrade || selectedBoard || selectedHealth || searchQuery || selectedStatus !== "Active") && (
            <button
              onClick={() => {
                setSelectedGrade("");
                setSelectedBoard("");
                setSelectedHealth("");
                setSearchQuery("");
                setSelectedStatus("Active");
              }}
              className="px-4 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider">
              Filter by:
            </span>
          </div>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Grade */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>

          {/* Board */}
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Health */}
          <select
            value={selectedHealth}
            onChange={(e) => setSelectedHealth(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Health Categories</option>
            {healthStates.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-card border border-border rounded-card animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((s) => (
            <div
              key={s.uuid}
              onClick={() => router.push(`/students/${s.uuid}`)}
              className="bg-card border border-border p-5 rounded-card shadow-premium-sm flex flex-col justify-between hover-card-premium cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[200px]">
                    <h3 className="font-bold text-base text-foreground truncate">
                      {s.studentName}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {s.uuid}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      s.healthStatus === "Excellent"
                        ? "bg-success/10 text-success"
                        : s.healthStatus === "Needs Attention"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {s.healthStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 bg-muted border border-border rounded text-muted-foreground font-medium">
                    Grade {s.grade}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-muted border border-border rounded text-muted-foreground font-medium">
                    {s.board}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 pt-4 border-t border-border/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-bold text-foreground">
                    {s.overallProgressScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${s.overallProgressScore}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-12 text-center rounded-card shadow-sm">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No students found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filters to find student profiles.
          </p>
        </div>
      )}

      {/* Enrollment slide-over panel */}
      {enrollOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEnrollOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border-l border-gray-200 h-full flex flex-col p-6 shadow-[-25px_0_50px_-12px_rgba(0,0,0,0.1)] z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Enroll Student</h2>
                  <p className="text-xs text-muted-foreground">
                    Add new academic file and assign subjects.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnrollOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit(onEnrollSubmit)}
              className="flex-1 overflow-y-auto space-y-4 pr-2 pb-12"
            >
              {/* Student name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Student Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  {...register("studentName")}
                  className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                    errors.studentName ? "border-red-500" : "border-gray-200"
                  } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {errors.studentName && (
                  <p className="text-[10px] text-red-500">{errors.studentName.message}</p>
                )}
              </div>

              {/* Grade & Board */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Grade *
                  </label>
                  <select
                    {...register("grade")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 border ${
                      errors.grade ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  >
                    <option value="">Select Grade</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                  {errors.grade && (
                    <p className="text-[10px] text-red-500">{errors.grade.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Board *
                  </label>
                  <select
                    {...register("board")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 border ${
                      errors.board ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  >
                    <option value="">Select Board</option>
                    {boards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {errors.board && (
                    <p className="text-[10px] text-red-500">{errors.board.message}</p>
                  )}
                </div>
              </div>

              {/* Parent Name & Contact */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Parent Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alok Sharma"
                  {...register("parentName")}
                  className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                    errors.parentName ? "border-red-500" : "border-gray-200"
                  } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {errors.parentName && (
                  <p className="text-[10px] text-red-500">{errors.parentName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Parent Email *
                  </label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    {...register("parentEmail")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                      errors.parentEmail ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {errors.parentEmail && (
                    <p className="text-[10px] text-red-500">{errors.parentEmail.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    WhatsApp (Intl format) *
                  </label>
                  <input
                    type="text"
                    placeholder="+919999999999"
                    {...register("parentWhatsApp")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                      errors.parentWhatsApp ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {errors.parentWhatsApp && (
                    <p className="text-[10px] text-red-500">
                      {errors.parentWhatsApp.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Mentor & Coordinator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Mentor *
                  </label>
                  <input
                    type="text"
                    placeholder="Mentor Name"
                    {...register("mentor")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                      errors.mentor ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {errors.mentor && (
                    <p className="text-[10px] text-red-500">{errors.mentor.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Coordinator *
                  </label>
                  <input
                    type="text"
                    placeholder="Coordinator Name"
                    {...register("academicCoordinator")}
                    className={`w-full px-3.5 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border ${
                      errors.academicCoordinator ? "border-red-500" : "border-gray-200"
                    } rounded-input text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {errors.academicCoordinator && (
                    <p className="text-[10px] text-red-500">
                      {errors.academicCoordinator.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject Allocations checkboxes */}
              <div className="space-y-2 border-t border-border pt-4 mt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Allocate Subjects *
                </label>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                  {[
                    { id: "SUB001", name: "Mathematics" },
                    { id: "SUB002", name: "Physics" },
                    { id: "SUB003", name: "Chemistry" },
                    { id: "SUB004", name: "Biology" },
                    { id: "SUB005", name: "English" },
                    { id: "SUB006", name: "ICT" },
                  ].map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-3 py-1.5 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={sub.id}
                        {...register("subjects")}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{sub.name}</span>
                    </label>
                  ))}
                </div>
                {errors.subjects && (
                  <p className="text-[10px] text-red-500">{errors.subjects.message}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-border flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEnrollOpen(false)}
                  className="flex-1 py-2.5 border border-border hover:bg-muted text-sm font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
