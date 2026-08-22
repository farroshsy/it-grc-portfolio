import { and, eq } from "drizzle-orm";
import {
  auditRequests,
  artifactRows,
  artifacts,
  caseStudies,
  caseStudyFrameworks,
  caseStudySections,
  controlTests,
  controls,
  jobMappings,
  policyRecords,
  remediationActions,
  risks,
  sources,
  type artifactTypeValues,
  type frameworkValues,
  type provenanceValues,
} from "../drizzle/schema";
import { getDb } from "./db";

type Provenance = (typeof provenanceValues)[number];
type Framework = (typeof frameworkValues)[number];
type ArtifactType = (typeof artifactTypeValues)[number];

type SeedArtifact = {
  type: ArtifactType;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
};

type SeedCaseStudy = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  scenario: string;
  provenance: Provenance;
  accent: string;
  frameworks: Framework[];
  sections: Array<{ sectionTitle: string; body: string }>;
  artifacts: SeedArtifact[];
  risks: Array<{
    riskId: string;
    title: string;
    category: string;
    businessUnit: string;
    likelihood: number;
    impact: number;
    inherentRisk: number;
    residualRisk: number;
    owner: string;
    status: string;
    dueDate?: string;
  }>;
  controls: Array<{
    controlId: string;
    title: string;
    domain: string;
    owner: string;
    status: string;
    effectiveness: number;
  }>;
  tests: Array<{ testId: string; controlId: string; result: string; severity: string }>;
  remediation: Array<{
    actionId: string;
    title: string;
    linkedRiskId: string;
    owner: string;
    status: string;
    severity: string;
    dueDate: string;
  }>;
  sources: Array<{ authority: string; publication: string; versionDate: string; url: string; note: string }>;
  codeLanguage?: string;
  code?: string;
};

const sections = (items: Array<[string, string]>) =>
  items.map(([sectionTitle, body]) => ({ sectionTitle, body }));

function createArtifactSet(prefix: string, provenance: Provenance, focus: string): SeedArtifact[] {
  const artifactSet: SeedArtifact[] = [
    {
      type: "Risk Register",
      title: `${focus} Risk Register`,
      description: "Illustrative risk records connecting a business event to an accountable owner, assessed exposure, and treatment decision.",
      columns: ["Risk ID", "Risk statement", "Likelihood", "Impact", "Residual risk", "Owner", "Status"],
      rows: [
        { "Risk ID": `${prefix}-R01`, "Risk statement": "Unapproved privileged access could affect a regulated production workflow.", Likelihood: 3, Impact: 5, "Residual risk": 10, Owner: "Security Engineering", Status: "Treatment in progress" },
        { "Risk ID": `${prefix}-R02`, "Risk statement": "Incomplete event records could impede investigation and supervisory reporting.", Likelihood: 3, Impact: 4, "Residual risk": 8, Owner: "Platform Engineering", Status: "Monitored" },
      ],
    },
    {
      type: "Control Matrix",
      title: `${focus} Control Matrix`,
      description: "Operational control design with accountable ownership, evidence expectations, and an implementation assessment.",
      columns: ["Control ID", "Control", "Owner", "Evidence", "Status", "Effectiveness"],
      rows: [
        { "Control ID": `${prefix}-C01`, Control: "Privileged access requires approved, time-bound elevation.", Owner: "Security Engineering", Evidence: "Access review export and approval record", Status: "Partially implemented", Effectiveness: 72 },
        { "Control ID": `${prefix}-C02`, Control: "Security events are centrally retained and reviewed.", Owner: "Platform Engineering", Evidence: "Logging configuration and review record", Status: "Implemented", Effectiveness: 88 },
      ],
    },
    {
      type: "Gap Analysis",
      title: `${focus} Gap Analysis`,
      description: "Observed design or operating gaps, stated as scoped simulated findings rather than certification conclusions.",
      columns: ["Gap ID", "Observation", "Risk", "Priority", "Owner", "Target state"],
      rows: [
        { "Gap ID": `${prefix}-G01`, Observation: "Emergency access approvals are not consistently retained in one evidence location.", Risk: "Reduced accountability for privileged activity", Priority: "High", Owner: "Security Engineering", "Target state": "Centralized approval trail" },
        { "Gap ID": `${prefix}-G02`, Observation: "Review cadence for selected alerts is not formally defined.", Risk: "Delayed identification of adverse events", Priority: "Medium", Owner: "Platform Engineering", "Target state": "Documented review cadence" },
      ],
    },
    {
      type: "Regulatory Mapping",
      title: `${focus} Requirement-to-Control Mapping`,
      description: "A paraphrased operational mapping from a regulatory or framework theme to risk, control, evidence, and test method.",
      columns: ["Requirement theme", "Risk", "Control", "Evidence", "Test method", "Status"],
      rows: [
        { "Requirement theme": "Information-system security and reliability", Risk: "Service disruption or compromise", Control: "Secure configuration baseline", Evidence: "Configuration export", "Test method": "Inspect configuration and sample change approvals", Status: "Partially implemented" },
        { "Requirement theme": "Technology-risk governance", Risk: "Unmanaged control exceptions", Control: "Risk acceptance workflow", Evidence: "Risk register entry", "Test method": "Trace sample exception to approval and expiry", Status: "Implemented" },
      ],
    },
    {
      type: "Control Testing",
      title: `${focus} Control-Testing Results`,
      description: "Synthetic testing outcomes that show the test logic, observed evidence, exception classification, and retest expectation.",
      columns: ["Test ID", "Control ID", "Population", "Result", "Exception", "Severity"],
      rows: [
        { "Test ID": `${prefix}-T01`, "Control ID": `${prefix}-C01`, Population: "Quarterly access reviews", Result: "Exception", Exception: "Two elevation approvals lacked a retained ticket link", Severity: "High" },
        { "Test ID": `${prefix}-T02`, "Control ID": `${prefix}-C02`, Population: "Production logging sources", Result: "Effective", Exception: "None observed in selected sample", Severity: "Low" },
      ],
    },
    {
      type: "Remediation Plan",
      title: `${focus} Remediation Plan`,
      description: "Accountable remediation actions designed to improve the simulated control environment and lower residual exposure.",
      columns: ["Action ID", "Action", "Linked risk", "Owner", "Due date", "Status"],
      rows: [
        { "Action ID": `${prefix}-A01`, Action: "Enforce ticket linkage before privileged-access elevation closes.", "Linked risk": `${prefix}-R01`, Owner: "Security Engineering", "Due date": "2026-09-30", Status: "In progress" },
        { "Action ID": `${prefix}-A02`, Action: "Document alert-review ownership and evidence cadence.", "Linked risk": `${prefix}-R02`, Owner: "Platform Engineering", "Due date": "2026-10-15", Status: "Planned" },
      ],
    },
  ];
  return artifactSet.map((artifact) => ({ ...artifact, description: `${artifact.description} Provenance: ${provenance}.` }));
}

