import { describe, expect, it } from "vitest";
import { createExecutiveBriefingPdf, executiveBriefingPdfLines } from "./executiveBriefingPdf";

describe("executive briefing PDF model", () => {
  it("builds a compact one-page management summary from briefing data", () => {
    const lines = executiveBriefingPdfLines({ highRiskCount: 1, exceptionCount: 2, overdueActionCount: 1, overdueRequestCount: 0, controlEffectiveness: 75, topRisks: [{ riskId: "FRA-R01", residualRisk: 10, owner: "Security", title: "Approval gap", status: "Open" }], decisions: [{ title: "Confirm treatment", prompt: "Choose a treatment path.", owner: "Security", level: "Residual risk" }], assuranceNote: "Simulated only." }, new Date("2026-08-21"));
    expect(lines.join(" ")).toContain("FRA-R01");
    expect(lines.join(" ")).toContain("Simulated only.");
  });

  it("creates a non-empty one-page PDF document", () => {
    const briefing = { highRiskCount: 1, exceptionCount: 2, overdueActionCount: 1, overdueRequestCount: 0, controlEffectiveness: 75, topRisks: [{ riskId: "FRA-R01", residualRisk: 10, owner: "Security", title: "Approval gap", status: "Open" }], decisions: [{ title: "Confirm treatment", prompt: "Choose a treatment path.", owner: "Security", level: "Residual risk" }], assuranceNote: "Simulated only." };
    const document = createExecutiveBriefingPdf(briefing, new Date("2026-08-21"));
    expect(document.getNumberOfPages()).toBe(1);
    expect(document.output("arraybuffer").byteLength).toBeGreaterThan(1000);
  });
});
