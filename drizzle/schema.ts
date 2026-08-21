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
