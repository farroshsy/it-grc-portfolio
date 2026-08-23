import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const provenanceValues = ["Academic", "Independent Research", "Simulated Case Study"] as const;
export const frameworkValues = ["ISO 27001", "PCI DSS", "BI/OJK", "NIST", "Cloud"] as const;
export const artifactTypeValues = ["Risk Register", "Control Matrix", "Gap Analysis", "Regulatory Mapping", "Control Testing", "Remediation Plan"] as const;
export const auditRequestStatusValues = ["Requested", "In review", "Closed", "Overdue"] as const;
export const policyStatusValues = ["Current", "Review due"] as const;
export const assuranceControlStatusValues = ["Evidence requested", "In testing", "Effective", "Exception"] as const;
export const evidenceSubmissionStatusValues = ["Draft", "Submitted", "Under review", "Accepted", "Rejected"] as const;
export const assuranceTestResultValues = ["Effective", "Exception"] as const;
export const findingStatusValues = ["Open", "Remediation planned", "In remediation", "Pending retest", "Closed", "Risk accepted"] as const;
export const treatmentChoiceValues = ["Remediation", "Risk acceptance"] as const;
export const riskAcceptanceStatusValues = ["Proposed", "Approved", "Rejected", "Expired"] as const;
export const remediationSyncStatusValues = ["Not connected", "Ready to create", "Synced open", "Synced closed", "Retest required"] as const;
export const grcWorkspaceRoleValues = ["control_owner", "grc_analyst", "risk_approver"] as const;
export const technicalVerdictValues = ["PASS", "FAIL", "INCONCLUSIVE"] as const;
export const evidenceRetentionStatusValues = ["Active", "Expired", "Legal hold"] as const;
export const evidenceTypeValues = ["Access review", "Change record", "Incident record", "Vulnerability scan", "Technical trace", "General"] as const;
export const tutorialFeedbackCategoryValues = ["Suggestion", "Issue", "Question"] as const;

