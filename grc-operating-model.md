# Control Assurance Hub — Operating Model

## Product Use Case

**Control Assurance Hub** closes the gap between a GRC control test and the engineering work needed to remediate a failure. Its initial scenario is a fintech platform that must demonstrate evidence-backed operation of privileged-access, change-management, monitoring, and cloud-security controls.

The workflow starts when a control owner submits evidence for a scoped system. A GRC analyst tests that evidence. A failed test produces a finding, which can be accepted as time-bound residual risk or routed to engineering as a GitHub Issue. GitHub tracks delivery; the GRC workspace tracks whether the delivered work actually resolves the control objective.

## Workflow States

| Object | States | Accountable role | Decision that advances the workflow |
|---|---|---|---|
| Evidence submission | Draft → Submitted → Under review → Accepted / Rejected | Control owner | Submit and provide sufficient evidence context |
| Control test | Planned → In testing → Effective / Exception | GRC analyst | Record test procedure and test conclusion |
| Finding | Open → Remediation planned → In remediation → Pending retest → Closed / Risk accepted | GRC analyst and risk owner | Assign treatment or approve a time-bound acceptance |
| Remediation link | Not connected → Ready to create → Synced open → Synced closed → Retest required | Engineering owner | Synchronize issue state and trigger a GRC retest |
| Risk acceptance | Proposed → Approved / Rejected / Expired | Risk approver | Formally accept a bounded residual-risk rationale with expiry |

## Core Entities

| Entity | Purpose | Key linkage |
|---|---|---|
| `grc_systems` | Business and technical system inventory | Scope of evidence and control testing |
| `assurance_controls` | Operable control objectives and owners | Requests evidence and defines a test method |
| `evidence_submissions` | Owner-provided evidence metadata and status | Submitted against a control and system |
| `assurance_tests` | Test steps, result, and conclusion | Reviews one evidence submission |
| `grc_findings` | Control exceptions and treatment tracking | Created from a failed assurance test |
| `risk_acceptances` | Time-bound residual-risk decisions | Optional alternative to remediation |
| `github_remediation_links` | External engineering ticket identity and state | Links a finding to a GitHub Issue |

## Provider Contract

The external-ticket provider abstraction has three methods: `createRemediationIssue`, `getIssueStatus`, and `syncRemediation`. The GitHub adapter uses repository issues. It sends a stable GRC finding ID, control ID, severity, owner, due date, and acceptance criteria in the issue body so a person can trace either system back to the other.

The app runs in offline workflow mode until `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPOSITORY` are supplied as server-side configuration. In offline mode, every action up to issue creation remains available, and the remediation link remains in `Ready to create` state. No fictional external issue is represented as live.

## Acceptance Criteria

The MVP is successful when a user can submit evidence, record an exception, generate a finding, select remediation rather than risk acceptance, create a linked GitHub Issue after connection, synchronize its state, and retain the final GRC retest decision. Each workflow transition must be testable and auditable in the product UI.
