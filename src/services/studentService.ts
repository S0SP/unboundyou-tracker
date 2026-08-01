import { getRows, updateRow, addRow } from "../lib/google/sheets";
import {
  Student,
  ClassLog,
  Assignment,
  ChapterTest,
  SchoolExam,
  Settings,
  DashboardCache,
} from "../types";

/**
 * Calculates academic analytics and updates the student's profile progress score
 * and health status in the '01_Students' sheet.
 */
export async function recalculateStudentStats(
  studentUuid: string
): Promise<{ overallProgressScore: number; healthStatus: Student["healthStatus"] }> {
  console.log(`Calculating stats for student UUID: ${studentUuid}`);

  // 1. Fetch all datasets from sheets
  const [classes, assignments, tests, exams, settingsList] = await Promise.all([
    getRows<ClassLog>("04_Classes"),
    getRows<Assignment>("05_Assignments"),
    getRows<ChapterTest>("06_Chapter_Tests"),
    getRows<SchoolExam>("07_School_Exams"),
    getRows<Settings>("13_Settings"),
  ]);

  // Filter for current student
  const studentClasses = classes.filter((c) => c.studentUuid === studentUuid);
  const studentAssignments = assignments.filter((a) => a.studentUuid === studentUuid);
  const studentTests = tests.filter((t) => t.studentUuid === studentUuid);
  const studentExams = exams.filter((e) => e.studentUuid === studentUuid);

  // Get active settings or default weights (sum to 1.0)
  const settings = settingsList[0] || {
    attendanceWeight: 0.15,
    assignmentWeight: 0.2,
    participationWeight: 0.15,
    homeworkWeight: 0.15,
    chapterTestWeight: 0.2,
    schoolExamWeight: 0.15,
  };

  // --- CALCULATION 1: Attendance Score ---
  // Present = 100, Late = 70, Rescheduled/Cancelled do not count. Absent/No Show = 0.
  let attendanceCount = 0;
  let totalAttendedScore = 0;
  let totalValidClasses = 0;

  studentClasses.forEach((c) => {
    const status = c.attendance;
    if (status === "Present") {
      attendanceCount++;
      totalAttendedScore += 100;
      totalValidClasses++;
    } else if (status === "Late") {
      attendanceCount++;
      totalAttendedScore += 70;
      totalValidClasses++;
    } else if (status === "Absent" || status === "No Show") {
      totalValidClasses++;
    }
  });

  const attendanceRate = totalValidClasses > 0 ? (attendanceCount / totalValidClasses) * 100 : 100;
  const attendanceScore = totalValidClasses > 0 ? totalAttendedScore / totalValidClasses : 100;

  // --- CALCULATION 2: Assignment Completion Score ---
  // Reviewed = 100, Submitted = 80, Pending = 0.
  let totalAssignmentScore = 0;
  let reviewedCount = 0;
  let submittedCount = 0;

  studentAssignments.forEach((a) => {
    const status = a.submissionStatus;
    if (status === "Reviewed") {
      totalAssignmentScore += 100;
      reviewedCount++;
    } else if (status === "Submitted") {
      totalAssignmentScore += 80;
      submittedCount++;
    }
  });

  const assignmentCompletionRate =
    studentAssignments.length > 0
      ? ((reviewedCount + submittedCount) / studentAssignments.length) * 100
      : 100;

  const assignmentScore =
    studentAssignments.length > 0 ? totalAssignmentScore / studentAssignments.length : 100;

  // --- CALCULATION 3: Homework Score ---
  // Based on classes where homework was given, what % was completed.
  let homeworkGivenCount = 0;
  let homeworkCompletedCount = 0;

  studentClasses.forEach((c) => {
    if (c.homeworkGiven === "TRUE" || (c.homeworkGiven as any) === true) {
      homeworkGivenCount++;
      if (c.homeworkCompleted === "TRUE" || (c.homeworkCompleted as any) === true) {
        homeworkCompletedCount++;
      }
    }
  });

  const homeworkScore =
    homeworkGivenCount > 0 ? (homeworkCompletedCount / homeworkGivenCount) * 100 : 100;

  // --- CALCULATION 4: Participation Score ---
  let totalParticipation = 0;
  let participationValidCount = 0;

  studentClasses.forEach((c) => {
    if (c.participation !== undefined && c.participation !== null && typeof c.participation === "number") {
      totalParticipation += Number(c.participation);
      participationValidCount++;
    }
  });

  const participationScore =
    participationValidCount > 0 ? totalParticipation / participationValidCount : 100;

  // --- CALCULATION 5: Chapter Test Score ---
  let totalTestScore = 0;

  studentTests.forEach((t) => {
    totalTestScore += Number(t.percentage) || 0;
  });

  const testScore = studentTests.length > 0 ? totalTestScore / studentTests.length : 100;

  // --- CALCULATION 6: School Exam Score & Improvement ---
  // Average school exam percentage
  let totalExamScore = 0;
  studentExams.forEach((e) => {
    totalExamScore += Number(e.percentage) || 0;
  });

  const examScore = studentExams.length > 0 ? totalExamScore / studentExams.length : 100;

  // --- WEIGHED IMPACT SCORE ---
  const overallProgressScore = Math.round(
    attendanceScore * settings.attendanceWeight +
      assignmentScore * settings.assignmentWeight +
      participationScore * settings.participationWeight +
      homeworkScore * settings.homeworkWeight +
      testScore * settings.chapterTestWeight +
      examScore * settings.schoolExamWeight
  );

  // --- HEALTH STATUS DETERMINATION ---
  let healthStatus: Student["healthStatus"] = "Excellent";

  if (overallProgressScore < 70 || attendanceRate < 70 || assignmentCompletionRate < 60) {
    healthStatus = "At Risk";
  } else if (overallProgressScore < 85 || attendanceRate < 80) {
    healthStatus = "Needs Attention";
  }

  // Update in Spreadsheet
  const nowStr = new Date().toISOString();
  await updateRow("01_Students", "UUID", studentUuid, {
    overallProgressScore,
    healthStatus,
    updatedAt: nowStr,
  });

  // Automatically refresh dashboard cache
  await refreshDashboardCache();

  return {
    overallProgressScore,
    healthStatus,
  };
}

