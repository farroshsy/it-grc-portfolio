type DirectoryGroup = { id: string; email: string; name: string; description?: string };
type DirectoryMember = { id: string; email: string; role: "OWNER" | "MANAGER" | "MEMBER"; type: string };

const requiredVariables = ["GOOGLE_WORKSPACE_CLIENT_ID", "GOOGLE_WORKSPACE_CLIENT_SECRET", "GOOGLE_WORKSPACE_REFRESH_TOKEN", "GOOGLE_WORKSPACE_DOMAIN"] as const;

export function getGoogleWorkspaceDirectoryStatus() {
  const missing = requiredVariables.filter((key) => !process.env[key]);
  return {
    provider: "Google Workspace" as const,
    mode: missing.length ? "offline" as const : "configured" as const,
    configured: missing.length === 0,
    missingVariables: missing,
    permissions: ["admin.directory.group.readonly", "admin.directory.group.member.readonly"] as const,
    note: missing.length ? "Directory discovery is inactive until administrator-approved OAuth credentials are configured. Local workspace-user search remains available." : "Directory group discovery is read-only and scoped to the configured Google Workspace domain.",
  };
}

async function directoryAccessToken() {
  const status = getGoogleWorkspaceDirectoryStatus();
  if (!status.configured) throw new Error("Google Workspace Directory OAuth is not configured.");
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_WORKSPACE_CLIENT_ID!, client_secret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET!, refresh_token: process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN!, grant_type: "refresh_token" });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("Google Workspace OAuth refresh failed. Confirm the approved Directory API scopes and refresh token.");
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google Workspace OAuth did not return an access token.");
  return payload.access_token;
}

async function directoryRequest<T>(path: string) {
  const accessToken = await directoryAccessToken();
  const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/${path}`, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Google Workspace Directory request failed (${response.status}). Verify the delegated administrator permissions and configured domain.`);
  return response.json() as Promise<T>;
}

export async function listGoogleWorkspaceGroups(query = "") {
  const status = getGoogleWorkspaceDirectoryStatus();
  if (!status.configured) return { ...status, groups: [] as DirectoryGroup[] };
  const params = new URLSearchParams({ domain: process.env.GOOGLE_WORKSPACE_DOMAIN!, maxResults: "100", ...(query.trim() ? { query: `email:${query.trim()}` } : {}) });
  const payload = await directoryRequest<{ groups?: Array<{ id?: string; email?: string; name?: string; description?: string }> }>(`groups?${params.toString()}`);
  return { ...status, groups: (payload.groups ?? []).flatMap((group) => group.id && group.email && group.name ? [{ id: group.id, email: group.email, name: group.name, description: group.description }] : []) };
}

export async function listGoogleWorkspaceGroupMembers(groupKey: string) {
  const status = getGoogleWorkspaceDirectoryStatus();
  if (!status.configured) return { ...status, members: [] as DirectoryMember[] };
  const payload = await directoryRequest<{ members?: Array<{ id?: string; email?: string; role?: "OWNER" | "MANAGER" | "MEMBER"; type?: string }> }>(`groups/${encodeURIComponent(groupKey)}/members?maxResults=200`);
  return { ...status, members: (payload.members ?? []).flatMap((member) => member.id && member.email && member.role && member.type ? [{ id: member.id, email: member.email, role: member.role, type: member.type }] : []) };
}