const globalSources = {
  iso: {
    authority: "ISO",
    publication: "ISO/IEC 27001:2022, Information security management systems — Requirements",
    versionDate: "2022",
    url: "https://www.iso.org/obp/ui/#iso:std:iso-iec:27001:ed-3:v1:en",
    note: "Used for ISMS and control-assessment methodology; restricted standard text is not reproduced.",
  },
  pci: {
    authority: "PCI Security Standards Council",
    publication: "PCI Data Security Standard",
    versionDate: "v4.0.1, June 2024",
    url: "https://www.pcisecuritystandards.org/standards/pci-dss/",
    note: "Used for payment-security context; restricted requirement text is not reproduced.",
  },
  bi: {
    authority: "Bank Indonesia",
    publication: "Bank Indonesia Regulation No. 22/23/PBI/2020 on Payment System",
    versionDate: "2020",
    url: "https://www.bi.go.id/en/publikasi/peraturan/Documents/PBI_222320.pdf",
    note: "Used for a simulated payment-system regulatory mapping and is not legal advice.",
  },
  ojk: {
    authority: "Otoritas Jasa Keuangan",
    publication: "OJK Regulation No. 11/POJK.03/2022 concerning Implementation of Information Technology by Commercial Banks",
    versionDate: "2022; effective 7 July 2022",
    url: "https://ojk.go.id/en/regulasi/Pages/Implementation-of-Information-Technology-by-Commercial-Banks.aspx",
    note: "Used for a simulated technology-governance translation; applicability requires qualified review.",
  },
  nist: {
    authority: "National Institute of Standards and Technology",
    publication: "The NIST Cybersecurity Framework (CSF) 2.0, NIST CSWP 29",
    versionDate: "February 2024",
    url: "https://doi.org/10.6028/NIST.CSWP.29",
    note: "Used for the continuous-governance operating model and outcome-oriented risk framing.",
  },
  cis: {
    authority: "Center for Internet Security",
    publication: "CIS Benchmarks",
    versionDate: "Version varies by technology; AWS Foundations 7.0.0 listed at research time",
    url: "https://www.cisecurity.org/cis-benchmarks",
    note: "Used for cloud configuration benchmark themes; benchmark text is not reproduced.",
  },
};

export const simulatedAuditRequests = [
  { requestId: "PBC-001", title: "Quarterly privileged-access review and sampled approval trail", domain: "Access", owner: "Security Engineering", status: "Closed" as const, dueDate: "2026-08-28", closureEvidence: "Illustrative closure: access-review export, linked elevation approvals, and reviewer sign-off stored in the simulated evidence index.", provenance: "Simulated Case Study" as const },
  { requestId: "PBC-002", title: "Production change sample with risk assessment and rollback evidence", domain: "Change", owner: "Platform Engineering", status: "In review" as const, dueDate: "2026-09-08", closureEvidence: "Illustrative closure criteria: approved change record, implementation log, validation output, and rollback decision where applicable.", provenance: "Simulated Case Study" as const },
  { requestId: "PBC-003", title: "Security-alert review attestation and exception follow-up", domain: "Incident", owner: "Platform Engineering", status: "Requested" as const, dueDate: "2026-09-15", closureEvidence: "Illustrative closure criteria: named reviewer, review cadence evidence, exception record, and remediation linkage.", provenance: "Simulated Case Study" as const },
  { requestId: "PBC-004", title: "Vulnerability remediation aging report and approved exceptions", domain: "Vulnerability", owner: "Cloud Security", status: "Overdue" as const, dueDate: "2026-08-21", closureEvidence: "Illustrative closure criteria: authenticated scan summary, remediation ticket sample, exception approval, and retest outcome.", provenance: "Simulated Case Study" as const },
  { requestId: "PBC-005", title: "Payment-service inventory and third-party responsibility matrix", domain: "Third Party", owner: "Vendor Management", status: "Closed" as const, dueDate: "2026-08-31", closureEvidence: "Illustrative closure: current service inventory, responsibility matrix, and reviewed third-party assurance record.", provenance: "Simulated Case Study" as const },
];

