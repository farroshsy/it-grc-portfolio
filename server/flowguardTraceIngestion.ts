/**
 * Named FlowGuard trace-import adapter derived from the supplied handoff's traceIngestion.ts.
 * It accepts exported JSON only; it is not a collector connection and does not persist raw telemetry.
 */
import type { FlowGuardAssertion, FlowGuardVerdict } from "./flowguardVerifier";

type SpanStatus = "ok" | "error" | "unset";
type NormalizedSpan = { traceId: string; spanId: string; service: string; operation: string; status: SpanStatus; startTime: number; attributes: Record<string, string> };
type ImportedTrace = { traceId: string; spans: NormalizedSpan[]; sourceShape: "otlp-json" | "jaeger-json" | "generic-json"; sourceName: string };

const paymentContract = [
  { service: "orderservice", operation: "CreateOrder", status: "ok" as const },
  { service: "paymentservice", operation: "AuthorizeCharge", status: "ok" as const },
  { service: "settlementservice", operation: "RecordSettlement", status: "ok" as const },
];

function asText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["stringValue", "boolValue", "intValue", "doubleValue", "value"]) if (record[key] !== undefined) return asText(record[key]);
  }
  return "";
}

function attributesToRecord(attributes: unknown): Record<string, string> {
  if (!Array.isArray(attributes)) return {};
  return Object.fromEntries(attributes.map((item: Record<string, unknown>) => [String(item?.key ?? ""), asText(item?.value ?? item?.vStr ?? "")]).filter(([key]) => key));
}

function resolveStatus(span: Record<string, unknown>, attributes: Record<string, string>): SpanStatus {
  const code = String((span.status as Record<string, unknown> | undefined)?.code ?? attributes["otel.status_code"] ?? "").toUpperCase();
  if (code === "2" || code === "ERROR" || attributes.error === "true") return "error";
  if (code === "1" || code === "OK") return "ok";
  return "unset";
}

function fromOtlp(root: Record<string, any>): NormalizedSpan[] {
  const spans: NormalizedSpan[] = [];
  for (const resourceSpan of root.resourceSpans ?? []) {
    const resourceAttributes = attributesToRecord(resourceSpan?.resource?.attributes);
    for (const scopeSpan of resourceSpan.scopeSpans ?? resourceSpan.instrumentationLibrarySpans ?? []) for (const span of scopeSpan.spans ?? []) {
      const attributes = { ...resourceAttributes, ...attributesToRecord(span.attributes) };
      spans.push({ traceId: String(span.traceId ?? ""), spanId: String(span.spanId ?? ""), service: attributes["service.name"] || "unknown-service", operation: String(span.name ?? "unknown-operation"), status: resolveStatus(span, attributes), startTime: Number(span.startTimeUnixNano ?? 0), attributes });
    }
  }
  return spans.filter((span) => span.traceId && span.spanId);
}

function fromJaeger(root: Record<string, any>): NormalizedSpan[] {
  const spans: NormalizedSpan[] = [];
  for (const trace of Array.isArray(root.data) ? root.data : []) {
    for (const span of trace.spans ?? []) {
      const attributes = attributesToRecord(span.tags);
      const process = trace.processes?.[span.processID] ?? {};
      spans.push({ traceId: String(span.traceID ?? trace.traceID ?? ""), spanId: String(span.spanID ?? ""), service: String(process.serviceName ?? attributes["service.name"] ?? "unknown-service"), operation: String(span.operationName ?? "unknown-operation"), status: attributes.error === "true" || String(attributes["otel.status_code"] ?? "").toUpperCase() === "ERROR" ? "error" : "ok", startTime: Number(span.startTime ?? 0), attributes });
    }
  }
  return spans.filter((span) => span.traceId && span.spanId);
}

