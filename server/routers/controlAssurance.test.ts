import { beforeEach, describe, expect, it, vi } from "vitest";

const operations = vi.hoisted(() => ({
  getControlAssuranceHubData: vi.fn(),
  submitEvidence: vi.fn(),
  setEvidenceReview: vi.fn(),
  recordTestDecision: vi.fn(),
  setFindingTreatment: vi.fn(),
  proposeRiskAcceptance: vi.fn(),
  decideRiskAcceptance: vi.fn(),
  markReadyForGithubIssue: vi.fn(),
  syncRemediationStatus: vi.fn(),
  getRemediationExportPayload: vi.fn(),
  importRemediationSnapshot: vi.fn(),
}));

vi.mock("../controlAssuranceDb", () => operations);

import { controlAssuranceRouter } from "./controlAssurance";

const authenticatedContext = {
  user: { id: 1, openId: "portfolio-owner", name: "Portfolio Owner", email: "owner@example.test", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
} as never;

describe("controlAssuranceRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the complete database-backed operating dataset through the public hub contract", async () => {
    const expected = { systems: [{ systemId: "SYS-PAY-01" }], controls: [], submissions: [], tests: [], findings: [], acceptances: [], remediationLinks: [], integration: { provider: "GitHub Issues", configured: false, mode: "Offline-first" } };
    operations.getControlAssuranceHubData.mockResolvedValue(expected);
    const caller = controlAssuranceRouter.createCaller({} as never);
    await expect(caller.hub()).resolves.toEqual(expected);
  });

  it("uses the authenticated user identity when a control owner submits evidence", async () => {
    operations.submitEvidence.mockResolvedValue({ submissionId: "EVD-900001" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.submitEvidence({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence package for control operation." })).resolves.toEqual({ submissionId: "EVD-900001" });
    expect(operations.submitEvidence).toHaveBeenCalledWith({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence package for control operation.", submittedBy: "Portfolio Owner" });
  });

  it("routes a treatment decision and offline issue preparation through validated procedures", async () => {
    operations.setFindingTreatment.mockResolvedValue({ success: true, status: "Remediation planned" });
    operations.markReadyForGithubIssue.mockResolvedValue({ success: true, integrationConfigured: false });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.setFindingTreatment({ findingId: "FND-001", treatmentChoice: "Remediation" })).resolves.toMatchObject({ success: true });
    await expect(caller.prepareGithubIssue({ findingId: "FND-001" })).resolves.toMatchObject({ integrationConfigured: false });
    expect(operations.setFindingTreatment).toHaveBeenCalledWith({ findingId: "FND-001", treatmentChoice: "Remediation" });
    expect(operations.markReadyForGithubIssue).toHaveBeenCalledWith("FND-001");
  });

  it("records a validated GRC test decision and returns the generated exception finding reference", async () => {
    operations.recordTestDecision.mockResolvedValue({ assuranceTestId: "TEST-900001", findingId: "FND-900001" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.recordTestDecision({ submissionId: "EVD-002", result: "Exception", conclusion: "Illustrative testing identified missing retrospective approval evidence." })).resolves.toEqual({ assuranceTestId: "TEST-900001", findingId: "FND-900001" });
    expect(operations.recordTestDecision).toHaveBeenCalledWith({ submissionId: "EVD-002", result: "Exception", conclusion: "Illustrative testing identified missing retrospective approval evidence.", testedBy: "Portfolio Owner" });
  });

  it("moves a finding through proposed and approved residual-risk decisions with an accountable approver", async () => {
    operations.proposeRiskAcceptance.mockResolvedValue({ acceptanceId: "RA-900001", status: "Proposed" });
    operations.decideRiskAcceptance.mockResolvedValue({ success: true, findingId: "FND-001", status: "Approved" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    const expiry = new Date("2026-10-01");
    await expect(caller.proposeRiskAcceptance({ findingId: "FND-001", rationale: "Illustrative time-bound residual-risk rationale for a controlled remediation period.", expiresAt: expiry })).resolves.toEqual({ acceptanceId: "RA-900001", status: "Proposed" });
    await expect(caller.decideRiskAcceptance({ acceptanceId: "RA-900001", decision: "Approved" })).resolves.toMatchObject({ findingId: "FND-001", status: "Approved" });
    expect(operations.proposeRiskAcceptance).toHaveBeenCalledWith(expect.objectContaining({ findingId: "FND-001", riskOwner: "Portfolio Owner", approver: "Technology Risk Approver" }));
    expect(operations.decideRiskAcceptance).toHaveBeenCalledWith({ acceptanceId: "RA-900001", decision: "Approved", approver: "Portfolio Owner" });
  });

  it("publishes a provider-neutral export payload and exposes a protected remediation refresh action", async () => {
    const expected = { schemaVersion: "1.0", type: "control-assurance-remediation-export", provenance: "Simulated Case Study", finding: { findingId: "FND-001" } };
    operations.getRemediationExportPayload.mockResolvedValue(expected);
    operations.syncRemediationStatus.mockResolvedValue({ success: true, integrationConfigured: false, synchronized: false });
    const publicCaller = controlAssuranceRouter.createCaller({} as never);
    const protectedCaller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(publicCaller.remediationExport({ findingId: "FND-001" })).resolves.toEqual(expected);
    await expect(protectedCaller.syncRemediation({ findingId: "FND-001" })).resolves.toMatchObject({ synchronized: false });
    expect(operations.getRemediationExportPayload).toHaveBeenCalledWith("FND-001");
    expect(operations.syncRemediationStatus).toHaveBeenCalledWith("FND-001");
  });

  it("accepts a provenance-safe external remediation snapshot without accepting credentials from the client", async () => {
    operations.importRemediationSnapshot.mockResolvedValue({ success: true, status: "Pending retest" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.importRemediationSnapshot({ findingId: "FND-001", provider: "GitHub Issues", externalIssueNumber: 42, externalIssueUrl: "https://github.com/acme/remediations/issues/42", externalState: "closed", observedAt: new Date("2026-08-21"), provenance: "Simulated Case Study" })).resolves.toEqual({ success: true, status: "Pending retest" });
    expect(operations.importRemediationSnapshot).toHaveBeenCalledWith(expect.objectContaining({ findingId: "FND-001", provider: "GitHub Issues", externalIssueNumber: 42, externalState: "closed", provenance: "Simulated Case Study" }));
  });
});
