import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generatePtmId } from "@/utils/idGenerator";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PtmLog } from "@/types";

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
      ptmDate,
      parentConcerns,
      mentorRecommendations,
      actionItems,
      nextPtmDate,
    } = body;

    if (!studentUuid || !subject || !ptmDate || !parentConcerns) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Meeting Date, and Parent Concerns." },
        { status: 400 }
      );
    }

    const ptmId = await generatePtmId();
    const author = session.user?.name || session.user?.email || "Unknown";

    const newPtm: PtmLog = {
      ptmId,
      studentUuid,
      subject,
      ptmDate,
      parentConcerns,
      mentorRecommendations: mentorRecommendations || "",
      actionItems: actionItems || "",
      nextPtmDate: nextPtmDate || "",
    };

    await addRow("09_PTMs", newPtm);

    await logAudit(
      "Create",
      author,
      studentUuid,
      "PTMs",
      `Recorded Parent-Teacher Meeting ${ptmId} for ${subject} held on ${ptmDate}.`
    );

    return NextResponse.json({ success: true, ptm: newPtm });
  } catch (error: any) {
    console.error("Error creating PTM record:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
