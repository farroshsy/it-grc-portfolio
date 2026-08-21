import { ExternalLink, LibraryBig } from "lucide-react";
import type { PortfolioSource } from "@/lib/portfolioTypes";

export default function SourcesPanel({ sources }: { sources: PortfolioSource[] }) {
  return (
    <section className="sources-panel" aria-labelledby="sources-heading">
      <div className="section-heading compact"><span className="eyebrow"><LibraryBig size={13} /> Sources</span><h2 id="sources-heading">Primary publications behind this assessment model</h2></div>
      <div className="sources-grid">
        {sources.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="source-meta"><span>{source.authority}</span><span>{source.versionDate}</span></div>
            <h3>{source.publication}</h3>
            <p>{source.note}</p>
            <a href={source.url} target="_blank" rel="noreferrer">View source <ExternalLink size={13} /></a>
          </article>
        ))}
      </div>
    </section>
  );
}
