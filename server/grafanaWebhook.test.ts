import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGrafanaWebhookSignature } from "./grafanaWebhook";

describe("Grafana webhook signature verification", () => {
  const secret = "test-shared-secret";
  const rawBody = Buffer.from('{"traceExport":{"spans":[]}}');
  const now = 1_760_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");

  it("accepts a current HMAC-SHA256 signature over the timestamp and raw body", () => {
    expect(verifyGrafanaWebhookSignature({ rawBody, timestamp, signature, secret, now })).toBe(true);
  });

  it("rejects altered, unsigned, and stale deliveries before trace processing", () => {
    expect(verifyGrafanaWebhookSignature({ rawBody, timestamp, signature: `${signature.slice(0, -1)}0`, secret, now })).toBe(false);
    expect(verifyGrafanaWebhookSignature({ rawBody, timestamp: String(Math.floor((now - 6 * 60 * 1000) / 1000)), signature, secret, now })).toBe(false);
    expect(verifyGrafanaWebhookSignature({ rawBody, timestamp, signature: undefined, secret, now })).toBe(false);
  });
});
