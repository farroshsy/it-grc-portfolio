import { and, eq } from "drizzle-orm";
import {
  assuranceControls,
  assuranceTests,
  evidenceSubmissions,
  flowguardControlContracts,
  flowguardControlExecutions,
  flowguardExceptions,
  githubRemediationLinks,
  grcFindings,
  grcSystems,
  riskAcceptances,
} from "../drizzle/schema";
import { getDb } from "./db";
import { buildFlowGuardGrcExport, evaluatePaymentCompletionFixture } from "./flowguardVerifier";

const provenance = "Simulated Case Study" as const;

const systems = [
  { systemId: "SYS-PAY-01", name: "Merchant Payment API", owner: "Platform Engineering", criticality: "High", dataClassification: "Restricted payment metadata", status: "In scope", provenance },
  { systemId: "SYS-ID-01", name: "Privileged Access Gateway", owner: "Security Engineering", criticality: "High", dataClassification: "Security operations data", status: "In scope", provenance },
];

const controls = [
  { controlId: "CAA-AC-01", systemId: "SYS-ID-01", title: "Privileged access requires time-bound, ticketed approval", objective: "Ensure elevated access is approved, scoped, time-bound, and traceable to a business or incident need.", owner: "Security Engineering", frequency: "Per elevation; reviewed quarterly", framework: "PCI DSS · NIST", status: "Exception" as const, provenance },
  { controlId: "CAA-CH-01", systemId: "SYS-PAY-01", title: "Production changes retain risk, approval, and rollback evidence", objective: "Ensure material production changes are risk-assessed, approved, tested, and recoverable.", owner: "Platform Engineering", frequency: "Per production change", framework: "ISO 27001 · NIST", status: "In testing" as const, provenance },
  { controlId: "CAA-MON-01", systemId: "SYS-PAY-01", title: "Security-event reviews are performed and retained", objective: "Ensure monitoring review activities are attributable, timely, and supported by retained evidence.", owner: "Security Operations", frequency: "Weekly", framework: "NIST · Cloud", status: "Effective" as const, provenance },
  { controlId: "CAA-PAY-01", systemId: "SYS-PAY-01", title: "Payment completion produces ordered settlement evidence", objective: "Ensure completed payment events retain ordered charge, settlement, and evidence records suitable for technical-control verification.", owner: "Platform Engineering", frequency: "Per payment flow", framework: "PCI DSS · BI/OJK · ISO 27001", status: "Exception" as const, provenance },
];

const submissions = [
  { submissionId: "EVD-001", controlId: "CAA-AC-01", status: "Rejected" as const, evidenceSummary: "Illustrative elevation export and emergency-access approvals. One emergency closure lacks a linked work item.", submittedBy: "Security Engineering", submittedAt: "2026-08-08", reviewedBy: "GRC Analyst", reviewNote: "Exception: retain ticket linkage for every completed elevation.", provenance },
  { submissionId: "EVD-002", controlId: "CAA-CH-01", status: "Under review" as const, evidenceSummary: "Illustrative production-change sample including risk assessment, approval, test result, and rollback plan.", submittedBy: "Platform Engineering", submittedAt: "2026-08-16", reviewedBy: "GRC Analyst", reviewNote: "Testing in progress; verify emergency-change retrospective approval.", provenance },
  { submissionId: "EVD-003", controlId: "CAA-MON-01", status: "Accepted" as const, evidenceSummary: "Illustrative weekly alert-review attestation, logging configuration extract, and selected exception record.", submittedBy: "Security Operations", submittedAt: "2026-08-14", reviewedBy: "GRC Analyst", reviewNote: "Evidence accepted for the selected review period.", provenance },
];

