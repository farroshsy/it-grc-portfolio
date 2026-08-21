import { createRemediationIssue, getRemediationIssueStatus, type GithubIssueConfig, type RemediationIssueInput } from "./githubIssuesProvider";

export type RemediationProvider = "GitHub Issues";

export async function createExternalRemediation(provider: RemediationProvider, finding: RemediationIssueInput, options?: { config?: GithubIssueConfig; fetcher?: typeof fetch }) {
  if (provider === "GitHub Issues") return createRemediationIssue(finding, options);
  throw new Error(`Unsupported remediation provider: ${provider satisfies never}`);
}

export async function refreshExternalRemediation(provider: RemediationProvider, issueNumber: number, options?: { config?: GithubIssueConfig; fetcher?: typeof fetch }) {
  if (provider === "GitHub Issues") return getRemediationIssueStatus(issueNumber, options);
  throw new Error(`Unsupported remediation provider: ${provider satisfies never}`);
}
