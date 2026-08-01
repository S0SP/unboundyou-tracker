import { NextRequest, NextResponse } from "next/server";
import { getRows, addRow } from "@/lib/google/sheets";
import { refreshDashboardCache } from "@/services/studentService";
import { logAudit } from "@/lib/google/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Student } from "@/types";

// Generates the next sequential Student UUID (e.g., UBY-2026-00001)
async function generateNextUuid(): Promise<string> {
  const students = await getRows<Student>("01_Students");
  const year = new Date().getFullYear();

  let maxNum = 0;
  students.forEach((s) => {
    if (s.uuid && s.uuid.startsWith(`UBY-${year}-`)) {
      const parts = s.uuid.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `UBY-${year}-${String(nextNum).padStart(5, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const students = await getRows<Student>("01_Students");
    return NextResponse.json(students);
  } catch (error: any) {
    console.error("Error fetching students:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      subjects, // Array of subject IDs e.g. ["SUB001", "SUB002"]
    } = body;

    if (!studentName || !grade || !board) {
      return NextResponse.json(
        { error: "Student Name, Grade, and Board are required." },
        { status: 400 }
      );
    }

    const uuid = await generateNextUuid();
    const nowStr = new Date().toISOString();

    const newStudent: Student = {
      uuid,
      studentName,
      grade,
      board,
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      parentWhatsApp: parentWhatsApp || "",
      mentor: mentor || "",
      academicCoordinator: academicCoordinator || "",
      enrollmentDate: nowStr.split("T")[0],
      status: "Active",
      overallProgressScore: 100, // Starts at 100
      healthStatus: "Excellent", // Starts excellent
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // 1. Add Student record
    await addRow("01_Students", newStudent);

    // 2. Add Student-Subject mappings if subjects are allocated
    if (Array.isArray(subjects)) {
      for (const subjectId of subjects) {
        await addRow("03_Student_Subjects", {
          uuid,
          subjectId,
          mentor: mentor || "",
          startDate: nowStr.split("T")[0],
          endDate: "",
          status: "Active",
        });
      }
    }

    // 3. Log event in Audit Log
    const author = session.user?.name || session.user?.email || "Unknown Admin";
    await logAudit(
      "Create",
      author,
      uuid,
      "Students",
      `Registered student ${studentName} (${uuid}) with ${subjects?.length || 0} subjects.`
    );

    // 4. Force refresh dashboard cache
    await refreshDashboardCache();

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    console.error("Error creating student:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
