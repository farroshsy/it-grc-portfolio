import { z } from "zod";
import { decideRiskAcceptance, getControlAssuranceHubData, getRemediationExportPayload, importRemediationSnapshot, markReadyForGithubIssue, proposeRiskAcceptance, recordTestDecision, setEvidenceReview, setFindingTreatment, submitEvidence, syncRemediationStatus } from "../controlAssuranceDb";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const controlAssuranceRouter = router({
  hub: publicProcedure.query(async () => {
    const data = await getControlAssuranceHubData();
    if (!data) throw new Error("The Control Assurance Hub datastore is unavailable.");
    return data;
  }),
  submitEvidence: protectedProcedure.input(z.object({ controlId: z.string().min(1).max(40), evidenceSummary: z.string().min(12).max(2000) })).mutation(async ({ input, ctx }) =>
    submitEvidence({ ...input, submittedBy: ctx.user.name || "Authenticated control owner" }),
  ),
  reviewEvidence: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40), status: z.enum(["Accepted", "Rejected"]), reviewNote: z.string().min(4).max(1200) })).mutation(async ({ input, ctx }) =>
    setEvidenceReview({ ...input, reviewedBy: ctx.user.name || "Authenticated GRC reviewer" }),
  ),
  recordTestDecision: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40), result: z.enum(["Effective", "Exception"]), conclusion: z.string().min(12).max(1600) })).mutation(async ({ input, ctx }) =>
    recordTestDecision({ ...input, testedBy: ctx.user.name || "Authenticated GRC analyst" }),
  ),
  setFindingTreatment: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), treatmentChoice: z.enum(["Remediation", "Risk acceptance"]) })).mutation(async ({ input }) => setFindingTreatment(input)),
  proposeRiskAcceptance: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), rationale: z.string().min(12).max(1600), expiresAt: z.coerce.date() })).mutation(async ({ input, ctx }) =>
    proposeRiskAcceptance({ ...input, riskOwner: ctx.user.name || "Authenticated risk owner", approver: "Technology Risk Approver" }),
  ),
  decideRiskAcceptance: protectedProcedure.input(z.object({ acceptanceId: z.string().min(1).max(40), decision: z.enum(["Approved", "Rejected"]) })).mutation(async ({ input, ctx }) =>
    decideRiskAcceptance({ ...input, approver: ctx.user.name || "Authenticated risk approver" }),
  ),
  prepareGithubIssue: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).mutation(async ({ input }) => markReadyForGithubIssue(input.findingId)),
  syncRemediation: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).mutation(async ({ input }) => syncRemediationStatus(input.findingId)),
  remediationExport: publicProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).query(async ({ input }) => getRemediationExportPayload(input.findingId)),
  importRemediationSnapshot: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), provider: z.literal("GitHub Issues"), externalIssueNumber: z.number().int().positive(), externalIssueUrl: z.string().url(), externalState: z.enum(["open", "closed"]), observedAt: z.coerce.date(), provenance: z.literal("Simulated Case Study") })).mutation(async ({ input }) => importRemediationSnapshot(input)),
});
