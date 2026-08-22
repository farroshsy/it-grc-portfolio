import { afterEach, describe, expect, it } from "vitest";
import { getGoogleWorkspaceDirectoryStatus, listGoogleWorkspaceGroups } from "./googleWorkspaceDirectory";

const keys = ["GOOGLE_WORKSPACE_CLIENT_ID", "GOOGLE_WORKSPACE_CLIENT_SECRET", "GOOGLE_WORKSPACE_REFRESH_TOKEN", "GOOGLE_WORKSPACE_DOMAIN"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => { for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; } });

describe("Google Workspace directory adapter", () => {
  it("stays offline and returns no directory data until all OAuth settings are present", async () => {
    for (const key of keys) delete process.env[key];
    expect(getGoogleWorkspaceDirectoryStatus()).toMatchObject({ provider: "Google Workspace", configured: false, mode: "offline" });
    await expect(listGoogleWorkspaceGroups()).resolves.toMatchObject({ configured: false, groups: [] });
  });
});
