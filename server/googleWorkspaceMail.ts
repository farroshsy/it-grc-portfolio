const requiredMailVariables = ["GOOGLE_WORKSPACE_CLIENT_ID", "GOOGLE_WORKSPACE_CLIENT_SECRET", "GOOGLE_WORKSPACE_REFRESH_TOKEN", "GOOGLE_WORKSPACE_SENDER_EMAIL"] as const;

type RetentionReminderEmail = {
  recipientEmail: string;
  dueAttachmentCount: number;
  overdueAttachmentCount: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getGoogleWorkspaceEmailStatus() {
  const missingVariables = requiredMailVariables.filter((key) => !process.env[key]);
  return {
    provider: "Google Workspace Gmail API" as const,
    configured: missingVariables.length === 0,
    missingVariables,
    requiredScope: "https://www.googleapis.com/auth/gmail.send" as const,
    note: missingVariables.length
      ? "Server-side Gmail delivery is inactive until secure project configuration is complete. Queued email reminders remain unsent."
      : "Server-side Gmail configuration is present. Delivery is verified only when the authorized mailbox accepts a metadata-only reminder.",
  };
}

function requireSafeEmail(value: string | undefined, label: string) {
  if (!value || !emailPattern.test(value)) throw new Error(`${label} is unavailable for Google Workspace delivery.`);
  return value;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function gmailAccessToken() {
  const status = getGoogleWorkspaceEmailStatus();
  if (!status.configured) throw new Error("Google Workspace email delivery is not configured.");
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_WORKSPACE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("Google Workspace authorization could not refresh the server-side access token.");
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google Workspace authorization did not return a server-side access token.");
  return payload.access_token;
}

export async function sendRetentionReviewEmail(input: RetentionReminderEmail) {
  const recipientEmail = requireSafeEmail(input.recipientEmail, "Recipient email");
  const senderEmail = requireSafeEmail(process.env.GOOGLE_WORKSPACE_SENDER_EMAIL, "Sender email");
  const accessToken = await gmailAccessToken();
  const subject = "Control Ledger · evidence retention review";
  const body = [
    "A scheduled Control Ledger evidence-retention review requires attention.",
    "",
    `Evidence records due for review: ${input.dueAttachmentCount}`,
    `Evidence records expired: ${input.overdueAttachmentCount}`,
    "",
    "Open the administrator retention queue to review the metadata. This email intentionally excludes attachment names, evidence content, and storage links.",
  ].join("\r\n");
  const raw = base64Url([`To: ${recipientEmail}`, `From: ${senderEmail}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n"));
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) throw new Error("Google Workspace email delivery was rejected.");
  return { delivered: true as const };
}
