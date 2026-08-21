import { z } from "zod";
import { getAuditRoomData, getCaseStudyDetail, getDashboardData, getExecutiveBriefingData, getPolicyPackData, getPortfolioHomeData } from "../portfolioDb";
import { publicProcedure, router } from "../_core/trpc";

export const portfolioRouter = router({
  home: publicProcedure.query(async () => {
    const data = await getPortfolioHomeData();
    if (!data) throw new Error("The portfolio datastore is unavailable.");
    return data;
  }),
  caseStudy: publicProcedure.input(z.object({ slug: z.string().min(1).max(96) })).query(async ({ input }) => {
    return getCaseStudyDetail(input.slug);
  }),
  dashboard: publicProcedure.query(async () => {
    const data = await getDashboardData();
    if (!data) throw new Error("The dashboard datastore is unavailable.");
    return data;
  }),
  auditRoom: publicProcedure.query(async () => {
    const data = await getAuditRoomData();
    if (!data) throw new Error("The audit-room datastore is unavailable.");
    return data;
  }),
  policyPack: publicProcedure.query(async () => {
    const data = await getPolicyPackData();
    if (!data) throw new Error("The policy-pack datastore is unavailable.");
    return data;
  }),
  executiveBriefing: publicProcedure.query(async () => {
    const data = await getExecutiveBriefingData();
    if (!data) throw new Error("The executive-briefing datastore is unavailable.");
    return data;
  }),
});
