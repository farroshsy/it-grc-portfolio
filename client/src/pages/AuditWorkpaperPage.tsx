import React from "react";
import { SiteShell } from "@/components/PortfolioChrome";
import { TutorialHelpLink } from "@/features/tutorial/TutorialHelpLink";
import AuditWorkpaper from "@/components/AuditWorkpaper";

export default function AuditWorkpaperPage() { return <SiteShell><main className="workpaper-page"><TutorialHelpLink step={2} label="Need help with workpaper testing?" /><AuditWorkpaper /><section className="workpaper-reference"><h2>Method note</h2><p>The workpaper uses a fictional population and samples to demonstrate planning, evidence inspection, exception treatment, and conclusion writing. NIST SP 800-53A Rev. 5 provides public methodological context for adaptable control-assessment procedures; this portfolio does not reproduce those procedures or issue assurance.</p><a href="https://csrc.nist.gov/pubs/sp/800/53/a/r5/final" target="_blank" rel="noreferrer">Review NIST SP 800-53A Rev. 5 ↗</a></section></main></SiteShell>; }
