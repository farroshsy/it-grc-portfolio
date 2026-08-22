# Deferred Google Workspace OAuth Activation

## Current boundary

Google Workspace credentials remain deliberately **deferred by the administrator**. The console reports server-side readiness but never accepts, displays, stores, or echoes OAuth credentials. Local workspace-user search, role assignment, and metadata-only in-app retention reminders continue to work without Google authorization.

| Capability | Current behavior | Activation condition |
|---|---|---|
| Directory group discovery | Offline and returns no groups or members | Server-side OAuth configuration is supplied through secure project configuration |
| Local role assignment | Available for existing authenticated local users | No Google dependency |
| In-app retention reminders | Available by default and configurable per administrator | No Google dependency |
| Email retention reminders | A server-side Gmail adapter is prepared; metadata-only delivery records remain queued while credentials are absent | Secure project configuration includes the Gmail sender and a refresh token granted the Gmail send scope |

## Approved scope boundary

The existing adapter is read-only and requires these Google Admin SDK Directory API OAuth scopes:

| Scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/admin.directory.group.readonly` | Search Google Workspace groups within the configured domain |
| `https://www.googleapis.com/auth/admin.directory.group.member.readonly` | List members of a selected group for matching to existing local workspace users |
| `https://www.googleapis.com/auth/gmail.send` | Send count-only retention-review reminders on behalf of the configured server mailbox |

Directory members are only a discovery source. They are matched by email to people who have already authenticated to the local workspace; the integration does not create local users or assign roles automatically.

## Secure activation checklist

1. Create or approve an OAuth client in the intended Google Workspace tenant and enable the Admin SDK Directory API.
2. Grant only the two read-only Directory scopes above plus `https://www.googleapis.com/auth/gmail.send` to the approved sender identity. Google documents `gmail.send` as a sensitive send-only scope; do not replace it with broader mailbox scopes. [1]
3. Configure the exact redirect URI when using an authorization-code flow. It must match the OAuth client configuration exactly.
4. Place `GOOGLE_WORKSPACE_CLIENT_ID`, `GOOGLE_WORKSPACE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_REFRESH_TOKEN`, `GOOGLE_WORKSPACE_DOMAIN`, and `GOOGLE_WORKSPACE_SENDER_EMAIL` only in secure server-side project configuration. Never paste them into the administrator page.
5. Verify read-only group discovery, then use the queue-processing action to send a metadata-only test reminder. The Gmail API uses a base64url-encoded MIME message submitted to `users.messages.send`; the implementation contains due and expired counts only. [2]

> The project-owner push notification generated after a scheduled retention review is separate from per-administrator in-app and queued-email preferences. It is a metadata-only project-owner alert and never contains attachment names, contents, or storage links.

## References

[1]: https://developers.google.com/workspace/gmail/api/auth/scopes "Google Gmail API scopes"
[2]: https://developers.google.com/workspace/gmail/api/guides/sending "Google Gmail API: create and send messages"