const tests = [
  { assuranceTestId: "TEST-001", controlId: "CAA-AC-01", submissionId: "EVD-001", testProcedure: "Inspect a judgmental sample of five privileged elevations for requester, approver, scope, expiry, and linked work item.", result: "Exception" as const, conclusion: "One illustrative emergency-elevation record did not retain a linked ticket after closure.", testedBy: "GRC Analyst", testedAt: "2026-08-18", provenance },
  { assuranceTestId: "TEST-002", controlId: "CAA-CH-01", submissionId: "EVD-002", testProcedure: "Trace selected production changes from risk assessment through approval, implementation validation, and rollback evidence.", result: "Exception" as const, conclusion: "One illustrative emergency change requires a retrospective approval record before the control can be concluded effective.", testedBy: "GRC Analyst", testedAt: "2026-08-19", provenance },
  { assuranceTestId: "TEST-003", controlId: "CAA-MON-01", submissionId: "EVD-003", testProcedure: "Inspect weekly review attestation, reviewer identity, event population, and linked exception handling.", result: "Effective" as const, conclusion: "Selected simulated evidence demonstrates a retained weekly review and named reviewer.", testedBy: "GRC Analyst", testedAt: "2026-08-19", provenance },
];

const findings = [
  { findingId: "FND-001", assuranceTestId: "TEST-001", controlId: "CAA-AC-01", title: "Emergency privileged elevation lacks retained ticket linkage", description: "The simulated control test identified one closed emergency elevation without traceable linkage to a business, incident, or change work item.", severity: "High", owner: "Security Engineering", status: "Remediation planned" as const, treatmentChoice: "Remediation" as const, dueDate: "2026-09-30", provenance },
  { findingId: "FND-002", assuranceTestId: "TEST-002", controlId: "CAA-CH-01", title: "Emergency change retrospective approval is incomplete", description: "The simulated test identified an emergency production change without a retained retrospective approval within the documented timeframe.", severity: "Medium", owner: "Platform Engineering", status: "Risk accepted" as const, treatmentChoice: "Risk acceptance" as const, dueDate: "2026-09-15", provenance },
];

const acceptances = [
  { acceptanceId: "RA-001", findingId: "FND-002", status: "Approved" as const, rationale: "Simulated short-term acceptance while the emergency-change workflow is updated; compensating management review occurs weekly.", riskOwner: "Platform Engineering", approver: "Technology Risk Lead", expiresAt: "2026-09-15", decisionAt: "2026-08-20", provenance },
];

const remediationLinks = [
  { linkId: "GHL-001", findingId: "FND-001", provider: "GitHub Issues", repository: "Not configured", issueNumber: null, issueUrl: null, syncStatus: "Ready to create" as const, lastSyncedAt: null, lastError: null, provenance },
  { linkId: "GHL-002", findingId: "FND-002", provider: "GitHub Issues", repository: "Not configured", issueNumber: null, issueUrl: null, syncStatus: "Not connected" as const, lastSyncedAt: null, lastError: null, provenance },
];

const flowguardContracts = [
  { contractId: "FGC-001", controlKey: "CTRL-PAY-001", mappedControlId: "CAA-PAY-01", process: "payment-completion", contractYaml: "control: CTRL-PAY-001\nprocess: payment-completion\nassertions:\n  - order_created\n  - charge_authorized\n  - settlement_recorded\n  - evidence_retained", provenanceSource: "FlowGuard simulated payment-control template", provenance },
];

const flowguardPaymentExport = buildFlowGuardGrcExport(evaluatePaymentCompletionFixture());

const flowguardExecutions = [
  { executionId: "FGX-001", contractId: "FGC-001", controlKey: flowguardPaymentExport.controlKey, mappedControlId: "CAA-PAY-01", verdict: flowguardPaymentExport.verdict, traceId: flowguardPaymentExport.traceId, evidenceHash: flowguardPaymentExport.evidenceHash, firstFinding: flowguardPaymentExport.finding?.explanation ?? "No FlowGuard assertion finding was produced.", occurredAt: flowguardPaymentExport.runAt, provenanceSource: flowguardPaymentExport.provenance.source, biOjkEvidenceReference: "Technical evidence cross-reference only", iso27001EvidenceReference: "ISMS operating-effectiveness cross-reference only", mappingInterpretationNote: "This machine-generated trace evidence does not determine regulatory applicability or claim certification.", provenance },
];

