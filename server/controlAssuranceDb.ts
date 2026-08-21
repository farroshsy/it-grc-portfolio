import { asc, desc, eq } from "drizzle-orm";
import {
  assuranceControls,
  assuranceTests,
  evidenceAttachments,
  evidenceSubmissions,
  flowguardControlContracts,
  flowguardControlExecutions,
  flowguardExceptions,
  flowguardTraceImports,
  githubRemediationLinks,
  grcFindings,
  grcSystems,
  grcUserRoles,
  riskAcceptances,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { ensureControlAssuranceSeeded } from "./controlAssuranceSeed";
import { controlStatusForTestDecision, effectiveRiskAcceptanceStatus, evidenceStatusForTestDecision, findingStatusForExternalState, findingStatusForRiskDecision, findingStatusForTreatment } from "../shared/controlAssuranceLifecycle";
import { createExternalRemediation, refreshExternalRemediation, type RemediationProvider } from "./remediationProvider";
import { storagePut } from "./storage";
import { evaluatePaymentTraceExport, parseFlowGuardTraceExport } from "./flowguardTraceIngestion";

async function readyDb() {
  const db = await getDb();
  if (!db) return null;
  await ensureControlAssuranceSeeded();
  return db;
}

export async function getControlAssuranceHubData() {
  const db = await readyDb();
  if (!db) return null;
  const [systems, controls, submissions, tests, findings, acceptances, remediationLinks] = await Promise.all([
    db.select().from(grcSystems).orderBy(asc(grcSystems.systemId)),
    db.select().from(assuranceControls).orderBy(asc(assuranceControls.controlId)),
    db.select().from(evidenceSubmissions).orderBy(desc(evidenceSubmissions.submittedAt)),
    db.select().from(assuranceTests).orderBy(desc(assuranceTests.testedAt)),
    db.select().from(grcFindings).orderBy(asc(grcFindings.dueDate)),
    db.select().from(riskAcceptances).orderBy(asc(riskAcceptances.expiresAt)),
    db.select().from(githubRemediationLinks).orderBy(asc(githubRemediationLinks.linkId)),
  ]);
  const resolvedAcceptances = await Promise.all(acceptances.map(async (acceptance) => {
    const status = effectiveRiskAcceptanceStatus(acceptance.status, acceptance.expiresAt);
    if (status !== acceptance.status) {
      await db.update(riskAcceptances).set({ status }).where(eq(riskAcceptances.acceptanceId, acceptance.acceptanceId));
      await db.update(grcFindings).set({ status: "Open", treatmentChoice: "Remediation" }).where(eq(grcFindings.findingId, acceptance.findingId));
    }
    return { ...acceptance, status };
  }));
  return { systems, controls, submissions, tests, findings, acceptances: resolvedAcceptances, remediationLinks, integration: { provider: "GitHub Issues", configured: false, mode: "Offline-first" as const } };
}

export async function getComplianceDashboardData() {
  const db = await readyDb();
  if (!db) return null;
  const [controls, tests, findings, acceptances, executions, technicalExceptions] = await Promise.all([
    db.select().from(assuranceControls).orderBy(asc(assuranceControls.controlId)),
    db.select().from(assuranceTests).orderBy(desc(assuranceTests.testedAt)),
    db.select().from(grcFindings).orderBy(asc(grcFindings.dueDate)),
    db.select().from(riskAcceptances).orderBy(asc(riskAcceptances.expiresAt)),
    db.select().from(flowguardControlExecutions).orderBy(asc(flowguardControlExecutions.occurredAt)),
    db.select().from(flowguardExceptions).orderBy(asc(flowguardExceptions.dueDate)),
  ]);
  return { controls, tests, findings, acceptances, executions, technicalExceptions };
}

export async function getFlowguardVerificationData() {
  const db = await readyDb();
  if (!db) return null;
  const [contracts, executions, technicalExceptions, traceImports] = await Promise.all([
    db.select().from(flowguardControlContracts).orderBy(asc(flowguardControlContracts.controlKey)),
    db.select().from(flowguardControlExecutions).orderBy(desc(flowguardControlExecutions.occurredAt)),
    db.select().from(flowguardExceptions).orderBy(asc(flowguardExceptions.dueDate)),
    db.select().from(flowguardTraceImports).orderBy(desc(flowguardTraceImports.ingestedAt)),
  ]);
  return { contracts, executions, technicalExceptions, traceImports };
}

export async function submitEvidence(input: { controlId: string; evidenceSummary: string; submittedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const submissionId = `EVD-${Date.now().toString().slice(-6)}`;
  await db.insert(evidenceSubmissions).values({
    submissionId,
    controlId: input.controlId,
    status: "Submitted",
    evidenceSummary: input.evidenceSummary,
    submittedBy: input.submittedBy,
    submittedAt: new Date(),
    provenance: "Simulated Case Study",
  });
  await db.update(assuranceControls).set({ status: "In testing" }).where(eq(assuranceControls.controlId, input.controlId));
  return { submissionId };
}

const allowedEvidenceContentTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);

export async function attachEvidenceFile(input: { submissionId: string; fileName: string; contentType: string; base64Data: string; uploadedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  if (!allowedEvidenceContentTypes.has(input.contentType)) throw new Error("Evidence files must be PDF, PNG, JPEG, WEBP, or plain text.");
  const fileData = Buffer.from(input.base64Data, "base64");
  if (!fileData.byteLength || fileData.byteLength > 5 * 1024 * 1024) throw new Error("Evidence files must be between 1 byte and 5 MB.");
  const [submission] = await db.select().from(evidenceSubmissions).where(eq(evidenceSubmissions.submissionId, input.submissionId)).limit(1);
  if (!submission) throw new Error("The evidence submission does not exist.");
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "evidence.bin";
  const attachmentId = `ATT-${Date.now().toString().slice(-6)}`;
  const uploaded = await storagePut(`grc-evidence/${submission.controlId}/${input.submissionId}/${safeFileName}`, fileData, input.contentType);
  const uploadedAt = new Date();
  const retentionUntil = new Date(uploadedAt);
  retentionUntil.setUTCFullYear(retentionUntil.getUTCFullYear() + 1);
  await db.insert(evidenceAttachments).values({ attachmentId, submissionId: input.submissionId, fileName: safeFileName, contentType: input.contentType, byteSize: fileData.byteLength, storageKey: uploaded.key, storageUrl: uploaded.url, uploadedBy: input.uploadedBy, uploadedAt, retentionUntil, retentionStatus: "Active", retentionNote: "Default 365-day portfolio evidence-retention policy.", provenance: "Simulated Case Study" });
  return { attachmentId, fileName: safeFileName, contentType: input.contentType, byteSize: fileData.byteLength, url: uploaded.url };
}

type AttachmentRow = typeof evidenceAttachments.$inferSelect;

export function resolveEvidenceAttachmentLifecycle<T extends Pick<AttachmentRow, "retentionStatus" | "retentionUntil" | "expiredAt" | "storageUrl">>(attachment: T, now = new Date()) {
  const retentionStatus = attachment.retentionStatus === "Legal hold" ? "Legal hold" : attachment.retentionUntil <= now ? "Expired" : "Active";
  const expiredAt = retentionStatus === "Expired" ? (attachment.expiredAt ?? now) : attachment.expiredAt;
  return { ...attachment, retentionStatus, expiredAt, storageUrl: retentionStatus === "Expired" ? null : attachment.storageUrl };
}

async function resolveAttachmentRetention(rows: AttachmentRow[]) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const now = new Date();
  return Promise.all(rows.map(async (attachment) => {
    const resolved = resolveEvidenceAttachmentLifecycle(attachment, now);
    if (resolved.retentionStatus !== attachment.retentionStatus) await db.update(evidenceAttachments).set({ retentionStatus: resolved.retentionStatus, expiredAt: resolved.retentionStatus === "Expired" ? now : null }).where(eq(evidenceAttachments.attachmentId, attachment.attachmentId));
    return resolved;
  }));
}

export async function listEvidenceAttachments(submissionId: string) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  return resolveAttachmentRetention(await db.select().from(evidenceAttachments).where(eq(evidenceAttachments.submissionId, submissionId)).orderBy(desc(evidenceAttachments.uploadedAt)));
}