export const simulatedPolicies = [
  { policyId: "POL-ACC-01", title: "Access Management Policy", domain: "Access", owner: "Security Engineering", version: "v1.2", reviewCycle: "Annual and upon material change", status: "Current" as const, purpose: "Defines how access is requested, approved, provisioned, reviewed, elevated, and revoked within the simulated control environment.", operatingRules: ["Role-based access is approved by a named business or system owner.", "Privileged elevation is time-bound and linked to an approved work item.", "Access reviews retain reviewer, population, decision, and exception evidence."], evidenceExamples: ["Access-review export", "Elevation approval", "Leaver deprovisioning record"], provenance: "Simulated Case Study" as const },
  { policyId: "POL-CHG-01", title: "Technology Change Management Procedure", domain: "Change", owner: "Platform Engineering", version: "v1.1", reviewCycle: "Annual and upon material change", status: "Current" as const, purpose: "Defines risk-aware planning, approval, testing, implementation, and post-change evidence for production changes in the simulated environment.", operatingRules: ["Changes record risk, approver, implementation plan, and rollback approach before release.", "Emergency changes receive retrospective review within the defined operating window.", "Material control-impacting changes update linked evidence or risk records."], evidenceExamples: ["Approved change ticket", "Test evidence", "Post-implementation review"], provenance: "Simulated Case Study" as const },
  { policyId: "POL-INC-01", title: "Incident Management Policy", domain: "Incident", owner: "Security Operations", version: "v1.3", reviewCycle: "Annual and after material incident lessons", status: "Current" as const, purpose: "Defines preparation, detection, response, recovery, communication, and lessons-learned expectations for the simulated security incident process.", operatingRules: ["Security events are triaged against defined severity and escalation criteria.", "Material incidents retain decision, communication, containment, and recovery records.", "Lessons learned are tracked to an owner and evaluated for control improvement."], evidenceExamples: ["Incident timeline", "Escalation decision", "Lessons-learned tracker"], provenance: "Simulated Case Study" as const },
  { policyId: "POL-VUL-01", title: "Vulnerability Management Standard", domain: "Vulnerability", owner: "Cloud Security", version: "v1.0", reviewCycle: "Annual and upon material technology change", status: "Review due" as const, purpose: "Defines asset coverage, risk-based triage, remediation, exception approval, and retest expectations for simulated vulnerability-management operations.", operatingRules: ["Authorized scans cover the defined in-scope asset inventory.", "Severity, exploitability, exposure, and business context inform remediation priority.", "Exceptions expire, name an approver, and require compensating-control rationale."], evidenceExamples: ["Scan coverage report", "Remediation ticket", "Exception approval and retest"], provenance: "Simulated Case Study" as const },
];

const cloudCheckCode = `#!/usr/bin/env python3
"""Illustrative AWS configuration checks aligned to CIS benchmark themes.

Run only in an AWS account where you are authorized to use the supplied credentials.
Install dependency: python3 -m pip install boto3
"""

from __future__ import annotations
import json
import sys
from dataclasses import asdict, dataclass
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

@dataclass
class CheckResult:
    check: str
    status: str
    observed: str
    remediation_hint: str

def check_root_mfa(iam) -> CheckResult:
    enabled = iam.get_account_summary()["SummaryMap"].get("AccountMFAEnabled", 0) == 1
    return CheckResult("Root account MFA", "PASS" if enabled else "FAIL", "Root MFA is enabled" if enabled else "Root MFA is not enabled", "Enable MFA for the account root user.")

def check_cloudtrail_multi_region(cloudtrail) -> CheckResult:
    trails = cloudtrail.describe_trails(includeShadowTrails=False).get("trailList", [])
    enabled = any(trail.get("IsMultiRegionTrail") for trail in trails)
    return CheckResult("Multi-region audit logging", "PASS" if enabled else "FAIL", "A multi-region trail exists" if enabled else "No multi-region trail was found", "Create or update a multi-region audit trail and validate delivery.")

def check_s3_public_access(s3) -> CheckResult:
    findings = []
    for bucket in s3.list_buckets().get("Buckets", []):
        name = bucket["Name"]
        try:
            config = s3.get_public_access_block(Bucket=name)["PublicAccessBlockConfiguration"]
            if not all(config.get(key, False) for key in ["BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets"]):
                findings.append(name)
        except ClientError as error:
            findings.append(f"{name} ({error.response['Error']['Code']})")
    return CheckResult("S3 public-access safeguards", "PASS" if not findings else "FAIL", "All discovered buckets have the evaluated safeguards" if not findings else ", ".join(findings), "Apply account and bucket-level safeguards; document approved exceptions.")

def main() -> int:
    try:
        session = boto3.Session()
        results = [check_root_mfa(session.client("iam")), check_cloudtrail_multi_region(session.client("cloudtrail")), check_s3_public_access(session.client("s3"))]
    except NoCredentialsError:
        print("AWS credentials were not found.", file=sys.stderr)
        return 2
    except ClientError as error:
        print(f"AWS API error: {error}", file=sys.stderr)
        return 3
    print(json.dumps([asdict(result) for result in results], indent=2))
    return 1 if any(result.status == "FAIL" for result in results) else 0

if __name__ == "__main__":
    raise SystemExit(main())`;

