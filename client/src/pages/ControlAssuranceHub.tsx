import React, { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Database, Download, FileCheck2, GitBranch, Layers3, Link2, ShieldAlert, Upload, UserRoundCheck } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ProvenanceBadge, SiteShell } from "@/components/PortfolioChrome";
import { trpc } from "@/lib/trpc";

type HubControl = { controlId: string; systemId: string; title: string; objective: string; owner: string; frequency: string; framework: string; status: string };
type HubSubmission = { submissionId: string; controlId: string; status: string; evidenceSummary: string; submittedBy: string; submittedAt: Date; reviewNote: string | null };
type HubFinding = { findingId: string; controlId: string; title: string; description: string; severity: string; owner: string; status: string; treatmentChoice: string; dueDate: Date };
type HubLink = { linkId: string; findingId: string; repository: string; issueNumber: number | null; issueUrl: string | null; syncStatus: string; lastError: string | null };
type HubAcceptance = { acceptanceId: string; findingId: string; status: string; rationale: string; riskOwner: string; approver: string; expiresAt: Date; decisionAt: Date | null };

const tabs = [
  ["command", "Command Center", Layers3],
  ["evidence", "Evidence Intake", Upload],
  ["findings", "Findings & Remediation", ShieldAlert],
  ["pbc", "PBC & Workpapers", ClipboardCheck],
  ["policies", "Policy Pack", FileCheck2],
  ["connection", "Connection Boundary", GitBranch],
] as const;

function statusClass(value: string) { return value.toLowerCase().replaceAll(" ", "-"); }

