import { addRow } from "./sheets";
import { AuditLog } from "../../types";

/**
 * Appends a new audit record to sheet '14_Audit_Log'.
 */
export async function logAudit(
  action: string,
  user: string,
  studentUuid: string,
  module: string,
  description: string
): Promise<void> {
  const auditEntry: AuditLog = {
    action,
    user,
    time: new Date().toISOString(),
    studentUuid,
    module,
    description,
  };

  try {
    await addRow("14_Audit_Log", auditEntry);
  } catch (error: any) {
    console.error("⚠️ Failed to write audit log:", error.message);
  }
}