const isoTechnicalEvidenceCode = `type EvidenceManifest = {
  accessReview: { mfaRequired: boolean; dormantPrivilegedAccounts: number; reviewApprovedAt?: string };
  deployment: { protectedBranch: boolean; approvals: number; ciPassed: boolean; changeId?: string };
  auditLogging: { centralArchive: boolean; immutableRetentionDays: number; reviewedAt?: string };
};
type Check = { control: string; status: "PASS" | "FAIL"; reason: string; evidence: string[] };

export function evaluateIsoTechnicalEvidence(manifest: EvidenceManifest): Check[] {
  return [
    { control: "Access governance", status: manifest.accessReview.mfaRequired && manifest.accessReview.dormantPrivilegedAccounts === 0 && Boolean(manifest.accessReview.reviewApprovedAt) ? "PASS" : "FAIL", reason: "Privileged access should be MFA-protected, reviewed, and free of dormant accounts.", evidence: ["MFA setting", "review approval timestamp", "privileged-account exception count"] },
    { control: "Change integrity", status: manifest.deployment.protectedBranch && manifest.deployment.approvals >= 1 && manifest.deployment.ciPassed && Boolean(manifest.deployment.changeId) ? "PASS" : "FAIL", reason: "Production changes should retain an approved, test-passing change trail.", evidence: ["branch-protection setting", "approval count", "CI result", "change identifier"] },
    { control: "Audit-log availability", status: manifest.auditLogging.centralArchive && manifest.auditLogging.immutableRetentionDays >= 365 && Boolean(manifest.auditLogging.reviewedAt) ? "PASS" : "FAIL", reason: "Security logging should be centralized, retained, and periodically reviewed.", evidence: ["log-archive configuration", "retention period", "review timestamp"] },
  ];
}
// Illustrative input only — run with authorized real configuration exports.
console.table(evaluateIsoTechnicalEvidence({
  accessReview: { mfaRequired: true, dormantPrivilegedAccounts: 0, reviewApprovedAt: "2026-08-18" },
  deployment: { protectedBranch: true, approvals: 1, ciPassed: true, changeId: "CHG-2041" },
  auditLogging: { centralArchive: true, immutableRetentionDays: 365, reviewedAt: "2026-08-19" },
}));`;

