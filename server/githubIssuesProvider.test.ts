import { describe, expect, it, vi } from "vitest";
import { buildGithubIssuePayload, createRemediationIssue, getGithubIssueConfig, getRemediationIssueStatus } from "./githubIssuesProvider";

const finding = { findingId: "FND-001", controlId: "CAA-AC-01", title: "Ticket linkage missing", severity: "High", owner: "Security Engineering", dueDate: new Date("2026-09-30"), description: "A simulated emergency elevation lacks a retained work-item reference." };

describe("githubIssuesProvider", () => {
  it("stays in offline-first mode when a repository and token are not configured", async () => {
    expect(getGithubIssueConfig({})).toMatchObject({ configured: false, token: "", owner: "", repository: "" });
    await expect(createRemediationIssue(finding, { config: getGithubIssueConfig({}) })).resolves.toMatchObject({ mode: "offline", repository: "Not configured" });
  });

  it("builds a traceable payload without leaking token data", () => {
    const payload = buildGithubIssuePayload(finding);
    expect(payload.title).toContain("FND-001");
    expect(payload.body).toContain("CAA-AC-01");
    expect(payload.body).toContain("GRC retains final authority");
    expect(payload.labels).toEqual(["grc-remediation", "severity:high"]);
  });

  it("creates a repository issue through a controlled provider response when configured", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 42, html_url: "https://github.com/acme/remediations/issues/42", state: "open" }), { status: 201 }));
    const result = await createRemediationIssue(finding, { config: getGithubIssueConfig({ GITHUB_TOKEN: "secret", GITHUB_OWNER: "acme", GITHUB_REPOSITORY: "remediations" }), fetcher });
    expect(result).toEqual({ mode: "connected", repository: "acme/remediations", issueNumber: 42, issueUrl: "https://github.com/acme/remediations/issues/42", state: "open" });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/acme/remediations/issues");
    expect((fetcher.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it("reconciles a connected issue's status through a controlled provider response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ html_url: "https://github.com/acme/remediations/issues/42", state: "closed" }), { status: 200 }));
    await expect(getRemediationIssueStatus(42, { config: getGithubIssueConfig({ GITHUB_TOKEN: "secret", GITHUB_OWNER: "acme", GITHUB_REPOSITORY: "remediations" }), fetcher })).resolves.toEqual({ mode: "connected", repository: "acme/remediations", issueUrl: "https://github.com/acme/remediations/issues/42", state: "closed" });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/acme/remediations/issues/42");
  });
});
