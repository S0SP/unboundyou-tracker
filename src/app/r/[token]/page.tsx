import { getRows } from "@/lib/google/sheets";
import { ReportLog, Student, ClassLog, Assignment, ChapterTest, SchoolExam, LearningPlan, PtmLog, MentorNote, Subject, StudentSubject } from "@/types";
import Image from "next/image";

export const dynamic = "force-dynamic";
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Award,
  TrendingUp,
  FileText,
  Download,
  AlertTriangle,
} from "lucide-react";
import React from "react";

interface PublicReportProps {
  params: Promise<{ token: string }>;
}

// Public API logic inside the Server Component (no session check)
async function loadReportData(token: string) {
  const reports = await getRows<ReportLog>("11_Reports");
  const report = reports.find((r) => r.publicToken === token);

  if (!report || report.status !== "Active") {
    return null;
  }

  // 1. If Snapshot mode, parse and return the cached JSON payload
  if (report.mode === "Snapshot" && report.snapshotData) {
    try {
      const parsedData = JSON.parse(report.snapshotData);
      return {
        report,
        ...parsedData,
      };
    } catch (err) {
      console.error("Failed to parse report snapshot JSON:", err);
    }
  }

  // 2. If Live mode (or snapshot data is missing), query latest sheets
  const studentUuid = report.uuid;
  const [
    students,
    subjects,
    studentSubjects,
    classes,
    assignments,
    tests,
    exams,
    plans,
    ptms,
    notes,
  ] = await Promise.all([
    getRows<Student>("01_Students"),
    getRows<Subject>("02_Subjects"),
    getRows<StudentSubject>("03_Student_Subjects"),
    getRows<ClassLog>("04_Classes"),
    getRows<Assignment>("05_Assignments"),
    getRows<ChapterTest>("06_Chapter_Tests"),
    getRows<SchoolExam>("07_School_Exams"),
    getRows<LearningPlan>("08_Learning_Plans"),
    getRows<PtmLog>("09_PTMs"),
    getRows<MentorNote>("10_Mentor_Notes"),
  ]);

  const student = students.find((s) => s.uuid === studentUuid);
  if (!student) return null;

  // Filter lists for student
  const studentClasses = classes.filter((c) => c.studentUuid === studentUuid);
  const studentAssignments = assignments.filter((a) => a.studentUuid === studentUuid);
  const studentTests = tests.filter((t) => t.studentUuid === studentUuid);
  const studentExams = exams.filter((e) => e.studentUuid === studentUuid);
  const studentPlans = plans.filter((p) => p.studentUuid === studentUuid);
  const studentPtms = ptms.filter((p) => p.studentUuid === studentUuid);
  
  // Filter notes that are marked to be included in reports
  const studentNotes = notes.filter(
    (n) => n.studentUuid === studentUuid && (n.includeInReport === "TRUE" || (n.includeInReport as any) === true)
  );

  return {
    report,
    student,
    subjects,
    classes: studentClasses,
    assignments: studentAssignments,
    tests: studentTests,
    exams: studentExams,
    learningPlans: studentPlans,
    ptmLogs: studentPtms,
    mentorNotes: studentNotes,
    reportMeta: {
      reportType: report.reportType,
      startDate: report.startDate,
      endDate: report.endDate,
      generatedBy: report.generatedBy,
    },
  };
}

