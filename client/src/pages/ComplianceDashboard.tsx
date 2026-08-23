import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ProvenanceBadge, SiteShell, TutorialHelpLink } from "@/components/PortfolioChrome";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PALETTE = ["#7fcbb7", "#e9ba6b", "#eb8066", "#a9b9ff"];

function ageBucket(dueDate: Date | null, now = new Date()) {
  if (!dueDate) return "Missing due date";
  const days = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return "Overdue";
  if (days <= 7) return "≤ 7 days";
  if (days <= 30) return "8–30 days";
  return "> 30 days";
}

export default function ComplianceDashboard() {
  const { isAuthenticated } = useAuth();
  const dashboard = trpc.controlAssurance.complianceDashboard.useQuery(undefined, { enabled: isAuthenticated });
  const access = trpc.controlAssurance.myAccess.useQuery(undefined, { enabled: isAuthenticated });
  const retentionReview = trpc.controlAssurance.retentionReviewDashboard.useQuery(undefined, { enabled: isAuthenticated && access.data?.isAdministrator === true });
  if (!isAuthenticated) return <SiteShell><main className="compliance-page"><div className="hub-state"><ShieldCheck size={20} /><div><strong>Workspace access required</strong><p>Sign in to view operational compliance measures and the role-specific action queue.</p><button className="hub-primary" onClick={startLogin}>Sign in to continue</button></div></div></main></SiteShell>;
  if (dashboard.isLoading) return <SiteShell><main className="compliance-page"><p className="hub-state">Loading operational compliance measures…</p></main></SiteShell>;
  if (dashboard.error || !dashboard.data) return <SiteShell><main className="compliance-page"><p className="hub-state">Compliance dashboard data is unavailable for this workspace role.</p></main></SiteShell>;
  const { controls, tests, findings, acceptances, executions, technicalExceptions, roles } = dashboard.data;
  const effectiveControls = controls.filter((control) => control.status === "Effective").length;
  const openFindings = findings.filter((finding) => !["Closed", "Risk accepted"].includes(finding.status));
  const pendingAcceptances = acceptances.filter((acceptance) => acceptance.status === "Proposed");
  const controlStatus = ["Effective", "In testing", "Exception", "Evidence requested"].map((name) => ({ name, value: controls.filter((control) => control.status === name).length })).filter((item) => item.value > 0);
  const remediationAging = [...openFindings.map((finding) => ({ dueDate: finding.dueDate })), ...technicalExceptions.filter((exception) => exception.status !== "Closed").map((exception) => ({ dueDate: exception.dueDate }))].reduce<Record<string, number>>((result, item) => { const key = ageBucket(item.dueDate); result[key] = (result[key] ?? 0) + 1; return result; }, {});
  const agingRows = ["Overdue", "≤ 7 days", "8–30 days", "> 30 days", "Missing due date"].map((name) => ({ name, value: remediationAging[name] ?? 0 }));
  const technicalVerdicts = ["PASS", "FAIL", "INCONCLUSIVE"].map((name) => ({ name, value: executions.filter((execution) => execution.verdict === name).length }));
  const complianceRate = controls.length ? Math.round((effectiveControls / controls.length) * 100) : 0;
  const nextAction = roles.includes("grc_analyst") ? "Review pending evidence and route open findings to accountable treatment." : roles.includes("risk_approver") ? "Review time-bound residual-risk decisions and confirm their expiry guardrails." : "Submit complete evidence packages for in-scope controls that need review.";

  return <SiteShell><main className="compliance-page"><section className="compliance-hero"><div><span className="eyebrow"><BarChart3 size={13} /> Operational compliance dashboard</span><h1>Turn control state into a management decision.</h1><p>Live metrics are derived from the Control Assurance Hub’s seeded working records: controls, test conclusions, open findings, risk decisions, and machine-generated technical evidence.</p><ProvenanceBadge label="Simulated Case Study" /><TutorialHelpLink step={2} label="Need help with testing?" /></div><aside><span>Operating measure</span><strong>{complianceRate}%</strong><p>Controls currently concluded effective. This is an illustrative operating indicator, not a certification or compliance conclusion.</p><div className="workspace-roles"><b>Workspace access</b><p>{roles.join(" · ").replaceAll("_", " ")}</p><small>{nextAction}</small></div></aside></section><section className="compliance-kpis"><Metric icon={<AlertTriangle size={18} />} label="Open findings" value={openFindings.length} note="Require treatment or retest" tone="risk" /><Metric icon={<Clock3 size={18} />} label="Pending risk acceptances" value={pendingAcceptances.length} note="Awaiting named approver" tone="warning" /><Metric icon={<CheckCircle2 size={18} />} label="Completed control tests" value={tests.length} note="Retained decision records" tone="assurance" /><Metric icon={<ShieldCheck size={18} />} label="Technical executions" value={executions.length} note="Immutable FlowGuard evidence" tone="technical" /></section>{access.data?.isAdministrator && <RetentionReviewPanel data={retentionReview.data} loading={retentionReview.isLoading} />}<section className="compliance-chart-grid"><article className="compliance-chart"><header><span>Control posture</span><p>Current assurance-control state</p></header><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={controlStatus} dataKey="value" nameKey="name" innerRadius={57} outerRadius={92} paddingAngle={4}>{controlStatus.map((entry, index) => <Cell key={entry.name} fill={PALETTE[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{controlStatus.map((item, index) => <span key={item.name}><i style={{ background: PALETTE[index] }} />{item.name}: {item.value}</span>)}</div></article><article className="compliance-chart"><header><span>Remediation aging</span><p>Open GRC findings and technical exceptions</p></header><ResponsiveContainer width="100%" height={260}><BarChart data={agingRows}><CartesianGrid stroke="#27413d" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9aacA5", fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: "#9aacA5", fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#e8bb72" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer><p className="chart-note">Use aging to prioritize accountable remediation before due dates convert into overdue control exposure.</p></article><article className="compliance-chart full"><header><span>Technical-control verification</span><p>FlowGuard verdicts remain machine-generated evidence, with source trace and evidence-hash references preserved.</p></header><ResponsiveContainer width="100%" height={220}><BarChart data={technicalVerdicts} layout="vertical"><CartesianGrid stroke="#27413d" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "#9aacA5", fontSize: 10 }} /><YAxis type="category" dataKey="name" width={92} tick={{ fill: "#c9d8d3", fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#98d9c6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></article></section></main></SiteShell>;
}

function Metric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: number; note: string; tone: string }) { return <article className={`compliance-kpi ${tone}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }

type RetentionReviewData = {
  schedule: { active: boolean; thresholdDays: number; cronExpression: string } | null;
  runs: Array<{ executedAt: Date; dueAttachmentCount: number; overdueAttachmentCount: number }>;
  dueAttachments: Array<{ attachmentId: string; evidenceType: string; retentionUntil: Date; provenance: string }>;
  dueCount: number;
  overdueCount: number;
};

function RetentionReviewPanel({ data, loading }: { data: RetentionReviewData | undefined; loading: boolean }) {
  if (loading || !data) return <section className="retention-dashboard"><p className="hub-state">Loading scheduled retention-review status…</p></section>;
  const { schedule, dueAttachments, dueCount, overdueCount, runs } = data;
  return <section className="retention-dashboard"><header><div><span className="eyebrow"><Clock3 size={13} /> Administrator retention review</span><h2>Scheduled review, without exposing the evidence itself.</h2><p>The reminder queue uses only attachment identifiers, evidence types, lifecycle dates, and provenance. File names, content, and storage links remain in the controlled administrator workspace.</p></div><aside><span>{schedule?.active ? "Scheduled" : "Ready to schedule"}</span><strong>{schedule?.thresholdDays ?? 30}-day horizon</strong><p>{schedule?.active ? `Runs ${schedule.cronExpression} UTC.` : "Default: Monday at 09:00 UTC after the site is published and the schedule is enabled."}</p></aside></header><div className="retention-dashboard-grid"><article><span>Due for review</span><strong>{dueCount}</strong><small>Active attachments expiring within the configured horizon</small></article><article><span>Expired</span><strong>{overdueCount}</strong><small>Links revoked; audit metadata retained</small></article><article><span>Latest run</span><strong>{runs[0] ? new Date(runs[0].executedAt).toLocaleDateString() : "Not run"}</strong><small>{runs[0] ? `${runs[0].dueAttachmentCount} due · ${runs[0].overdueAttachmentCount} expired` : "Enable after publication to begin review runs"}</small></article></div>{dueAttachments.length ? <div className="retention-dashboard-list">{dueAttachments.slice(0, 6).map((attachment) => <div key={attachment.attachmentId}><span>{attachment.attachmentId} · {attachment.evidenceType}</span><strong>Retention date: {new Date(attachment.retentionUntil).toLocaleDateString()}</strong><small>{attachment.provenance}</small></div>)}</div> : <p className="chart-note">No active attachment metadata currently falls inside the review horizon.</p>}</section>;
}
