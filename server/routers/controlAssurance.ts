import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { applyRetentionTemplate, assignWorkspaceRole, attachEvidenceFile, bulkAssignWorkspaceRole, decideRiskAcceptance, getAdministrationData, getComplianceDashboardData, getControlAssuranceHubData, getFlowguardVerificationData, getRemediationExportPayload, getRetentionReviewDashboard, getRoleAssignmentAuditExport, getRoleAssignmentAuditPage, importRemediationSnapshot, ingestFlowGuardPaymentTrace, listEvidenceAttachments, listWorkspaceEvidenceAttachments, markReadyForGithubIssue, proposeRiskAcceptance, recordTestDecision, saveRetentionReviewSchedule, setEvidenceAttachmentRetention, setEvidenceReview, setFindingTreatment, setGrafanaWebhookConfig, submitEvidence, syncRemediationStatus, upsertRetentionTemplate } from "../controlAssuranceDb";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
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
  administration: adminProcedure.query(async () => {
    const data = await getAdministrationData();
    if (!data) throw new Error("The administration datastore is unavailable.");
    return data;
  }),
  roleAssignmentAudit: adminProcedure.input(z.object({ page: z.number().int().min(1), pageSize: z.number().int().min(10).max(100) })).query(async ({ input }) => getRoleAssignmentAuditPage(input)),
  roleAssignmentAuditExport: adminProcedure.query(async () => getRoleAssignmentAuditExport()),
  assignWorkspaceRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), workspaceRole: z.enum(["control_owner", "grc_analyst", "risk_approver"]), active: z.boolean() })).mutation(async ({ input, ctx }) => assignWorkspaceRole({ ...input, assignedBy: ctx.user.name || "Workspace administrator" })),
  bulkAssignWorkspaceRole: adminProcedure.input(z.object({ userIds: z.array(z.number().int().positive()).min(1).max(100), workspaceRole: z.enum(["control_owner", "grc_analyst", "risk_approver"]), active: z.boolean() })).mutation(async ({ input, ctx }) => bulkAssignWorkspaceRole({ ...input, assignedBy: ctx.user.name || "Workspace administrator" })),
  setAttachmentRetention: adminProcedure.input(z.object({ attachmentId: z.string().min(1).max(40), retentionUntil: z.coerce.date(), retentionStatus: z.enum(["Active", "Legal hold"]), retentionNote: z.string().max(500).nullable() })).mutation(async ({ input }) => setEvidenceAttachmentRetention(input)),
  upsertRetentionTemplate: adminProcedure.input(z.object({ templateId: z.string().min(1).max(40).optional(), title: z.string().min(3).max(120), evidenceType: z.enum(["Access review", "Change record", "Incident record", "Vulnerability scan", "Technical trace", "General"]), retentionDays: z.number().int().min(1).max(3650), retentionNote: z.string().min(3).max(500), active: z.boolean() })).mutation(async ({ input }) => upsertRetentionTemplate(input)),
  applyRetentionTemplate: adminProcedure.input(z.object({ attachmentId: z.string().min(1).max(40), templateId: z.string().min(1).max(40) })).mutation(async ({ input }) => applyRetentionTemplate(input)),
  setGrafanaWebhook: adminProcedure.input(z.object({ active: z.boolean() })).mutation(async ({ input, ctx }) => setGrafanaWebhookConfig({ ...input, updatedBy: ctx.user.name || "Workspace administrator" })),
  retentionReviewDashboard: adminProcedure.query(async () => getRetentionReviewDashboard()),
  configureRetentionReview: adminProcedure.input(z.object({ active: z.boolean(), cronExpression: z.string().regex(/^\d+\s+\d+\s+\d+\s+\*\s+\*\s+\d+$/, "Use a six-field UTC cron expression."), thresholdDays: z.number().int().min(1).max(365) })).mutation(async ({ input, ctx }) => {
    const existing = await getRetentionReviewDashboard();
    if (process.env.NODE_ENV !== "production" && input.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Publish the site before enabling the scheduled retention review." });
    let scheduleCronTaskUid = existing.schedule?.scheduleCronTaskUid ?? null;
    if (input.active && !scheduleCronTaskUid) {
      const job = await createHeartbeatJob({ name: "grc-retention-review", cron: input.cronExpression, path: "/api/scheduled/retention-review", description: "Weekly metadata-only evidence-retention review for GRC administrators." }, "");
      scheduleCronTaskUid = job.taskUid;
    } else if (scheduleCronTaskUid) {
      await updateHeartbeatJob(scheduleCronTaskUid, { cron: input.cronExpression, enable: input.active }, "");
    }
    return saveRetentionReviewSchedule({ ...input, scheduleCronTaskUid, configuredBy: ctx.user.name || "Workspace administrator" });
  }),
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
  ingestPaymentTrace: protectedProcedure.input(z.object({ sourceName: z.string().min(3).max(160), rawTrace: z.string().min(20).max(1_000_000) })).mutation(async ({ input, ctx }) => { await assertWorkspaceRole(ctx.user, ["grc_analyst"]); return ingestFlowGuardPaymentTrace({ ...input, ingestedBy: ctx.user.name || "Authenticated GRC analyst" }); }),
  remediationExport: publicProcedure.input(z.object({ findingId: z.string().min(1).max(40) })).query(async ({ input }) => getRemediationExportPayload(input.findingId)),
  importRemediationSnapshot: protectedProcedure.input(z.object({ findingId: z.string().min(1).max(40), provider: z.literal("GitHub Issues"), externalIssueNumber: z.number().int().positive(), externalIssueUrl: z.string().url(), externalState: z.enum(["open", "closed"]), observedAt: z.coerce.date(), provenance: z.literal("Simulated Case Study") })).mutation(async ({ input, ctx }) => { await assertWorkspaceRole(ctx.user, ["grc_analyst"]); return importRemediationSnapshot(input); }),
});
