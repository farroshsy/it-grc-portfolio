import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { SiteShell } from "@/components/PortfolioChrome";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, UserCog } from "lucide-react";

const roles = ["control_owner", "grc_analyst", "risk_approver"] as const;
const roleLabel = (role: string) => role.replaceAll("_", " ");

export default function Administration() {
  const { isAuthenticated } = useAuth();
  const access = trpc.controlAssurance.myAccess.useQuery(undefined, { enabled: isAuthenticated });
  const admin = trpc.controlAssurance.administration.useQuery(undefined, { enabled: isAuthenticated && access.data?.isAdministrator === true });
  const utils = trpc.useUtils();
  const assign = trpc.controlAssurance.assignWorkspaceRole.useMutation({ onSuccess: () => { utils.controlAssurance.administration.invalidate(); utils.controlAssurance.myAccess.invalidate(); } });
  const retention = trpc.controlAssurance.setAttachmentRetention.useMutation({ onSuccess: () => utils.controlAssurance.administration.invalidate() });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, "Active" | "Legal hold">>({});

  if (!isAuthenticated) return <SiteShell><main className="admin-page"><AccessState title="Administrator access required" detail="Sign in with an administrator account to manage workspace permissions and evidence retention." /></main></SiteShell>;
  if (access.isLoading) return <SiteShell><main className="admin-page"><p className="hub-state">Resolving administrator access…</p></main></SiteShell>;
  if (!access.data?.isAdministrator) return <SiteShell><main className="admin-page"><AccessState title="Administrator role required" detail="Workspace-role actions remain separate from the platform administrator permission required to manage assignments and retention policies." /></main></SiteShell>;
  if (admin.isLoading) return <SiteShell><main className="admin-page"><p className="hub-state">Loading role assignments and evidence lifecycle records…</p></main></SiteShell>;
  if (admin.error || !admin.data) return <SiteShell><main className="admin-page"><p className="hub-state">Administration data is unavailable.</p></main></SiteShell>;
  const { users, roleAssignments, attachments } = admin.data;

  return <SiteShell><main className="admin-page">
    <section className="admin-hero"><div><span className="eyebrow"><UserCog size={13} /> Workspace administration</span><h1>Assign accountable GRC actions and retain only the evidence you need.</h1><p>This console manages operational workspace roles separately from the platform administrator identity. Evidence expiry revokes the attachment link from regular workflow views; managed storage objects are not deleted by this portfolio implementation.</p></div><aside><span>Control boundary</span><strong>Administrator-only</strong><p>Assignments are per user and per workspace role. An administrator retains all GRC actions regardless of explicit role records.</p></aside></section>
    <section className="admin-section"><div className="section-heading compact"><div><span className="eyebrow">Role assignment</span><h2>One person, explicit operating duties.</h2></div><p>Toggle a role to activate or deactivate its associated workflow actions.</p></div><div className="admin-users">{users.map((user) => { const assigned = roleAssignments.filter((assignment) => assignment.userId === user.id); return <article key={user.id}><header><div><span>{user.role === "admin" ? "Platform administrator" : "Workspace member"}</span><h3>{user.name || user.email || `User ${user.id}`}</h3><small>{user.email || user.openId}</small></div><i>{user.role}</i></header><div className="role-toggles">{roles.map((role) => { const active = assigned.find((item) => item.workspaceRole === role)?.active ?? false; return <button key={role} className={active ? "active" : ""} disabled={assign.isPending} onClick={() => assign.mutate({ userId: user.id, workspaceRole: role, active: !active })}>{roleLabel(role)} <b>{active ? "Active" : "Inactive"}</b></button>; })}</div></article>; })}</div></section>
    <section className="admin-section retention-section"><div className="section-heading compact"><div><span className="eyebrow">Evidence retention</span><h2>Expiry controls remove access, not audit context.</h2></div><p>Expired attachment rows remain as audit metadata without a workflow download URL. Legal hold protects a record from automatic expiry.</p></div>{attachments.length ? <div className="retention-list">{attachments.map((attachment) => { const date = dates[attachment.attachmentId] ?? new Date(attachment.retentionUntil).toISOString().slice(0, 10); const status = statuses[attachment.attachmentId] ?? (attachment.retentionStatus === "Legal hold" ? "Legal hold" : "Active"); return <article key={attachment.attachmentId}><div><span>{attachment.attachmentId} · {attachment.retentionStatus}</span><h3>{attachment.fileName}</h3><p>{attachment.submissionId} · {attachment.uploadedBy} · {Math.ceil(attachment.byteSize / 1024)} KB</p>{attachment.retentionNote && <small>{attachment.retentionNote}</small>}</div><div className="retention-controls"><label>Retain until<input type="date" value={date} onChange={(event) => setDates({ ...dates, [attachment.attachmentId]: event.target.value })} /></label><label>Status<select value={status} onChange={(event) => setStatuses({ ...statuses, [attachment.attachmentId]: event.target.value as "Active" | "Legal hold" })}><option value="Active">Active</option><option value="Legal hold">Legal hold</option></select></label><label>Note<input value={notes[attachment.attachmentId] ?? attachment.retentionNote ?? ""} onChange={(event) => setNotes({ ...notes, [attachment.attachmentId]: event.target.value })} placeholder="Retention rationale" /></label><button disabled={retention.isPending || attachment.retentionStatus === "Expired"} onClick={() => retention.mutate({ attachmentId: attachment.attachmentId, retentionUntil: new Date(`${date}T00:00:00Z`), retentionStatus: status, retentionNote: (notes[attachment.attachmentId] ?? attachment.retentionNote ?? "").trim() || null })}>{attachment.retentionStatus === "Expired" ? "Expired" : "Save lifecycle"}</button></div></article>; })}</div> : <p className="hub-state">No managed evidence attachments have been uploaded yet.</p>}</section>
  </main></SiteShell>;
}

function AccessState({ title, detail }: { title: string; detail: string }) { return <div className="hub-state"><ShieldCheck size={20} /><div><strong>{title}</strong><p>{detail}</p><button className="hub-primary" onClick={startLogin}>Sign in to continue</button></div></div>; }