export default function ControlAssuranceHub() {
  const { data, isLoading, error } = trpc.controlAssurance.hub.useQuery();
  const auditRoom = trpc.portfolio.auditRoom.useQuery();
  const policyPack = trpc.portfolio.policyPack.useQuery();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const submitEvidence = trpc.controlAssurance.submitEvidence.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const reviewEvidence = trpc.controlAssurance.reviewEvidence.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const recordTestDecision = trpc.controlAssurance.recordTestDecision.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const setTreatment = trpc.controlAssurance.setFindingTreatment.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const proposeAcceptance = trpc.controlAssurance.proposeRiskAcceptance.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const decideAcceptance = trpc.controlAssurance.decideRiskAcceptance.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const prepareGithub = trpc.controlAssurance.prepareGithubIssue.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const syncRemediation = trpc.controlAssurance.syncRemediation.useMutation({ onSuccess: () => utils.controlAssurance.hub.invalidate() });
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("command");
  const [controlId, setControlId] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [feedback, setFeedback] = useState("");

  const controls = (data?.controls ?? []) as HubControl[];
  const submissions = (data?.submissions ?? []) as HubSubmission[];
  const findings = (data?.findings ?? []) as HubFinding[];
  const links = (data?.remediationLinks ?? []) as HubLink[];
  const acceptances = (data?.acceptances ?? []) as HubAcceptance[];
  const selectedControl = controlId || controls[0]?.controlId || "";
  const metrics = useMemo(() => ({
    evidenceToReview: submissions.filter((submission) => ["Submitted", "Under review"].includes(submission.status)).length,
    exceptions: findings.filter((finding) => !["Closed", "Risk accepted"].includes(finding.status)).length,
    pendingRetest: findings.filter((finding) => finding.status === "Pending retest").length,
    readyForEngineering: links.filter((link) => link.syncStatus === "Ready to create").length,
  }), [submissions, findings, links]);

  const guardAction = (action: () => void) => { if (!isAuthenticated) { startLogin(); return; } action(); };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    guardAction(() => submitEvidence.mutate({ controlId: selectedControl, evidenceSummary }, { onSuccess: (result) => { setEvidenceSummary(""); setFeedback(`Evidence ${result.submissionId} submitted for review.`); } }));
  };

  return <SiteShell><main className="hub-page">
    <section className="hub-hero"><div><span className="eyebrow"><Database size={13} /> Control Assurance Hub</span><h1>From proof to decision—without losing the engineering handoff.</h1><p>An offline-first GRC workspace that turns control evidence into test conclusions, findings, remediation actions, risk acceptance, and management-ready decisions.</p><ProvenanceBadge label="Simulated Case Study" /></div><aside><span>Operating scenario</span><strong>Fintech control assurance</strong><p>Every record is synthetic. The workflow is functional; no client data, live external issue, or certification claim is represented.</p></aside></section>
    <section className="hub-layout">
      <nav className="hub-nav" aria-label="Control Assurance Hub sections">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "hub-nav-item active" : "hub-nav-item"}><Icon size={15} /><span>{label}</span></button>)}</nav>
      <div className="hub-content">
        {isLoading ? <HubState title="Loading the Control Assurance Hub" detail="Retrieving systems, controls, evidence, findings, and decision records." /> : error ? <HubState title="The workspace is unavailable" detail={error.message || "The GRC workflow data could not be loaded."} /> : <>
          {tab === "command" && <CommandCenter metrics={metrics} controls={controls} findings={findings} submissions={submissions} links={links} onNavigate={setTab} />}
          {tab === "evidence" && <EvidenceIntake controls={controls} submissions={submissions} selectedControl={selectedControl} setControlId={setControlId} evidenceSummary={evidenceSummary} setEvidenceSummary={setEvidenceSummary} isAuthenticated={isAuthenticated} busy={submitEvidence.isPending || reviewEvidence.isPending || recordTestDecision.isPending} feedback={feedback} onSubmit={handleSubmit} onReview={(submissionId, status) => guardAction(() => reviewEvidence.mutate({ submissionId, status, reviewNote: status === "Accepted" ? "Evidence accepted in the simulated review workflow." : "Evidence rejected; update the evidence package and resubmit." }))} onTest={(submissionId, result) => guardAction(() => recordTestDecision.mutate({ submissionId, result, conclusion: result === "Effective" ? "Simulated test conclusion: evidence is sufficient for the stated control objective and review period." : "Simulated test conclusion: evidence does not fully demonstrate the stated control objective; a remediation-ready finding has been created." }, { onSuccess: (result) => setFeedback(result.findingId ? `Test concluded with an exception. ${result.findingId} is ready for treatment.` : "Test concluded effective; the control record has been updated.") }))} />}
          {tab === "findings" && <FindingsRemediation findings={findings} links={links} acceptances={acceptances} busy={setTreatment.isPending || prepareGithub.isPending || proposeAcceptance.isPending || decideAcceptance.isPending || syncRemediation.isPending} onTreatment={(findingId, treatmentChoice) => guardAction(() => setTreatment.mutate({ findingId, treatmentChoice }))} onPrepare={(findingId) => guardAction(() => prepareGithub.mutate({ findingId }))} onSync={(findingId) => guardAction(() => syncRemediation.mutate({ findingId }))} onProposeAcceptance={(findingId: string, rationale: string) => guardAction(() => proposeAcceptance.mutate({ findingId, rationale, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }))} onDecideAcceptance={(acceptanceId: string, decision: "Approved" | "Rejected") => guardAction(() => decideAcceptance.mutate({ acceptanceId, decision }))} />}
          {tab === "pbc" && <PbcWorkpapers requests={auditRoom.data?.requests ?? []} />}
          {tab === "policies" && <PolicyWorkspace policies={policyPack.data?.policies ?? []} />}
          {tab === "connection" && <ConnectionBoundary links={links} />}
        </>}
      </div>
    </section>
  </main></SiteShell>;
}

export function HubState({ title, detail }: { title: string; detail: string }) { return <div className="hub-state"><Database size={20} /><div><strong>{title}</strong><p>{detail}</p></div></div>; }