function fromGeneric(root: any): NormalizedSpan[] {
  const source = Array.isArray(root) ? root : root.spans;
  if (!Array.isArray(source)) return [];
  return source.map((span: Record<string, unknown>): NormalizedSpan => ({ traceId: String(span.traceId ?? span.traceID ?? ""), spanId: String(span.spanId ?? span.spanID ?? ""), service: String(span.service ?? span.serviceName ?? "unknown-service"), operation: String(span.operation ?? span.name ?? span.operationName ?? "unknown-operation"), status: (String(span.status ?? "unset").toLowerCase() === "error" ? "error" : String(span.status ?? "unset").toLowerCase() === "ok" ? "ok" : "unset") as SpanStatus, startTime: Number(span.startTime ?? span.startTimeUnixNano ?? 0), attributes: typeof span.attributes === "object" && span.attributes ? Object.fromEntries(Object.entries(span.attributes as Record<string, unknown>).map(([key, value]) => [key, asText(value)])) : {} })).filter((span) => span.traceId && span.spanId);
}

export function parseFlowGuardTraceExport(rawTrace: string, sourceName: string): ImportedTrace {
  let root: Record<string, any>;
  try { root = JSON.parse(rawTrace); } catch { throw new Error("The trace export must be valid JSON: OTLP JSON, Jaeger JSON, or a generic span array."); }
  const otlp = fromOtlp(root);
  const jaeger = otlp.length ? [] : fromJaeger(root);
  const generic = otlp.length || jaeger.length ? [] : fromGeneric(root);
  const spans = otlp.length ? otlp : jaeger.length ? jaeger : generic;
  if (!spans.length) throw new Error("No supported spans were found. Expected OTLP resourceSpans, Jaeger data[].spans, or a generic spans array.");
  return { traceId: spans[0].traceId, spans, sourceShape: otlp.length ? "otlp-json" : jaeger.length ? "jaeger-json" : "generic-json", sourceName };
}

function fingerprint(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) { value ^= input.charCodeAt(index); value = Math.imul(value, 16777619); }
  return `sha256:fg-${(value >>> 0).toString(16).padStart(8, "0")}live`;
}

export function evaluatePaymentTraceExport(trace: ImportedTrace) {
  const assertions: FlowGuardAssertion[] = paymentContract.map((requirement) => {
    const match = trace.spans.filter((span) => span.service === requirement.service && span.operation === requirement.operation).sort((left, right) => left.startTime - right.startTime)[0];
    const key = `${requirement.service}/${requirement.operation}`;
    if (!match) return { key, label: key, service: requirement.service, operation: requirement.operation, expected: `status = ${requirement.status}`, observed: "span missing", spanId: "—", status: "FAIL", detail: `No ${key} span was found in the imported trace.` };
    if (match.status === "unset") return { key, label: key, service: requirement.service, operation: requirement.operation, expected: `status = ${requirement.status}`, observed: "status = unset", spanId: match.spanId, status: "INCONCLUSIVE", detail: `${key} has no explicit status, so the payment control cannot be verified.` };
    if (match.status !== requirement.status) return { key, label: key, service: requirement.service, operation: requirement.operation, expected: `status = ${requirement.status}`, observed: `status = ${match.status}`, spanId: match.spanId, status: "FAIL", detail: `${key} did not meet its required status.` };
    return { key, label: key, service: requirement.service, operation: requirement.operation, expected: `status = ${requirement.status}`, observed: `status = ${match.status}`, spanId: match.spanId, status: "PASS", detail: `${key} was present and satisfied its required status.` };
  });
  const firstFinding = assertions.find((assertion) => assertion.status === "FAIL") ?? assertions.find((assertion) => assertion.status === "INCONCLUSIVE") ?? null;
  const verdict: FlowGuardVerdict = firstFinding?.status === "FAIL" ? "FAIL" : firstFinding ? "INCONCLUSIVE" : "PASS";
  return { verdict, firstFinding, evidenceHash: fingerprint(`${trace.traceId}:payment-completion:${assertions.map((item) => `${item.key}:${item.status}`).join("|")}`), traceId: trace.traceId, sourceShape: trace.sourceShape, spanCount: trace.spans.length, sourceName: trace.sourceName, occurredAt: new Date(), assertions };
}
