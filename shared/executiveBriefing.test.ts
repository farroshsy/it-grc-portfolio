import { describe, expect, it } from "vitest";
import { createExecutiveBriefing } from "./executiveBriefing";

describe("createExecutiveBriefing", () => {
  it("prioritizes residual-risk and overdue-action decision prompts from the supplied governance records", () => {
    const briefing = createExecutiveBriefing({
      risks: [{ riskId: "R-01", title: "Elevated access evidence gap", residualRisk: 12, owner: "Security", status: "Open" }],
      controls: [{ effectiveness: 80 }, { effectiveness: 70 }],
      tests: [{ result: "Exception", severity: "High" }],
      remediation: [{ actionId: "A-01", title: "Link approvals", linkedRiskId: "R-01", owner: "Security", status: "In progress", severity: "High", dueDate: new Date("2026-08-15") }],
      auditRequests: [{ requestId: "PBC-01", title: "Review", owner: "Security", status: "Requested", dueDate: new Date("2026-08-15") }],
    }, new Date("2026-09-01"));

    expect(briefing).toMatchObject({ highRiskCount: 1, exceptionCount: 1, overdueActionCount: 1, overdueRequestCount: 1, controlEffectiveness: 75 });
    expect(briefing.decisions.map((item) => item.title)).toEqual(["Confirm treatment for R-01", "Resolve overdue action A-01"]);
  });
});
