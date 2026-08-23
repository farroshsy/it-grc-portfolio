import React, { useMemo, useState } from "react";
import { ClipboardCheck, FileCheck2, Filter, Search, ShieldCheck } from "lucide-react";
import { SiteShell, ProvenanceBadge, TutorialHelpLink } from "@/components/PortfolioChrome";
import { trpc } from "@/lib/trpc";
import AuditWorkpaper from "@/components/AuditWorkpaper";

type AuditRequest = {
  id: number; requestId: string; title: string; domain: string; owner: string; status: string;
  dueDate: Date; closureEvidence: string; provenance: "Academic" | "Independent Research" | "Simulated Case Study";
};

const statuses = ["All", "Requested", "In review", "Closed", "Overdue"];

function AuditMessage({ title, detail }: { title: string; detail: string }) {
  return <div className="evidence-state"><ClipboardCheck size={19} /><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

export default function AuditRoom() {
  const { data, isLoading, error } = trpc.portfolio.auditRoom.useQuery();
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const requests = (data?.requests ?? []) as AuditRequest[];
  const filtered = useMemo(() => requests.filter((request) => (status === "All" || request.status === status) && `${request.requestId} ${request.title} ${request.owner} ${request.domain}`.toLowerCase().includes(query.toLowerCase())), [requests, status, query]);
  const metrics = useMemo(() => ({ open: requests.filter((request) => request.status !== "Closed").length, closed: requests.filter((request) => request.status === "Closed").length, overdue: requests.filter((request) => request.status === "Overdue").length }), [requests]);

  return <SiteShell><main className="audit-room-page">
    <section className="audit-hero"><div><span className="eyebrow"><ClipboardCheck size={13} /> Simulated audit room</span><h1>Evidence requests with accountable closure.</h1><p>This fictional PBC tracker demonstrates how an IT GRC analyst turns a control question into an owned request, a target date, and a traceable closure record.</p><ProvenanceBadge label="Simulated Case Study" /><TutorialHelpLink step={2} label="Need help with audit testing?" /></div><div className="audit-statement"><ShieldCheck size={21} /><p>Each record is a synthetic evidence request. It does not represent an active audit, a real company, or a client evidence room.</p></div></section>
    {isLoading ? <AuditMessage title="Loading the simulated evidence ledger" detail="Retrieving database-backed PBC request records." /> : error ? <AuditMessage title="The audit room is unavailable" detail={error.message || "The evidence ledger could not be loaded. Please retry shortly."} /> : requests.length === 0 ? <AuditMessage title="No audit requests are available" detail="This simulated evidence room has no requests to display yet." /> : <>
      <section className="pbc-metrics"><article><span>Open requests</span><strong>{metrics.open}</strong><small>Awaiting review or closure</small></article><article><span>Closed requests</span><strong>{metrics.closed}</strong><small>Illustrative evidence trail retained</small></article><article><span>Overdue requests</span><strong>{metrics.overdue}</strong><small>Requires owner escalation</small></article></section>
      <section className="audit-workspace"><div className="workspace-heading"><div><span className="eyebrow"><FileCheck2 size={13} /> Provided by client ledger</span><h2>Request-to-evidence trace</h2></div><div className="audit-controls"><div className="audit-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a request" aria-label="Find an audit request" /></div><div className="status-filter"><Filter size={13} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter audit requests by status">{statuses.map((item) => <option key={item}>{item}</option>)}</select></div></div></div>
        {filtered.length === 0 ? <AuditMessage title="No requests match this view" detail="Clear the search or choose another request status to inspect the simulated ledger." /> : <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Request</th><th>Owner</th><th>State</th><th>Target</th><th>Closure evidence</th></tr></thead><tbody>{filtered.map((request) => <tr key={request.id}><td><span className="table-id">{request.requestId}</span><strong>{request.title}</strong><small>{request.domain} · {request.provenance}</small></td><td>{request.owner}</td><td><span className={`audit-status ${request.status.toLowerCase().replace(" ", "-")}`}>{request.status}</span></td><td>{new Date(request.dueDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td><td>{request.closureEvidence}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="audit-operating-note"><span>How to explain this in interview</span><p>“I begin with the control objective, request evidence from a named owner, validate completeness and period, document the test result, and link any gap to a treatment decision. The status is not the outcome; the closure evidence is.”</p></section>
      <AuditWorkpaper />
    </>}
  </main></SiteShell>;
}
