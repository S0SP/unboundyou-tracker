import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generateClassId } from "@/utils/idGenerator";
import { recalculateStudentStats } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClassLog } from "@/types";

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
      date,
      duration,
      attendance,
      participation,
      homeworkGiven,
      homeworkCompleted,
      revisionNotesShared,
      remarks,
    } = body;

    if (!studentUuid || !subject || !date || !attendance) {
      return NextResponse.json(
        { error: "Student UUID, Subject, Date, and Attendance status are required." },
        { status: 400 }
      );
    }

    const classId = await generateClassId();
    const author = session.user?.name || session.user?.email || "Unknown";

    const newClass: ClassLog = {
      classId,
      studentUuid,
      subject,
      chapter: chapter || "",
      date,
      duration: duration ? Number(duration) : 60,
      attendance,
      participation: participation !== undefined ? Number(participation) : 80,
      homeworkGiven: homeworkGiven ? "TRUE" : "FALSE",
      homeworkCompleted: homeworkCompleted ? "TRUE" : "FALSE",
      revisionNotesShared: revisionNotesShared ? "TRUE" : "FALSE",
      remarks: remarks || "",
      createdBy: author,
      timestamp: new Date().toISOString(),
    };

    // 1. Write class record
    await addRow("04_Classes", newClass);

    // 2. Trigger student stats update
    const updatedStats = await recalculateStudentStats(studentUuid);

    // 3. Log audit event
    await logAudit(
      "Create",
      author,
      studentUuid,
      "Classes",
      `Logged class ${classId} for subject ${subject} (Attendance: ${attendance}).`
    );

    return NextResponse.json({ success: true, class: newClass, stats: updatedStats });
  } catch (error: any) {
    console.error("Error logging class:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
