import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getTutorialProgress, saveTutorialProgress } from "../features/tutorial/progressDb";

export const tutorialRouter = router({
  progress: protectedProcedure.query(async ({ ctx }) => getTutorialProgress(ctx.user.id)),
  saveProgress: protectedProcedure.input(z.object({ activeStep: z.number().int().min(0).max(4), completed: z.boolean() })).mutation(async ({ input, ctx }) => saveTutorialProgress({ ...input, userId: ctx.user.id })),
});
