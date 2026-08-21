import { z } from "zod";
import { getCaseStudyDetail, getDashboardData, getPortfolioHomeData } from "../portfolioDb";
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
});