const flowguardExceptionRecords = [
  { exceptionId: "FG-EXC-001", executionId: "FGX-001", linkedFindingId: null, title: "Payment completion trace lacks settlement confirmation", owner: "Platform Engineering", dueDate: "2026-09-12", remediation: "Add settlement-event verification and retain the resulting evidence hash for retest.", retestStatus: "Retest required", status: "Open", provenance },
];

let seeding: Promise<void> | null = null;

export async function ensureControlAssuranceSeeded() {
  if (seeding) return seeding;
  seeding = seed().finally(() => { seeding = null; });
  return seeding;
}

async function seed() {
  const db = await getDb();
  if (!db) return;
  const [systemExists] = await db.select({ id: grcSystems.id }).from(grcSystems).where(eq(grcSystems.systemId, "SYS-PAY-01")).limit(1);
  if (!systemExists) await db.insert(grcSystems).values(systems);
  for (const control of controls) {
    const [controlExists] = await db.select({ id: assuranceControls.id }).from(assuranceControls).where(eq(assuranceControls.controlId, control.controlId)).limit(1);
    if (!controlExists) await db.insert(assuranceControls).values(control);
  }
  const [submissionExists] = await db.select({ id: evidenceSubmissions.id }).from(evidenceSubmissions).where(eq(evidenceSubmissions.submissionId, "EVD-001")).limit(1);
  if (!submissionExists) await db.insert(evidenceSubmissions).values(submissions.map((item) => ({ ...item, submittedAt: new Date(item.submittedAt) })));
  const [testExists] = await db.select({ id: assuranceTests.id }).from(assuranceTests).where(eq(assuranceTests.assuranceTestId, "TEST-001")).limit(1);
  if (!testExists) await db.insert(assuranceTests).values(tests.map((item) => ({ ...item, testedAt: new Date(item.testedAt) })));
  const [findingExists] = await db.select({ id: grcFindings.id }).from(grcFindings).where(eq(grcFindings.findingId, "FND-001")).limit(1);
  if (!findingExists) await db.insert(grcFindings).values(findings.map((item) => ({ ...item, dueDate: new Date(item.dueDate) })));
  const [acceptanceExists] = await db.select({ id: riskAcceptances.id }).from(riskAcceptances).where(eq(riskAcceptances.acceptanceId, "RA-001")).limit(1);
  if (!acceptanceExists) await db.insert(riskAcceptances).values(acceptances.map((item) => ({ ...item, expiresAt: new Date(item.expiresAt), decisionAt: new Date(item.decisionAt) })));
  const [linkExists] = await db.select({ id: githubRemediationLinks.id }).from(githubRemediationLinks).where(eq(githubRemediationLinks.linkId, "GHL-001")).limit(1);
  if (!linkExists) await db.insert(githubRemediationLinks).values(remediationLinks);
  const [contractExists] = await db.select({ id: flowguardControlContracts.id }).from(flowguardControlContracts).where(eq(flowguardControlContracts.contractId, "FGC-001")).limit(1);
  if (!contractExists) await db.insert(flowguardControlContracts).values(flowguardContracts);
  const [executionExists] = await db.select({ id: flowguardControlExecutions.id }).from(flowguardControlExecutions).where(eq(flowguardControlExecutions.executionId, "FGX-001")).limit(1);
  if (!executionExists) await db.insert(flowguardControlExecutions).values(flowguardExecutions.map((item) => ({ ...item, occurredAt: new Date(item.occurredAt) })));
  const [exceptionExists] = await db.select({ id: flowguardExceptions.id }).from(flowguardExceptions).where(eq(flowguardExceptions.exceptionId, "FG-EXC-001")).limit(1);
  if (!exceptionExists) await db.insert(flowguardExceptions).values(flowguardExceptionRecords.map((item) => ({ ...item, dueDate: new Date(item.dueDate) })));
}

export const simulatedControlAssuranceScenario = { systems, controls, submissions, tests, findings, acceptances, remediationLinks, flowguardContracts, flowguardExecutions, flowguardExceptionRecords };