export default async function PublicReportPage({ params }: PublicReportProps) {
  const { token } = await params;
  const data = await loadReportData(token);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="bg-[#141B2D] border border-white/5 p-8 rounded-card max-w-md text-center space-y-4 shadow-premium-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Report Unavailable</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This progress report link is invalid, has expired, or has been disabled by UnboundYou success coordinators.
          </p>
        </div>
      </div>
    );
  }

  const { report, student, classes, assignments, tests, exams, learningPlans, mentorNotes, reportMeta } = data as any;

  // Filter datasets by date range
  const start = new Date(reportMeta.startDate);
  const end = new Date(reportMeta.endDate);

  const filterByDate = (item: any, dateKey: string) => {
    if (!item[dateKey]) return false;
    const d = new Date(item[dateKey]);
    return d >= start && d <= end;
  };

  const periodClasses = classes.filter((c: any) => filterByDate(c, "date"));
  const periodAssignments = assignments.filter((a: any) => filterByDate(a, "assignedDate"));
  const periodTests = tests.filter((t: any) => filterByDate(t, "date"));
  const periodExams = exams.filter((e: any) => filterByDate(e, "date"));
  const activePlan = learningPlans[learningPlans.length - 1];

  // Stats
  const totalClasses = periodClasses.length;
  const presentClasses = periodClasses.filter(
    (c: any) => c.attendance === "Present" || c.attendance === "Late"
  ).length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  const totalAssignments = periodAssignments.length;
  const completedAssignments = periodAssignments.filter(
    (a: any) => a.submissionStatus !== "Pending"
  ).length;
  const homeworkRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 100;

  const averageTestScore =
    periodTests.length > 0
      ? Math.round(periodTests.reduce((sum: number, t: any) => sum + (t.percentage || 0), 0) / periodTests.length)
      : 100;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cover booklet banner - Brand Blue */}
        <div className="bg-[#2F80F9] text-white p-8 md:p-12 rounded-card shadow-premium-lg flex flex-col justify-between min-h-[260px] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-[250px] h-[250px] bg-white/10 rounded-full blur-[60px]" />
          <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full blur-[40px]" />

          {/* Logo + Download row */}
          <div className="flex justify-between items-start z-10">
            <Image src="/logo.png" alt="UnboundYou" width={150} height={38} className="object-contain brightness-0 invert" />
            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-btn text-xs font-bold transition-all backdrop-blur-sm border border-white/20"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
          </div>

          {/* Title */}
          <div className="mt-6 z-10">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Academic Progress Booklet
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-1 text-white tracking-tight">
              {reportMeta.reportType} Progress Report
            </h1>
            <p className="text-white/70 text-xs md:text-sm mt-2">
              Period: {reportMeta.startDate} to {reportMeta.endDate}
            </p>
          </div>

          {/* Meta footer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/20 mt-6 z-10">
            <div>
              <p className="text-[10px] text-white/60 uppercase">Student</p>
              <p className="font-bold text-white text-base mt-1">{student.studentName}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase">Grade &amp; Board</p>
              <p className="font-bold text-white text-base mt-1">
                Grade {student.grade} ({student.board})
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-white/60 uppercase">Report Type</p>
              <p className="font-bold text-white text-base mt-1">{reportMeta.reportType}</p>
            </div>
          </div>
        </div>

        {/* Analytics Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-5 rounded-card shadow-premium-sm text-center hover-card-premium">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Success Index
            </p>
            <p className="text-3xl font-extrabold text-primary mt-1">
              {student.overallProgressScore}%
            </p>
          </div>
          <div className="bg-card border border-border p-5 rounded-card shadow-premium-sm text-center hover-card-premium">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Attendance
            </p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{attendanceRate}%</p>
          </div>
          <div className="bg-card border border-border p-5 rounded-card shadow-premium-sm text-center hover-card-premium">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Homework
            </p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{homeworkRate}%</p>
          </div>
          <div className="bg-card border border-border p-5 rounded-card shadow-premium-sm text-center hover-card-premium">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Chapter Test Average
            </p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{averageTestScore}%</p>
          </div>
        </div>

        {/* Feedback Section */}
        {mentorNotes && mentorNotes.length > 0 && (
          <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Mentor Feedback & Insights
            </h2>
            <div className="space-y-4 divide-y divide-border/60">
              {mentorNotes.map((n: any, idx: number) => (
                <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-primary">{n.subject} Feedback</span>
                    <span className="text-muted-foreground font-mono">{n.date}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {n.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tests & Exams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chapter Tests */}
          <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Chapter Tests
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold">
                    <th className="pb-2">Test Name</th>
                    <th className="pb-2">Subject</th>
                    <th className="pb-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {periodTests.length > 0 ? (
                    periodTests.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium text-foreground">{t.testName}</td>
                        <td className="py-2.5 text-muted-foreground">{t.subject}</td>
                        <td className="py-2.5 font-bold text-primary">{t.percentage}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-muted-foreground">
                        No chapter tests recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* School Exams */}
          <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              School Exam Improvement
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold">
                    <th className="pb-2">Exam Name</th>
                    <th className="pb-2">Subject</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {periodExams.length > 0 ? (
                    periodExams.map((e: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium text-foreground">{e.examName}</td>
                        <td className="py-2.5 text-muted-foreground">{e.subject}</td>
                        <td className="py-2.5 font-bold">{e.percentage}%</td>
                        <td className="py-2.5">
                          <span
                            className={`font-bold ${
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
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No school exams tracked in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Classes Timeline */}
        {periodClasses.length > 0 && (
          <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Classes Attendance & Notes
            </h3>
            <div className="space-y-4">
              {periodClasses.slice(0, 5).map((c: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start text-sm">
                  <span className="w-20 font-bold text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                    {c.date}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {c.subject} — {c.chapter}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success rounded-full font-bold">
                        {c.attendance}
                      </span>
                    </div>
                    {c.remarks && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Learning Roadmap */}
        {activePlan && (
          <div className="bg-card border border-border p-6 rounded-card shadow-premium-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Monthly Learning Roadmap ({activePlan.month})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-muted-foreground uppercase">Strengths</h4>
                <p className="text-foreground/90">{activePlan.strengths}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-muted-foreground uppercase">Focus Areas</h4>
                <p className="text-foreground/90">{activePlan.weakAreas}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-muted-foreground uppercase">Target Goals</h4>
                <p className="text-foreground/90">{activePlan.goals}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-muted-foreground uppercase">Mentor Plan</h4>
                <p className="text-foreground/90">{activePlan.mentorPlan}</p>
              </div>
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-border space-y-1">
                <h4 className="font-bold text-xs text-success uppercase">Parent Action Items</h4>
                <p className="text-foreground/90">{activePlan.parentFocus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer branding */}
        <div className="text-center py-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="UnboundYou" width={140} height={36} className="object-contain opacity-80" />
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} UnboundYou Academic Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
