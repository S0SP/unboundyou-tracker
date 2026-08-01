import { NextRequest, NextResponse } from "next/server";
import { getRows, addRow } from "@/lib/google/sheets";
import { uploadReport } from "@/lib/google/drive";
import { generateReportId } from "@/utils/idGenerator";
import { logAudit } from "@/lib/google/audit";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { ReportTemplate } from "@/lib/pdf/reportTemplate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs";
import path from "path";
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await getRows<ReportLog>("11_Reports");
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error fetching reports list:", error.message);
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
      studentUuid,
      reportType, // "Weekly" | "Monthly" | "Custom"
      startDate,
      endDate,
      includeNotes,
      mode, // "Snapshot" | "Live"
    } = body;

    if (!studentUuid || !reportType || !startDate || !endDate || !mode) {
      return NextResponse.json(
        { error: "Required fields: Student UUID, Report Type, Start Date, End Date, and Mode." },
        { status: 400 }
      );
    }

    // 1. Gather all student datasets concurrently
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
    ]);

    const student = students.find((s) => s.uuid === studentUuid);
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Filter datasets specifically for student
    const studentClasses = classes.filter((c) => c.studentUuid === studentUuid);
    const studentAssignments = assignments.filter((a) => a.studentUuid === studentUuid);
    const studentTests = tests.filter((t) => t.studentUuid === studentUuid);
    const studentExams = exams.filter((e) => e.studentUuid === studentUuid);
    const studentPlans = plans.filter((p) => p.studentUuid === studentUuid);
    const studentPtms = ptms.filter((p) => p.studentUuid === studentUuid);
    const studentNotes = includeNotes
      ? notes.filter((n) => n.studentUuid === studentUuid && (n.includeInReport === "TRUE" || (n.includeInReport as any) === true))
      : [];

    const author = session.user?.name || session.user?.email || "Academic Coordinator";

    // 2. Prepare report details object
    const reportData = {
      student,
      subjects,
      classes: studentClasses,
      assignments: studentAssignments,
      tests: studentTests,
      exams: studentExams,
      learningPlans: studentPlans,
      ptms: studentPtms,
      mentorNotes: studentNotes,
      reportMeta: {
        reportType,
        startDate,
        endDate,
        generatedBy: author,
      },
    };

    // 3. Compile PDF in-memory using @react-pdf/renderer
    console.log(`Compiling PDF for student ${student.studentName}...`);

    // Read logo as base64 so @react-pdf/renderer can embed it
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoDataUrl = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : "";

    const stream = await renderToStream(
      React.createElement(ReportTemplate as any, { data: reportData, logoDataUrl }) as any
    );

    // Convert stream to Buffer
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 4. Upload PDF to Google Drive under folder format (Year / Month / StudentUUID)
    const reportDate = new Date();
    const yearStr = String(reportDate.getFullYear());
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthStr = monthNames[reportDate.getMonth()];

    // Branded File Name e.g. "Rahul_Sharma_Monthly_2026-08-01_to_2026-08-31.pdf"
    const cleanedName = student.studentName.replace(/\s+/g, "_");
    const fileName = `${cleanedName}_${reportType}_${startDate}_to_${endDate}.pdf`;

    const reportId = await generateReportId();

    let driveFileId = "";
    let pdfUrl = "";

    try {
      const uploadResult = await uploadReport(
        fileName,
        pdfBuffer,
        studentUuid,
        yearStr,
        monthStr
      );
      driveFileId = uploadResult.fileId;
      pdfUrl = uploadResult.webViewLink;
    } catch (uploadError: any) {
      console.warn("⚠️ Could not upload to Google Drive (Quota/Permissions). Falling back to dynamic PDF URL.", uploadError.message);
      // Fallback to dynamic PDF endpoint
      pdfUrl = `/api/reports/${reportId}/pdf`;
    }

    // 5. Generate secure random token
    const publicToken = crypto.randomBytes(16).toString("hex");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicUrl = `${appUrl}/r/${publicToken}`;

    // 6. If mode is "Snapshot", cache the gathered dataset in Google Sheet row
    const snapshotDataStr =
      mode === "Snapshot" ? JSON.stringify(reportData) : "";

    const newReport: ReportLog = {
      reportId,
      uuid: studentUuid,
      reportType,
      startDate,
      endDate,
      generatedBy: author,
      generatedDate: nowISO(),
      driveFileId,
      pdfUrl,
      publicToken,
      publicUrl,
      mode,
      status: "Active",
      snapshotData: snapshotDataStr,
    };

    // 7. Save metadata to sheet '11_Reports'
    await addRow("11_Reports", newReport);

    // 8. Log action in Audit Logs
    await logAudit(
      "Generate",
      author,
      studentUuid,
      "Reports",
      `Generated ${reportType} report ${reportId} (${mode} mode) uploaded to Google Drive.`
    );

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("Error generating report PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function nowISO(): string {
  return new Date().toISOString();
}