const seedCases: SeedCaseStudy[] = [
  {
    slug: "fintech-risk-assessment",
    title: "Fintech Risk Assessment",
    shortTitle: "Risk Assessment",
    summary: "A simulated regional payment platform assessment that traces business processes, technology risks, controls, evidence, and accountable remediation into one decision-ready view.",
    scenario: "Simulated Case Study: a regional payment company processes merchant payments through cloud-hosted APIs, a reconciliation service, and internal operations tooling.",
    provenance: "Simulated Case Study",
    accent: "#3a6a73",
    frameworks: ["PCI DSS", "NIST", "Cloud"],
    sections: sections([
      ["Context", "Simulated Case Study: a regional payment platform operates merchant APIs, transaction processing, reconciliation, and support tooling across cloud services. This assessment models how an IT GRC analyst would structure an initial review without claiming a real client engagement."],
      ["Scope", "The illustrative scope includes production access, transaction-event logging, cloud configuration, vulnerability management, backup recovery, and key third-party dependencies. The case excludes real cardholder data, personal data, and proprietary systems."],
      ["Methodology", "The method starts with process and asset scoping, then connects requirement themes to risk scenarios, controls, owners, expected evidence, design testing, operating testing, and remediation. Risk scores are calculated from likelihood and impact on a five-point scale."],
      ["Findings", "The simulated review identified fragmented retention of emergency-access approvals and an incomplete documented cadence for selected security-alert reviews. Both observations are presented as illustrative control opportunities, not audit findings."],
      ["Risk", "Weak evidence retention can impair accountability during an incident or examination. An undocumented review cadence can delay detection of relevant activity and make control operation difficult to demonstrate."],
      ["Controls", "The target control set requires time-bound elevation with retained approval references, centralized event logging, named reviewers, and traceable exception handling. Control ownership sits with Security Engineering and Platform Engineering."],
      ["Evidence", "Illustrative evidence includes access-review exports, approved ticket references, logging configuration exports, alert-review records, and a versioned risk register. All evidence examples are synthetic and no real organization data is represented."],
      ["Remediation", "The remediation plan centralizes the emergency-access approval trail and introduces a documented alert-review standard with ownership, frequency, evidence location, and a follow-up operating-effectiveness test."],
      ["Outcome", "The intended outcome is a measurable decline in residual risk and a repeatable evidence path that management, engineering, and an assessor can follow from requirement through to control operation."],
      ["Artifacts", "Use the interactive evidence workspace below to inspect the simulated risk register, control matrix, gap analysis, regulatory mapping, control-testing results, and remediation plan."],
    ]),
    artifacts: createArtifactSet("FRA", "Simulated Case Study", "Fintech Risk Assessment"),
    risks: [
      { riskId: "FRA-R01", title: "Privileged access may be elevated without a retained approval reference.", category: "Access", businessUnit: "Engineering", likelihood: 4, impact: 5, inherentRisk: 20, residualRisk: 10, owner: "Security Engineering", status: "Treatment in progress", dueDate: "2026-09-30" },
      { riskId: "FRA-R02", title: "Alert reviews may not be evidenced consistently across production services.", category: "Monitoring", businessUnit: "Platform", likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 8, owner: "Platform Engineering", status: "Monitored", dueDate: "2026-10-15" },
    ],
    controls: [
      { controlId: "FRA-C01", title: "Time-bound privileged access with ticketed approval", domain: "Identity", owner: "Security Engineering", status: "Partially implemented", effectiveness: 72 },
      { controlId: "FRA-C02", title: "Centralized security-event review and retained attestation", domain: "Monitoring", owner: "Platform Engineering", status: "Implemented", effectiveness: 88 },
    ],
    tests: [
      { testId: "FRA-T01", controlId: "FRA-C01", result: "Exception", severity: "High" },
      { testId: "FRA-T02", controlId: "FRA-C02", result: "Effective", severity: "Low" },
    ],
    remediation: [
      { actionId: "FRA-A01", title: "Require ticket linkage before elevated access can be closed.", linkedRiskId: "FRA-R01", owner: "Security Engineering", status: "In progress", severity: "High", dueDate: "2026-09-30" },
      { actionId: "FRA-A02", title: "Publish alert-review cadence with central evidence storage.", linkedRiskId: "FRA-R02", owner: "Platform Engineering", status: "Planned", severity: "Medium", dueDate: "2026-10-15" },
    ],
    sources: [globalSources.pci, globalSources.nist, globalSources.cis, {
      authority: "PCI Security Standards Council",
      publication: "PCI DSS Scoping and Segmentation Guidance for Modern Network Architectures",
      versionDate: "Information supplement announced 9 September 2024",
      url: "https://blog.pcisecuritystandards.org/new-information-supplement-pci-dss-scoping-and-segmentation-guidance-for-modern-network-architectures",
      note: "Used for the simulated data-flow and scope-boundary reasoning; supplemental guidance does not replace a PCI standard.",
    }],
  },
  {
    slug: "iso-27001-control-assessment",
    title: "ISO 27001 Control Assessment",
    shortTitle: "ISO 27001 Assessment",
    summary: "An independent-research assessment model that turns ISMS objectives into testable access, deployment, and logging controls with evidence requests, tests, gaps, and risk-based priorities.",
    scenario: "Independent Research: an illustrative SaaS provider is preparing an internal readiness review for an ISO/IEC 27001:2022-aligned information security management system.",
    provenance: "Independent Research",
    accent: "#3d5a97",
    frameworks: ["ISO 27001", "NIST", "Cloud"],
    sections: sections([
      ["Context", "Independent Research: this case models an internal readiness assessment for a fictional cloud-hosted SaaS provider. It demonstrates operationalization of ISMS objectives and deliberately avoids reproducing copyrighted standard text."],
      ["Scope", "The scope includes the ISMS boundary, asset accountability, access controls, change management, incident response, supplier oversight, backup recovery, and cloud operations. The work is an assessment model, not a certification claim."],
      ["Methodology", "Each requirement theme is translated into a business objective, risk, control statement, control owner, evidence request, test procedure, result, finding, and remediation decision. Priorities reflect residual risk and evidence confidence."],
      ["Findings", "The assessment model shows that a formal control can exist but remain difficult to prove when evidence ownership is ambiguous. It also identifies an opportunity to standardize evidence retention for supplier due diligence."],
      ["Risk", "Controls with unclear ownership or dispersed evidence can fail during surveillance, incident investigation, or management review even when day-to-day practices are sound."],
      ["Controls", "The target state combines documented objectives with technical guardrails: MFA-backed privileged access, protected production branches with approval and CI evidence, and centralized audit logging with retained review timestamps. These are implementation examples, not reproduced ISO text."],
      ["Evidence", "Evidence is modeled as discrete, dateable, attributable records: identity-provider settings, access-review approvals, protected-branch configuration, CI results, change identifiers, log-archive settings, and periodic log-review timestamps. The case uses synthetic descriptions only and does not present an ISO certificate or auditor statement."],
      ["Remediation", "The plan assigns a control-evidence steward for each high-value control, creates a retention location, and requires a post-remediation retest against the original test procedure."],
      ["Outcome", "The intended outcome is a defensible control narrative that can be traced from information-security objective to evidence, test result, and management decision."],
      ["Artifacts", "The interactive tabs and runnable TypeScript evidence-manifest evaluator make the requirement-to-control-to-evidence chain inspectable. Results are technical evidence cues for analyst review, not an automated certification determination."],
    ]),
    artifacts: createArtifactSet("ISO", "Independent Research", "ISO 27001 Control Assessment"),
    risks: [
      { riskId: "ISO-R01", title: "Unclear evidence ownership may prevent timely demonstration of operating controls.", category: "Governance", businessUnit: "Security", likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 6, owner: "GRC", status: "Treatment approved", dueDate: "2026-10-01" },
      { riskId: "ISO-R02", title: "Supplier assurance evidence may not be reviewed at a defined cadence.", category: "Third Party", businessUnit: "Procurement", likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 9, owner: "Vendor Management", status: "Open", dueDate: "2026-08-15" },
    ],
    controls: [
      { controlId: "ISO-C01", title: "Named evidence steward for each key security control", domain: "Governance", owner: "GRC", status: "Implemented", effectiveness: 90 },
      { controlId: "ISO-C02", title: "Periodic supplier security assurance review", domain: "Third Party", owner: "Vendor Management", status: "Partially implemented", effectiveness: 64 },
    ],
    tests: [
      { testId: "ISO-T01", controlId: "ISO-C01", result: "Effective", severity: "Low" },
      { testId: "ISO-T02", controlId: "ISO-C02", result: "Exception", severity: "Medium" },
    ],
    remediation: [
      { actionId: "ISO-A01", title: "Create a supplier-review calendar and central evidence index.", linkedRiskId: "ISO-R02", owner: "Vendor Management", status: "Overdue", severity: "Medium", dueDate: "2026-08-15" },
      { actionId: "ISO-A02", title: "Retest selected supplier files against the documented cadence.", linkedRiskId: "ISO-R02", owner: "GRC", status: "Planned", severity: "Medium", dueDate: "2026-09-15" },
    ],
    sources: [globalSources.iso, globalSources.nist],
    codeLanguage: "typescript",
    code: isoTechnicalEvidenceCode,
  },
  {
    slug: "indonesia-regulatory-mapping",
    title: "Indonesia Regulatory Mapping — BI & OJK",
    shortTitle: "BI & OJK Mapping",
    summary: "A simulated, non-legal translation workflow from Indonesian payment-system and IT governance source themes to controls, evidence, ownership, testing, and remediation.",
    scenario: "Simulated Case Study: a non-bank payment service provider is assessing whether its technology governance and information-system capabilities can be evidenced for a regulator-facing readiness discussion.",
    provenance: "Simulated Case Study",
    accent: "#8a5a2a",
    frameworks: ["BI/OJK", "NIST", "Cloud"],
    sections: sections([
      ["Context", "Simulated Case Study: a fictional Indonesian payment-service provider is expanding its platform. This work demonstrates a translation method from public regulatory material to practical technology-control questions. It is not legal advice and does not determine licensing applicability."],
      ["Scope", "The illustrative mapping covers governance, risk management, information-system security and reliability, supporting providers, operational evidence, and examination readiness. It does not assess a real product, license category, or organization."],
      ["Methodology", "The methodology first tests applicability assumptions, then paraphrases source themes, identifies affected systems and processes, articulates risks, defines controls, assigns owners, specifies evidence, designs tests, and tracks residual risk."],
      ["Findings", "The model identifies that a payment provider can have technical safeguards yet still lack a cohesive evidence narrative that connects technology decisions to governance accountability and operational risk ownership."],
      ["Risk", "If regulatory themes are not translated into concrete control objectives, engineering teams may implement safeguards inconsistently and management may be unable to explain how obligations are governed across product changes and third parties."],
      ["Controls", "The proposed control set includes an approval-based technology change process, a regulated-service asset inventory, a control-evidence catalog, vendor responsibility mapping, and risk acceptance with defined expiry."],
      ["Evidence", "Illustrative evidence includes service inventories, architecture decisions, approved changes, risk-register records, access reviews, vendor due-diligence files, and control-test workpapers. All listed evidence is synthetic."],
      ["Remediation", "The roadmap establishes a regulatory obligation register, links it to the control library, assigns owners by service and market, and adds a periodic impact review when systems or regulatory sources change."],
      ["Outcome", "The desired outcome is a repeatable regulation-to-control chain that is understandable to engineering, legal, security, management, and an examiner without overclaiming regulatory expertise."],
      ["Artifacts", "The artifact workspace provides a simulated regulatory mapping alongside corresponding risks, controls, tests, gaps, and remediation actions."],
    ]),
    artifacts: createArtifactSet("BIO", "Simulated Case Study", "BI & OJK Regulatory Mapping"),
    risks: [
      { riskId: "BIO-R01", title: "Regulatory source themes may not be translated into owned technical controls.", category: "Compliance", businessUnit: "GRC", likelihood: 4, impact: 5, inherentRisk: 20, residualRisk: 12, owner: "GRC", status: "Treatment in progress", dueDate: "2026-09-20" },
      { riskId: "BIO-R02", title: "Supporting-provider responsibilities may not be traceable to evidence obligations.", category: "Third Party", businessUnit: "Legal", likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 8, owner: "Vendor Management", status: "Monitored", dueDate: "2026-10-31" },
    ],
    controls: [
      { controlId: "BIO-C01", title: "Regulatory obligation register linked to control owner and evidence", domain: "Compliance", owner: "GRC", status: "Partially implemented", effectiveness: 70 },
      { controlId: "BIO-C02", title: "Supporting-provider responsibility and assurance record", domain: "Third Party", owner: "Vendor Management", status: "Implemented", effectiveness: 82 },
    ],
    tests: [
      { testId: "BIO-T01", controlId: "BIO-C01", result: "Exception", severity: "High" },
      { testId: "BIO-T02", controlId: "BIO-C02", result: "Effective", severity: "Low" },
    ],
    remediation: [
      { actionId: "BIO-A01", title: "Publish owner and evidence attributes for each regulatory mapping record.", linkedRiskId: "BIO-R01", owner: "GRC", status: "In progress", severity: "High", dueDate: "2026-09-20" },
      { actionId: "BIO-A02", title: "Add regulatory impact review to product-change initiation.", linkedRiskId: "BIO-R01", owner: "Product Operations", status: "Planned", severity: "High", dueDate: "2026-10-20" },
    ],
    sources: [globalSources.bi, globalSources.ojk, globalSources.nist],
  },
  {
    slug: "cloud-control-automation",
    title: "Cloud Control Automation",
    shortTitle: "Automation Mini-Project",
    summary: "A compact, runnable Python control-checking pattern that queries authorized AWS configuration data and returns machine-readable evidence for review.",
    scenario: "Independent Research: a local script is designed for an authorized AWS account and demonstrates how repeatable configuration checks can support continuous governance without replacing human review.",
    provenance: "Independent Research",
    accent: "#6d4c7f",
    frameworks: ["Cloud", "NIST"],
    sections: sections([
      ["Context", "Independent Research: this mini-project demonstrates how configuration evidence can be collected consistently from a cloud environment using an authorized, read-oriented API workflow."],
      ["Scope", "The script checks root-user MFA, multi-region audit logging, and bucket public-access safeguards. It is intentionally narrow and should be adapted to an organization’s account structure, exception process, and benchmark version."],
      ["Methodology", "The script connects through the AWS SDK, queries account configuration, produces structured JSON results, returns a non-zero status when a simulated control check fails, and preserves a human-readable remediation hint."],
      ["Findings", "Automation can make control evidence more repeatable, but it does not determine regulatory applicability, approve risk acceptance, validate compensating controls, or replace review of business context."],
      ["Risk", "Manual evidence collection can become inconsistent at scale, while unchecked automation can create false confidence if identities, permissions, exceptions, and scope are not governed."],
      ["Controls", "The operating model pairs automated collection with ownership, scheduled review, exception records, versioned logic, and human assessment of material findings."],
      ["Evidence", "The output is a JSON array of check results. It should be stored with run context, script version, authorization provenance, and a review record. The code shown is runnable but is not executed by this portfolio site."],
      ["Remediation", "A failed check should open a tracked remediation or formally approved exception. The pipeline should not silently suppress a failed control result."],
      ["Outcome", "The intended outcome is faster, reproducible collection of configuration evidence and a clear handoff from technical signal to GRC assessment."],
      ["Artifacts", "The code panel presents the runnable research script. The shared artifact patterns remain labeled and are not presented as production evidence."],
    ]),
    artifacts: createArtifactSet("AUT", "Independent Research", "Cloud Control Automation"),
    risks: [
      { riskId: "AUT-R01", title: "Cloud configuration evidence may be collected inconsistently without repeatable checks.", category: "Cloud", businessUnit: "Platform", likelihood: 3, impact: 3, inherentRisk: 9, residualRisk: 4, owner: "Cloud Security", status: "Monitored", dueDate: "2026-10-31" },
    ],
    controls: [
      { controlId: "AUT-C01", title: "Versioned cloud-control check with reviewed output", domain: "Cloud", owner: "Cloud Security", status: "Implemented", effectiveness: 86 },
    ],
    tests: [{ testId: "AUT-T01", controlId: "AUT-C01", result: "Effective", severity: "Low" }],
    remediation: [{ actionId: "AUT-A01", title: "Define exception workflow for failed automated configuration checks.", linkedRiskId: "AUT-R01", owner: "Cloud Security", status: "Planned", severity: "Low", dueDate: "2026-10-31" }],
    sources: [globalSources.cis, globalSources.nist],
    codeLanguage: "python",
    code: cloudCheckCode,
  },
];

