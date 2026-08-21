import { describe, expect, it } from "vitest";
import { evaluatePaymentTraceExport, parseFlowGuardTraceExport } from "./flowguardTraceIngestion";

describe("FlowGuard trace-export ingestion", () => {
  it("parses generic trace JSON and produces deterministic payment-control evidence without retaining raw input", () => {
    const trace = parseFlowGuardTraceExport(JSON.stringify({ spans: [
      { traceId: "trace-900", spanId: "order", service: "orderservice", operation: "CreateOrder", status: "ok", startTime: 1 },
      { traceId: "trace-900", spanId: "authorize", service: "paymentservice", operation: "AuthorizeCharge", status: "ok", startTime: 2 },
      { traceId: "trace-900", spanId: "settle", service: "settlementservice", operation: "RecordSettlement", status: "ok", startTime: 3 },
    ] }), "payment-export.json");
    const evaluation = evaluatePaymentTraceExport(trace);
    expect(trace.sourceShape).toBe("generic-json");
    expect(evaluation).toMatchObject({ verdict: "PASS", traceId: "trace-900", spanCount: 3 });
    expect(evaluation.evidenceHash).toMatch(/^sha256:fg-/);
  });

  it("reports missing settlement evidence as a failure rather than asserting a control conclusion", () => {
    const trace = parseFlowGuardTraceExport(JSON.stringify({ spans: [
      { traceId: "trace-901", spanId: "order", service: "orderservice", operation: "CreateOrder", status: "ok", startTime: 1 },
      { traceId: "trace-901", spanId: "authorize", service: "paymentservice", operation: "AuthorizeCharge", status: "ok", startTime: 2 },
    ] }), "incomplete-payment-export.json");
    expect(evaluatePaymentTraceExport(trace)).toMatchObject({ verdict: "FAIL", firstFinding: { service: "settlementservice", operation: "RecordSettlement" } });
  });
});
