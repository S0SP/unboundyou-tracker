import { getRows } from "../lib/google/sheets";

/**
 * Utility to generate sequential IDs for various entities.
 */
async function generateId(
  sheetName: string,
  prefix: string,
  idKey: string
): Promise<string> {
  const rows = await getRows<any>(sheetName);
  let maxNum = 0;

  rows.forEach((row) => {
    const idVal = row[idKey];
    if (idVal && idVal.startsWith(`${prefix}-`)) {
      const num = parseInt(idVal.split("-")[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
}

export async function generateClassId(): Promise<string> {
  return generateId("04_Classes", "CLS", "classId");
}

export async function generateAssignmentId(): Promise<string> {
  return generateId("05_Assignments", "ASN", "assignmentId");
}

export async function generateTestId(): Promise<string> {
  return generateId("06_Chapter_Tests", "TST", "testId");
}

export async function generateExamId(): Promise<string> {
  return generateId("07_School_Exams", "EXM", "examId");
}

export async function generatePlanId(): Promise<string> {
  return generateId("08_Learning_Plans", "PLN", "planId");
}

export async function generatePtmId(): Promise<string> {
  return generateId("09_PTMs", "PTM", "ptmId");
}

export async function generateNoteId(): Promise<string> {
  return generateId("10_Mentor_Notes", "NTE", "noteId");
}

export async function generateReportId(): Promise<string> {
  return generateId("11_Reports", "RPT", "reportId");
}