/** Core user table backing the preconfigured authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Additional operational GRC roles. The template admin role retains every workspace permission. */
export const grcUserRoles = mysqlTable("grc_user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceRole: mysqlEnum("workspaceRole", grcWorkspaceRoleValues).notNull(),
  assignedBy: varchar("assignedBy", { length: 80 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("grc_user_roles_user_idx").on(table.userId),
  uniqueIndex("grc_user_role_unique").on(table.userId, table.workspaceRole),
]);

/** Immutable accountability ledger for administrator role assignments, including bulk operations. */
export const grcRoleAssignmentEvents = mysqlTable("grc_role_assignment_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 40 }).notNull(),
  batchId: varchar("batchId", { length: 40 }),
  userId: int("userId").notNull(),
  workspaceRole: mysqlEnum("workspaceRole", grcWorkspaceRoleValues).notNull(),
  previousActive: boolean("previousActive"),
  resultingActive: boolean("resultingActive").notNull(),
  assignedBy: varchar("assignedBy", { length: 80 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
}, (table) => [
  uniqueIndex("grc_role_assignment_event_identifier_unique").on(table.eventId),
  index("grc_role_assignment_event_user_idx").on(table.userId, table.occurredAt),
  index("grc_role_assignment_event_batch_idx").on(table.batchId),
]);

export const caseStudies = mysqlTable("case_studies", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  shortTitle: varchar("shortTitle", { length: 72 }).notNull(),
  summary: text("summary").notNull(),
  scenario: text("scenario").notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
  accent: varchar("accent", { length: 20 }).notNull(),
  featured: boolean("featured").default(true).notNull(),
  codeLanguage: varchar("codeLanguage", { length: 32 }),
  code: text("code"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const caseStudyFrameworks = mysqlTable("case_study_frameworks", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  framework: mysqlEnum("framework", frameworkValues).notNull(),
}, (table) => [
  index("case_study_frameworks_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("case_study_framework_unique").on(table.caseStudyId, table.framework),
]);

export const caseStudySections = mysqlTable("case_study_sections", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  sectionTitle: varchar("sectionTitle", { length: 32 }).notNull(),
  body: text("body").notNull(),
  displayOrder: int("displayOrder").notNull(),
}, (table) => [
  index("case_study_sections_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("case_study_section_order_unique").on(table.caseStudyId, table.displayOrder),
]);

export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  type: mysqlEnum("type", artifactTypeValues).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
  columns: json("columns").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("artifacts_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("artifact_type_per_case_unique").on(table.caseStudyId, table.type),
]);

export const artifactRows = mysqlTable("artifact_rows", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  sortOrder: int("sortOrder").notNull(),
  record: json("record").$type<Record<string, string | number>>().notNull(),
}, (table) => [
  index("artifact_rows_artifact_id_idx").on(table.artifactId),
  uniqueIndex("artifact_row_order_unique").on(table.artifactId, table.sortOrder),
]);

export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  riskId: varchar("riskId", { length: 32 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  businessUnit: varchar("businessUnit", { length: 80 }).notNull(),
  likelihood: int("likelihood").notNull(),
  impact: int("impact").notNull(),
  inherentRisk: int("inherentRisk").notNull(),
  residualRisk: int("residualRisk").notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  dueDate: timestamp("dueDate"),
}, (table) => [
  index("risks_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("risk_identifier_unique").on(table.riskId),
]);

export const controls = mysqlTable("controls", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  domain: varchar("domain", { length: 80 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  effectiveness: int("effectiveness").notNull(),
}, (table) => [
  index("controls_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("control_identifier_unique").on(table.controlId),
]);

export const controlTests = mysqlTable("control_tests", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  testId: varchar("testId", { length: 40 }).notNull(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  result: varchar("result", { length: 40 }).notNull(),
  severity: varchar("severity", { length: 40 }).notNull(),
}, (table) => [
  index("control_tests_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("control_test_identifier_unique").on(table.testId),
]);

export const remediationActions = mysqlTable("remediation_actions", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  actionId: varchar("actionId", { length: 40 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  linkedRiskId: varchar("linkedRiskId", { length: 32 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  severity: varchar("severity", { length: 40 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
}, (table) => [
  index("remediation_case_study_id_idx").on(table.caseStudyId),
  uniqueIndex("remediation_action_identifier_unique").on(table.actionId),
]);

export const auditRequests = mysqlTable("audit_requests", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId").notNull(),
  requestId: varchar("requestId", { length: 40 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  domain: varchar("domain", { length: 80 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  status: mysqlEnum("status", auditRequestStatusValues).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  closureEvidence: text("closureEvidence").notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  index("audit_requests_case_study_id_idx").on(table.caseStudyId),
  index("audit_requests_status_idx").on(table.status),
  uniqueIndex("audit_request_identifier_unique").on(table.requestId),
]);

export const policyRecords = mysqlTable("policy_records", {
  id: int("id").autoincrement().primaryKey(),
  policyId: varchar("policyId", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  domain: varchar("domain", { length: 80 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  version: varchar("version", { length: 24 }).notNull(),
  reviewCycle: varchar("reviewCycle", { length: 80 }).notNull(),
  status: mysqlEnum("status", policyStatusValues).notNull(),
  purpose: text("purpose").notNull(),
  operatingRules: json("operatingRules").$type<string[]>().notNull(),
  evidenceExamples: json("evidenceExamples").$type<string[]>().notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  index("policy_records_domain_idx").on(table.domain),
  uniqueIndex("policy_record_identifier_unique").on(table.policyId),
]);

export const grcSystems = mysqlTable("grc_systems", {
  id: int("id").autoincrement().primaryKey(),
  systemId: varchar("systemId", { length: 40 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  criticality: varchar("criticality", { length: 32 }).notNull(),
  dataClassification: varchar("dataClassification", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [uniqueIndex("grc_system_identifier_unique").on(table.systemId)]);

export const assuranceControls = mysqlTable("assurance_controls", {
  id: int("id").autoincrement().primaryKey(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  systemId: varchar("systemId", { length: 40 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  objective: text("objective").notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  frequency: varchar("frequency", { length: 60 }).notNull(),
  framework: varchar("framework", { length: 80 }).notNull(),
  status: mysqlEnum("status", assuranceControlStatusValues).notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("assurance_controls_system_idx").on(table.systemId), uniqueIndex("assurance_control_identifier_unique").on(table.controlId)]);

export const evidenceSubmissions = mysqlTable("evidence_submissions", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: varchar("submissionId", { length: 40 }).notNull(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  status: mysqlEnum("status", evidenceSubmissionStatusValues).notNull(),
  evidenceSummary: text("evidenceSummary").notNull(),
  submittedBy: varchar("submittedBy", { length: 80 }).notNull(),
  submittedAt: timestamp("submittedAt").notNull(),
  reviewedBy: varchar("reviewedBy", { length: 80 }),
  reviewNote: text("reviewNote"),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("evidence_submissions_control_idx").on(table.controlId), index("evidence_submissions_status_idx").on(table.status), uniqueIndex("evidence_submission_identifier_unique").on(table.submissionId)]);

/** File metadata is stored in MySQL; binary evidence is stored through the managed object-storage helper. */
export const evidenceAttachments = mysqlTable("evidence_attachments", {
  id: int("id").autoincrement().primaryKey(),
  attachmentId: varchar("attachmentId", { length: 40 }).notNull(),
  submissionId: varchar("submissionId", { length: 40 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 120 }).notNull(),
  byteSize: int("byteSize").notNull(),
  storageKey: text("storageKey").notNull(),
  storageUrl: text("storageUrl").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 80 }).notNull(),
  uploadedAt: timestamp("uploadedAt").notNull(),
  retentionUntil: timestamp("retentionUntil").notNull(),
  retentionStatus: mysqlEnum("retentionStatus", evidenceRetentionStatusValues).default("Active").notNull(),
  expiredAt: timestamp("expiredAt"),
  retentionNote: text("retentionNote"),
  evidenceType: mysqlEnum("evidenceType", evidenceTypeValues).default("General").notNull(),
  retentionTemplateId: varchar("retentionTemplateId", { length: 40 }),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  index("evidence_attachments_submission_idx").on(table.submissionId),
  index("evidence_attachments_retention_idx").on(table.retentionUntil, table.retentionStatus),
  uniqueIndex("evidence_attachment_identifier_unique").on(table.attachmentId),
]);

/** Reusable administrator-managed lifecycle settings, categorized by evidence type. */
export const evidenceRetentionTemplates = mysqlTable("evidence_retention_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateId: varchar("templateId", { length: 40 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  evidenceType: mysqlEnum("evidenceType", evidenceTypeValues).notNull(),
  retentionDays: int("retentionDays").notNull(),
  retentionNote: text("retentionNote").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("evidence_retention_template_identifier_unique").on(table.templateId),
  index("evidence_retention_template_type_idx").on(table.evidenceType, table.active),
]);

/** Administrator-managed recurring review settings; schedule ownership is stored by Heartbeat task UID. */
export const retentionReviewSchedules = mysqlTable("retention_review_schedules", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: varchar("scheduleId", { length: 40 }).notNull(),
  active: boolean("active").default(false).notNull(),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  thresholdDays: int("thresholdDays").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  lastRunReminderCount: int("lastRunReminderCount").default(0).notNull(),
  configuredBy: varchar("configuredBy", { length: 80 }).notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => [
  uniqueIndex("retention_review_schedule_identifier_unique").on(table.scheduleId),
  index("retention_review_schedule_task_uid_idx").on(table.scheduleCronTaskUid),
]);

/** Immutable metadata-only execution history for scheduled evidence-retention reviews. */
export const retentionReviewRuns = mysqlTable("retention_review_runs", {
  id: int("id").autoincrement().primaryKey(),
  runId: varchar("runId", { length: 40 }).notNull(),
  scheduleId: varchar("scheduleId", { length: 40 }).notNull(),
  executedAt: timestamp("executedAt").notNull(),
  dueAttachmentCount: int("dueAttachmentCount").notNull(),
  overdueAttachmentCount: int("overdueAttachmentCount").notNull(),
  status: varchar("status", { length: 40 }).notNull(),
}, (table) => [
  uniqueIndex("retention_review_run_identifier_unique").on(table.runId),
  index("retention_review_runs_schedule_idx").on(table.scheduleId, table.executedAt),
]);

/** Per-recipient delivery metadata for retention review reminders. File names, evidence content, and storage links are never stored here. */
export const retentionReviewNotifications = mysqlTable("retention_review_notifications", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: varchar("notificationId", { length: 56 }).notNull(),
  runId: varchar("runId", { length: 40 }).notNull(),
  recipientUserId: int("recipientUserId").notNull(),
  channel: varchar("channel", { length: 24 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  dueAttachmentCount: int("dueAttachmentCount").notNull(),
  overdueAttachmentCount: int("overdueAttachmentCount").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  readAt: timestamp("readAt"),
  deliveryAttemptedAt: timestamp("deliveryAttemptedAt"),
  deliveredAt: timestamp("deliveredAt"),
  deliveryError: varchar("deliveryError", { length: 160 }),
}, (table) => [
  uniqueIndex("retention_review_notification_identifier_unique").on(table.notificationId),
  uniqueIndex("retention_review_notification_delivery_unique").on(table.runId, table.recipientUserId, table.channel),
  index("retention_review_notification_recipient_idx").on(table.recipientUserId, table.readAt, table.createdAt),
]);

/** Per-administrator delivery preferences; credentials and recipient addresses are not stored in this operational table. */
export const retentionReviewNotificationPreferences = mysqlTable("retention_review_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("retention_review_notification_preference_user_unique").on(table.userId),
]);

/** Personal administrator shortcuts for frequently used audit-log filters. */
export const grcSavedAuditViews = mysqlTable("grc_saved_audit_views", {
  id: int("id").autoincrement().primaryKey(),
  viewId: varchar("viewId", { length: 48 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  workspaceRole: varchar("workspaceRole", { length: 40 }),
  assignedBy: varchar("assignedBy", { length: 80 }),
  createdAt: timestamp("createdAt").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
}, (table) => [
  uniqueIndex("grc_saved_audit_view_identifier_unique").on(table.viewId),
  uniqueIndex("grc_saved_audit_view_owner_title_unique").on(table.ownerUserId, table.title),
  index("grc_saved_audit_view_owner_idx").on(table.ownerUserId, table.createdAt),
]);

/** Personal walkthrough progress; this stores only the active tutorial step and never workspace evidence or role data. */
export const tutorialProgress = mysqlTable("tutorial_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  activeStep: int("activeStep").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("tutorial_progress_user_unique").on(table.userId),
]);

/** Private user state for the administrator console; onboarding items are opaque keys, not evidence or audit records. */
export const userExperiencePreferences = mysqlTable("user_experience_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adminDarkMode: boolean("adminDarkMode").default(false).notNull(),
  onboardingSteps: json("onboardingSteps").$type<string[]>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("user_experience_preferences_user_unique").on(table.userId),
]);

/** Authenticated product feedback; separate from control evidence, audit workpapers, and administrative records. */
export const tutorialFeedback = mysqlTable("tutorial_feedback", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: varchar("feedbackId", { length: 40 }).notNull(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", tutorialFeedbackCategoryValues).notNull(),
  message: text("message").notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tutorial_feedback_identifier_unique").on(table.feedbackId),
  index("tutorial_feedback_user_created_idx").on(table.userId, table.createdAt),
]);

export const assuranceTests = mysqlTable("assurance_tests", {
  id: int("id").autoincrement().primaryKey(),
  assuranceTestId: varchar("assuranceTestId", { length: 40 }).notNull(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  submissionId: varchar("submissionId", { length: 40 }).notNull(),
  testProcedure: text("testProcedure").notNull(),
  result: mysqlEnum("result", assuranceTestResultValues).notNull(),
  conclusion: text("conclusion").notNull(),
  testedBy: varchar("testedBy", { length: 80 }).notNull(),
  testedAt: timestamp("testedAt").notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("assurance_tests_control_idx").on(table.controlId), index("assurance_tests_submission_idx").on(table.submissionId), uniqueIndex("assurance_test_identifier_unique").on(table.assuranceTestId)]);

export const grcFindings = mysqlTable("grc_findings", {
  id: int("id").autoincrement().primaryKey(),
  findingId: varchar("findingId", { length: 40 }).notNull(),
  assuranceTestId: varchar("assuranceTestId", { length: 40 }).notNull(),
  controlId: varchar("controlId", { length: 40 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 40 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  status: mysqlEnum("status", findingStatusValues).notNull(),
  treatmentChoice: mysqlEnum("treatmentChoice", treatmentChoiceValues).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("grc_findings_control_idx").on(table.controlId), index("grc_findings_status_idx").on(table.status), uniqueIndex("grc_finding_identifier_unique").on(table.findingId)]);

export const riskAcceptances = mysqlTable("risk_acceptances", {
  id: int("id").autoincrement().primaryKey(),
  acceptanceId: varchar("acceptanceId", { length: 40 }).notNull(),
  findingId: varchar("findingId", { length: 40 }).notNull(),
  status: mysqlEnum("status", riskAcceptanceStatusValues).notNull(),
  rationale: text("rationale").notNull(),
  riskOwner: varchar("riskOwner", { length: 80 }).notNull(),
  approver: varchar("approver", { length: 80 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  decisionAt: timestamp("decisionAt"),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("risk_acceptances_finding_idx").on(table.findingId), uniqueIndex("risk_acceptance_identifier_unique").on(table.acceptanceId)]);

export const githubRemediationLinks = mysqlTable("github_remediation_links", {
  id: int("id").autoincrement().primaryKey(),
  linkId: varchar("linkId", { length: 40 }).notNull(),
  findingId: varchar("findingId", { length: 40 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  repository: varchar("repository", { length: 160 }).notNull(),
  issueNumber: int("issueNumber"),
  issueUrl: text("issueUrl"),
  syncStatus: mysqlEnum("syncStatus", remediationSyncStatusValues).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  lastError: text("lastError"),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [index("github_remediation_finding_idx").on(table.findingId), uniqueIndex("github_remediation_link_identifier_unique").on(table.linkId)]);

/** Executable technical-control contracts map to the existing assurance control catalogue, not a parallel taxonomy. */
export const flowguardControlContracts = mysqlTable("flowguard_control_contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractId: varchar("contractId", { length: 40 }).notNull(),
  controlKey: varchar("controlKey", { length: 40 }).notNull(),
  mappedControlId: varchar("mappedControlId", { length: 40 }).notNull(),
  process: varchar("process", { length: 120 }).notNull(),
  contractYaml: text("contractYaml").notNull(),
  provenanceSource: varchar("provenanceSource", { length: 160 }).notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("flowguard_contract_identifier_unique").on(table.contractId),
  uniqueIndex("flowguard_control_key_unique").on(table.controlKey),
  index("flowguard_contract_mapped_control_idx").on(table.mappedControlId),
]);

/** Immutable trace/fixture execution evidence. A retest creates a new row instead of changing a historical verdict. */
export const flowguardControlExecutions = mysqlTable("flowguard_control_executions", {
  id: int("id").autoincrement().primaryKey(),
  executionId: varchar("executionId", { length: 40 }).notNull(),
  contractId: varchar("contractId", { length: 40 }).notNull(),
  controlKey: varchar("controlKey", { length: 40 }).notNull(),
  mappedControlId: varchar("mappedControlId", { length: 40 }).notNull(),
  verdict: mysqlEnum("verdict", technicalVerdictValues).notNull(),
  traceId: varchar("traceId", { length: 160 }).notNull(),
  evidenceHash: varchar("evidenceHash", { length: 160 }).notNull(),
  firstFinding: text("firstFinding"),
  occurredAt: timestamp("occurredAt").notNull(),
  provenanceSource: varchar("provenanceSource", { length: 160 }).notNull(),
  biOjkEvidenceReference: varchar("biOjkEvidenceReference", { length: 160 }),
  iso27001EvidenceReference: varchar("iso27001EvidenceReference", { length: 160 }),
  mappingInterpretationNote: text("mappingInterpretationNote"),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  uniqueIndex("flowguard_execution_identifier_unique").on(table.executionId),
  uniqueIndex("flowguard_evidence_hash_unique").on(table.evidenceHash),
  index("flowguard_execution_control_idx").on(table.mappedControlId),
  index("flowguard_execution_occurred_idx").on(table.occurredAt),
]);

export const flowguardExceptions = mysqlTable("flowguard_exceptions", {
  id: int("id").autoincrement().primaryKey(),
  exceptionId: varchar("exceptionId", { length: 40 }).notNull(),
  executionId: varchar("executionId", { length: 40 }).notNull(),
  linkedFindingId: varchar("linkedFindingId", { length: 40 }),
  title: varchar("title", { length: 250 }).notNull(),
  owner: varchar("owner", { length: 80 }).notNull(),
  dueDate: timestamp("dueDate"),
  remediation: text("remediation").notNull(),
  retestStatus: varchar("retestStatus", { length: 60 }).notNull(),
  status: varchar("status", { length: 60 }).notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  uniqueIndex("flowguard_exception_identifier_unique").on(table.exceptionId),
  index("flowguard_exception_execution_idx").on(table.executionId),
]);

/** Persists audit metadata only; raw trace-export payloads are evaluated transiently and are never stored. */
export const flowguardTraceImports = mysqlTable("flowguard_trace_imports", {
  id: int("id").autoincrement().primaryKey(),
  importId: varchar("importId", { length: 40 }).notNull(),
  executionId: varchar("executionId", { length: 40 }).notNull(),
  sourceName: varchar("sourceName", { length: 160 }).notNull(),
  sourceShape: varchar("sourceShape", { length: 32 }).notNull(),
  spanCount: int("spanCount").notNull(),
  traceId: varchar("traceId", { length: 160 }).notNull(),
  ingestedBy: varchar("ingestedBy", { length: 80 }).notNull(),
  ingestedAt: timestamp("ingestedAt").notNull(),
  rawTraceStored: boolean("rawTraceStored").default(false).notNull(),
  provenance: mysqlEnum("provenance", provenanceValues).notNull(),
}, (table) => [
  uniqueIndex("flowguard_trace_import_identifier_unique").on(table.importId),
  uniqueIndex("flowguard_trace_import_execution_unique").on(table.executionId),
  index("flowguard_trace_imported_at_idx").on(table.ingestedAt),
]);

/** Grafana is explicit and inactive by default; its HMAC secret is stored only in server environment configuration. */
export const flowguardWebhookConfigs = mysqlTable("flowguard_webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  configId: varchar("configId", { length: 40 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  active: boolean("active").default(false).notNull(),
  endpointPath: varchar("endpointPath", { length: 160 }).notNull(),
  updatedBy: varchar("updatedBy", { length: 80 }).notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => [
  uniqueIndex("flowguard_webhook_config_identifier_unique").on(table.configId),
  uniqueIndex("flowguard_webhook_provider_unique").on(table.provider),
]);

/** Lightweight idempotency and audit receipt; raw webhook payloads are never retained. */
export const flowguardWebhookDeliveries = mysqlTable("flowguard_webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: varchar("deliveryId", { length: 96 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  receivedAt: timestamp("receivedAt").notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  executionId: varchar("executionId", { length: 40 }),
}, (table) => [
  uniqueIndex("flowguard_webhook_delivery_identifier_unique").on(table.deliveryId),
  index("flowguard_webhook_delivery_received_idx").on(table.receivedAt),
]);

export const sources = mysqlTable("sources", {
  id: int("id").autoincrement().primaryKey(),
  caseStudyId: int("caseStudyId"),
  authority: varchar("authority", { length: 120 }).notNull(),
  publication: varchar("publication", { length: 300 }).notNull(),
  versionDate: varchar("versionDate", { length: 100 }).notNull(),
  url: text("url").notNull(),
  note: text("note").notNull(),
}, (table) => [index("sources_case_study_id_idx").on(table.caseStudyId)]);

export const jobMappings = mysqlTable("job_mappings", {
  id: int("id").autoincrement().primaryKey(),
  requirement: varchar("requirement", { length: 255 }).notNull(),
  evidence: varchar("evidence", { length: 255 }).notNull(),
  caseStudySlug: varchar("caseStudySlug", { length: 96 }).notNull(),
  displayOrder: int("displayOrder").notNull(),
}, (table) => [uniqueIndex("job_mapping_order_unique").on(table.displayOrder)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
