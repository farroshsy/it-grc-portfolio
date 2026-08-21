import React, { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Award, BookOpen, ClipboardCheck, Database, FileText, LayoutDashboard, Presentation, ShieldCheck } from "lucide-react";

export function ProvenanceBadge({ label }: { label: "Academic" | "Independent Research" | "Simulated Case Study" }) {
  return <span className="provenance-badge">{label}</span>;
}

export function FrameworkTags({ frameworks }: { frameworks: string[] }) {
  return (
    <div className="framework-tags" aria-label="Frameworks">
      {frameworks.map((framework) => <span key={framework} className="framework-tag">{framework}</span>)}
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const nav = [
    { href: "/", label: "Portfolio", icon: BookOpen },
    { href: "/workspace", label: "Workspace", icon: Database },
    { href: "/dashboard", label: "Governance view", icon: LayoutDashboard },
    { href: "/audit-room", label: "Audit room", icon: ClipboardCheck },
    { href: "/policy-pack", label: "Policy pack", icon: FileText },
    { href: "/executive-briefing", label: "Executive brief", icon: Presentation },
    { href: "/skills-certifications", label: "Skills", icon: Award },
  ];

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="GRC evidence portfolio home">
          <span className="brand-mark"><ShieldCheck size={17} strokeWidth={2.2} /></span>
          <span>Control Ledger</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={location === href ? "nav-link active" : "nav-link"}>
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>
        <a className="header-status" href="#portfolio-disclaimer">
          Evidence-led portfolio <ArrowUpRight size={13} />
        </a>
      </header>
      {children}
      <footer className="site-footer" id="portfolio-disclaimer">
        <div><strong>Control Ledger</strong> — an evidence-led IT GRC portfolio.</div>
        <p>All work is clearly labeled as Academic, Independent Research, or Simulated Case Study. It does not represent client work, certifications, regulatory relationships, or legal advice.</p>
      </footer>
    </div>
  );
}
