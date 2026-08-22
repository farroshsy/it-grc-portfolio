export type RoleAssignmentAuditCsvRow = {
  eventId: string;
  batchId: string | null;
  occurredAt: Date;
  userId: number;
  workspaceRole: string;
  previousActive: boolean | null;
  resultingActive: boolean;
  assignedBy: string;
};

function safeCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function roleAssignmentAuditToCsv(rows: RoleAssignmentAuditCsvRow[], resolveUser: (userId: number) => string): string {
  const header = ["Event ID", "Batch ID", "Occurred at", "User", "Workspace role", "Previous state", "Resulting state", "Assigned by"];
  const entries = rows.map((event) => [
    event.eventId,
    event.batchId,
    event.occurredAt.toISOString(),
    resolveUser(event.userId),
    event.workspaceRole.replaceAll("_", " "),
    event.previousActive === null ? "Not previously assigned" : event.previousActive ? "Active" : "Inactive",
    event.resultingActive ? "Active" : "Inactive",
    event.assignedBy,
  ].map(safeCell).join(","));
  return [header.map(safeCell).join(","), ...entries].join("\n");
}