/**
 * Re-aggregates academy-wide stats and stores them in the '12_Dashboard_Cache' sheet.
 */
export async function refreshDashboardCache(): Promise<DashboardCache> {
  const [students, classes, assignments, reports] = await Promise.all([
    getRows<Student>("01_Students"),
    getRows<ClassLog>("04_Classes"),
    getRows<Assignment>("05_Assignments"),
    getRows<any>("11_Reports"),
  ]);

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active").length;

  // Average progress score across active students
  const activeStudentsList = students.filter((s) => s.status === "Active");
  const averageProgress =
    activeStudentsList.length > 0
      ? Math.round(
          activeStudentsList.reduce(
            (sum, s) => sum + (Number(s.overallProgressScore) || 0),
            0
          ) / activeStudentsList.length
        )
      : 0;

  const studentsAtRisk = activeStudentsList.filter(
    (s) => s.healthStatus === "At Risk"
  ).length;

  // Overall attendance rate across all active class logs
  let attendancePresentCount = 0;
  let totalAttendedClasses = 0;
  classes.forEach((c) => {
    if (c.attendance === "Present" || c.attendance === "Late") {
      attendancePresentCount++;
      totalAttendedClasses++;
    } else if (c.attendance === "Absent" || c.attendance === "No Show") {
      totalAttendedClasses++;
    }
  });
  const attendancePercentage =
    totalAttendedClasses > 0
      ? Math.round((attendancePresentCount / totalAttendedClasses) * 100)
      : 100;

  // Pending assignments count
  const pendingAssignments = assignments.filter(
    (a) => a.submissionStatus === "Pending"
  ).length;

  // Reports pending (Count reports generated in status != 'Sent' or mock value)
  const reportsPending = reports.filter((r) => r.status === "Pending").length;

  // Average test/assignment score
  const reviewedAssignments = assignments.filter(
    (a) => a.submissionStatus === "Reviewed" || a.submissionStatus === "Submitted"
  );
  const averageScore =
    reviewedAssignments.length > 0
      ? Math.round(
          reviewedAssignments.reduce(
            (sum, a) => sum + (Number(a.percentage) || 0),
            0
          ) / reviewedAssignments.length
        )
      : 0;

  const cachePayload: DashboardCache = {
    totalStudents,
    activeStudents,
    attendancePercentage,
    pendingAssignments,
    reportsPending,
    averageScore,
    averageProgress,
    studentsAtRisk,
    updatedAt: new Date().toISOString(),
  };

  try {
    const existingCacheRows = await getRows<DashboardCache>("12_Dashboard_Cache");
    if (existingCacheRows.length > 0) {
      const existingCache = existingCacheRows[0];
      // Update the first row by using its current Total Students value as the lookup key
      await updateRow("12_Dashboard_Cache", "Total Students", String(existingCache.totalStudents), {
        "Total Students": totalStudents,
        activeStudents,
        "Attendance %": attendancePercentage,
        "Pending Assignments": pendingAssignments,
        "Reports Pending": reportsPending,
        "Average Score": averageScore,
        "Average Progress": averageProgress,
        "Students At Risk": studentsAtRisk,
        "Updated At": cachePayload.updatedAt,
      });
    } else {
      await addRow("12_Dashboard_Cache", cachePayload);
    }
  } catch (error) {
    console.error("Failed to update dashboard cache:", error);
    await addRow("12_Dashboard_Cache", cachePayload);
  }

  return cachePayload;
}
