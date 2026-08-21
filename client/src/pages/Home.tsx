import { ArrowRight, ArrowUpRight, DatabaseZap, FileText, Loader2, ShieldCheck, Waypoints } from "lucide-react";
import { Link } from "wouter";
import { FrameworkTags, ProvenanceBadge, SiteShell } from "@/components/PortfolioChrome";
import { trpc } from "@/lib/trpc";
import type { PortfolioStudy } from "@/lib/portfolioTypes";

export default function Home() {
  const { data, isLoading, error } = trpc.portfolio.home.useQuery();
  const studies = (data?.studies ?? []) as PortfolioStudy[];
  const flagshipStudies = studies.filter((study) => study.slug !== "cloud-control-automation");
  const automation = studies.find((study) => study.slug === "cloud-control-automation");

  return (
    <SiteShell>
      <main>
        <section className="home-hero">
          <div className="hero-grid-pattern" aria-hidden="true" />
          <div className="hero-kicker"><span className="pulse-dot" /> IT GRC · Technology Risk · Compliance</div>
          <h1>translate ambiguous regulatory requirements into concrete technology controls.</h1>
          <p className="hero-intro">An evidence-led portfolio for fintech and technology GRC roles. I connect regulatory intent, operational risk, control design, testable evidence, and accountable remediation in one traceable operating model.</p>
          <div className="hero-actions"><a href="#case-studies" className="button-primary">Review case studies <ArrowRight size={16} /></a><Link href="/dashboard" className="button-secondary">Open governance view <ArrowUpRight size={16} /></Link></div>
          <div className="evidence-chain" aria-label="Governance evidence chain"><span>Requirement</span><i /><span>Risk</span><i /><span>Control</span><i /><span>Evidence</span><i /><span>Test</span><i /><span>Remediation</span></div>
        </section>

        <section className="statement-band"><div className="statement-icon"><Waypoints size={20} /></div><p>Foundational frameworks are the baseline. The emphasis is on <strong>continuous governance</strong>: controls that remain owned, observable, tested, and improved as systems, markets, and regulations change.</p></section>

        <section className="portfolio-section" id="case-studies">
          <div className="section-heading"><div><span className="eyebrow"><ShieldCheck size={13} /> Flagship work</span><h2>Four connected demonstrations of GRC practice</h2></div><p>Each assessment is intentionally bounded and provenance-labeled. The goal is not to simulate credentials; it is to show structured, auditable reasoning.</p></div>
          {isLoading && <div className="page-loading"><Loader2 className="animate-spin" /> Loading portfolio records…</div>}
          {error && <div className="error-state">The portfolio records could not be loaded. Please refresh and try again.</div>}
          <div className="case-study-grid">
            {flagshipStudies.map((study, index) => <CaseStudyCard study={study} index={index} key={study.id} />)}
          </div>
          {automation && <Link href={`/case-studies/${automation.slug}`} className="automation-callout"><div className="automation-icon"><DatabaseZap size={21} /></div><div><span className="eyebrow">Automation mini-project</span><h3>{automation.title}</h3><p>{automation.summary}</p><div className="callout-tags"><ProvenanceBadge label={automation.provenance} /><FrameworkTags frameworks={automation.frameworks} /></div></div><ArrowRight className="automation-arrow" size={22} /></Link>}
        </section>

        <section className="mapping-section">
          <div className="section-heading"><div><span className="eyebrow"><FileText size={13} /> Role alignment</span><h2>Job description → portfolio evidence</h2></div><p>The mapping makes the hiring signal explicit: each role requirement links to a concrete, inspectable piece of work.</p></div>
          <div className="mapping-table-wrap">
            <table className="mapping-table"><thead><tr><th>Xendit IT GRC Analyst requirement</th><th>Portfolio evidence</th><th>Assessment</th></tr></thead><tbody>
              {(data?.mappings ?? []).map((mapping) => <tr key={mapping.id}><td>{mapping.requirement}</td><td>{mapping.evidence}</td><td><Link href={`/case-studies/${mapping.caseStudySlug}`}>Inspect <ArrowUpRight size={13} /></Link></td></tr>)}
            </tbody></table>
          </div>
        </section>

        <section className="thinking-section">
          <div><span className="eyebrow">How I think</span><h2>From obligation to operational assurance</h2><p>When a new rule, framework update, or market requirement emerges, the work is not complete when it has been summarized. It becomes useful when it is translated into a decision that engineering and leadership can act on.</p></div>
          <ol className="thinking-steps"><li><span>01</span> Determine applicability and affected systems.</li><li><span>02</span> Translate obligations into risk and control objectives.</li><li><span>03</span> Assign owner, evidence, test method, and review cadence.</li><li><span>04</span> Escalate gaps, track remediation, and report residual risk.</li></ol>
        </section>
      </main>
    </SiteShell>
  );
}

function CaseStudyCard({ study, index }: { study: PortfolioStudy; index: number }) {
  return <Link href={`/case-studies/${study.slug}`} className="case-card" style={{ "--case-accent": study.accent } as React.CSSProperties}>
    <div className="card-topline"><span>0{index + 1}</span><ArrowUpRight size={17} /></div>
    <div><ProvenanceBadge label={study.provenance} /><h3>{study.title}</h3><p>{study.summary}</p></div>
    <FrameworkTags frameworks={study.frameworks} />
  </Link>;
}
