import { NextRequest, NextResponse } from "next/server";
import { addRow, updateRow } from "@/lib/google/sheets";
import { generateAssignmentId } from "@/utils/idGenerator";
import { recalculateStudentStats } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Assignment } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      studentUuid,
      subject,
      chapter,
      assignmentTitle,
      assignedDate,
      dueDate,
    } = body;

    if (!studentUuid || !subject || !assignmentTitle || !assignedDate || !dueDate) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Title, Assigned Date, and Due Date." },
        { status: 400 }
      );
    }

    const assignmentId = await generateAssignmentId();
    const newAssignment: Assignment = {
      assignmentId,
      studentUuid,
      subject,
      chapter: chapter || "",
      assignmentTitle,
      assignedDate,
      dueDate,
      submissionStatus: "Pending",
      score: 0,
      totalMarks: 100,
      percentage: 0,
      mentorRemarks: "",
    };

    await addRow("05_Assignments", newAssignment);
    await recalculateStudentStats(studentUuid);

    const author = session.user?.name || session.user?.email || "Unknown";
    await logAudit(
      "Create",
      author,
      studentUuid,
      "Assignments",
      `Assigned "${assignmentTitle}" for ${subject} due on ${dueDate}.`
    );

    return NextResponse.json({ success: true, assignment: newAssignment });
  } catch (error: any) {
    console.error("Error creating assignment:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      assignmentId,
      studentUuid,
      submissionStatus,
      score,
      totalMarks,
      mentorRemarks,
    } = body;

    if (!assignmentId || !studentUuid || !submissionStatus) {
      return NextResponse.json(
        { error: "Assignment ID, Student UUID, and Submission Status are required." },
        { status: 400 }
      );
    }

    const numericScore = Number(score) || 0;
    const numericTotal = Number(totalMarks) || 100;
    const percentage = numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0;

    await updateRow("05_Assignments", "Assignment ID", assignmentId, {
      submissionStatus,
      score: numericScore,
      totalMarks: numericTotal,
      percentage,
      mentorRemarks: mentorRemarks || "",
    });

    const updatedStats = await recalculateStudentStats(studentUuid);

    const author = session.user?.name || session.user?.email || "Unknown";
    await logAudit(
      "Review",
      author,
      studentUuid,
      "Assignments",
      `Reviewed assignment ${assignmentId} (Status: ${submissionStatus}, Score: ${percentage}%).`
    );

    return NextResponse.json({ success: true, stats: updatedStats });
  } catch (error: any) {
    console.error("Error reviewing assignment:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
