import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generateTestId } from "@/utils/idGenerator";
import { recalculateStudentStats } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChapterTest } from "@/types";

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
      testName,
      date,
      marksObtained,
      totalMarks,
      mentorComment,
    } = body;

    if (!studentUuid || !subject || !testName || !date || !totalMarks) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Test Name, Date, and Total Marks." },
        { status: 400 }
      );
    }

    const testId = await generateTestId();
    const obMarks = Number(marksObtained) || 0;
    const totMarks = Number(totalMarks) || 100;
    const percentage = totMarks > 0 ? Math.round((obMarks / totMarks) * 100) : 0;

    const newTest: ChapterTest = {
      testId,
      studentUuid,
      subject,
      chapter: chapter || "",
      testName,
      date,
      marksObtained: obMarks,
      totalMarks: totMarks,
      percentage,
      mentorComment: mentorComment || "",
    };

    await addRow("06_Chapter_Tests", newTest);
    const updatedStats = await recalculateStudentStats(studentUuid);

    const author = session.user?.name || session.user?.email || "Unknown";
    await logAudit(
      "Create",
      author,
      studentUuid,
      "Tests",
      `Recorded test "${testName}" for ${subject} (Score: ${percentage}%).`
    );

    return NextResponse.json({ success: true, test: newTest, stats: updatedStats });
  } catch (error: any) {
    console.error("Error saving chapter test:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
