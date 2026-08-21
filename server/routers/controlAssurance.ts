import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { attachEvidenceFile, decideRiskAcceptance, getComplianceDashboardData, getControlAssuranceHubData, getFlowguardVerificationData, getRemediationExportPayload, importRemediationSnapshot, listEvidenceAttachments, listWorkspaceEvidenceAttachments, markReadyForGithubIssue, proposeRiskAcceptance, recordTestDecision, setEvidenceReview, setFindingTreatment, submitEvidence, syncRemediationStatus } from "../controlAssuranceDb";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { canPerformWorkspaceAction, getWorkspaceRoles, type WorkspaceRole } from "../grcAccess";

async function assertWorkspaceRole(user: Parameters<typeof getWorkspaceRoles>[0], allowed: WorkspaceRole[]) {
  const roles = await getWorkspaceRoles(user);
  if (!canPerformWorkspaceAction(roles, allowed)) throw new TRPCError({ code: "FORBIDDEN", message: `This action requires one of: ${allowed.join(", ")}.` });
  return roles;
}

export const controlAssuranceRouter = router({
  hub: publicProcedure.query(async () => {
    const data = await getControlAssuranceHubData();
    if (!data) throw new Error("The Control Assurance Hub datastore is unavailable.");
    return data;
  }),
  complianceDashboard: protectedProcedure.query(async ({ ctx }) => {
    const roles = await assertWorkspaceRole(ctx.user, ["control_owner", "grc_analyst", "risk_approver"]);
    const data = await getComplianceDashboardData();
    if (!data) throw new Error("The compliance dashboard datastore is unavailable.");
    return { ...data, roles };
  }),
  technicalVerification: protectedProcedure.query(async ({ ctx }) => {
    const roles = await assertWorkspaceRole(ctx.user, ["control_owner", "grc_analyst", "risk_approver"]);
    const data = await getFlowguardVerificationData();
    if (!data) throw new Error("The technical-verification datastore is unavailable.");
    return { ...data, roles };
  }),
  myAccess: protectedProcedure.query(async ({ ctx }) => ({ roles: await getWorkspaceRoles(ctx.user), isAdministrator: ctx.user.role === "admin" })),
  submitEvidence: protectedProcedure.input(z.object({ controlId: z.string().min(1).max(40), evidenceSummary: z.string().min(12).max(2000) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["control_owner"]);
    return submitEvidence({ ...input, submittedBy: ctx.user.name || "Authenticated control owner" });
  }),
  attachEvidence: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40), fileName: z.string().min(1).max(255), contentType: z.string().min(3).max(120), base64Data: z.string().min(4).max(7_000_000) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["control_owner"]);
    return attachEvidenceFile({ ...input, uploadedBy: ctx.user.name || "Authenticated control owner" });
  }),
  evidenceAttachments: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40) })).query(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["control_owner", "grc_analyst", "risk_approver"]);
    return listEvidenceAttachments(input.submissionId);
  }),
  evidenceAttachmentIndex: protectedProcedure.query(async ({ ctx }) => {
    await assertWorkspaceRole(ctx.user, ["control_owner", "grc_analyst", "risk_approver"]);
    return listWorkspaceEvidenceAttachments();
  }),
  reviewEvidence: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40), status: z.enum(["Accepted", "Rejected"]), reviewNote: z.string().min(4).max(1200) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["grc_analyst"]);
    return setEvidenceReview({ ...input, reviewedBy: ctx.user.name || "Authenticated GRC reviewer" });
  }),
  recordTestDecision: protectedProcedure.input(z.object({ submissionId: z.string().min(1).max(40), result: z.enum(["Effective", "Exception"]), conclusion: z.string().min(12).max(1600) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["grc_analyst"]);
    return recordTestDecision({ ...input, testedBy: ctx.user.name || "Authenticated GRC analyst" });
  }),
  setFindingTreatment: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), treatmentChoice: z.enum(["Remediation", "Risk acceptance"]) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["grc_analyst"]);
    return setFindingTreatment(input);
  }),
  proposeRiskAcceptance: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), rationale: z.string().min(12).max(1600), expiresAt: z.coerce.date() })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["risk_approver"]);
    return proposeRiskAcceptance({ ...input, riskOwner: ctx.user.name || "Authenticated risk owner", approver: ctx.user.name || "Technology Risk Approver" });
  }),
  decideRiskAcceptance: protectedProcedure.input(z.object({ acceptanceId: z.string().min(1).max(40), decision: z.enum(["Approved", "Rejected"]) })).mutation(async ({ input, ctx }) => {
    await assertWorkspaceRole(ctx.user, ["risk_approver"]);
    return decideRiskAcceptance({ ...input, approver: ctx.user.name || "Authenticated risk approver" });
  }),
  prepareGithubIssue: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).mutation(async ({ input, ctx }) => { await assertWorkspaceRole(ctx.user, ["grc_analyst"]); return markReadyForGithubIssue(input.findingId); }),
  syncRemediation: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).mutation(async ({ input, ctx }) => { await assertWorkspaceRole(ctx.user, ["grc_analyst"]); return syncRemediationStatus(input.findingId); }),
  remediationExport: publicProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).query(async ({ input }) => getRemediationExportPayload(input.findingId)),
  importRemediationSnapshot: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), provider: z.literal("GitHub Issues"), externalIssueNumber: z.number().int().positive(), externalIssueUrl: z.string().url(), externalState: z.enum(["open", "closed"]), observedAt: z.coerce.date(), provenance: z.literal("Simulated Case Study") })).mutation(async ({ input, ctx }) => { await assertWorkspaceRole(ctx.user, ["grc_analyst"]); return importRemediationSnapshot(input); }),
});