let seeding: Promise<void> | null = null;

export async function ensurePortfolioSeeded(): Promise<void> {
  if (seeding) return seeding;
  seeding = seedPortfolio().finally(() => {
    seeding = null;
  });
  return seeding;
}

async function seedPortfolio(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: caseStudies.id }).from(caseStudies).limit(1);
  if (existing.length > 0) {
    await seedSupplementaryEvidence(db);
    return;
  }

  for (const study of seedCases) {
    await db.insert(caseStudies).values({
      slug: study.slug,
      title: study.title,
      shortTitle: study.shortTitle,
      summary: study.summary,
      scenario: study.scenario,
      provenance: study.provenance,
      accent: study.accent,
      codeLanguage: study.codeLanguage,
      code: study.code,
    });
    const [storedStudy] = await db.select({ id: caseStudies.id }).from(caseStudies).where(eq(caseStudies.slug, study.slug)).limit(1);
    if (!storedStudy) throw new Error(`Unable to retrieve seeded case study: ${study.slug}`);

    await db.insert(caseStudyFrameworks).values(study.frameworks.map((framework) => ({ caseStudyId: storedStudy.id, framework })));
    await db.insert(caseStudySections).values(study.sections.map((section, index) => ({
      caseStudyId: storedStudy.id,
      ...section,
      displayOrder: index + 1,
    })));

    for (const artifact of study.artifacts) {
      await db.insert(artifacts).values({
        caseStudyId: storedStudy.id,
        type: artifact.type,
        title: artifact.title,
        description: artifact.description,
        provenance: study.provenance,
        columns: artifact.columns,
      });
      const [storedArtifact] = await db.select({ id: artifacts.id }).from(artifacts)
        .where(eq(artifacts.caseStudyId, storedStudy.id)).orderBy(artifacts.id);
      const artifactList = await db.select({ id: artifacts.id, type: artifacts.type }).from(artifacts).where(eq(artifacts.caseStudyId, storedStudy.id));
      const stored = artifactList.find((item) => item.type === artifact.type);
      if (!stored) throw new Error(`Unable to retrieve seeded artifact: ${artifact.type}`);
      await db.insert(artifactRows).values(artifact.rows.map((record, index) => ({ artifactId: stored.id, sortOrder: index + 1, record })));
      void storedArtifact;
    }

    await db.insert(risks).values(study.risks.map((risk) => ({ ...risk, caseStudyId: storedStudy.id, dueDate: risk.dueDate ? new Date(risk.dueDate) : null })));
    await db.insert(controls).values(study.controls.map((control) => ({ ...control, caseStudyId: storedStudy.id })));
    await db.insert(controlTests).values(study.tests.map((test) => ({ ...test, caseStudyId: storedStudy.id })));
    await db.insert(remediationActions).values(study.remediation.map((action) => ({ ...action, caseStudyId: storedStudy.id, dueDate: new Date(action.dueDate) })));
    await db.insert(sources).values(study.sources.map((source) => ({ ...source, caseStudyId: storedStudy.id })));
  }

  await db.insert(jobMappings).values([
    { requirement: "IT risk assessments and consolidated risk register", evidence: "Fintech Risk Assessment — risk register, risk scoring, and remediation trace", caseStudySlug: "fintech-risk-assessment", displayOrder: 1 },
    { requirement: "ISO 27001 implementation, audit readiness, and evidence", evidence: "ISO 27001 Control Assessment — control-to-evidence assessment method", caseStudySlug: "iso-27001-control-assessment", displayOrder: 2 },
    { requirement: "BI and OJK technology governance requirements", evidence: "Indonesia Regulatory Mapping — paraphrased requirement-to-control chain", caseStudySlug: "indonesia-regulatory-mapping", displayOrder: 3 },
    { requirement: "Cloud security and scalable GRC automation", evidence: "Cloud Control Automation — runnable evidence-collection pattern", caseStudySlug: "cloud-control-automation", displayOrder: 4 },
    { requirement: "Control testing, gaps, and remediation tracking", evidence: "Interactive tables in each case study with test, gap, and action records", caseStudySlug: "fintech-risk-assessment", displayOrder: 5 },
    { requirement: "Cross-functional, compliance-by-design communication", evidence: "Evidence chain showing owners, technical controls, and management-ready outcomes", caseStudySlug: "indonesia-regulatory-mapping", displayOrder: 6 },
  ]);
  await seedSupplementaryEvidence(db);
}

