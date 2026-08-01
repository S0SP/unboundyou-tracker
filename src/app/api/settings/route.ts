import { NextRequest, NextResponse } from "next/server";
import { getRows, updateRow, addRow } from "@/lib/google/sheets";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Settings } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settingsList = await getRows<Settings>("13_Settings");
    const settings = settingsList[0] || {
      attendanceWeight: 0.15,
      assignmentWeight: 0.2,
      participationWeight: 0.15,
      homeworkWeight: 0.15,
      chapterTestWeight: 0.2,
      schoolExamWeight: 0.15,
    };
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching settings:", error.message);
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
      attendanceWeight,
      assignmentWeight,
      participationWeight,
      homeworkWeight,
      chapterTestWeight,
      schoolExamWeight,
    } = body;

    const attW = Number(attendanceWeight) || 0;
    const asnW = Number(assignmentWeight) || 0;
    const prtW = Number(participationWeight) || 0;
    const hmwW = Number(homeworkWeight) || 0;
    const tstW = Number(chapterTestWeight) || 0;
    const exmW = Number(schoolExamWeight) || 0;

    // Validate weights sum to 1.0 (approx due to floats)
    const sum = Math.round((attW + asnW + prtW + hmwW + tstW + exmW) * 100) / 100;
    if (sum !== 1.0) {
      return NextResponse.json(
        { error: `The weights must sum to exactly 1.00. Current sum is: ${sum}` },
        { status: 400 }
      );
    }

    const newSettings = {
      attendanceWeight: attW,
      assignmentWeight: asnW,
      participationWeight: prtW,
      homeworkWeight: hmwW,
      chapterTestWeight: tstW,
      schoolExamWeight: exmW,
    };

    // Update first settings row
    const settingsList = await getRows<Settings>("13_Settings");
    if (settingsList.length > 0) {
      await updateRow(
        "13_Settings",
        "Attendance Weight",
        String(settingsList[0].attendanceWeight),
        {
          "Attendance Weight": attW,
          "Assignment Weight": asnW,
          "Participation Weight": prtW,
          "Homework Weight": hmwW,
          "Chapter Test Weight": tstW,
          "School Exam Weight": exmW,
        }
      );
    } else {
      await addRow("13_Settings", newSettings);
    }

    const author = session.user?.name || session.user?.email || "Unknown";
    await logAudit(
      "Update",
      author,
      "SYSTEM",
      "Settings",
      `Updated score calculation weights: Att:${attW}, Asn:${asnW}, Part:${prtW}, HW:${hmwW}, Test:${tstW}, Exam:${exmW}`
    );

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: any) {
    console.error("Error saving settings:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
