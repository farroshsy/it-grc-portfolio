import { describe, expect, it } from "vitest";
import { getGithubIssueConfig } from "./githubIssuesProvider";
import { refreshExternalRemediation } from "./remediationProvider";

describe("remediation provider dispatch", () => {
  it("declares GitHub Issues as the first supported provider", async () => {
    const provider = await import("./remediationProvider");
    expect(typeof provider.createExternalRemediation).toBe("function");
    expect(typeof provider.refreshExternalRemediation).toBe("function");
  });

  it("dispatches a GitHub refresh through the generic provider contract", async () => {
    const fetcher = async () => new Response(JSON.stringify({ html_url: "https://github.com/acme/repo/issues/8", state: "closed" }), { status: 200 });
    await expect(refreshExternalRemediation("GitHub Issues", 8, { config: getGithubIssueConfig({ GITHUB_TOKEN: "test", GITHUB_OWNER: "acme", GITHUB_REPOSITORY: "repo" }), fetcher })).resolves.toMatchObject({ mode: "connected", repository: "acme/repo", state: "closed" });
  });
});
