import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getTutorialProgress, saveTutorialProgress } from "../features/tutorial/progressDb";
import { submitTutorialFeedback } from "../features/tutorial/feedbackDb";

export const tutorialRouter = router({
  progress: protectedProcedure.query(async ({ ctx }) => getTutorialProgress(ctx.user.id)),
  saveProgress: protectedProcedure.input(z.object({ activeStep: z.number().int().min(0).max(4), completed: z.boolean() })).mutation(async ({ input, ctx }) => saveTutorialProgress({ ...input, userId: ctx.user.id })),
  submitFeedback: protectedProcedure.input(z.object({ category: z.enum(["Suggestion", "Issue", "Question"]), message: z.string().trim().min(12).max(1500), contactEmail: z.string().trim().email().max(320).optional() })).mutation(async ({ input, ctx }) => submitTutorialFeedback({ ...input, userId: ctx.user.id })),
});
