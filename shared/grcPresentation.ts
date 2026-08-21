export const requiredCaseStudySections = [
  "Context",
  "Scope",
  "Methodology",
  "Findings",
  "Risk",
  "Controls",
  "Evidence",
  "Remediation",
  "Outcome",
  "Artifacts",
] as const;

export const permittedProvenanceLabels = ["Academic", "Independent Research", "Simulated Case Study"] as const;

export type DashboardRiskRecord = { residualRisk: number; category: string };
export type DashboardControlRecord = { effectiveness: number };
export type DashboardRemediationRecord = { status: string; dueDate: Date | string };

export function residualRiskTone(score: number) {
  if (score >= 12) return "high";
  if (score >= 8) return "moderate";
  return "low";
}

export function isActionOverdue(action: DashboardRemediationRecord, now: Date) {
  return action.status !== "Complete" && new Date(action.dueDate).getTime() < now.getTime();
}

export function calculateGovernanceMetrics(
  risks: DashboardRiskRecord[],
  controls: DashboardControlRecord[],
  remediation: DashboardRemediationRecord[],
  now: Date,
) {
  return {
    highResidualRiskCount: risks.filter((risk) => risk.residualRisk >= 12).length,
    openRemediationCount: remediation.filter((action) => action.status !== "Complete").length,
    overdueActionCount: remediation.filter((action) => isActionOverdue(action, now)).length,
    controlEffectiveness: controls.length
      ? Math.round(controls.reduce((total, control) => total + control.effectiveness, 0) / controls.length)
      : 0,
  };
}

export function summarizeResidualRiskByCategory(risks: DashboardRiskRecord[]) {
  const totals = risks.reduce<Record<string, { category: string; score: number; count: number }>>((accumulator, risk) => {
    const current = accumulator[risk.category] ?? { category: risk.category, score: 0, count: 0 };
    current.score += risk.residualRisk;
    current.count += 1;
    accumulator[risk.category] = current;
    return accumulator;
  }, {});
  return Object.values(totals).map((item) => ({ category: item.category, residual: Math.round(item.score / item.count) }));
}
