import { describe, expect, it } from "vitest";
import { buildFlowGuardGrcExport, evaluatePaymentCompletionFixture } from "./flowguardVerifier";

describe("FlowGuard payment-control verifier adapter", () => {
  it("evaluates the named payment-completion fixture into immutable, provenance-labelled GRC evidence", () => {
    const evaluation = evaluatePaymentCompletionFixture();
    const exported = buildFlowGuardGrcExport(evaluation);
    expect(evaluation).toMatchObject({ controlKey: "CTRL-PAY-001", process: "payment-completion", verdict: "FAIL", traceId: "sim-trace-payment-001", provenanceLabel: "Simulated Case Study" });
    expect(evaluation.firstFinding?.key).toBe("settlement-recorded");
    expect(exported).toMatchObject({ schemaVersion: "flowguard.control-execution.v1", evidenceHash: evaluation.evidenceHash, finding: { key: "settlement-recorded" }, provenance: { label: "Simulated Case Study" } });
    expect(exported.provenance.note).toContain("does not by itself prove regulatory compliance");
  });
});
