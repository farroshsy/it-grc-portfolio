import { describe, expect, it } from "vitest";
import { simulatedAuditWorkpaper, workpaperResultSummary } from "./auditWorkpaperModel";

describe("simulated audit workpaper", () => {
  it("retains a transparent simulated provenance label and summarizes tested procedures", () => {
    expect(simulatedAuditWorkpaper.provenance).toBe("Simulated Case Study");
    expect(workpaperResultSummary(simulatedAuditWorkpaper.steps)).toEqual({ effective: 2, exceptions: 1 });
  });
});
