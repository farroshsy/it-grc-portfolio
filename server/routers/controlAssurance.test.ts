import { beforeEach, describe, expect, it, vi } from "vitest";

const operations = vi.hoisted(() => ({
  getControlAssuranceHubData: vi.fn(),
  getComplianceDashboardData: vi.fn(),
  getFlowguardVerificationData: vi.fn(),
  submitEvidence: vi.fn(),
  attachEvidenceFile: vi.fn(),
  listEvidenceAttachments: vi.fn(),
  listWorkspaceEvidenceAttachments: vi.fn(),
  getAdministrationData: vi.fn(),
  assignWorkspaceRole: vi.fn(),
  bulkAssignWorkspaceRole: vi.fn(),
  upsertRetentionTemplate: vi.fn(),
  applyRetentionTemplate: vi.fn(),
  setGrafanaWebhookConfig: vi.fn(),
  getRetentionReviewDashboard: vi.fn(),
  saveRetentionReviewSchedule: vi.fn(),
  setEvidenceAttachmentRetention: vi.fn(),
  ingestFlowGuardPaymentTrace: vi.fn(),
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

const access = vi.hoisted(() => ({
  canPerformWorkspaceAction: vi.fn(),
  getWorkspaceRoles: vi.fn(),
}));

vi.mock("../controlAssuranceDb", () => operations);
vi.mock("../grcAccess", () => access);

import { controlAssuranceRouter } from "./controlAssurance";

const authenticatedContext = {
  user: { id: 1, openId: "portfolio-owner", name: "Portfolio Owner", email: "owner@example.test", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
} as never;

describe("controlAssuranceRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.getWorkspaceRoles.mockImplementation(async (user: { role: string }) => user.role === "admin" ? ["control_owner", "grc_analyst", "risk_approver"] : []);
    access.canPerformWorkspaceAction.mockImplementation((roles: string[], allowed: string[]) => allowed.some((role) => roles.includes(role)));
  });

  it("returns the complete database-backed operating dataset through the public hub contract", async () => {
    const expected = { systems: [{ systemId: "SYS-PAY-01" }], controls: [], submissions: [], tests: [], findings: [], acceptances: [], remediationLinks: [], attachments: [], integration: { provider: "GitHub Issues", configured: false, mode: "Offline-first" } };
    operations.getControlAssuranceHubData.mockResolvedValue(expected);
    await expect(controlAssuranceRouter.createCaller({} as never).hub()).resolves.toEqual(expected);
  });

  it("returns database-backed operational compliance and FlowGuard verification data only to an authenticated workspace role", async () => {
    const dashboard = { controls: [{ controlId: "CAA-01" }], tests: [], findings: [], acceptances: [], executions: [], technicalExceptions: [] };
    const technical = { contracts: [{ contractId: "FGC-001" }], executions: [{ executionId: "FGX-001" }], technicalExceptions: [{ exceptionId: "FG-EXC-001" }] };
    operations.getComplianceDashboardData.mockResolvedValue(dashboard);
    operations.getFlowguardVerificationData.mockResolvedValue(technical);
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.complianceDashboard()).resolves.toEqual({ ...dashboard, roles: ["control_owner", "grc_analyst", "risk_approver"] });
    await expect(caller.technicalVerification()).resolves.toEqual({ ...technical, roles: ["control_owner", "grc_analyst", "risk_approver"] });
    await expect(controlAssuranceRouter.createCaller({} as never).complianceDashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("uses the authenticated identity when a control owner submits evidence and records a managed attachment", async () => {
    operations.submitEvidence.mockResolvedValue({ submissionId: "EVD-900001" });
    operations.attachEvidenceFile.mockResolvedValue({ attachmentId: "ATT-900001", storageUrl: "/manus-storage/evidence.pdf" });
    operations.listEvidenceAttachments.mockResolvedValue([{ attachmentId: "ATT-900001" }]);
    operations.listWorkspaceEvidenceAttachments.mockResolvedValue([{ attachmentId: "ATT-900001", storageUrl: "/manus-storage/evidence.pdf" }]);
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.submitEvidence({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence package for control operation." })).resolves.toEqual({ submissionId: "EVD-900001" });
    await expect(caller.attachEvidence({ submissionId: "EVD-900001", fileName: "access-review.pdf", contentType: "application/pdf", base64Data: "c2ltdWxhdGVk" })).resolves.toMatchObject({ attachmentId: "ATT-900001" });
    await expect(caller.evidenceAttachments({ submissionId: "EVD-900001" })).resolves.toEqual([{ attachmentId: "ATT-900001" }]);
    await expect(caller.evidenceAttachmentIndex()).resolves.toEqual([{ attachmentId: "ATT-900001", storageUrl: "/manus-storage/evidence.pdf" }]);
    expect(operations.submitEvidence).toHaveBeenCalledWith({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence package for control operation.", submittedBy: "Portfolio Owner" });
    expect(operations.attachEvidenceFile).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "EVD-900001", fileName: "access-review.pdf", uploadedBy: "Portfolio Owner" }));
  });

  it("reports resolved workspace permissions and rejects users without the required role", async () => {
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.myAccess()).resolves.toEqual({ roles: ["control_owner", "grc_analyst", "risk_approver"], isAdministrator: true });
    access.getWorkspaceRoles.mockResolvedValue([]);
    const userContext = { user: { ...((authenticatedContext as { user: object }).user), role: "user" } } as never;
    const restrictedCaller = controlAssuranceRouter.createCaller(userContext);
    await expect(restrictedCaller.submitEvidence({ controlId: "CAA-AC-01", evidenceSummary: "Illustrative evidence package for role enforcement." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.attachEvidence({ submissionId: "EVD-001", fileName: "evidence.pdf", contentType: "application/pdf", base64Data: "c2ltdWxhdGVk" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.evidenceAttachmentIndex()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.recordTestDecision({ submissionId: "EVD-001", result: "Effective", conclusion: "Illustrative role-enforcement test conclusion." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.proposeRiskAcceptance({ findingId: "FND-001", rationale: "Illustrative role-enforcement residual-risk rationale.", expiresAt: new Date("2026-10-01") })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.ingestPaymentTrace({ sourceName: "test.json", rawTrace: '{"spans":[{"traceId":"t1","spanId":"s1"}]}' })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(restrictedCaller.administration()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("limits role assignment and evidence-retention configuration to the platform administrator", async () => {
    operations.getAdministrationData.mockResolvedValue({ users: [{ id: 2, name: "Control Owner" }], roleAssignments: [], attachments: [{ attachmentId: "ATT-001", retentionStatus: "Active" }], roleEvents: [], retentionTemplates: [], webhookConfigs: [] });
    operations.assignWorkspaceRole.mockResolvedValue({ success: true });
    operations.bulkAssignWorkspaceRole.mockResolvedValue({ success: true, batchId: "RAB-001", updatedUsers: 2 });
    operations.setEvidenceAttachmentRetention.mockResolvedValue({ success: true });
    operations.upsertRetentionTemplate.mockResolvedValue({ success: true, templateId: "RTP-001" });
    operations.applyRetentionTemplate.mockResolvedValue({ success: true, retentionUntil: new Date("2027-08-21") });
    operations.setGrafanaWebhookConfig.mockResolvedValue({ success: true, active: false });
    operations.getRetentionReviewDashboard.mockResolvedValue({ schedule: { scheduleId: "RRS-001", active: false, cronExpression: "0 0 9 * * 1", thresholdDays: 30 }, runs: [], dueAttachments: [], dueCount: 0, overdueCount: 0 });
    operations.saveRetentionReviewSchedule.mockResolvedValue({ scheduleId: "RRS-001", active: false, cronExpression: "0 0 9 * * 1", thresholdDays: 30 });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.administration()).resolves.toMatchObject({ users: [{ id: 2 }] });
    await expect(caller.assignWorkspaceRole({ userId: 2, workspaceRole: "control_owner", active: true })).resolves.toEqual({ success: true });
    await expect(caller.bulkAssignWorkspaceRole({ userIds: [2, 3], workspaceRole: "grc_analyst", active: true })).resolves.toMatchObject({ updatedUsers: 2 });
    await expect(caller.setAttachmentRetention({ attachmentId: "ATT-001", retentionUntil: new Date("2027-08-21"), retentionStatus: "Legal hold", retentionNote: "Open audit request" })).resolves.toEqual({ success: true });
    await expect(caller.upsertRetentionTemplate({ title: "Change evidence", evidenceType: "Change record", retentionDays: 730, retentionNote: "Retain approved production change evidence.", active: true })).resolves.toMatchObject({ templateId: "RTP-001" });
    await expect(caller.applyRetentionTemplate({ attachmentId: "ATT-001", templateId: "RTP-001" })).resolves.toMatchObject({ success: true });
    await expect(caller.setGrafanaWebhook({ active: false })).resolves.toMatchObject({ active: false });
    await expect(caller.retentionReviewDashboard()).resolves.toMatchObject({ schedule: { scheduleId: "RRS-001" }, dueCount: 0 });
    await expect(caller.configureRetentionReview({ active: false, cronExpression: "0 0 9 * * 1", thresholdDays: 30 })).resolves.toMatchObject({ active: false, thresholdDays: 30 });
    expect(operations.assignWorkspaceRole).toHaveBeenCalledWith({ userId: 2, workspaceRole: "control_owner", active: true, assignedBy: "Portfolio Owner" });
    expect(operations.setEvidenceAttachmentRetention).toHaveBeenCalledWith(expect.objectContaining({ attachmentId: "ATT-001", retentionStatus: "Legal hold" }));
    expect(operations.bulkAssignWorkspaceRole).toHaveBeenCalledWith(expect.objectContaining({ userIds: [2, 3], workspaceRole: "grc_analyst", assignedBy: "Portfolio Owner" }));
    expect(operations.setGrafanaWebhookConfig).toHaveBeenCalledWith({ active: false, updatedBy: "Portfolio Owner" });
    expect(operations.saveRetentionReviewSchedule).toHaveBeenCalledWith({ active: false, cronExpression: "0 0 9 * * 1", thresholdDays: 30, configuredBy: "Portfolio Owner", scheduleCronTaskUid: null });
  });

  it("accepts a trace export only through an authenticated GRC analyst workflow", async () => {
    operations.ingestFlowGuardPaymentTrace.mockResolvedValue({ executionId: "FGX-900001", importId: "FGI-900001", verdict: "PASS", rawTraceStored: false });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.ingestPaymentTrace({ sourceName: "payment-export.json", rawTrace: '{"spans":[{"traceId":"trace-1","spanId":"span-1","service":"orderservice","operation":"CreateOrder","status":"ok"}]}' })).resolves.toMatchObject({ executionId: "FGX-900001", rawTraceStored: false });
    expect(operations.ingestFlowGuardPaymentTrace).toHaveBeenCalledWith(expect.objectContaining({ sourceName: "payment-export.json", ingestedBy: "Portfolio Owner" }));
  });

  it("routes analyst treatment decisions and offline issue preparation through validated procedures", async () => {
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

  it("moves a finding through proposed and approved residual-risk decisions with the named risk approver", async () => {
    operations.proposeRiskAcceptance.mockResolvedValue({ acceptanceId: "RA-900001", status: "Proposed" });
    operations.decideRiskAcceptance.mockResolvedValue({ success: true, findingId: "FND-001", status: "Approved" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    const expiry = new Date("2026-10-01");
    await expect(caller.proposeRiskAcceptance({ findingId: "FND-001", rationale: "Illustrative time-bound residual-risk rationale for a controlled remediation period.", expiresAt: expiry })).resolves.toEqual({ acceptanceId: "RA-900001", status: "Proposed" });
    await expect(caller.decideRiskAcceptance({ acceptanceId: "RA-900001", decision: "Approved" })).resolves.toMatchObject({ findingId: "FND-001", status: "Approved" });
    expect(operations.proposeRiskAcceptance).toHaveBeenCalledWith(expect.objectContaining({ findingId: "FND-001", riskOwner: "Portfolio Owner", approver: "Portfolio Owner" }));
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

  it("accepts a provenance-safe external remediation snapshot without accepting client credentials", async () => {
    operations.importRemediationSnapshot.mockResolvedValue({ success: true, status: "Pending retest" });
    const caller = controlAssuranceRouter.createCaller(authenticatedContext);
    await expect(caller.importRemediationSnapshot({ findingId: "FND-001", provider: "GitHub Issues", externalIssueNumber: 42, externalIssueUrl: "https://github.com/acme/remediations/issues/42", externalState: "closed", observedAt: new Date("2026-08-21"), provenance: "Simulated Case Study" })).resolves.toEqual({ success: true, status: "Pending retest" });
    expect(operations.importRemediationSnapshot).toHaveBeenCalledWith(expect.objectContaining({ findingId: "FND-001", provider: "GitHub Issues", externalIssueNumber: 42, externalState: "closed", provenance: "Simulated Case Study" }));
  });
});
