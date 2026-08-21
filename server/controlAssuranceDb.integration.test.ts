import { beforeEach, describe, expect, it, vi } from "vitest";

const getDb = vi.hoisted(() => vi.fn());
const ensureControlAssuranceSeeded = vi.hoisted(() => vi.fn());
vi.mock("./db", () => ({ getDb }));
vi.mock("./controlAssuranceSeed", () => ({ ensureControlAssuranceSeeded }));

import { decideRiskAcceptance, proposeRiskAcceptance, recordTestDecision, setFindingTreatment, submitEvidence, syncRemediationStatus } from "./controlAssuranceDb";

describe("controlAssuranceDb controlled persistence lifecycle", () => {
  beforeEach(() => { vi.clearAllMocks(); ensureControlAssuranceSeeded.mockResolvedValue(undefined); });

  it("drives implemented persistence operations from submitted evidence through offline remediation synchronization", async () => {
    const selectResponses = [
      [{ submissionId: "EVD-200", controlId: "CAA-AC-01" }], [], [{ controlId: "CAA-AC-01", title: "Privileged access approval", owner: "Security Engineering" }],
      [{ linkId: "GHL-200", findingId: "FND-200" }],
      [{ findingId: "FND-200" }],
      [{ acceptanceId: "RA-200", findingId: "FND-200" }],
      [{ linkId: "GHL-200", findingId: "FND-200", issueNumber: null }],
    ];
    const inserts: unknown[] = [];
    const updates: unknown[] = [];
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve(selectResponses.shift() ?? []) }) }) }),
      insert: (_table: unknown) => ({ values: (value: unknown) => { inserts.push(value); return Promise.resolve(); } }),
      update: (_table: unknown) => ({ set: (value: unknown) => { updates.push(value); return { where: () => Promise.resolve() }; } }),
    };
    getDb.mockResolvedValue(db);
    await submitEvidence({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence submitted for a controlled lifecycle test.", submittedBy: "Owner" });
    const result = await recordTestDecision({ submissionId: "EVD-200", result: "Exception", conclusion: "Illustrative exception conclusion that requires engineering remediation.", testedBy: "Analyst" });
    await setFindingTreatment({ findingId: result.findingId!, treatmentChoice: "Risk acceptance" });
    const acceptance = await proposeRiskAcceptance({ findingId: result.findingId!, rationale: "Illustrative time-bound residual-risk rationale for controlled testing.", riskOwner: "Risk Owner", approver: "Approver", expiresAt: new Date("2026-10-01") });
    await decideRiskAcceptance({ acceptanceId: acceptance.acceptanceId, decision: "Rejected", approver: "Approver" });
    await syncRemediationStatus(result.findingId!);
    expect(inserts).toHaveLength(5);
    expect(updates).toContainEqual(expect.objectContaining({ status: "Exception" }));
    expect(updates).toContainEqual(expect.objectContaining({ status: "Open", treatmentChoice: "Remediation" }));
    expect(updates).toContainEqual(expect.objectContaining({ lastError: expect.stringContaining("No external issue") }));
  });
});
