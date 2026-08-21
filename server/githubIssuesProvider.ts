export type GithubIssueConfig = {
  token: string;
  owner: string;
  repository: string;
  configured: boolean;
};

export type RemediationIssueInput = {
  findingId: string;
  controlId: string;
  title: string;
  severity: string;
  owner: string;
  dueDate: Date;
  description: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function getGithubIssueConfig(env: Record<string, string | undefined> = process.env): GithubIssueConfig {
  const token = env.GITHUB_TOKEN?.trim() ?? "";
  const owner = env.GITHUB_OWNER?.trim() ?? "";
  const repository = env.GITHUB_REPOSITORY?.trim() ?? "";
  return { token, owner, repository, configured: Boolean(token && owner && repository) };
}

export function buildGithubIssuePayload(finding: RemediationIssueInput) {
  return {
    title: `[GRC ${finding.findingId}] ${finding.title}`,
    body: [
      "## Control Assurance Hub remediation request",
      "",
      `- **Finding ID:** ${finding.findingId}`,
      `- **Control ID:** ${finding.controlId}`,
      `- **Severity:** ${finding.severity}`,
      `- **Engineering owner:** ${finding.owner}`,
      `- **Target date:** ${finding.dueDate.toISOString().slice(0, 10)}`,
      "",
      "### Exception summary",
      finding.description,
      "",
      "### GRC acceptance criteria",
      "Provide implementation evidence, link the relevant engineering change, and request a GRC retest before marking this remediation complete.",
      "",
      "> This issue was created from a Control Assurance Hub record. GRC retains final authority for control retest and closure.",
    ].join("\n"),
    labels: ["grc-remediation", `severity:${finding.severity.toLowerCase()}`],
  };
}

export type GithubIssueResult =
  | { mode: "offline"; repository: "Not configured"; message: string }
  | { mode: "connected"; repository: string; issueNumber: number; issueUrl: string; state: "open" | "closed" };

export async function createRemediationIssue(
  finding: RemediationIssueInput,
  options: { config?: GithubIssueConfig; fetcher?: FetchLike } = {},
): Promise<GithubIssueResult> {
  const config = options.config ?? getGithubIssueConfig();
  if (!config.configured) {
    return { mode: "offline", repository: "Not configured", message: "GitHub is not configured. The remediation remains ready to create in offline-first mode." };
  }
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repository)}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "Control-Assurance-Hub",
    },
    body: JSON.stringify(buildGithubIssuePayload(finding)),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`GitHub issue creation failed (${response.status}): ${detail || response.statusText}`);
  }
  const issue = await response.json() as { number: number; html_url: string; state: "open" | "closed" };
  return { mode: "connected", repository: `${config.owner}/${config.repository}`, issueNumber: issue.number, issueUrl: issue.html_url, state: issue.state };
}

export async function getRemediationIssueStatus(
  issueNumber: number,
  options: { config?: GithubIssueConfig; fetcher?: FetchLike } = {},
): Promise<{ mode: "offline"; message: string } | { mode: "connected"; state: "open" | "closed"; issueUrl: string; repository: string }> {
  const config = options.config ?? getGithubIssueConfig();
  if (!config.configured) return { mode: "offline", message: "GitHub is not configured. The stored remediation state remains authoritative until a connection is supplied." };
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repository)}/issues/${issueNumber}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "Control-Assurance-Hub",
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`GitHub issue status refresh failed (${response.status}): ${detail || response.statusText}`);
  }
  const issue = await response.json() as { html_url: string; state: "open" | "closed" };
  return { mode: "connected", repository: `${config.owner}/${config.repository}`, state: issue.state, issueUrl: issue.html_url };
}
