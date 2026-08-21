import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const provenanceValues = ["Academic", "Independent Research", "Simulated Case Study"] as const;
export const frameworkValues = ["ISO 27001", "PCI DSS", "BI/OJK", "NIST", "Cloud"] as const;
export const artifactTypeValues = ["Risk Register", "Control Matrix", "Gap Analysis", "Regulatory Mapping", "Control Testing", "Remediation Plan"] as const;

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
