import { describe, expect, it } from "vitest";
import { roleAssignmentAuditToCsv } from "./roleAssignmentAuditCsv";

describe("roleAssignmentAuditToCsv", () => {
  it("creates attributed CSV rows and neutralizes spreadsheet formulas", () => {
    const csv = roleAssignmentAuditToCsv([{ eventId: "RAE-01", batchId: null, occurredAt: new Date("2026-08-22T00:00:00.000Z"), userId: 7, workspaceRole: "grc_analyst", previousActive: false, resultingActive: true, assignedBy: "=unsafe" }], (id) => `User ${id}`);
    expect(csv).toContain('"grc analyst"');
    expect(csv).toContain('"\'=unsafe"');
    expect(csv).toContain('"2026-08-22T00:00:00.000Z"');
  });
});
