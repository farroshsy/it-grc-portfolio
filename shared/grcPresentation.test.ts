import { describe, expect, it } from "vitest";
import {
  calculateGovernanceMetrics,
  isActionOverdue,
  permittedProvenanceLabels,
  requiredCaseStudySections,
  residualRiskTone,
  summarizeResidualRiskByCategory,
} from "./grcPresentation";

describe("GRC portfolio presentation contracts", () => {
  it("preserves the required case-study sequence and provenance-only label vocabulary", () => {
    expect(requiredCaseStudySections).toEqual([
      "Context", "Scope", "Methodology", "Findings", "Risk", "Controls", "Evidence", "Remediation", "Outcome", "Artifacts",
    ]);
    expect(permittedProvenanceLabels).toEqual(["Academic", "Independent Research", "Simulated Case Study"]);
  });

  it("calculates residual-risk, remediation, and control-effectiveness metrics", () => {
    const asOf = new Date("2026-08-21T00:00:00.000Z");
    const metrics = calculateGovernanceMetrics(
      [{ residualRisk: 12, category: "Compliance" }, { residualRisk: 8, category: "Compliance" }, { residualRisk: 4, category: "Cloud" }],
      [{ effectiveness: 70 }, { effectiveness: 88 }],
      [{ status: "In progress", dueDate: "2026-08-20" }, { status: "Planned", dueDate: "2026-09-01" }, { status: "Complete", dueDate: "2026-08-01" }],
      asOf,
    );
    expect(metrics).toEqual({ highResidualRiskCount: 1, openRemediationCount: 2, overdueActionCount: 1, controlEffectiveness: 79 });
    expect(isActionOverdue({ status: "Complete", dueDate: "2026-08-01" }, asOf)).toBe(false);
  });

  it("groups residual risk by category and maintains escalation boundaries", () => {
    expect(summarizeResidualRiskByCategory([
      { category: "Compliance", residualRisk: 12 }, { category: "Compliance", residualRisk: 8 }, { category: "Cloud", residualRisk: 4 },
    ])).toEqual([{ category: "Compliance", residual: 10 }, { category: "Cloud", residual: 4 }]);
    expect(residualRiskTone(12)).toBe("high");
    expect(residualRiskTone(8)).toBe("moderate");
    expect(residualRiskTone(7)).toBe("low");
  });
});
