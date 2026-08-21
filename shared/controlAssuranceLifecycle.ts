export type EvidenceDecision = "Effective" | "Exception";
export type TreatmentChoice = "Remediation" | "Risk acceptance";
export type RiskDecision = "Approved" | "Rejected";
export type ExternalIssueState = "open" | "closed";

export function controlStatusForTestDecision(result: EvidenceDecision) {
  return result === "Effective" ? "Effective" as const : "Exception" as const;
}

export function evidenceStatusForTestDecision(result: EvidenceDecision) {
  return result === "Effective" ? "Accepted" as const : "Rejected" as const;
}

export function findingStatusForTreatment(treatment: TreatmentChoice) {
  return treatment === "Remediation" ? "Remediation planned" as const : "Open" as const;
}

export function findingStatusForRiskDecision(decision: RiskDecision) {
  return decision === "Approved" ? "Risk accepted" as const : "Open" as const;
}

export function findingStatusForExternalState(state: ExternalIssueState) {
  return state === "closed" ? "Pending retest" as const : "In remediation" as const;
}

export function effectiveRiskAcceptanceStatus(status: "Proposed" | "Approved" | "Rejected" | "Expired", expiresAt: Date, now = new Date()) {
  return status === "Approved" && expiresAt.getTime() <= now.getTime() ? "Expired" as const : status;
}
