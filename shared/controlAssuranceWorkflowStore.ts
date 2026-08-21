import { controlStatusForTestDecision, evidenceStatusForTestDecision, findingStatusForExternalState, findingStatusForRiskDecision, findingStatusForTreatment, type EvidenceDecision, type ExternalIssueState, type RiskDecision, type TreatmentChoice } from "./controlAssuranceLifecycle";

export type WorkflowFinding = { id: string; status: string; treatment: TreatmentChoice };
export type WorkflowAcceptance = { id: string; findingId: string; status: "Proposed" | "Approved" | "Rejected" };

export function createControlAssuranceWorkflowStore() {
  const state = {
    evidence: new Map<string, { id: string; status: string; controlId: string }>(),
    controls: new Map<string, { id: string; status: string }>(),
    findings: new Map<string, WorkflowFinding>(),
    acceptances: new Map<string, WorkflowAcceptance>(),
    remediation: new Map<string, { findingId: string; state: string }>(),
  };

  return {
    state,
    submitEvidence(id: string, controlId: string) { state.evidence.set(id, { id, controlId, status: "Submitted" }); state.controls.set(controlId, { id: controlId, status: "In testing" }); },
    decideTest(id: string, result: EvidenceDecision) {
      const evidence = state.evidence.get(id); if (!evidence) throw new Error("Evidence not found");
      evidence.status = evidenceStatusForTestDecision(result);
      state.controls.get(evidence.controlId)!.status = controlStatusForTestDecision(result);
      if (result === "Exception") { const finding = { id: `FND-${id}`, status: "Open", treatment: "Remediation" as const }; state.findings.set(finding.id, finding); state.remediation.set(finding.id, { findingId: finding.id, state: "Ready to create" }); return finding; }
      return null;
    },
    setTreatment(findingId: string, treatment: TreatmentChoice) { const finding = state.findings.get(findingId); if (!finding) throw new Error("Finding not found"); finding.treatment = treatment; finding.status = findingStatusForTreatment(treatment); },
    proposeAcceptance(id: string, findingId: string) { const acceptance = { id, findingId, status: "Proposed" as const }; state.acceptances.set(id, acceptance); return acceptance; },
    decideAcceptance(id: string, decision: RiskDecision) { const acceptance = state.acceptances.get(id); if (!acceptance) throw new Error("Acceptance not found"); acceptance.status = decision; state.findings.get(acceptance.findingId)!.status = findingStatusForRiskDecision(decision); },
    syncRemediation(findingId: string, stateFromProvider: ExternalIssueState) { state.remediation.get(findingId)!.state = stateFromProvider; state.findings.get(findingId)!.status = findingStatusForExternalState(stateFromProvider); },
  };
}
