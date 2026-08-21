import { describe, expect, it } from "vitest";
import { connectedFlowIds, paymentFlowById, paymentSecurityFlows, paymentSecurityNodes } from "./paymentSecurityModel";

describe("simulated payment-security data-flow model", () => {
  it("keeps the modeled PCI-oriented CDE, external, and security-supporting boundaries explicit", () => {
    expect(paymentSecurityNodes.filter((node) => node.classification === "CDE component").map((node) => node.id)).toEqual(["gateway", "tokenVault", "orchestrator"]);
    expect(paymentSecurityNodes.some((node) => node.id === "checkout" && node.classification === "Out of CDE by design assumption")).toBe(true);
    expect(paymentSecurityFlows).toHaveLength(7);
  });

  it("connects the payment gateway to tokenization, authorization, telemetry, and approved administration flows", () => {
    expect(connectedFlowIds("gateway")).toEqual(["f2", "f3", "f4", "f5", "f6", "f7"]);
  });

  it("provides independent flow detail for the hosted-entry boundary", () => {
    const hostedEntry = paymentFlowById("f2");
    expect(hostedEntry).toMatchObject({
      data: "Simulated payment entry payload",
      boundary: "Merchant → CDE",
      evidence: ["Hosted-field architecture decision", "Transport security configuration", "Client-side change approval"],
    });
  });
});
