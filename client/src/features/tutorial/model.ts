import { BookOpen, ClipboardCheck, Database, LayoutDashboard, Settings2, type LucideIcon } from "lucide-react";

export const TUTORIAL_STEP_COUNT = 5;

export type TutorialStep = {
  kicker: string;
  title: string;
  summary: string;
  action: string;
  href: string;
  icon: LucideIcon;
  checks: readonly string[];
};

export const tutorialSteps: readonly TutorialStep[] = [
  {
    kicker: "Start with the map",
    title: "Choose the right surface for your task.",
    summary: "Control Ledger has two complementary surfaces: the public portfolio explains the assurance approach, while the authenticated workspace is where evidence, testing, remediation, and decisions are operated.",
    action: "Explore the portfolio",
    href: "/",
    icon: BookOpen,
    checks: ["Use case studies to understand the control rationale.", "Open Governance view to read the executive decision context.", "Sign in before attempting workspace operations."],
  },
  {
    kicker: "Control-owner path",
    title: "Submit evidence against a named control.",
    summary: "Control owners begin in the workspace. Record a concise evidence summary, attach the supporting file to managed storage, and keep the record tied to a specific control objective.",
    action: "Open the workspace",
    href: "/workspace",
    icon: Database,
    checks: ["Choose the relevant control before creating evidence.", "Attach the source file; file bytes remain in managed storage, not the operational database.", "Use a factual summary that lets an analyst understand what is being evidenced."],
  },
  {
    kicker: "GRC analyst path",
    title: "Test the evidence, then make the gap actionable.",
    summary: "Analysts review submitted evidence, record a test conclusion, and turn an ineffective result into a traceable finding with a remediation path. The compliance dashboard shows the resulting operating picture.",
    action: "Open compliance view",
    href: "/compliance-dashboard",
    icon: ClipboardCheck,
    checks: ["Use a reproducible test step and conclusion.", "Create or follow the linked remediation when a control is ineffective.", "Use Trace verify only for technical traces that are safe to process; raw payloads are not retained."],
  },
  {
    kicker: "Decision path",
    title: "Turn results into an owned risk decision.",
    summary: "Use the governance dashboard and executive briefing to convert evidence and finding status into priorities. Risk approvers can review the rationale, expiry, and residual-risk request without mistaking the portfolio for a legal or certification decision.",
    action: "Open governance view",
    href: "/dashboard",
    icon: LayoutDashboard,
    checks: ["Review open findings and pending acceptance decisions together.", "Set a clear expiration when an acceptance is justified.", "Keep framework mappings evidence-reference only; they are not certification claims."],
  },
  {
    kicker: "Administrator path",
    title: "Maintain accountable access and review cadence.",
    summary: "Administrators assign workspace duties, inspect the immutable role ledger, manage evidence retention, and save private audit views. Retention reminders are metadata-only. Google directory and email delivery remain server-side and are currently OAuth-pending.",
    action: "Open administration",
    href: "/administration",
    icon: Settings2,
    checks: ["Assign only the duty needed for the task: control owner, GRC analyst, or risk approver.", "Use retention templates and review the expiry queue before links are revoked.", "Configure Google credentials only in secure project settings—never in the browser."],
  },
];

export function tutorialHrefForStep(step: number) {
  const safeStep = Math.min(Math.max(Math.trunc(step), 0), TUTORIAL_STEP_COUNT - 1);
  return `/how-to-use?step=${safeStep + 1}`;
}
