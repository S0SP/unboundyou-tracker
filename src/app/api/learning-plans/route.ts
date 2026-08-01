import { NextRequest, NextResponse } from "next/server";
import { addRow } from "@/lib/google/sheets";
import { generatePlanId } from "@/utils/idGenerator";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearningPlan } from "@/types";

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
      month,
      strengths,
      weakAreas,
      goals,
      mentorPlan,
      parentFocus,
    } = body;

    if (!studentUuid || !subject || !month || !goals) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Subject, Month, and Goals." },
        { status: 400 }
      );
    }

    const planId = await generatePlanId();
    const author = session.user?.name || session.user?.email || "Unknown";

    const newPlan: LearningPlan = {
      planId,
      studentUuid,
      subject,
      month,
      strengths: strengths || "",
      weakAreas: weakAreas || "",
      goals,
      mentorPlan: mentorPlan || "",
      parentFocus: parentFocus || "",
      createdBy: author,
      createdAt: new Date().toISOString(),
    };

    await addRow("08_Learning_Plans", newPlan);

    await logAudit(
      "Create",
      author,
      studentUuid,
      "Learning Plans",
      `Created learning plan ${planId} for ${subject} for the month of ${month}.`
    );

    return NextResponse.json({ success: true, learningPlan: newPlan });
  } catch (error: any) {
    console.error("Error creating learning plan:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
