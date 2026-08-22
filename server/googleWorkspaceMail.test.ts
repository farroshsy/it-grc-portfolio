import { afterEach, describe, expect, it, vi } from "vitest";
import { getGoogleWorkspaceEmailStatus, sendRetentionReviewEmail } from "./googleWorkspaceMail";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Google Workspace retention-review mail adapter", () => {
  it("stays pending until all server-only credentials and sender configuration exist", () => {
    vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_WORKSPACE_REFRESH_TOKEN", "");
    vi.stubEnv("GOOGLE_WORKSPACE_SENDER_EMAIL", "");
    const status = getGoogleWorkspaceEmailStatus();
    expect(status.configured).toBe(false);
    expect(status.missingVariables).toContain("GOOGLE_WORKSPACE_REFRESH_TOKEN");
    expect(status.note).toContain("inactive");
  });

  it("sends only count-based reminder text through a refreshed Gmail access token", async () => {
    vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("GOOGLE_WORKSPACE_REFRESH_TOKEN", "refresh-token");
    vi.stubEnv("GOOGLE_WORKSPACE_SENDER_EMAIL", "grc-notify@example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "gmail-message" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendRetentionReviewEmail({ recipientEmail: "admin@example.com", dueAttachmentCount: 4, overdueAttachmentCount: 2 })).resolves.toEqual({ delivered: true });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://oauth2.googleapis.com/token", expect.objectContaining({ method: "POST" }));
    const [, request] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(fetchMock.mock.calls[1][0]).toBe("https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    expect(request.headers).toMatchObject({ authorization: "Bearer access-token" });
    const raw = JSON.parse(request.body as string).raw as string;
    const message = Buffer.from(raw, "base64url").toString("utf8");
    expect(message).toContain("Evidence records due for review: 4");
    expect(message).toContain("Evidence records expired: 2");
    expect(message).not.toContain("attachment-name");
    expect(message).not.toMatch(/https?:\/\//);
  });
});
