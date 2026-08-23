import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, Database, LayoutDashboard, Settings2, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/PortfolioChrome";

const tutorialSteps = [
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
] as const;

export default function HowToUse() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = tutorialSteps[activeIndex];
  const ActiveIcon = activeStep.icon;
  const previous = () => setActiveIndex((index) => Math.max(0, index - 1));
  const next = () => setActiveIndex((index) => Math.min(tutorialSteps.length - 1, index + 1));

  return <SiteShell><main className="tutorial-page">
    <section className="tutorial-hero"><div><span className="eyebrow"><ShieldCheck size={13} /> Interactive product guide</span><h1>Learn the control loop before you operate it.</h1><p>Use this short walkthrough to understand where each GRC activity belongs, what each role can do, and which boundaries keep the evidence trail defensible.</p></div><aside><span>Estimated route</span><strong>Five practical steps</strong><p>Choose a step, follow the recommended page, then return here whenever you need the broader operating context.</p></aside></section>

    <section className="tutorial-navigator" aria-label="Tutorial steps"><div className="tutorial-step-list" role="tablist" aria-label="How to use Control Ledger">{tutorialSteps.map((step, index) => { const Icon = step.icon; const selected = index === activeIndex; return <button key={step.title} role="tab" aria-selected={selected} className={selected ? "active" : ""} onClick={() => setActiveIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={15} /><strong>{step.kicker}</strong></button>; })}</div><div className="tutorial-progress" aria-label={`Step ${activeIndex + 1} of ${tutorialSteps.length}`}><span>Step {activeIndex + 1} of {tutorialSteps.length}</span><i><b style={{ width: `${((activeIndex + 1) / tutorialSteps.length) * 100}%` }} /></i></div></section>

    <section className="tutorial-stage" aria-live="polite"><aside><span className="tutorial-step-number">{String(activeIndex + 1).padStart(2, "0")}</span><ActiveIcon size={28} /><span>{activeStep.kicker}</span></aside><div><span className="eyebrow">What to do</span><h2>{activeStep.title}</h2><p>{activeStep.summary}</p><ol>{activeStep.checks.map((check, index) => <li key={check}><span>{index + 1}</span>{check}</li>)}</ol><div className="tutorial-actions"><Link href={activeStep.href} className="button-primary">{activeStep.action} <ArrowRight size={15} /></Link><div><button onClick={previous} disabled={activeIndex === 0}><ArrowLeft size={14} /> Previous</button><button onClick={next} disabled={activeIndex === tutorialSteps.length - 1}>Next <ArrowRight size={14} /></button></div></div></div></section>

    <section className="tutorial-boundaries"><div><span className="eyebrow"><ShieldCheck size={13} /> Operating boundaries</span><h2>Three safeguards to remember.</h2><p>The tutorial explains how the product works; it does not override role controls or provenance labels.</p></div><div className="tutorial-boundary-grid"><article><strong>Role-scoped actions</strong><p>Workspace duties gate evidence submission, assurance testing, and risk approval. Platform administrators retain configuration responsibility.</p></article><article><strong>Evidence stays managed</strong><p>Files are stored separately from lifecycle metadata. Expiry and legal holds shape access without deleting the accountability trail.</p></article><article><strong>Secrets stay server-side</strong><p>Google Directory and queued Gmail reminders display readiness only. OAuth client secrets and refresh tokens never belong in this website’s browser UI.</p></article></div></section>
  </main></SiteShell>;
}
