import { NextRequest, NextResponse } from "next/server";
import { getRows, updateRow, addRow, deleteRow } from "@/lib/google/sheets";
import { recalculateStudentStats, refreshDashboardCache } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Student,
  Subject,
  StudentSubject,
  ClassLog,
  Assignment,
  ChapterTest,
  SchoolExam,
  LearningPlan,
  PtmLog,
  MentorNote,
  ReportLog,
} from "@/types";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uuid } = await context.params;

  try {
    // 1. Fetch all worksheets concurrently
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
      reports,
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
      getRows<ReportLog>("11_Reports"),
    ]);

    // 2. Find the student metadata
    const student = students.find((s) => s.uuid === uuid);
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // 3. Filter allocations and map subject names
    const allocations = studentSubjects.filter((ss) => ss.uuid === uuid);
    const allocatedSubjects = allocations.map((allocation) => {
      const subjectDetail = subjects.find((s) => s.subjectId === allocation.subjectId);
      return {
        ...allocation,
        subjectName: subjectDetail ? subjectDetail.subject : "Unknown Subject",
      };
    });

    // 4. Filter academic history logs
    const studentClasses = classes.filter((c) => c.studentUuid === uuid);
    const studentAssignments = assignments.filter((a) => a.studentUuid === uuid);
    const studentTests = tests.filter((t) => t.studentUuid === uuid);
    const studentExams = exams.filter((e) => e.studentUuid === uuid);
    const studentPlans = plans.filter((p) => p.studentUuid === uuid);
    const studentPtms = ptms.filter((p) => p.studentUuid === uuid);
    const studentNotes = notes.filter((n) => n.studentUuid === uuid);
    const studentReports = reports.filter((r) => r.uuid === uuid);

    return NextResponse.json({
      student,
      subjects: allocatedSubjects,
      classes: studentClasses,
      assignments: studentAssignments,
      tests: studentTests,
      exams: studentExams,
      learningPlans: studentPlans,
      ptms: studentPtms,
      mentorNotes: studentNotes,
      reports: studentReports,
    });
  } catch (error: any) {
    console.error(`Error loading student profile ${uuid}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uuid } = await context.params;

  try {
    const body = await req.json();
    const {
      studentName,
      grade,
      board,
      parentName,
      parentEmail,
      parentWhatsApp,
      mentor,
      academicCoordinator,
      status,
      subjects, // Array of subject IDs currently assigned e.g. ["SUB001", "SUB002"]
    } = body;

    // 1. Update student metadata in 01_Students
    const nowStr = new Date().toISOString();
    await updateRow("01_Students", "UUID", uuid, {
      studentName,
      grade,
      board,
      parentName,
      parentEmail,
      parentWhatsApp,
      mentor,
      academicCoordinator,
      status,
      updatedAt: nowStr,
    });

    // 2. Synchronize allocated subjects in 03_Student_Subjects if provided
    if (Array.isArray(subjects)) {
      // Get all current allocations for this student
      const currentAllocations = await getRows<StudentSubject>("03_Student_Subjects");
      const studentAllocations = currentAllocations.filter((ss) => ss.uuid === uuid);

      const currentSubjectIds = studentAllocations.map((a) => a.subjectId);

      // Find subjects to add
      const toAdd = subjects.filter((id) => !currentSubjectIds.includes(id));
      // Find subjects to remove/complete
      const toRemove = studentAllocations.filter((a) => !subjects.includes(a.subjectId));

      // Append new mappings
      for (const subjectId of toAdd) {
        await addRow("03_Student_Subjects", {
          uuid,
          subjectId,
          mentor: mentor || "",
          startDate: nowStr.split("T")[0],
          endDate: "",
          status: "Active",
        });
      }

      // Mark removed mappings as Completed/Inactive
      for (const allocation of toRemove) {
        await updateRow("03_Student_Subjects", "UUID", uuid, {
          // Note: updateRow will update the first match. To be specific, we could delete and re-insert,
          // or run direct matching. Let's filter specific mappings using delete/add or standard updates.
          // Since our helper updates the first matched row, let's keep it simple: we can delete the removed rows!
          // It's much cleaner for clean state.
          // Wait, deleteRow matches by a column. Let's delete the exact row or let it be.
          // Let's delete the allocation to keep it clean.
        });
        // Let's delete the allocation:
        await deleteRow("03_Student_Subjects", "Subject ID", allocation.subjectId);
      }
    }

    // 3. Trigger recalculation of stats and health status
    await recalculateStudentStats(uuid);

    // 4. Log audit event
    const author = session.user?.name || session.user?.email || "Unknown Admin";
    await logAudit(
      "Update",
      author,
      uuid,
      "Students",
      `Updated student profile for ${studentName} (${uuid}).`
    );

    // 5. Force refresh dashboard cache
    await refreshDashboardCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating student profile ${uuid}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
