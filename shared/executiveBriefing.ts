export type BriefingRisk = { riskId: string; title: string; residualRisk: number; owner: string; status: string };
export type BriefingControl = { effectiveness: number };
export type BriefingTest = { result: string; severity: string };
export type BriefingAction = { actionId: string; title: string; linkedRiskId: string; owner: string; status: string; severity: string; dueDate: Date };
export type BriefingAuditRequest = { requestId: string; title: string; owner: string; status: string; dueDate: Date };

export function createExecutiveBriefing(input: { risks: BriefingRisk[]; controls: BriefingControl[]; tests: BriefingTest[]; remediation: BriefingAction[]; auditRequests: BriefingAuditRequest[] }, now = new Date()) {
  const risks = [...input.risks].sort((left, right) => right.residualRisk - left.residualRisk);
  const highRisks = risks.filter((risk) => risk.residualRisk >= 10);
  const exceptions = input.tests.filter((test) => test.result === "Exception");
  const overdueActions = input.remediation.filter((action) => action.dueDate < now && action.status !== "Complete");
  const overdueRequests = input.auditRequests.filter((request) => request.dueDate < now && request.status !== "Closed");
  const controlEffectiveness = input.controls.length ? Math.round(input.controls.reduce((total, control) => total + control.effectiveness, 0) / input.controls.length) : 0;
  const decisions = [
    ...(highRisks.slice(0, 2).map((risk) => ({ title: `Confirm treatment for ${risk.riskId}`, prompt: `Confirm the accountable owner, funding or delivery path, and target-risk decision for ${risk.title}.`, owner: risk.owner, level: "Residual risk" }))),
    ...(overdueActions.slice(0, 1).map((action) => ({ title: `Resolve overdue action ${action.actionId}`, prompt: `Decide whether to accelerate, re-scope, or formally accept time-bound exposure for ${action.title}.`, owner: action.owner, level: "Remediation" }))),
  ];
  return {
    topRisks: risks.slice(0, 3),
    highRiskCount: highRisks.length,
    exceptionCount: exceptions.length,
    overdueActionCount: overdueActions.length,
    overdueRequestCount: overdueRequests.length,
    controlEffectiveness,
    decisions,
    assuranceNote: "Illustrative management view derived from simulated portfolio records. It is not an audit opinion, certification statement, or regulatory conclusion.",
  };
}

export type ExecutiveBriefingSummary = ReturnType<typeof createExecutiveBriefing>;
