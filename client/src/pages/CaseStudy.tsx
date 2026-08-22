import { ArrowLeft, Braces, Copy, FileSearch, Loader2 } from "lucide-react";
import React from "react";
import { Link, useRoute } from "wouter";
import ArtifactViewer from "@/components/ArtifactViewer";
import PaymentSecurityDiagram, { PciInterviewReadiness } from "@/components/PaymentSecurityDiagram";
import { FrameworkTags, ProvenanceBadge, SiteShell } from "@/components/PortfolioChrome";
import SourcesPanel from "@/components/SourcesPanel";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { CaseSection, PortfolioArtifact, PortfolioSource, PortfolioStudy } from "@/lib/portfolioTypes";
import { requiredCaseStudySections } from "../../../shared/grcPresentation";

function LoadingCase() {
  return <div className="page-loading"><Loader2 className="animate-spin" /> Loading assessment record…</div>;
}

export default function CaseStudy() {
  const [, params] = useRoute("/case-studies/:slug");
  const slug = params?.slug ?? "";
  const { data, isLoading, error } = trpc.portfolio.caseStudy.useQuery({ slug });

  if (isLoading) return <SiteShell><LoadingCase /></SiteShell>;
  if (error || !data) return <SiteShell><main className="not-found-card"><FileSearch size={32} /><h1>Assessment record unavailable</h1><p>The selected case study could not be found or the data service is temporarily unavailable.</p><Link href="/">Return to portfolio</Link></main></SiteShell>;

  const study = data.study as PortfolioStudy;
  const sections = [...(data.sections as CaseSection[])].sort((a, b) => requiredCaseStudySections.indexOf(a.sectionTitle as (typeof requiredCaseStudySections)[number]) - requiredCaseStudySections.indexOf(b.sectionTitle as (typeof requiredCaseStudySections)[number]));
  const artifacts = data.artifacts as PortfolioArtifact[];
  const caseSources = data.sources as PortfolioSource[];
  const showCode = Boolean(study.code && study.codeLanguage);
  const isPaymentSecurityCase = study.slug === "fintech-risk-assessment";

  async function copyCode() {
    if (study.code) await navigator.clipboard.writeText(study.code);
  }

  return (
    <SiteShell>
      <main>
        <section className="case-hero" style={{ "--case-accent": study.accent } as React.CSSProperties}>
          <Link className="back-link" href="/"><ArrowLeft size={15} /> Portfolio index</Link>
          <div className="case-hero-grid">
            <div>
              <div className="case-meta"><ProvenanceBadge label={study.provenance} /><FrameworkTags frameworks={study.frameworks} /></div>
              <h1>{study.title}</h1>
              <p className="case-summary">{study.summary}</p>
            </div>
            <aside className="scenario-note"><span>Scenario boundary</span><p>{study.scenario}</p></aside>
          </div>
        </section>
        <section className="case-sections">
          {sections.map((section, index) => (
            <article className="case-section" id={section.sectionTitle.toLowerCase()} key={section.id}>
              <div className="section-index">{String(index + 1).padStart(2, "0")}</div>
              <div><span className="eyebrow">{section.sectionTitle}</span><p>{section.body}</p></div>
            </article>
          ))}
        </section>
        {isPaymentSecurityCase && <><PaymentSecurityDiagram /><PciInterviewReadiness /></>}
        {showCode && <section className="code-panel" aria-labelledby="automation-code-heading">
          <div className="code-panel-heading"><div><span className="eyebrow"><Braces size={13} /> Runnable {study.codeLanguage} code</span><h2 id="automation-code-heading">Evidence collection, not a substitute for review</h2><p>Run only with authorized cloud credentials. The script is shown for independent-research demonstration and is not executed by this website.</p></div><Button variant="outline" onClick={copyCode}><Copy size={15} /> Copy script</Button></div>
          <pre><code>{study.code}</code></pre>
        </section>}
        <ArtifactViewer artifacts={artifacts} />
        <SourcesPanel sources={caseSources} />
      </main>
    </SiteShell>
  );
}