export function CommandCenter({ metrics, controls, findings, submissions, links, onNavigate }: { metrics: Record<string, number>; controls: HubControl[]; findings: HubFinding[]; submissions: HubSubmission[]; links: HubLink[]; onNavigate: (value: "command" | "evidence" | "findings" | "pbc" | "policies" | "connection") => void }) {
  if (!controls.length && !findings.length && !submissions.length) return <HubState title="No operational records are in scope" detail="Start by defining a system and control, then submit evidence to begin a defensible assurance workflow." />;
  return <><div className="hub-section-heading"><div><span className="eyebrow"><Layers3 size={13} /> Operating command center</span><h2>What needs action today</h2></div><p>Start with the evidence queue, document a conclusion, and route every exception to a treatment decision.</p></div><section className="hub-metrics"><Metric label="Evidence to review" value={metrics.evidenceToReview} tone="mint" /><Metric label="Open exceptions" value={metrics.exceptions} tone="coral" /><Metric label="Pending retest" value={metrics.pendingRetest} tone="amber" /><Metric label="Ready for engineering" value={metrics.readyForEngineering} tone="blue" /></section><section className="hub-two-col"><article className="hub-panel"><div className="panel-title"><span>Control queue</span><button onClick={() => onNavigate("evidence")}>Open evidence intake <ArrowRight size={13} /></button></div>{controls.map((control) => <div className="control-row" key={control.controlId}><div><span>{control.controlId} · {control.framework}</span><strong>{control.title}</strong><small>{control.owner} · {control.frequency}</small></div><i className={`hub-status ${statusClass(control.status)}`}>{control.status}</i></div>)}</article><article className="hub-panel"><div className="panel-title"><span>Decision queue</span><button onClick={() => onNavigate("findings")}>Open treatments <ArrowRight size={13} /></button></div>{findings.map((finding) => <div className="finding-row" key={finding.findingId}><div><span>{finding.findingId} · {finding.severity}</span><strong>{finding.title}</strong><small>{finding.owner} · Due {new Date(finding.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div><i className={`hub-status ${statusClass(finding.status)}`}>{finding.status}</i></div>)}</article></section><section className="hub-process"><span className="eyebrow">Working business process</span><div>{["Control scoped", "Evidence submitted", "Test concluded", "Finding created", "Treatment selected", "Retest / acceptance"].map((step, index) => <React.Fragment key={step}><span className={index < 4 ? "done" : ""}>{String(index + 1).padStart(2, "0")} {step}</span>{index < 5 && <b>→</b>}</React.Fragment>)}</div><p>{submissions.length} evidence submissions, {findings.length} findings, and {links.length} future engineering-ticket links are retained in the current simulated workflow.</p></section></>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { return <article className={`hub-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>Live workflow record</small></article>; }

export function EvidenceIntake({ controls, submissions, selectedControl, setControlId, evidenceSummary, setEvidenceSummary, isAuthenticated, busy, feedback, onSubmit, onReview, onTest }: { controls: HubControl[]; submissions: HubSubmission[]; selectedControl: string; setControlId: (value: string) => void; evidenceSummary: string; setEvidenceSummary: (value: string) => void; isAuthenticated: boolean; busy: boolean; feedback: string; onSubmit: (event: FormEvent) => void; onReview: (submissionId: string, status: "Accepted" | "Rejected") => void; onTest: (submissionId: string, result: "Effective" | "Exception") => void }) {
  if (!controls.length) return <HubState title="No controls are available for evidence intake" detail="Define an in-scope system and an owned control before requesting or reviewing evidence." />;
  return <><div className="hub-section-heading"><div><span className="eyebrow"><Upload size={13} /> Control-owner workflow</span><h2>Submit evidence, then make it reviewable.</h2></div><p>The intake is intentionally metadata-first: it captures what proves the control and who owns it, without uploading fictional files.</p></div><section className="evidence-layout"><form className="evidence-form" onSubmit={onSubmit}><label>Control<select value={selectedControl} onChange={(event) => setControlId(event.target.value)}>{controls.map((control) => <option key={control.controlId} value={control.controlId}>{control.controlId} — {control.title}</option>)}</select></label><label>Evidence summary<textarea value={evidenceSummary} onChange={(event) => setEvidenceSummary(event.target.value)} minLength={12} required placeholder="Describe the evidence, period covered, source system, and what it proves." /></label><div className="evidence-form-note"><UserRoundCheck size={14} /><span>{isAuthenticated ? "You are signed in and can submit a simulated evidence record." : "Sign in to submit a workflow record; browsing remains available without sign-in."}</span></div><button className="hub-primary" disabled={busy}>{busy ? "Submitting…" : "Submit evidence for review"}</button>{feedback && <p className="hub-feedback">{feedback}</p>}</form><article className="hub-panel evidence-list"><div className="panel-title"><span>Review queue</span><small>{submissions.length} records</small></div>{submissions.map((submission) => <div className="submission-row" key={submission.submissionId}><div><span>{submission.submissionId} · {submission.controlId}</span><strong>{submission.evidenceSummary}</strong><small>Submitted by {submission.submittedBy} · {new Date(submission.submittedAt).toLocaleDateString()}</small>{submission.reviewNote && <em>{submission.reviewNote}</em>}</div><aside><i className={`hub-status ${statusClass(submission.status)}`}>{submission.status}</i>{["Submitted", "Under review"].includes(submission.status) && <div><button onClick={() => onReview(submission.submissionId, "Accepted")}>Accept</button><button onClick={() => onReview(submission.submissionId, "Rejected")}>Reject</button><button onClick={() => onTest(submission.submissionId, "Effective")}>Test effective</button><button onClick={() => onTest(submission.submissionId, "Exception")}>Record exception</button></div>}</aside></div>)}</article></section></>;
}

export function FindingsRemediation({ findings, links, acceptances, busy, onTreatment, onPrepare, onSync, onProposeAcceptance, onDecideAcceptance }: { findings: HubFinding[]; links: HubLink[]; acceptances: HubAcceptance[]; busy: boolean; onTreatment: (findingId: string, treatment: "Remediation" | "Risk acceptance") => void; onPrepare: (findingId: string) => void; onSync: (findingId: string) => void; onProposeAcceptance: (findingId: string, rationale: string) => void; onDecideAcceptance: (acceptanceId: string, decision: "Approved" | "Rejected") => void }) {
  if (!findings.length) return <HubState title="No findings require a treatment decision" detail="An exception conclusion creates a finding here, where it can be remediated or proposed for time-bound risk acceptance." />;
  return <><div className="hub-section-heading"><div><span className="eyebrow"><ShieldAlert size={13} /> Decision workflow</span><h2>Turn a control exception into accountable treatment.</h2></div><p>Choose engineering remediation when the control must be restored; choose a time-bound risk acceptance only when a named approver accepts residual exposure.</p></div><section className="findings-stack">{findings.map((finding) => {
    const link = links.find((item) => item.findingId === finding.findingId);
    const acceptance = acceptances.find((item) => item.findingId === finding.findingId && item.status !== "Expired");
    return <article className="finding-card" key={finding.findingId}><header><div><span>{finding.findingId} · {finding.controlId} · {finding.severity}</span><h3>{finding.title}</h3><p>{finding.description}</p></div><i className={`hub-status ${statusClass(finding.status)}`}>{finding.status}</i></header><div className="finding-card-meta"><span><b>Owner</b>{finding.owner}</span><span><b>Current treatment</b>{finding.treatmentChoice}</span><span><b>Target date</b>{new Date(finding.dueDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span></div><footer><div><button disabled={busy} onClick={() => onTreatment(finding.findingId, "Remediation")}>Route to remediation</button><button disabled={busy} onClick={() => onTreatment(finding.findingId, "Risk acceptance")}>Choose risk acceptance</button>{finding.treatmentChoice === "Risk acceptance" && !acceptance && <button disabled={busy} onClick={() => onProposeAcceptance(finding.findingId, "Simulated time-bound acceptance while the control owner implements the durable remediation and GRC schedules a retest.")}>Propose acceptance</button>}{acceptance?.status === "Proposed" && <><button disabled={busy} onClick={() => onDecideAcceptance(acceptance.acceptanceId, "Approved")}>Approve acceptance</button><button disabled={busy} onClick={() => onDecideAcceptance(acceptance.acceptanceId, "Rejected")}>Reject acceptance</button></>}<RemediationExportButton findingId={finding.findingId} /></div>{link && <aside><span><Link2 size={13} /> GitHub Issues</span><strong>{link.syncStatus}</strong>{link.lastError && <small>{link.lastError}</small>}<div>{link.syncStatus === "Ready to create" && <button disabled={busy} onClick={() => onPrepare(finding.findingId)}>Prepare external issue</button>}<button disabled={busy} onClick={() => onSync(finding.findingId)}>Refresh issue state</button></div></aside>}</footer>{acceptance && <div className="acceptance-note"><span>Risk acceptance · {acceptance.status}</span><p>{acceptance.rationale}</p><small>Owner: {acceptance.riskOwner} · Approver: {acceptance.approver} · Expires {new Date(acceptance.expiresAt).toLocaleDateString()}</small></div>}</article>;
  })}</section></>;
}

function RemediationExportButton({ findingId }: { findingId: string }) {
  const payload = trpc.controlAssurance.remediationExport.useQuery({ findingId }, { enabled: false });
  const download = async () => {
    const result = await payload.refetch();
    if (!result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${findingId.toLowerCase()}-remediation-handoff.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <button disabled={payload.isFetching} onClick={download}><Download size={11} /> {payload.isFetching ? "Preparing…" : "Export handoff"}</button>;
}

export function PbcWorkpapers({ requests }: { requests: Array<{ requestId: string; title: string; owner: string; status: string; closureEvidence: string }> }) { if (!requests.length) return <HubState title="No PBC requests are open" detail="Create an evidence request to track who owns the response, what proves closure, and which workpaper uses the result." />; return <><div className="hub-section-heading"><div><span className="eyebrow"><ClipboardCheck size={13} /> Audit evidence</span><h2>Request-to-proof and test-workpaper trace.</h2></div><p>Use the PBC ledger to coordinate evidence requests, then retain the test steps and conclusion that support the control decision.</p></div><section className="hub-two-col"><article className="hub-panel"><div className="panel-title"><span>PBC tracker</span><Link href="/audit-room">Full tracker <ArrowRight size={13} /></Link></div>{requests.map((request) => <div className="pbc-row" key={request.requestId}><div><span>{request.requestId}</span><strong>{request.title}</strong><small>{request.owner}</small></div><aside><i className={`hub-status ${statusClass(request.status)}`}>{request.status}</i><p>{request.closureEvidence}</p></aside></div>)}</article><article className="workpaper-preview"><span className="eyebrow"><FileCheck2 size={13} /> Workpaper</span><h3>Test procedure → selected sample → observation → conclusion</h3><p>The simulated access workpaper contains three test steps, one exception, evidence inspected, sample selection, follow-up remediation, and a GRC conclusion.</p><Link href="/audit-workpaper">Inspect the full audit workpaper <ArrowRight size={13} /></Link></article></section></>;
}

export function PolicyWorkspace({ policies }: { policies: Array<{ policyId: string; title: string; owner: string; status: string; purpose: string }> }) { if (!policies.length) return <HubState title="No policy references are loaded" detail="Add approved policy records to define the evidence expectations for each control domain." />; return <><div className="hub-section-heading"><div><span className="eyebrow"><FileCheck2 size={13} /> Operating rules</span><h2>Policies that define what evidence should exist.</h2></div><p>Each procedure describes the control intent and evidence expected from an owner before an analyst starts testing.</p></div><section className="policy-workspace-grid">{policies.map((policy) => <article key={policy.policyId}><span>{policy.policyId} · {policy.status}</span><h3>{policy.title}</h3><p>{policy.purpose}</p><small>Owner: {policy.owner}</small></article>)}</section><Link className="hub-link" href="/policy-pack">Open full policy-and-procedure pack <ArrowRight size={13} /></Link></>;
}

export function ConnectionBoundary({ links }: { links: HubLink[] }) { if (!links.length) return <HubState title="No remediation handoffs are queued" detail="A remediation-ready finding will create a future engineering handoff record here without requiring an external connection." />; return <><div className="hub-section-heading"><div><span className="eyebrow"><GitBranch size={13} /> Future connection</span><h2>Engineering tracker ready—without a dependency.</h2></div><p>The business workflow works offline. When you later connect GitHub, the same finding record creates and synchronizes an engineering issue.</p></div><section className="connection-card"><div><span className="eyebrow">GitHub Issues adapter</span><h3>Offline-first mode is active.</h3><p>No token or repository is configured. The workspace never manufactures a live external ticket; it records a clear handoff state instead.</p><ul><li>Server-side token only, never client-exposed</li><li>Single repository, Issues: Read and write permission</li><li>Finding ID, control ID, severity, owner, and acceptance criteria transfer to the issue</li></ul></div><aside><strong>{links.filter((link) => link.syncStatus === "Ready to create").length}</strong><span>findings ready to create in GitHub later</span><Link href="/skills-certifications">View integration-ready skills <ArrowRight size={13} /></Link></aside></section><section className="connection-table">{links.map((link) => <div key={link.linkId}><span>{link.linkId} · {link.findingId}</span><strong>{link.repository}</strong><i className={`hub-status ${statusClass(link.syncStatus)}`}>{link.syncStatus}</i>{link.lastError && <small>{link.lastError}</small>}</div>)}</section></>;
}
