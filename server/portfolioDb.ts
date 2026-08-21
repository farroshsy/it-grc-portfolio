import { asc, eq } from "drizzle-orm";
import {
  auditRequests,
  artifactRows,
  artifacts,
  caseStudies,
  caseStudyFrameworks,
  caseStudySections,
  controlTests,
  controls,
  jobMappings,
  policyRecords,
  remediationActions,
  risks,
  sources,
} from "../drizzle/schema";
import { getDb } from "./db";
import { ensureControlAssuranceSeeded } from "./controlAssuranceSeed";
import { ensurePortfolioSeeded } from "./portfolioSeed";

async function readyDb() {
  const db = await getDb();
  if (!db) return null;
  await ensurePortfolioSeeded();
  await ensureControlAssuranceSeeded();
  return db;
}

export async function getPortfolioHomeData() {
  const db = await readyDb();
  if (!db) return null;
  const [studies, frameworks, mappings] = await Promise.all([
    db.select().from(caseStudies).orderBy(asc(caseStudies.id)),
    db.select().from(caseStudyFrameworks),
    db.select().from(jobMappings).orderBy(asc(jobMappings.displayOrder)),
  ]);
  return {
    studies: studies.map((study) => ({ ...study, frameworks: frameworks.filter((item) => item.caseStudyId === study.id).map((item) => item.framework) })),
    mappings,
  };
}

export async function getCaseStudyDetail(slug: string) {
  const db = await readyDb();
  if (!db) return null;
  const [study] = await db.select().from(caseStudies).where(eq(caseStudies.slug, slug)).limit(1);
  if (!study) return null;
  const [frameworks, sections, studyArtifacts, studySources] = await Promise.all([
    db.select().from(caseStudyFrameworks).where(eq(caseStudyFrameworks.caseStudyId, study.id)),
    db.select().from(caseStudySections).where(eq(caseStudySections.caseStudyId, study.id)).orderBy(asc(caseStudySections.displayOrder)),
    db.select().from(artifacts).where(eq(artifacts.caseStudyId, study.id)).orderBy(asc(artifacts.id)),
    db.select().from(sources).where(eq(sources.caseStudyId, study.id)).orderBy(asc(sources.id)),
  ]);
  const rows = studyArtifacts.length
    ? await db.select().from(artifactRows).orderBy(asc(artifactRows.sortOrder))
    : [];
  return {
    study: { ...study, frameworks: frameworks.map((item) => item.framework) },
    sections,
    artifacts: studyArtifacts.map((artifact) => ({
      ...artifact,
      rows: rows.filter((row) => row.artifactId === artifact.id),
    })),
    sources: studySources,
  };
}

export async function getDashboardData() {
  const db = await readyDb();
  if (!db) return null;
  const [allRisks, allControls, allTests, allRemediation, studies, frameworks] = await Promise.all([
    db.select().from(risks).orderBy(asc(risks.riskId)),
    db.select().from(controls).orderBy(asc(controls.controlId)),
    db.select().from(controlTests).orderBy(asc(controlTests.testId)),
    db.select().from(remediationActions).orderBy(asc(remediationActions.dueDate)),
    db.select().from(caseStudies).orderBy(asc(caseStudies.id)),
    db.select().from(caseStudyFrameworks).orderBy(asc(caseStudyFrameworks.id)),
  ]);
  return { risks: allRisks, controls: allControls, tests: allTests, remediation: allRemediation, studies, frameworks };
}

export async function getAuditRoomData() {
  const db = await readyDb();
  if (!db) return null;
  const [requests, studies] = await Promise.all([
    db.select().from(auditRequests).orderBy(asc(auditRequests.dueDate)),
    db.select().from(caseStudies).orderBy(asc(caseStudies.id)),
  ]);
  return { requests, studies };
}

export async function getPolicyPackData() {
  const db = await readyDb();
  if (!db) return null;
  const policies = await db.select().from(policyRecords).orderBy(asc(policyRecords.policyId));
  return { policies };
}

export async function getExecutiveBriefingData() {
  const db = await readyDb();
  if (!db) return null;
  const [allRisks, allControls, allTests, allRemediation, requests] = await Promise.all([
    db.select().from(risks).orderBy(asc(risks.riskId)),
    db.select().from(controls).orderBy(asc(controls.controlId)),
    db.select().from(controlTests).orderBy(asc(controlTests.testId)),
    db.select().from(remediationActions).orderBy(asc(remediationActions.dueDate)),
    db.select().from(auditRequests).orderBy(asc(auditRequests.dueDate)),
  ]);
  return { risks: allRisks, controls: allControls, tests: allTests, remediation: allRemediation, auditRequests: requests };
}
