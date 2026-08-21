import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import { getGrafanaWebhookConfig, ingestFlowGuardPaymentTrace, recordGrafanaWebhookDelivery } from "./controlAssuranceDb";

const signatureHeader = "x-grafana-alerting-signature";
const timestampHeader = "x-grafana-alerting-timestamp";
const maxClockSkewMilliseconds = 5 * 60 * 1000;

export function verifyGrafanaWebhookSignature(input: { rawBody: Buffer; signature: string | undefined; timestamp: string | undefined; secret: string; now?: number }) {
  if (!input.signature || !input.timestamp || !/^\d{10,13}$/.test(input.timestamp)) return false;
  const timestampMs = Number(input.timestamp) * (input.timestamp.length === 10 ? 1000 : 1);
  if (!Number.isFinite(timestampMs) || Math.abs((input.now ?? Date.now()) - timestampMs) > maxClockSkewMilliseconds) return false;
  const expected = crypto.createHmac("sha256", input.secret).update(`${input.timestamp}:${input.rawBody.toString("utf8")}`).digest("hex");
  const received = input.signature.replace(/^sha256=/i, "");
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
}

function deliveryIdFor(request: Request, rawBody: Buffer) {
  const supplied = request.header("x-flowguard-delivery-id");
  return supplied?.slice(0, 96) || crypto.createHash("sha256").update(rawBody).digest("hex").slice(0, 64);
}

function parseTraceExport(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("traceExport" in payload)) return null;
  const traceExport = (payload as { traceExport: unknown }).traceExport;
  if (typeof traceExport === "string") return traceExport;
  if (traceExport && typeof traceExport === "object") return JSON.stringify(traceExport);
  return null;
}

export function registerGrafanaWebhook(app: Express) {
  app.post("/api/webhooks/flowguard/grafana", express.raw({ type: "application/json", limit: "5mb" }), async (request: Request, response: Response) => {
    const config = await getGrafanaWebhookConfig();
    if (!config?.active) return response.status(404).json({ error: "Grafana webhook provider is inactive." });
    const secret = process.env.GRAFANA_WEBHOOK_SECRET;
    if (!secret) return response.status(503).json({ error: "Grafana webhook secret is not configured." });
    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    const valid = verifyGrafanaWebhookSignature({ rawBody, signature: request.header(signatureHeader) ?? undefined, timestamp: request.header(timestampHeader) ?? undefined, secret });
    if (!valid) return response.status(401).json({ error: "Invalid or stale Grafana webhook signature." });
    const deliveryId = deliveryIdFor(request, rawBody);
    const accepted = await recordGrafanaWebhookDelivery({ deliveryId, status: "Received" });
    if (!accepted) return response.status(202).json({ status: "Duplicate delivery ignored.", deliveryId });
    try {
      const traceExport = parseTraceExport(JSON.parse(rawBody.toString("utf8")));
      if (!traceExport) return response.status(422).json({ error: "The Grafana custom payload must include a traceExport JSON field.", deliveryId });
      const result = await ingestFlowGuardPaymentTrace({ rawTrace: traceExport, sourceName: "Grafana webhook trace export", ingestedBy: "Grafana webhook" });
      return response.status(202).json({ status: "Accepted", deliveryId, executionId: result.executionId, verdict: result.verdict, rawTraceStored: false });
    } catch (error) {
      return response.status(422).json({ error: error instanceof Error ? error.message : "Unable to evaluate the Grafana trace export.", deliveryId });
    }
  });
}
