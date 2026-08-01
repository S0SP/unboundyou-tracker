import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generateNoteId } from "@/utils/idGenerator";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MentorNote } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentUuid, subject, date, notes, includeInReport } = body;

    if (!studentUuid || !subject || !date || !notes) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Date, and Notes content." },
        { status: 400 }
      );
    }

    const noteId = await generateNoteId();
    const author = session.user?.name || session.user?.email || "Unknown";

    const newNote: MentorNote = {
      noteId,
      studentUuid,
      subject,
      date,
      notes,
      includeInReport: includeInReport ? "TRUE" : "FALSE",
    };

    await addRow("10_Mentor_Notes", newNote);

    await logAudit(
      "Create",
      author,
      studentUuid,
      "Notes",
      `Added mentor note ${noteId} for ${subject} (Include in report: ${
        includeInReport ? "Yes" : "No"
      }).`
    );

    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error("Error creating mentor note:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
