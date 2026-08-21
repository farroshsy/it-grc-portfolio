/**
 * Named FlowGuard technical-verification adapter.
 * Adapted from the supplied FlowGuard handoff module (`client/src/lib/flowguard.ts`):
 * deterministic verdict evaluation, evidence fingerprinting, and evidence-first GRC export.
 */
export type FlowGuardVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";
export type FlowGuardAssertionStatus = "PASS" | "FAIL" | "NOT_VERIFIED" | "INCONCLUSIVE";

export type FlowGuardAssertion = {
  key: string;
  label: string;
  service: string;
  operation: string;
  expected: string;
  observed: string;
  spanId: string;
  status: FlowGuardAssertionStatus;
  detail: string;
};

export type FlowGuardPaymentEvaluation = {
  verdict: FlowGuardVerdict;
  firstFinding: FlowGuardAssertion | null;
  evidenceHash: string;
  controlKey: "CTRL-PAY-001";
  process: "payment-completion";
  contractVersion: "payment-completion-v1.0.0";
  assertions: FlowGuardAssertion[];
  traceId: string;
  durationMs: number;
  runAt: string;
  environment: string;
  provenanceLabel: "Simulated Case Study";
  provenanceSource: string;
};

function fingerprint(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sha256:fg-${(hash >>> 0).toString(16).padStart(8, "0")}e7a1`;
}

export function evaluatePaymentCompletionFixture(): FlowGuardPaymentEvaluation {
  const assertions: FlowGuardAssertion[] = [
    { key: "order-created", label: "Order created", service: "checkoutservice", operation: "PlaceOrder", expected: "order record present", observed: "order record present", spanId: "5c19ae71", status: "PASS", detail: "The order record is retained in the canonical payment trace." },
    { key: "charge-authorized", label: "Charge authorized", service: "paymentservice", operation: "AuthorizeCharge", expected: "authorization = approved", observed: "authorization = approved", spanId: "8d2f41bc", status: "PASS", detail: "The payment authorization precedes the settlement checkpoint." },
    { key: "settlement-recorded", label: "Settlement confirmation recorded", service: "settlementservice", operation: "RecordSettlement", expected: "settlement event present", observed: "event missing", spanId: "a74ed901", status: "FAIL", detail: "Settlement confirmation was absent after charge authorization in the simulated trace." },
    { key: "evidence-retained", label: "Verification evidence retained", service: "evidenceledger", operation: "AppendEvidence", expected: "evidence hash retained", observed: "awaiting settlement event", spanId: "b431e6f0", status: "NOT_VERIFIED", detail: "Evidence retention cannot be verified until the required settlement event is present." },
  ];
  const firstFinding = assertions.find((assertion) => assertion.status === "FAIL") ?? assertions.find((assertion) => assertion.status === "INCONCLUSIVE") ?? null;
  const traceId = "sim-trace-payment-001";
  return {
    verdict: firstFinding?.status === "FAIL" ? "FAIL" : firstFinding ? "INCONCLUSIVE" : "PASS",
    firstFinding,
    evidenceHash: fingerprint(`${traceId}:${assertions.map((item) => `${item.key}:${item.status}`).join("|")}`),
    controlKey: "CTRL-PAY-001",
    process: "payment-completion",
    contractVersion: "payment-completion-v1.0.0",
    assertions,
    traceId,
    durationMs: 734,
    runAt: "2026-08-20T10:15:00Z",
    environment: "flowguard-simulated-payment-fixture",
    provenanceLabel: "Simulated Case Study",
    provenanceSource: "FlowGuard handoff deterministic payment-completion fixture adapter",
  };
}

export function buildFlowGuardGrcExport(evaluation: FlowGuardPaymentEvaluation) {
  return {
    schemaVersion: "flowguard.control-execution.v1",
    executionId: `fg-${evaluation.traceId}`,
    controlKey: evaluation.controlKey,
    process: evaluation.process,
    verdict: evaluation.verdict,
    runAt: evaluation.runAt,
    environment: evaluation.environment,
    contractVersion: evaluation.contractVersion,
    traceId: evaluation.traceId,
    durationMs: evaluation.durationMs,
    evidenceHash: evaluation.evidenceHash,
    provenance: {
      label: evaluation.provenanceLabel,
      source: evaluation.provenanceSource,
      note: "This result demonstrates a technical control test and does not by itself prove regulatory compliance.",
    },
    assertions: evaluation.assertions.map((assertion) => ({ key: assertion.key, status: assertion.status, service: assertion.service, operation: assertion.operation, expected: assertion.expected, observed: assertion.observed, spanId: assertion.spanId, explanation: assertion.detail })),
    finding: evaluation.firstFinding ? { key: evaluation.firstFinding.key, service: evaluation.firstFinding.service, operation: evaluation.firstFinding.operation, status: evaluation.firstFinding.status, spanId: evaluation.firstFinding.spanId, explanation: evaluation.firstFinding.detail } : null,
  };
}
