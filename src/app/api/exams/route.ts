import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generateExamId } from "@/utils/idGenerator";
import { recalculateStudentStats } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SchoolExam } from "@/types";

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
      examName,
      date,
      marks,
      total,
      previousPercentage,
    } = body;

    if (!studentUuid || !subject || !examName || !date || !total) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Exam Name, Date, and Total Marks." },
        { status: 400 }
      );
    }

    const examId = await generateExamId();
    const numericMarks = Number(marks) || 0;
    const numericTotal = Number(total) || 100;
    const percentage = numericTotal > 0 ? Math.round((numericMarks / numericTotal) * 100) : 0;
    const prevPercentage = Number(previousPercentage) || 0;
    const improvementPercentage = percentage - prevPercentage;

    const newExam: SchoolExam = {
      examId,
      studentUuid,
      subject,
      examName,
      date,
      marks: numericMarks,
      total: numericTotal,
      percentage,
      previousPercentage: prevPercentage,
      improvementPercentage,
    };

    await addRow("07_School_Exams", newExam);
    const updatedStats = await recalculateStudentStats(studentUuid);

    const author = session.user?.name || session.user?.email || "Unknown";
    await logAudit(
      "Create",
      author,
      studentUuid,
      "Exams",
      `Recorded school exam "${examName}" for ${subject} (Score: ${percentage}%, Improvement: ${improvementPercentage}%).`
    );

    return NextResponse.json({ success: true, exam: newExam, stats: updatedStats });
  } catch (error: any) {
    console.error("Error saving school exam:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
