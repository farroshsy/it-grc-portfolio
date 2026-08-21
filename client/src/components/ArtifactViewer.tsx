import { ArrowDownUp, Database, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { PortfolioArtifact } from "@/lib/portfolioTypes";
import { ProvenanceBadge } from "./PortfolioChrome";

function asText(value: string | number | undefined) {
  return value === undefined ? "—" : String(value);
}

export default function ArtifactViewer({ artifacts }: { artifacts: PortfolioArtifact[] }) {
  const [activeId, setActiveId] = useState<number>(artifacts[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const active = artifacts.find((artifact) => artifact.id === activeId) ?? artifacts[0];

  const rows = useMemo(() => {
    if (!active) return [];
    const needle = query.trim().toLowerCase();
    const filtered = active.rows.filter((row) => !needle || Object.values(row.record).some((value) => String(value).toLowerCase().includes(needle)));
    if (!sort) return filtered;
    return [...filtered].sort((left, right) => {
      const a = left.record[sort.column];
      const b = right.record[sort.column];
      const comparison = typeof a === "number" && typeof b === "number" ? a - b : asText(a).localeCompare(asText(b));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [active, query, sort]);

  if (!active) return null;

  function toggleSort(column: string) {
    setSort((current) => current?.column === column ? { column, direction: current.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" });
  }

  return (
    <section className="artifact-workspace" aria-labelledby="artifact-workspace-heading">
      <div className="artifact-workspace-header">
        <div>
          <span className="eyebrow"><Database size={13} /> Artifact workspace</span>
          <h2 id="artifact-workspace-heading">Inspectable evidence records</h2>
          <p>Records are returned by the portfolio data service. Filter, sort, and inspect the simulated or independent-research workpapers.</p>
        </div>
        <ProvenanceBadge label={active.provenance} />
      </div>
      <div className="artifact-tabs" role="tablist" aria-label="Artifact type">
        {artifacts.map((artifact) => (
          <button key={artifact.id} role="tab" aria-selected={artifact.id === active.id} className={artifact.id === active.id ? "artifact-tab active" : "artifact-tab"} onClick={() => { setActiveId(artifact.id); setQuery(""); setSort(null); }}>
            {artifact.type}
          </button>
        ))}
      </div>
      <div className="artifact-caption">
        <div><h3>{active.title}</h3><p>{active.description}</p></div>
        <label className="table-search"><Search size={15} /><span className="sr-only">Filter records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter records" /></label>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>{active.columns.map((column) => <th key={column}><button onClick={() => toggleSort(column)}>{column}<ArrowDownUp size={12} /></button></th>)}</tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id}>{active.columns.map((column) => <td key={column}>{asText(row.record[column])}</td>)}</tr>)}
            {!rows.length && <tr><td colSpan={active.columns.length}><div className="no-results"><SlidersHorizontal size={18} /> No records match the active filter.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
