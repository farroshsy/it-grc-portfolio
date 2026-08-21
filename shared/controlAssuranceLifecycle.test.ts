import { describe, expect, it } from "vitest";
import { controlStatusForTestDecision, effectiveRiskAcceptanceStatus, evidenceStatusForTestDecision, findingStatusForExternalState, findingStatusForRiskDecision, findingStatusForTreatment } from "./controlAssuranceLifecycle";

describe("control assurance lifecycle", () => {
  it("moves submitted evidence through a test conclusion and creates an exception-ready control posture", () => {
    expect(evidenceStatusForTestDecision("Exception")).toBe("Rejected");
    expect(controlStatusForTestDecision("Exception")).toBe("Exception");
    expect(findingStatusForTreatment("Remediation")).toBe("Remediation planned");
  });

  it("supports risk acceptance decisions and deterministic expiry", () => {
    expect(findingStatusForRiskDecision("Approved")).toBe("Risk accepted");
    expect(effectiveRiskAcceptanceStatus("Approved", new Date("2026-08-01"), new Date("2026-08-21"))).toBe("Expired");
    expect(effectiveRiskAcceptanceStatus("Approved", new Date("2026-09-01"), new Date("2026-08-21"))).toBe("Approved");
  });

  it("returns a remediation to GRC retest after an external engineering issue closes", () => {
    expect(findingStatusForExternalState("open")).toBe("In remediation");
    expect(findingStatusForExternalState("closed")).toBe("Pending retest");
  });
});
