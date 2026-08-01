"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  BookOpen,
  CheckSquare,
  Award,
  TrendingUp,
  Plus,
  ArrowLeft,
  GraduationCap,
  Users,
  Settings,
  ChevronRight,
  FileText,
  Lock,
  ExternalLink,
  Download,
  Check,
  RefreshCw,
  User,
  Mail,
  Phone,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Student,
  ClassLog,
  Assignment,
  ChapterTest,
  SchoolExam,
  LearningPlan,
  PtmLog,
  MentorNote,
  ReportLog,
} from "@/types";

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const router = useRouter();
  const { uuid } = use(params);

  // Core datasets
  const [profile, setProfile] = useState<{
    student: Student;
    subjects: any[];
    classes: ClassLog[];
    assignments: Assignment[];
    tests: ChapterTest[];
    exams: SchoolExam[];
    learningPlans: LearningPlan[];
    ptms: PtmLog[];
    mentorNotes: MentorNote[];
    reports: ReportLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal triggers
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form input states
  const [classForm, setClassForm] = useState({
    subject: "",
    chapter: "",
    date: new Date().toISOString().split("T")[0],
    duration: 60,
    attendance: "Present",
    participation: 80,
    homeworkGiven: false,
    homeworkCompleted: false,
    revisionNotesShared: true,
    remarks: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    subject: "",
    chapter: "",
    assignmentTitle: "",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [reviewForm, setReviewForm] = useState({
    assignmentId: "",
    submissionStatus: "Reviewed",
    score: 80,
    totalMarks: 100,
    mentorRemarks: "",
  });

  const [testForm, setTestForm] = useState({
    subject: "",
    chapter: "",
    testName: "",
    date: new Date().toISOString().split("T")[0],
    marksObtained: 80,
    totalMarks: 100,
    mentorComment: "",
  });

  const [examForm, setExamForm] = useState({
    subject: "",
    examName: "",
    date: new Date().toISOString().split("T")[0],
    marks: 80,
    total: 100,
    previousPercentage: 70,
  });

  const [planForm, setPlanForm] = useState({
    subject: "",
    month: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    strengths: "",
    weakAreas: "",
    goals: "",
    mentorPlan: "",
    parentFocus: "",
  });

  const [ptmForm, setPtmForm] = useState({
    subject: "",
    ptmDate: new Date().toISOString().split("T")[0],
    parentConcerns: "",
    mentorRecommendations: "",
    actionItems: "",
    nextPtmDate: "",
  });

  const [noteForm, setNoteForm] = useState({
    subject: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    includeInReport: true,
  });

  // Report Builder configuration
  const [reportBuilder, setReportBuilder] = useState({
    reportType: "Monthly",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    includeNotes: true,
    mode: "Snapshot" as "Snapshot" | "Live",
  });

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/students/${uuid}`);
      const data = await res.json();
      if (!data.error) {
        setProfile(data);
        // Default the form subject values to first available subject
        if (data.subjects && data.subjects.length > 0) {
          const firstSubName = data.subjects[0].subjectName;
          setClassForm((prev) => ({ ...prev, subject: firstSubName }));
          setAssignmentForm((prev) => ({ ...prev, subject: firstSubName }));
          setTestForm((prev) => ({ ...prev, subject: firstSubName }));
          setExamForm((prev) => ({ ...prev, subject: firstSubName }));
          setPlanForm((prev) => ({ ...prev, subject: firstSubName }));
          setPtmForm((prev) => ({ ...prev, subject: firstSubName }));
          setNoteForm((prev) => ({ ...prev, subject: firstSubName }));
        }
      } else {
        router.push("/students");
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [uuid]);

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground text-sm">Loading student academic file...</p>
      </div>
    );
  }

  const { student, subjects, classes, assignments, tests, exams, learningPlans, ptms: ptmLogs, mentorNotes, reports } = profile;

  // Analytical indicators
  const totalClassesCount = classes.length;
  const presentClasses = classes.filter((c) => c.attendance === "Present" || c.attendance === "Late").length;
  const attendanceRate = totalClassesCount > 0 ? Math.round((presentClasses / totalClassesCount) * 100) : 100;

  const totalAssignmentsCount = assignments.length;
  const completedAssignments = assignments.filter((a) => a.submissionStatus !== "Pending").length;
  const assignmentRate = totalAssignmentsCount > 0 ? Math.round((completedAssignments / totalAssignmentsCount) * 100) : 100;

  const averageTestScore =
    tests.length > 0
      ? Math.round(tests.reduce((sum, t) => sum + (t.percentage || 0), 0) / tests.length)
      : 0;

  // Dynamic Class Submit
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...classForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Dynamic Assignment Submit
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assignmentForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Dynamic Assignment Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Record Chapter Test Submit
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...testForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Record School Exam Submit
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...examForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Record Learning Plan Submit
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/learning-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...planForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Record PTM Submit
  const handlePtmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/ptms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ptmForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Record Note Submit
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...noteForm, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Report Builder Submit Trigger
  const handleBuildReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reportBuilder, studentUuid: uuid }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveModal(null);
        loadProfile();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back & Profile Header */}
      <div className="space-y-4">
        <Link
          href="/students"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground btn-transition w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students Directory
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase shrink-0">
              {student.studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {student.studentName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                    student.healthStatus === "Excellent"
                      ? "bg-success/10 text-success"
                      : student.healthStatus === "Needs Attention"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {student.healthStatus}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                UUID: <span className="font-mono">{student.uuid}</span> • Grade {student.grade} ({student.board})
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {subjects.map((sub: any) => (
                  <span
                    key={sub.subjectId}
                    className="text-[10px] px-2 py-0.5 bg-muted rounded border text-muted-foreground font-medium"
                  >
                    {sub.subjectName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveModal("report")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1120] text-white hover:bg-black rounded-btn text-xs font-semibold btn-transition shadow-premium-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Build Progress Report
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Progress Score
          </p>
          <p className="text-2xl font-extrabold text-primary mt-1">
            {student.overallProgressScore}%
          </p>
        </div>
        <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Attendance Rate
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{attendanceRate}%</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Homework Rate
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{assignmentRate}%</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Avg Test Score
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{averageTestScore}%</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-card shadow-premium-sm text-center col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Academic Mentor
          </p>
          <p className="text-sm font-bold text-foreground mt-2 truncate">
            {student.mentor || "Not Assigned"}
          </p>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">
          Academic Journey Progression
        </h3>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 relative">
          <div className="absolute left-[15px] lg:left-6 right-auto lg:right-6 top-6 bottom-6 lg:bottom-auto lg:h-[2px] bg-border z-0 w-[2px] lg:w-auto" />

          {[
            { label: "Enrollment", done: true },
            { label: "Learning Plan", done: learningPlans.length > 0 },
            { label: "Weekly Classes", done: classes.length > 0 },
            { label: "Assignments", done: assignments.length > 0 },
            { label: "Chapter Test", done: tests.length > 0 },
            { label: "Parent Teacher Meeting", done: ptmLogs.length > 0 },
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex lg:flex-col items-center gap-4 lg:gap-3 z-10 w-full lg:w-auto relative"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 ${
                  step.done
                    ? "bg-primary text-white border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {step.done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-xs font-bold whitespace-nowrap ${
                  step.done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Segment Controls */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: "overview", label: "Overview" },
          { id: "classes", label: "Classes Log" },
          { id: "assignments", label: "Assignments" },
          { id: "logs", label: "Academic Scores" },
          { id: "plans", label: "Learning Plan" },
          { id: "ptms", label: "PTMs" },
          { id: "notes", label: "Mentor Feedback" },
          { id: "reports", label: "Reports" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-6 text-sm font-semibold border-b-2 btn-transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contacts card */}
            <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
              <h3 className="font-bold text-base text-foreground">File Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>
                    Parent: <strong className="text-foreground">{student.parentName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{student.parentEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{student.parentWhatsApp}</span>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>
                    Enrollment Date:{" "}
                    <strong className="text-foreground">{student.enrollmentDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>
                    Coordinator:{" "}
                    <strong className="text-foreground">{student.academicCoordinator}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary logs */}
            <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
              <h3 className="font-bold text-base text-foreground">File Analytics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Total Classes Logged</span>
                  <span className="font-bold">{totalClassesCount} classes</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Chapter Tests Tracked</span>
                  <span className="font-bold">{tests.length} tests</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Parent Meetings (PTMs)</span>
                  <span className="font-bold">{ptmLogs.length} meetings</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Generated Reports Logged</span>
                  <span className="font-bold">{reports.length} report(s)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLASSES LOG TAB */}
        {activeTab === "classes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Weekly Classes Log</h2>
              <button
                onClick={() => setActiveModal("class")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-primary/95 btn-transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Class Info
              </button>
            </div>

            <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground text-xs font-bold border-b border-border">
                      <th className="p-4">Date</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Chapter</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Attendance</th>
                      <th className="p-4">Participation</th>
                      <th className="p-4">Homework</th>
                      <th className="p-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.length > 0 ? (
                      classes.map((c) => (
                        <tr key={c.classId} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4 whitespace-nowrap font-medium">{c.date}</td>
                          <td className="p-4">{c.subject}</td>
                          <td className="p-4 font-semibold text-foreground">{c.chapter}</td>
                          <td className="p-4">{c.duration} mins</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.attendance === "Present"
                                  ? "bg-success/15 text-success"
                                  : c.attendance === "Late"
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-red-500/15 text-red-500"
                              }`}
                            >
                              {c.attendance}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{c.participation}%</td>
                          <td className="p-4">
                            {c.homeworkGiven === "TRUE" || (c.homeworkGiven as any) === true ? (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  c.homeworkCompleted === "TRUE" || (c.homeworkCompleted as any) === true
                                    ? "bg-success/10 text-success"
                                    : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                {c.homeworkCompleted === "TRUE" || (c.homeworkCompleted as any) === true
                                  ? "Completed"
                                  : "Pending"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Not Given</span>
                            )}
                          </td>
                          <td className="p-4 text-xs max-w-xs truncate">{c.remarks}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No classes logged yet for this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Assignments Log</h2>
              <button
                onClick={() => setActiveModal("assignment")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-primary/95 btn-transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Homework
              </button>
            </div>

            <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground text-xs font-bold border-b border-border">
                      <th className="p-4">Assigned</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Assignment Title</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length > 0 ? (
                      assignments.map((a) => (
                        <tr key={a.assignmentId} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4 whitespace-nowrap">{a.assignedDate}</td>
                          <td className="p-4">{a.subject}</td>
                          <td className="p-4 font-semibold text-foreground">{a.assignmentTitle}</td>
                          <td className="p-4 whitespace-nowrap">{a.dueDate}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                a.submissionStatus === "Reviewed"
                                  ? "bg-success/15 text-success"
                                  : a.submissionStatus === "Submitted"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-red-500/15 text-red-500"
                              }`}
                            >
                              {a.submissionStatus}
                            </span>
                          </td>
                          <td className="p-4 font-bold">
                            {a.submissionStatus !== "Pending"
                              ? `${a.score}/${a.totalMarks} (${a.percentage}%)`
                              : "-"}
                          </td>
                          <td className="p-4">
                            {a.submissionStatus !== "Reviewed" && (
                              <button
                                onClick={() => {
                                  setReviewForm({
                                    assignmentId: a.assignmentId,
                                    submissionStatus: "Reviewed",
                                    score: a.score || 80,
                                    totalMarks: a.totalMarks || 100,
                                    mentorRemarks: a.mentorRemarks || "",
                                  });
                                  setActiveModal("review");
                                }}
                                className="px-2.5 py-1 bg-muted border hover:bg-primary hover:text-white rounded text-[10px] font-semibold btn-transition"
                              >
                                Review Marks
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No assignments logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC SCORES TAB */}
        {activeTab === "logs" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chapter Tests */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-foreground">Chapter Tests</h3>
                <button
                  onClick={() => setActiveModal("test")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-btn shadow-premium-sm btn-transition"
                >
                  <Plus className="w-3 h-3" />
                  Record Test
                </button>
              </div>
              <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-muted-foreground text-[10px] font-bold border-b border-border">
                        <th className="p-3">Test</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.length > 0 ? (
                        tests.map((t) => (
                          <tr key={t.testId} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 font-semibold text-foreground">{t.testName}</td>
                            <td className="p-3 text-xs">{t.subject}</td>
                            <td className="p-3 font-bold text-primary">{t.percentage}%</td>
                            <td className="p-3 text-xs whitespace-nowrap">{t.date}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                            No chapter tests logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* School Exams */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-foreground">School Exams</h3>
                <button
                  onClick={() => setActiveModal("exam")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-btn shadow-premium-sm btn-transition"
                >
                  <Plus className="w-3 h-3" />
                  Record Exam
                </button>
              </div>
              <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-muted-foreground text-[10px] font-bold border-b border-border">
                        <th className="p-3">Exam Name</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length > 0 ? (
                        exams.map((e) => (
                          <tr key={e.examId} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 font-semibold text-foreground">{e.examName}</td>
                            <td className="p-3 text-xs">{e.subject}</td>
                            <td className="p-3 font-bold">{e.percentage}%</td>
                            <td className="p-3">
                              <span
                                className={`text-xs font-bold ${
                                  e.improvementPercentage >= 0 ? "text-success" : "text-red-500"
                                }`}
                              >
                                {e.improvementPercentage >= 0 ? "+" : ""}
                                {e.improvementPercentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                            No school exams logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEARNING ROADMAP TAB */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Monthly Learning Roadmap</h2>
              <button
                onClick={() => setActiveModal("plan")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-primary/95 btn-transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Learning Plan
              </button>
            </div>

            {learningPlans.length > 0 ? (
              <div className="space-y-6">
                {learningPlans.map((plan) => (
                  <div
                    key={plan.planId}
                    className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">
                          {plan.subject} Roadmap
                        </h3>
                        <p className="text-xs text-muted-foreground">Month: {plan.month}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Added by {plan.createdBy}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary text-xs uppercase tracking-wide">
                          Strengths
                        </h4>
                        <p className="text-muted-foreground">{plan.strengths}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary text-xs uppercase tracking-wide">
                          Weak Areas
                        </h4>
                        <p className="text-muted-foreground">{plan.weakAreas}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary text-xs uppercase tracking-wide">
                          Academic Goals
                        </h4>
                        <p className="text-muted-foreground">{plan.goals}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-primary text-xs uppercase tracking-wide">
                          Mentor Roadmap
                        </h4>
                        <p className="text-muted-foreground">{plan.mentorPlan}</p>
                      </div>
                      <div className="space-y-2 col-span-1 md:col-span-2 border-t border-border pt-4">
                        <h4 className="font-bold text-success text-xs uppercase tracking-wide">
                          Parent Action Items
                        </h4>
                        <p className="text-muted-foreground">{plan.parentFocus}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border p-12 text-center rounded-card">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-semibold">
                  No monthly learning plans generated yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PTM TAB */}
        {activeTab === "ptms" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">PTM Meeting Logs</h2>
              <button
                onClick={() => setActiveModal("ptm")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-primary/95 btn-transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Log PTM
              </button>
            </div>

            {ptmLogs.length > 0 ? (
              <div className="space-y-6">
                {ptmLogs.map((p) => (
                  <div
                    key={p.ptmId}
                    className="bg-card border border-border p-5 rounded-card shadow-premium-sm space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-border pb-2.5">
                      <div>
                        <h4 className="font-bold text-base text-foreground">
                          PTM Meeting ({p.subject})
                        </h4>
                        <p className="text-xs text-muted-foreground">Held on: {p.ptmDate}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.ptmId}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                          Parent Concerns
                        </h5>
                        <p className="text-muted-foreground mt-1">{p.parentConcerns}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                          Mentor Recommendations
                        </h5>
                        <p className="text-muted-foreground mt-1">{p.mentorRecommendations}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                          Coordinator Action Items
                        </h5>
                        <p className="text-muted-foreground mt-1">{p.actionItems}</p>
                      </div>
                      {p.nextPtmDate && (
                        <div className="pt-2 border-t border-border flex items-center gap-2 text-xs font-bold text-success">
                          <Calendar className="w-4 h-4" />
                          <span>Next PTM Date: {p.nextPtmDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border p-12 text-center rounded-card">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-semibold">
                  No Parent Teacher Meetings (PTMs) recorded yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MENTOR NOTES / FEEDBACK TAB */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Mentor Feedback & Insights</h2>
              <button
                onClick={() => setActiveModal("note")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-primary/95 btn-transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Mentor Note
              </button>
            </div>

            {mentorNotes.length > 0 ? (
              <div className="space-y-4">
                {mentorNotes.map((n) => (
                  <div
                    key={n.noteId}
                    className="bg-card border border-border p-5 rounded-card shadow-premium-sm space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center border-b border-border pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-primary">{n.subject}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.date}</p>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          n.includeInReport === "TRUE" || (n.includeInReport as any) === true
                            ? "bg-success/10 text-success"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {n.includeInReport === "TRUE" || (n.includeInReport as any) === true ? (
                          <>Included in Report</>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            Private Note
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {n.notes}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border p-12 text-center rounded-card">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-semibold">
                  No mentor feedback logged yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Generated Reports Library</h2>
              <button
                onClick={() => setActiveModal("report")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1120] text-white text-xs font-semibold rounded-btn shadow-premium-sm hover:bg-black btn-transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Build Progress Report
              </button>
            </div>

            {reports.length > 0 ? (
              <div className="bg-card border border-border rounded-card shadow-premium-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-muted-foreground text-xs font-bold border-b border-border">
                        <th className="p-4">Date</th>
                        <th className="p-4">Report ID</th>
                        <th className="p-4">Period</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4">Author</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.reportId} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4 whitespace-nowrap font-medium">
                            {r.generatedDate.split("T")[0]}
                          </td>
                          <td className="p-4 font-mono font-bold text-xs">{r.reportId}</td>
                          <td className="p-4">
                            {r.reportType} ({r.startDate} to {r.endDate})
                          </td>
                          <td className="p-4 text-xs font-semibold">{r.mode}</td>
                          <td className="p-4">{r.generatedBy}</td>
                          <td className="p-4 flex items-center gap-3">
                            <a
                              href={r.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-muted hover:bg-primary hover:text-white rounded btn-transition text-muted-foreground"
                              title="Download PDF booklet"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <a
                              href={r.publicUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-muted hover:bg-success hover:text-white rounded btn-transition text-muted-foreground"
                              title="Public secure view URL"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border p-12 text-center rounded-card">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-semibold">
                  No PDF booklets compiled yet for this student file.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- ALL LOGGING FORMS MODALS OVERLAYS --- */}

      {/* 1. Log Class Modal */}
      {activeModal === "class" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-lg border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Log Class Info</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleClassSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={classForm.subject}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    value={classForm.date}
                    onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Chapter Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic Equations"
                  required
                  value={classForm.chapter}
                  onChange={(e) => setClassForm({ ...classForm, chapter: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Duration (mins)</label>
                  <input
                    type="number"
                    value={classForm.duration}
                    onChange={(e) => setClassForm({ ...classForm, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Attendance</label>
                  <select
                    value={classForm.attendance}
                    onChange={(e) => setClassForm({ ...classForm, attendance: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="No Show">No Show</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Participation Rate ({classForm.participation}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={classForm.participation}
                  onChange={(e) => setClassForm({ ...classForm, participation: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2 bg-muted border border-border rounded cursor-pointer text-[10px] font-semibold">
                  <input
                    type="checkbox"
                    checked={classForm.homeworkGiven}
                    onChange={(e) => setClassForm({ ...classForm, homeworkGiven: e.target.checked })}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span>Homework Given</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-muted border border-border rounded cursor-pointer text-[10px] font-semibold">
                  <input
                    type="checkbox"
                    checked={classForm.homeworkCompleted}
                    onChange={(e) => setClassForm({ ...classForm, homeworkCompleted: e.target.checked })}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span>HW Completed</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-muted border border-border rounded cursor-pointer text-[10px] font-semibold">
                  <input
                    type="checkbox"
                    checked={classForm.revisionNotesShared}
                    onChange={(e) => setClassForm({ ...classForm, revisionNotesShared: e.target.checked })}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span>Notes Shared</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mentor Remarks</label>
                <textarea
                  placeholder="Class activity feedback notes..."
                  rows={3}
                  value={classForm.remarks}
                  onChange={(e) => setClassForm({ ...classForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Log Class Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Homework Modal */}
      {activeModal === "assignment" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Assign Homework</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssignmentSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                <select
                  value={assignmentForm.subject}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                >
                  {subjects.map((sub: any) => (
                    <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Chapter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chemical Bonding"
                  value={assignmentForm.chapter}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, chapter: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Practice Sheet 2"
                  required
                  value={assignmentForm.assignmentTitle}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Assigned Date</label>
                  <input
                    type="date"
                    value={assignmentForm.assignedDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Due Date</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Assigning..." : "Assign Homework"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Review Assignment Modal */}
      {activeModal === "review" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Review Assignment</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Submission Status</label>
                <select
                  value={reviewForm.submissionStatus}
                  onChange={(e) => setReviewForm({ ...reviewForm, submissionStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Score Obtained</label>
                  <input
                    type="number"
                    value={reviewForm.score}
                    onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Total Marks</label>
                  <input
                    type="number"
                    value={reviewForm.totalMarks}
                    onChange={(e) => setReviewForm({ ...reviewForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mentor Remarks</label>
                <textarea
                  placeholder="Review comment notes..."
                  rows={3}
                  value={reviewForm.mentorRemarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, mentorRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Record Chapter Test Modal */}
      {activeModal === "test" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Record Chapter Test</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleTestSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={testForm.subject}
                    onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    value={testForm.date}
                    onChange={(e) => setTestForm({ ...testForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Chapter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics"
                  value={testForm.chapter}
                  onChange={(e) => setTestForm({ ...testForm, chapter: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Assessment 1"
                  required
                  value={testForm.testName}
                  onChange={(e) => setTestForm({ ...testForm, testName: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Marks Obtained</label>
                  <input
                    type="number"
                    value={testForm.marksObtained}
                    onChange={(e) => setTestForm({ ...testForm, marksObtained: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Total Marks</label>
                  <input
                    type="number"
                    value={testForm.totalMarks}
                    onChange={(e) => setTestForm({ ...testForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mentor Comment</label>
                <textarea
                  placeholder="Feedback on test performance..."
                  rows={2}
                  value={testForm.mentorComment}
                  onChange={(e) => setTestForm({ ...testForm, mentorComment: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Record Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Record School Exam Modal */}
      {activeModal === "exam" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Record School Exam</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleExamSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Exam Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Term 1"
                  required
                  value={examForm.examName}
                  onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Marks</label>
                  <input
                    type="number"
                    value={examForm.marks}
                    onChange={(e) => setExamForm({ ...examForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Total Marks</label>
                  <input
                    type="number"
                    value={examForm.total}
                    onChange={(e) => setExamForm({ ...examForm, total: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Prev Score %</label>
                  <input
                    type="number"
                    value={examForm.previousPercentage}
                    onChange={(e) => setExamForm({ ...examForm, previousPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Record Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Record Learning Plan Modal */}
      {activeModal === "plan" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-lg border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Record Monthly Learning Plan</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePlanSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={planForm.subject}
                    onChange={(e) => setPlanForm({ ...planForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Target Month</label>
                  <input
                    type="month"
                    value={planForm.month}
                    onChange={(e) => setPlanForm({ ...planForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Academic Goals *</label>
                <input
                  type="text"
                  placeholder="e.g. Master trigonometry, improve equation parsing."
                  required
                  value={planForm.goals}
                  onChange={(e) => setPlanForm({ ...planForm, goals: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Identified Strengths</label>
                <textarea
                  placeholder="e.g. Solid arithmetic skills, good homework completion rate."
                  rows={2}
                  value={planForm.strengths}
                  onChange={(e) => setPlanForm({ ...planForm, strengths: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Weak Focus Areas</label>
                <textarea
                  placeholder="e.g. Tends to commit silly computational errors."
                  rows={2}
                  value={planForm.weakAreas}
                  onChange={(e) => setPlanForm({ ...planForm, weakAreas: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mentor Plan & Strategy</label>
                <textarea
                  placeholder="e.g. Incorporate 15-minute weekly speed tests during sessions."
                  rows={2}
                  value={planForm.mentorPlan}
                  onChange={(e) => setPlanForm({ ...planForm, mentorPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Parent Focus Points</label>
                <textarea
                  placeholder="e.g. Ensure child attempts practice sheet before Sunday."
                  rows={2}
                  value={planForm.parentFocus}
                  onChange={(e) => setPlanForm({ ...planForm, parentFocus: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Record Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Log PTM Modal */}
      {activeModal === "ptm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Log Parent Meeting (PTM)</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePtmSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={ptmForm.subject}
                    onChange={(e) => setPtmForm({ ...ptmForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Meeting Date</label>
                  <input
                    type="date"
                    value={ptmForm.ptmDate}
                    onChange={(e) => setPtmForm({ ...ptmForm, ptmDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Parent Concerns *</label>
                <textarea
                  placeholder="What concerns did the parents highlight?"
                  rows={2}
                  required
                  value={ptmForm.parentConcerns}
                  onChange={(e) => setPtmForm({ ...ptmForm, parentConcerns: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mentor Recommendations</label>
                <textarea
                  placeholder="Recommendations shared with parent..."
                  rows={2}
                  value={ptmForm.mentorRecommendations}
                  onChange={(e) => setPtmForm({ ...ptmForm, mentorRecommendations: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Action Items</label>
                <textarea
                  placeholder="Action list resolved in the meeting..."
                  rows={2}
                  value={ptmForm.actionItems}
                  onChange={(e) => setPtmForm({ ...ptmForm, actionItems: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Next Scheduled PTM Date</label>
                <input
                  type="date"
                  value={ptmForm.nextPtmDate}
                  onChange={(e) => setPtmForm({ ...ptmForm, nextPtmDate: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Log PTM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Add Mentor Note Modal */}
      {activeModal === "note" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-md border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Add Mentor Note / Feedback</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleNoteSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                  <select
                    value={noteForm.subject}
                    onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  >
                    {subjects.map((sub: any) => (
                      <option key={sub.subjectId} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    value={noteForm.date}
                    onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Feedback Notes *</label>
                <textarea
                  placeholder="Detailed academic feedback and observations..."
                  rows={4}
                  required
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-muted border border-border rounded cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={noteForm.includeInReport}
                  onChange={(e) => setNoteForm({ ...noteForm, includeInReport: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span>Include feedback in generated parent reports</span>
              </label>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Add Mentor Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Report Builder Modal (Stepped Wizard) */}
      {activeModal === "report" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="bg-card w-full max-w-lg border border-border rounded-dialog shadow-premium-lg flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-foreground">Academic Progress Report Builder</h3>
                <p className="text-[10px] text-muted-foreground">Student: {student.studentName}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBuildReport} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Report Period Type</label>
                <select
                  value={reportBuilder.reportType}
                  onChange={(e) => setReportBuilder({ ...reportBuilder, reportType: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                >
                  <option value="Weekly">Weekly Progress</option>
                  <option value="Monthly">Monthly Progress</option>
                  <option value="Custom">Custom Date Range</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                  <input
                    type="date"
                    value={reportBuilder.startDate}
                    onChange={(e) => setReportBuilder({ ...reportBuilder, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                  <input
                    type="date"
                    value={reportBuilder.endDate}
                    onChange={(e) => setReportBuilder({ ...reportBuilder, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Sharing Mode Option</label>
                <select
                  value={reportBuilder.mode}
                  onChange={(e) => setReportBuilder({ ...reportBuilder, mode: e.target.value as any })}
                  className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-input text-xs focus:outline-none"
                >
                  <option value="Snapshot">Snapshot (Cache frozen JSON payload)</option>
                  <option value="Live">Live (Loads latest database logs in real-time)</option>
                </select>
                <p className="text-[10px] text-muted-foreground/80 mt-1">
                  * Snapshot mode freezes the academic tables at generation time, whereas Live mode queries sheets whenever the URL is loaded.
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 bg-muted border border-border rounded cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={reportBuilder.includeNotes}
                  onChange={(e) => setReportBuilder({ ...reportBuilder, includeNotes: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span>Include mentor feedback notes in booklet</span>
              </label>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-btn text-muted-foreground btn-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-grow-2 py-2 bg-[#0B1120] text-white hover:bg-black font-semibold text-xs rounded-btn shadow-premium-md btn-transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Compiling PDF & Uploading...
                    </>
                  ) : (
                    "Compile booklet & Generate URL"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
