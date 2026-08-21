import { beforeEach, describe, expect, it, vi } from "vitest";

const dataAccess = vi.hoisted(() => ({
  getPortfolioHomeData: vi.fn(),
  getCaseStudyDetail: vi.fn(),
  getDashboardData: vi.fn(),
}));

vi.mock("../portfolioDb", () => dataAccess);

import { portfolioRouter } from "./portfolio";

describe("portfolioRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the database-provided home model through the public tRPC contract", async () => {
    const expected = { studies: [{ slug: "fintech-risk-assessment" }], mappings: [{ displayOrder: 1 }] };
    dataAccess.getPortfolioHomeData.mockResolvedValue(expected);
    const caller = portfolioRouter.createCaller({} as never);
    await expect(caller.home()).resolves.toEqual(expected);
  });

  it("passes a validated slug into the selected case-study query", async () => {
    const expected = { study: { slug: "iso-27001-control-assessment" }, sections: [], artifacts: [], sources: [] };
    dataAccess.getCaseStudyDetail.mockResolvedValue(expected);
    const caller = portfolioRouter.createCaller({} as never);
    await expect(caller.caseStudy({ slug: "iso-27001-control-assessment" })).resolves.toEqual(expected);
    expect(dataAccess.getCaseStudyDetail).toHaveBeenCalledWith("iso-27001-control-assessment");
  });

  it("returns the data-access result for the Recharts governance dashboard", async () => {
    const expected = { risks: [], controls: [], tests: [], remediation: [], studies: [], frameworks: [] };
    dataAccess.getDashboardData.mockResolvedValue(expected);
    const caller = portfolioRouter.createCaller({} as never);
    await expect(caller.dashboard()).resolves.toEqual(expected);
  });
});
