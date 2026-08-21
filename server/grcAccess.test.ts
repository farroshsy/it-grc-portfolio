import { describe, expect, it } from "vitest";
import { canPerformWorkspaceAction } from "./grcAccess";

describe("GRC workspace access model", () => {
  it("separates evidence ownership, test decisions, and risk approval responsibilities", () => {
    expect(canPerformWorkspaceAction(["control_owner"], ["control_owner"])).toBe(true);
    expect(canPerformWorkspaceAction(["control_owner"], ["grc_analyst"])).toBe(false);
    expect(canPerformWorkspaceAction(["grc_analyst"], ["grc_analyst"])).toBe(true);
    expect(canPerformWorkspaceAction(["risk_approver"], ["risk_approver"])).toBe(true);
    expect(canPerformWorkspaceAction(["risk_approver"], ["control_owner", "grc_analyst"])).toBe(false);
  });
});
