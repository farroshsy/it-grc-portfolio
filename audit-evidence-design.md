# Simulated GRC Evidence Expansion — Design Record

## Portfolio Principle

The audit room, policy pack, and executive briefing are **Simulated Case Study** artifacts. They demonstrate an IT GRC operating model without representing professional work, real client evidence, or a regulatory opinion. Every surface must retain that label and state that the records are illustrative.

## Audit Room / PBC Tracker

The tracker will be backed by `audit_requests` records. Each request will have a request ID, evidence title, domain, accountable owner, request status, target date, closure evidence, and a `Simulated Case Study` provenance field. The audit-room interface will support text filtering and status filtering; closure evidence will make the request-to-proof trail visible.

| Field | Purpose |
|---|---|
| Request ID | Enables evidence-request traceability. |
| Evidence request | States the illustrative item requested from a control owner. |
| Owner | Names the accountable simulated function. |
| Status and target date | Shows PBC workflow and timing discipline. |
| Closure evidence | Shows what would substantiate completion, not a real artifact. |

## Policy-and-Procedure Pack

The policy pack will contain four short, simulated policy records: **access management**, **technology change management**, **incident management**, and **vulnerability management**. Each contains an owner, review cycle, version, purpose, core operating rules, evidence examples, and selected reference material. The summaries illustrate control design; they are not organizational policies or prescriptive regulatory advice.

## Executive Risk Briefing

The briefing will consume the existing dashboard dataset through a dedicated tRPC query and derive a one-page decision view. It will include a concise posture summary, a prioritized list of residual-risk discussions, remediation actions requiring management attention, and explicit decision prompts. The brief will avoid an assurance or certification conclusion. NIST CSF 2.0 provides the governance-and-risk-management context; NIST SP 800-53 and SP 800-61 Rev. 3 inform the control and incident-management themes.[1] [2] [3]

## References

[1] [NIST, *Cybersecurity Framework 2.0*, February 2024](https://www.nist.gov/cyberframework)

[2] [NIST, *SP 800-53 Rev. 5: Security and Privacy Controls for Information Systems and Organizations*, September 2020; updates as of 10 December 2020](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

[3] [NIST, *SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management*, April 2025](https://csrc.nist.gov/projects/incident-response)