async function seedSupplementaryEvidence(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const [fintech] = await db.select({ id: caseStudies.id }).from(caseStudies).where(eq(caseStudies.slug, "fintech-risk-assessment")).limit(1);
  if (!fintech) return;
  const [existingAudit, existingPolicies] = await Promise.all([
    db.select({ id: auditRequests.id }).from(auditRequests).limit(1),
    db.select({ id: policyRecords.id }).from(policyRecords).limit(1),
  ]);
  if (existingAudit.length === 0) await db.insert(auditRequests).values(simulatedAuditRequests.map((request) => ({ ...request, caseStudyId: fintech.id, dueDate: new Date(request.dueDate) })));
  if (existingPolicies.length === 0) await db.insert(policyRecords).values(simulatedPolicies);
  const [iso] = await db.select({ id: caseStudies.id }).from(caseStudies).where(eq(caseStudies.slug, "iso-27001-control-assessment")).limit(1);
  if (iso) {
    await db.update(caseStudies).set({ summary: "An independent-research assessment model that turns ISMS objectives into testable access, deployment, and logging controls with evidence requests, tests, gaps, and risk-based priorities.", codeLanguage: "typescript", code: isoTechnicalEvidenceCode }).where(eq(caseStudies.id, iso.id));
    await db.update(caseStudySections).set({ body: "The target state combines documented objectives with technical guardrails: MFA-backed privileged access, protected production branches with approval and CI evidence, and centralized audit logging with retained review timestamps. These are implementation examples, not reproduced ISO text." }).where(and(eq(caseStudySections.caseStudyId, iso.id), eq(caseStudySections.sectionTitle, "Controls")));
    await db.update(caseStudySections).set({ body: "Evidence is modeled as discrete, dateable, attributable records: identity-provider settings, access-review approvals, protected-branch configuration, CI results, change identifiers, log-archive settings, and periodic log-review timestamps. The case uses synthetic descriptions only and does not present an ISO certificate or auditor statement." }).where(and(eq(caseStudySections.caseStudyId, iso.id), eq(caseStudySections.sectionTitle, "Evidence")));
    await db.update(caseStudySections).set({ body: "The interactive tabs and runnable TypeScript evidence-manifest evaluator make the requirement-to-control-to-evidence chain inspectable. Results are technical evidence cues for analyst review, not an automated certification determination." }).where(and(eq(caseStudySections.caseStudyId, iso.id), eq(caseStudySections.sectionTitle, "Artifacts")));
  }
}
