import { asc, desc, eq } from "drizzle-orm";
import {
  assuranceControls,
  assuranceTests,
  evidenceSubmissions,
  githubRemediationLinks,
  grcFindings,
  grcSystems,
  riskAcceptances,
} from "../drizzle/schema";
import { getDb } from "./db";
import { ensureControlAssuranceSeeded } from "./controlAssuranceSeed";
import { controlStatusForTestDecision, effectiveRiskAcceptanceStatus, evidenceStatusForTestDecision, findingStatusForExternalState, findingStatusForRiskDecision, findingStatusForTreatment } from "../shared/controlAssuranceLifecycle";
import { createExternalRemediation, refreshExternalRemediation, type RemediationProvider } from "./remediationProvider";

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
