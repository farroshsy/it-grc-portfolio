export type WorkpaperStep = {
  id: string;
  procedure: string;
  evidence: string;
  result: "Effective" | "Exception";
  observation: string;
};

export const simulatedAuditWorkpaper = {
  workpaperId: "WP-ACC-001",
  title: "Time-bound privileged access — operating effectiveness test",
  provenance: "Simulated Case Study" as const,
  controlObjective: "Privileged access is approved, time-bound, and supported by a retrievable approval trail.",
  population: "Illustrative population: 24 closed privileged-elevation events for the simulated review period.",
  selectionMethod: "Illustrative judgmental sample of 5 events selected across systems, approvers, and urgency categories to inspect the end-to-end approval trail.",
  samples: ["PA-1842 · Customer-data environment", "PA-1877 · Payment gateway", "PA-1894 · Reconciliation service", "PA-1901 · Production observability", "PA-1922 · Incident response elevation"],
  steps: [
    { id: "01", procedure: "Obtain the selected elevation record and identify the requester, approver, scope, and expiry time.", evidence: "Elevation-system export and ticket reference", result: "Effective", observation: "All sampled records identify an approved requester, approver, scope, and defined expiry time." },
    { id: "02", procedure: "Trace the selected elevation to the linked business or operational work item.", evidence: "Approved change, incident, or support ticket", result: "Exception", observation: "One simulated sample lacked a retained work-item link after emergency elevation closure." },
    { id: "03", procedure: "Inspect whether elevated access was revoked or expired within the approved period.", evidence: "Identity-provider activity and deprovisioning record", result: "Effective", observation: "Selected records showed expiry or revocation consistent with the simulated approval period." },
  ] as WorkpaperStep[],
  conclusion: "Simulated conclusion: the control design is evident in the selected records, but the missing emergency-elevation ticket link is treated as an exception. The workpaper recommends remediation FRA-A01 and a defined retest after implementation.",
  followUp: "FRA-A01 · Require ticket linkage before elevated access can be closed.",
};

export function workpaperResultSummary(steps: WorkpaperStep[]) {
  return { effective: steps.filter((step) => step.result === "Effective").length, exceptions: steps.filter((step) => step.result === "Exception").length };
}
