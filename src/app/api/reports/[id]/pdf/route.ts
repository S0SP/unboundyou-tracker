import { NextRequest, NextResponse } from "next/server";
import { getRows } from "@/lib/google/sheets";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { ReportTemplate } from "@/lib/pdf/reportTemplate";
import { ReportLog } from "@/types";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const reports = await getRows<ReportLog>("11_Reports");
    const report = reports.find((r) => r.reportId === reportId);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.snapshotData) {
      return NextResponse.json({ error: "Report was not saved as a snapshot, dynamic rendering is unavailable." }, { status: 400 });
    }

    const reportData = JSON.parse(report.snapshotData);

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoDataUrl = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : "";

    const stream = await renderToStream(
      React.createElement(ReportTemplate as any, { data: reportData, logoDataUrl }) as any
    );

    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Report_${reportId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating dynamic PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
