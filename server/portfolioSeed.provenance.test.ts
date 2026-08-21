import { describe, expect, it } from "vitest";
import { provenanceValues } from "../drizzle/schema";
import { simulatedAuditRequests, simulatedPolicies } from "./portfolioSeed";

describe("simulated GRC evidence provenance", () => {
  it("retains the approved portfolio provenance vocabulary", () => {
    expect(provenanceValues).toEqual(["Academic", "Independent Research", "Simulated Case Study"]);
  });

  it("labels every audit request and policy record as an approved simulated artifact", () => {
    const approved = new Set<string>(provenanceValues);
    expect(simulatedAuditRequests.every((request) => approved.has(request.provenance))).toBe(true);
    expect(simulatedPolicies.every((policy) => approved.has(policy.provenance))).toBe(true);
    expect(simulatedAuditRequests.every((request) => request.provenance === "Simulated Case Study")).toBe(true);
    expect(simulatedPolicies.every((policy) => policy.provenance === "Simulated Case Study")).toBe(true);
  });
});
