import { jsPDF } from "jspdf";
import type { ExecutiveBriefingSummary } from "./executiveBriefing";

export function executiveBriefingPdfLines(briefing: ExecutiveBriefingSummary, generatedOn: Date) {
  return [
    "CONTROL LEDGER · SIMULATED EXECUTIVE RISK BRIEFING",
    `Generated ${generatedOn.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`,
    `Elevated residual risks: ${briefing.highRiskCount} | Testing exceptions: ${briefing.exceptionCount} | Overdue actions: ${briefing.overdueActionCount} | Control effectiveness: ${briefing.controlEffectiveness}%`,
    "TOP RESIDUAL-RISK WATCHLIST",
    ...briefing.topRisks.map((risk) => `${risk.riskId} · Residual ${risk.residualRisk} · ${risk.owner} — ${risk.title}`),
    "MANAGEMENT DECISION PROMPTS",
    ...briefing.decisions.map((decision) => `${decision.title}: ${decision.prompt}`),
    `EVIDENCE READINESS: ${briefing.overdueRequestCount} illustrative evidence request(s) overdue.`,
    briefing.assuranceNote,
  ];
}

export function createExecutiveBriefingPdf(briefing: ExecutiveBriefingSummary, generatedOn = new Date()) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lines = executiveBriefingPdfLines(briefing, generatedOn);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 46;
  lines.forEach((line, index) => {
    const isHeading = [0, 3, 3 + briefing.topRisks.length + 1].includes(index);
    doc.setFont("helvetica", isHeading ? "bold" : "normal");
    doc.setFontSize(index === 0 ? 15 : isHeading ? 10 : 9);
    doc.setTextColor(isHeading ? 24 : 50, isHeading ? 76 : 72, isHeading ? 67 : 68);
    const wrapped = doc.splitTextToSize(line, pageWidth - 72);
    doc.text(wrapped, 36, y);
    y += wrapped.length * (isHeading ? 15 : 12) + (isHeading ? 8 : 4);
  });
  doc.setDrawColor(91, 154, 136);
  doc.line(36, 28, pageWidth - 36, 28);
  return doc;
}

export function downloadExecutiveBriefingPdf(briefing: ExecutiveBriefingSummary) {
  createExecutiveBriefingPdf(briefing).save("control-ledger-simulated-executive-risk-briefing.pdf");
}