export async function listWorkspaceEvidenceAttachments() {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  return resolveAttachmentRetention(await db.select().from(evidenceAttachments).orderBy(desc(evidenceAttachments.uploadedAt)));
}

export async function setEvidenceAttachmentRetention(input: { attachmentId: string; retentionUntil: Date; retentionStatus: "Active" | "Legal hold"; retentionNote: string | null }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  await db.update(evidenceAttachments).set({ retentionUntil: input.retentionUntil, retentionStatus: input.retentionStatus, retentionNote: input.retentionNote, expiredAt: null }).where(eq(evidenceAttachments.attachmentId, input.attachmentId));
  return { success: true as const };
}

export async function getAdministrationData() {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [workspaceUsers, roleAssignments, attachments] = await Promise.all([
    db.select().from(users).orderBy(asc(users.name)),
    db.select().from(grcUserRoles).orderBy(asc(grcUserRoles.userId)),
    db.select().from(evidenceAttachments).orderBy(asc(evidenceAttachments.retentionUntil)),
  ]);
  return { users: workspaceUsers, roleAssignments, attachments: await resolveAttachmentRetention(attachments) };
}

export async function assignWorkspaceRole(input: { userId: number; workspaceRole: "control_owner" | "grc_analyst" | "risk_approver"; active: boolean; assignedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  await db.insert(grcUserRoles).values({ ...input }).onDuplicateKeyUpdate({ set: { active: input.active, assignedBy: input.assignedBy } });
  return { success: true as const };
}

export async function ingestFlowGuardPaymentTrace(input: { rawTrace: string; sourceName: string; ingestedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const imported = parseFlowGuardTraceExport(input.rawTrace, input.sourceName);
  const evaluation = evaluatePaymentTraceExport(imported);
  const suffix = Date.now().toString().slice(-6);
  const executionId = `FGX-${suffix}`;
  const importId = `FGI-${suffix}`;
  await db.insert(flowguardControlExecutions).values({ executionId, contractId: "FGC-001", controlKey: "CTRL-PAY-001", mappedControlId: "CAA-PAY-01", verdict: evaluation.verdict, traceId: evaluation.traceId, evidenceHash: evaluation.evidenceHash, firstFinding: evaluation.firstFinding?.detail ?? null, occurredAt: evaluation.occurredAt, provenanceSource: `Imported trace export: ${evaluation.sourceName}`, biOjkEvidenceReference: "Technical evidence cross-reference only", iso27001EvidenceReference: "ISMS operating-effectiveness cross-reference only", mappingInterpretationNote: "Imported trace evidence is evaluated deterministically; it does not determine regulatory applicability or assert certification.", provenance: "Independent Research" });
  await db.insert(flowguardTraceImports).values({ importId, executionId, sourceName: evaluation.sourceName, sourceShape: evaluation.sourceShape, spanCount: evaluation.spanCount, traceId: evaluation.traceId, ingestedBy: input.ingestedBy, ingestedAt: new Date(), rawTraceStored: false, provenance: "Independent Research" });
  let exceptionId: string | null = null;
  if (evaluation.verdict !== "PASS") {
    exceptionId = `FG-EXC-${suffix}`;
    const dueDate = new Date(); dueDate.setUTCDate(dueDate.getUTCDate() + 30);
    await db.insert(flowguardExceptions).values({ exceptionId, executionId, linkedFindingId: null, title: `Imported trace verification: ${evaluation.firstFinding?.label ?? "inconclusive evidence"}`, owner: "Platform Engineering", dueDate, remediation: "Review the imported trace finding, correct the technical control path, and submit a new trace export for retest.", retestStatus: "Retest required", status: "Open", provenance: "Independent Research" });
  }
  return { executionId, importId, exceptionId, verdict: evaluation.verdict, traceId: evaluation.traceId, evidenceHash: evaluation.evidenceHash, rawTraceStored: false as const };
}

export async function setEvidenceReview(input: { submissionId: string; status: "Accepted" | "Rejected"; reviewNote: string; reviewedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  await db.update(evidenceSubmissions).set({ status: input.status, reviewNote: input.reviewNote, reviewedBy: input.reviewedBy }).where(eq(evidenceSubmissions.submissionId, input.submissionId));
  return { success: true as const };
}

export async function recordTestDecision(input: { submissionId: string; result: "Effective" | "Exception"; conclusion: string; testedBy: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [[submission], [existingTest]] = await Promise.all([
    db.select().from(evidenceSubmissions).where(eq(evidenceSubmissions.submissionId, input.submissionId)).limit(1),
    db.select().from(assuranceTests).where(eq(assuranceTests.submissionId, input.submissionId)).limit(1),
  ]);
  if (!submission) throw new Error("The evidence submission does not exist.");
  if (existingTest) throw new Error("A control-test decision is already recorded for this evidence submission.");
  const [control] = await db.select().from(assuranceControls).where(eq(assuranceControls.controlId, submission.controlId)).limit(1);
  if (!control) throw new Error("The linked control does not exist.");
  const suffix = Date.now().toString().slice(-6);
  const assuranceTestId = `TEST-${suffix}`;
  await db.insert(assuranceTests).values({
    assuranceTestId,
    controlId: submission.controlId,
    submissionId: submission.submissionId,
    testProcedure: `Assess ${submission.submissionId} against the ${submission.controlId} control objective and retained evidence requirements.`,
    result: input.result,
    conclusion: input.conclusion,
    testedBy: input.testedBy,
    testedAt: new Date(),
    provenance: "Simulated Case Study",
  });
  await db.update(evidenceSubmissions).set({ status: evidenceStatusForTestDecision(input.result), reviewedBy: input.testedBy, reviewNote: input.conclusion }).where(eq(evidenceSubmissions.submissionId, input.submissionId));
  await db.update(assuranceControls).set({ status: controlStatusForTestDecision(input.result) }).where(eq(assuranceControls.controlId, submission.controlId));
  if (input.result === "Effective") return { assuranceTestId, findingId: null };
  const findingId = `FND-${suffix}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  await db.insert(grcFindings).values({
    findingId,
    assuranceTestId,
    controlId: submission.controlId,
    title: `Control-test exception: ${control.title}`,
    description: input.conclusion,
    severity: "Medium",
    owner: control.owner,
    status: "Open",
    treatmentChoice: "Remediation",
    dueDate,
    provenance: "Simulated Case Study",
  });
  await db.insert(githubRemediationLinks).values({
    linkId: `GHL-${suffix}`,
    findingId,
    provider: "GitHub Issues",
    repository: "Not configured",
    issueNumber: null,
    issueUrl: null,
    syncStatus: "Ready to create",
    lastSyncedAt: null,
    lastError: "GitHub is not configured. The GRC finding is ready for future engineering-ticket creation.",
    provenance: "Simulated Case Study",
  });
  return { assuranceTestId, findingId };
}

export async function setFindingTreatment(input: { findingId: string; treatmentChoice: "Remediation" | "Risk acceptance" }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const status = findingStatusForTreatment(input.treatmentChoice);
  await db.update(grcFindings).set({ treatmentChoice: input.treatmentChoice, status }).where(eq(grcFindings.findingId, input.findingId));
  const [link] = await db.select().from(githubRemediationLinks).where(eq(githubRemediationLinks.findingId, input.findingId)).limit(1);
  if (input.treatmentChoice === "Remediation" && link) await db.update(githubRemediationLinks).set({ syncStatus: "Ready to create", lastError: null }).where(eq(githubRemediationLinks.linkId, link.linkId));
  return { success: true as const, status };
}

export async function proposeRiskAcceptance(input: { findingId: string; rationale: string; riskOwner: string; approver: string; expiresAt: Date }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [finding] = await db.select().from(grcFindings).where(eq(grcFindings.findingId, input.findingId)).limit(1);
  if (!finding) throw new Error("The remediation finding does not exist.");
  const acceptanceId = `RA-${Date.now().toString().slice(-6)}`;
  await db.insert(riskAcceptances).values({ acceptanceId, findingId: input.findingId, status: "Proposed", rationale: input.rationale, riskOwner: input.riskOwner, approver: input.approver, expiresAt: input.expiresAt, decisionAt: null, provenance: "Simulated Case Study" });
  await db.update(grcFindings).set({ treatmentChoice: "Risk acceptance", status: "Open" }).where(eq(grcFindings.findingId, input.findingId));
  return { acceptanceId, status: "Proposed" as const };
}

export async function decideRiskAcceptance(input: { acceptanceId: string; decision: "Approved" | "Rejected"; approver: string }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [acceptance] = await db.select().from(riskAcceptances).where(eq(riskAcceptances.acceptanceId, input.acceptanceId)).limit(1);
  if (!acceptance) throw new Error("The risk acceptance does not exist.");
  await db.update(riskAcceptances).set({ status: input.decision, approver: input.approver, decisionAt: new Date() }).where(eq(riskAcceptances.acceptanceId, input.acceptanceId));
  await db.update(grcFindings).set({ status: findingStatusForRiskDecision(input.decision), treatmentChoice: input.decision === "Approved" ? "Risk acceptance" : "Remediation" }).where(eq(grcFindings.findingId, acceptance.findingId));
  return { success: true as const, findingId: acceptance.findingId, status: input.decision };
}

export async function markReadyForGithubIssue(findingId: string) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [[link], [finding]] = await Promise.all([
    db.select().from(githubRemediationLinks).where(eq(githubRemediationLinks.findingId, findingId)).limit(1),
    db.select().from(grcFindings).where(eq(grcFindings.findingId, findingId)).limit(1),
  ]);
  if (!link) throw new Error("No remediation link exists for this finding.");
  if (!finding) throw new Error("The remediation finding does not exist.");
  const result = await createExternalRemediation(link.provider as RemediationProvider, {
    findingId: finding.findingId,
    controlId: finding.controlId,
    title: finding.title,
    severity: finding.severity,
    owner: finding.owner,
    dueDate: finding.dueDate,
    description: finding.description,
  });
  if (result.mode === "offline") {
    await db.update(githubRemediationLinks).set({ repository: result.repository, syncStatus: "Ready to create", lastError: result.message }).where(eq(githubRemediationLinks.linkId, link.linkId));
    return { success: true as const, integrationConfigured: false };
  }
  await db.update(githubRemediationLinks).set({ repository: result.repository, issueNumber: result.issueNumber, issueUrl: result.issueUrl, syncStatus: result.state === "closed" ? "Synced closed" : "Synced open", lastSyncedAt: new Date(), lastError: null }).where(eq(githubRemediationLinks.linkId, link.linkId));
  await db.update(grcFindings).set({ status: result.state === "closed" ? "Pending retest" : "In remediation" }).where(eq(grcFindings.findingId, findingId));
  return { success: true as const, integrationConfigured: true };
}

export async function syncRemediationStatus(findingId: string) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [link] = await db.select().from(githubRemediationLinks).where(eq(githubRemediationLinks.findingId, findingId)).limit(1);
  if (!link) throw new Error("No remediation link exists for this finding.");
  if (!link.issueNumber) {
    await db.update(githubRemediationLinks).set({ lastError: "No external issue exists yet. Create the GitHub issue after configuring a repository and server-side token." }).where(eq(githubRemediationLinks.linkId, link.linkId));
    return { success: true as const, integrationConfigured: false, synchronized: false };
  }
  const result = await refreshExternalRemediation(link.provider as RemediationProvider, link.issueNumber);
  if (result.mode === "offline") {
    await db.update(githubRemediationLinks).set({ lastError: result.message }).where(eq(githubRemediationLinks.linkId, link.linkId));
    return { success: true as const, integrationConfigured: false, synchronized: false };
  }
  await db.update(githubRemediationLinks).set({ repository: result.repository, issueUrl: result.issueUrl, syncStatus: result.state === "closed" ? "Synced closed" : "Synced open", lastSyncedAt: new Date(), lastError: null }).where(eq(githubRemediationLinks.linkId, link.linkId));
  await db.update(grcFindings).set({ status: findingStatusForExternalState(result.state) }).where(eq(grcFindings.findingId, findingId));
  return { success: true as const, integrationConfigured: true, synchronized: true, state: result.state };
}

export async function getRemediationExportPayload(findingId: string) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [[finding], [link], acceptanceRows] = await Promise.all([
    db.select().from(grcFindings).where(eq(grcFindings.findingId, findingId)).limit(1),
    db.select().from(githubRemediationLinks).where(eq(githubRemediationLinks.findingId, findingId)).limit(1),
    db.select().from(riskAcceptances).where(eq(riskAcceptances.findingId, findingId)),
  ]);
  if (!finding) throw new Error("The remediation finding does not exist.");
  return {
    schemaVersion: "1.0",
    type: "control-assurance-remediation-export",
    generatedAt: new Date().toISOString(),
    provenance: "Simulated Case Study" as const,
    finding,
    remediationLink: link ?? null,
    riskAcceptances: acceptanceRows,
  };
}

export async function importRemediationSnapshot(input: { findingId: string; provider: RemediationProvider; externalIssueNumber: number; externalIssueUrl: string; externalState: "open" | "closed"; observedAt: Date; provenance: "Simulated Case Study" }) {
  const db = await readyDb();
  if (!db) throw new Error("The control-assurance datastore is unavailable.");
  const [link] = await db.select().from(githubRemediationLinks).where(eq(githubRemediationLinks.findingId, input.findingId)).limit(1);
  if (!link) throw new Error("No remediation link exists for this finding.");
  await db.update(githubRemediationLinks).set({ provider: input.provider, issueNumber: input.externalIssueNumber, issueUrl: input.externalIssueUrl, syncStatus: input.externalState === "closed" ? "Synced closed" : "Synced open", lastSyncedAt: input.observedAt, lastError: null }).where(eq(githubRemediationLinks.linkId, link.linkId));
  await db.update(grcFindings).set({ status: findingStatusForExternalState(input.externalState) }).where(eq(grcFindings.findingId, input.findingId));
  return { success: true as const, status: findingStatusForExternalState(input.externalState) };
}
