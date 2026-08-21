import { AlertTriangle, CheckCircle2, CircleDotDashed, Gauge, RefreshCw, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { SiteShell } from "@/components/PortfolioChrome";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { calculateGovernanceMetrics, isActionOverdue, residualRiskTone, summarizeResidualRiskByCategory } from "../../../shared/grcPresentation";

type DashboardRisk = {
  id: number;
  riskId: string;
  title: string;
  category: string;
  businessUnit: string;
  likelihood: number;
  impact: number;
  inherentRisk: number;
  residualRisk: number;
  owner: string;
  status: string;
  dueDate: Date | null;
};

type DashboardControl = { id: number; caseStudyId: number; title: string; domain: string; owner: string; status: string; effectiveness: number };
type DashboardTest = { id: number; testId: string; controlId: string; result: string; severity: string };
type DashboardAction = { id: number; actionId: string; title: string; linkedRiskId: string; owner: string; status: string; severity: string; dueDate: Date };
type DashboardFramework = { id: number; caseStudyId: number; framework: string };

function heatColor(residualRisk: number) {
  if (residualRiskTone(residualRisk) === "high") return "#e87858";
  if (residualRiskTone(residualRisk) === "moderate") return "#e5b762";
  return "#79bfab";
}

function bucketRiskLabel(score: number) {
  const tone = residualRiskTone(score);
  return tone === "high" ? "High" : tone === "moderate" ? "Moderate" : "Low";
}

export default function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = trpc.portfolio.dashboard.useQuery(undefined, { refetchOnWindowFocus: true });
  const risks = (data?.risks ?? []) as DashboardRisk[];
  const controls = (data?.controls ?? []) as DashboardControl[];
  const tests = (data?.tests ?? []) as DashboardTest[];
  const remediation = (data?.remediation ?? []) as DashboardAction[];
  const frameworks = (data?.frameworks ?? []) as DashboardFramework[];
  const now = new Date();

  const metrics = useMemo(() => calculateGovernanceMetrics(risks, controls, remediation, now), [risks, controls, remediation, now]);

  const byCategory = useMemo(() => summarizeResidualRiskByCategory(risks), [risks]);

  const controlData = useMemo(() => controls.map((control) => ({ name: control.domain, effectiveness: control.effectiveness, status: control.status })), [controls]);
  const frameworkReadiness = useMemo(() => Object.values(frameworks.reduce<Record<string, { framework: string; total: number; effectiveness: number }>>((accumulator, link) => {
    const current = accumulator[link.framework] ?? { framework: link.framework, total: 0, effectiveness: 0 };
    const linkedControls = controls.filter((control) => control.caseStudyId === link.caseStudyId);
    const score = linkedControls.length ? Math.round(linkedControls.reduce((total, control) => total + control.effectiveness, 0) / linkedControls.length) : 0;
    current.total += 1;
    current.effectiveness += score;
    accumulator[link.framework] = current;
    return accumulator;
  }, {})).map((item) => ({ framework: item.framework, readiness: Math.round(item.effectiveness / item.total) })), [frameworks, controls]);

  if (isLoading) return <SiteShell><div className="page-loading"><RefreshCw className="animate-spin" /> Reading governance records…</div></SiteShell>;
  if (error) return <SiteShell><main className="not-found-card"><ShieldAlert size={34} /><h1>Governance view unavailable</h1><p>The database-backed dashboard query did not complete. Please refresh to retry.</p></main></SiteShell>;

  return (
    <SiteShell>
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div><span className="eyebrow"><Gauge size={13} /> Continuous governance</span><h1>Compliance posture, traced to evidence.</h1><p>This view is calculated from the portfolio’s database records through live tRPC queries. It models how a GRC team can move from periodic assessment toward an observable, continuously managed control environment.</p></div>
          <Button className="dashboard-refresh" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> Refresh data</Button>
        </section>
        <section className="metric-grid" aria-label="GRC posture summary">
          <Metric icon={ShieldAlert} label="High residual risks" value={metrics.highResidualRiskCount} tone="danger" detail="Residual score ≥ 12" />
          <Metric icon={CircleDotDashed} label="Open remediation" value={metrics.openRemediationCount} tone="accent" detail="Owner action still active" />
          <Metric icon={AlertTriangle} label="Overdue actions" value={metrics.overdueActionCount} tone="warning" detail="Past target due date" />
          <Metric icon={CheckCircle2} label="Control effectiveness" value={`${metrics.controlEffectiveness}%`} tone="success" detail="Mean assessed effectiveness" />
        </section>
        <section className="dashboard-grid top-charts">
          <article className="chart-card heatmap-card"><ChartHeader title="Risk heat map" subtitle="Likelihood × impact, colored by residual risk" /><div className="chart-area"><ResponsiveContainer width="100%" height={310}><ScatterChart margin={{ top: 14, right: 14, bottom: 8, left: -12 }}><CartesianGrid stroke="#2a3b3d" strokeDasharray="3 5" /><XAxis dataKey="likelihood" type="number" name="Likelihood" domain={[1, 5]} tickCount={5} axisLine={false} tickLine={false} stroke="#91a59f" label={{ value: "Likelihood", position: "insideBottom", offset: -3, fill: "#91a59f", fontSize: 11 }} /><YAxis dataKey="impact" type="number" name="Impact" domain={[1, 5]} tickCount={5} axisLine={false} tickLine={false} stroke="#91a59f" label={{ value: "Impact", angle: -90, position: "insideLeft", fill: "#91a59f", fontSize: 11 }} /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={<RiskTooltip />} /><Scatter name="Risks" data={risks} shape={(props: { cx?: number; cy?: number; payload?: DashboardRisk }) => <circle cx={props.cx} cy={props.cy} r={9} fill={heatColor(props.payload?.residualRisk ?? 0)} stroke="#0f1a1d" strokeWidth={3} />} /></ScatterChart></ResponsiveContainer></div><div className="heatmap-key"><span><i className="high" /> High ≥ 12</span><span><i className="moderate" /> Moderate 8–11</span><span><i className="low" /> Low &lt; 8</span></div></article>
          <article className="chart-card"><ChartHeader title="Residual risk by category" subtitle="Average residual score across available records" /><div className="chart-area"><ResponsiveContainer width="100%" height={310}><BarChart data={byCategory} layout="vertical" margin={{ top: 12, right: 22, bottom: 8, left: 24 }}><CartesianGrid horizontal={false} stroke="#2a3b3d" /><XAxis type="number" domain={[0, 20]} axisLine={false} tickLine={false} stroke="#91a59f" /><YAxis dataKey="category" type="category" width={87} axisLine={false} tickLine={false} stroke="#bdc9c5" fontSize={11} /><Tooltip contentStyle={{ background: "#152226", border: "1px solid #33484a", borderRadius: 6 }} /><Bar dataKey="residual" radius={[0, 5, 5, 0]}>{byCategory.map((entry) => <Cell key={entry.category} fill={heatColor(entry.residual)} />)}</Bar></BarChart></ResponsiveContainer></div></article>
        </section>
        <section className="dashboard-grid bottom-charts">
          <article className="chart-card"><ChartHeader title="Control effectiveness" subtitle="Assessment record by control domain" /><div className="chart-area"><ResponsiveContainer width="100%" height={270}><BarChart data={controlData} margin={{ top: 12, right: 8, bottom: 8, left: -18 }}><CartesianGrid vertical={false} stroke="#2a3b3d" /><XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#a8b8b3" fontSize={10} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} stroke="#91a59f" unit="%" /><Tooltip contentStyle={{ background: "#152226", border: "1px solid #33484a", borderRadius: 6 }} /><Bar dataKey="effectiveness" fill="#7fc4b2" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
          <article className="chart-card test-card"><ChartHeader title="Control testing signal" subtitle="Design and operating test outcomes in the current record set" /><div className="test-rows">{tests.map((test) => <div className="test-row" key={test.id}><span className={test.result === "Effective" ? "test-dot effective" : "test-dot exception"} /><div><strong>{test.controlId}</strong><span>{test.testId} · {test.severity} severity</span></div><b>{test.result}</b></div>)}</div></article>
        </section>
        <section className="framework-readiness-card chart-card"><ChartHeader title="Compliance status by framework" subtitle="Database-derived readiness indicator from linked case-study controls" /><div className="chart-area"><ResponsiveContainer width="100%" height={260}><BarChart data={frameworkReadiness} margin={{ top: 12, right: 8, bottom: 8, left: -18 }}><CartesianGrid vertical={false} stroke="#2a3b3d" /><XAxis dataKey="framework" axisLine={false} tickLine={false} stroke="#a8b8b3" fontSize={10} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} stroke="#91a59f" unit="%" /><Tooltip contentStyle={{ background: "#152226", border: "1px solid #33484a", borderRadius: 6 }} /><Bar dataKey="readiness" fill="#94d4c4" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="framework-chart-note">This readiness indicator is an illustrative assessment model, not a certification, attestation, or legal conclusion.</p></section>
        <section className="dashboard-remediation"><div className="section-heading compact"><span className="eyebrow"><CircleDotDashed size={13} /> Remediation ledger</span><h2>Open actions with accountable owners</h2></div><div className="remediation-table-wrap"><table className="remediation-table"><thead><tr><th>Action</th><th>Linked risk</th><th>Owner</th><th>Severity</th><th>Target date</th><th>State</th></tr></thead><tbody>{remediation.map((action) => { const isOverdue = isActionOverdue(action, now); return <tr key={action.id}><td><strong>{action.title}</strong><span>{action.actionId}</span></td><td>{action.linkedRiskId}</td><td>{action.owner}</td><td><span className={`severity-pill ${action.severity.toLowerCase()}`}>{action.severity}</span></td><td className={isOverdue ? "overdue" : ""}>{new Date(action.dueDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td><td>{action.status}</td></tr>; })}</tbody></table></div></section>
        <section className="dashboard-note"><span>Operating model note</span><p>Automation, dashboards, and framework mappings are decision-support mechanisms. Material risk decisions, exceptions, regulatory applicability, and control conclusions remain accountable human responsibilities.</p></section>
      </main>
    </SiteShell>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof ShieldAlert; label: string; value: string | number; detail: string; tone: "danger" | "accent" | "warning" | "success" }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon"><Icon size={17} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="chart-header"><h2>{title}</h2><p>{subtitle}</p></header>;
}

function RiskTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DashboardRisk }> }) {
  if (!active || !payload?.[0]) return null;
  const risk = payload[0].payload;
  return <div className="risk-tooltip"><strong>{risk.riskId}</strong><p>{risk.title}</p><span>{bucketRiskLabel(risk.residualRisk)} residual risk · {risk.residualRisk}/25</span></div>;
}
