# Deferred Google Workspace OAuth Activation

## Current boundary

Google Workspace integration is deliberately **inactive**. The administrator console reports the status but never accepts, displays, stores, or echoes OAuth credentials. Local workspace-user search, role assignment, and metadata-only in-app retention reminders continue to work without Google authorization.

| Capability | Current behavior | Activation condition |
|---|---|---|
| Directory group discovery | Offline and returns no groups or members | Server-side OAuth configuration is supplied through secure project configuration |
| Local role assignment | Available for existing authenticated local users | No Google dependency |
| In-app retention reminders | Available by default and configurable per administrator | No Google dependency |
| Email retention reminders | Metadata delivery records can be queued, but no email is sent | A separately approved, server-side delivery adapter and sender authorization are configured |

## Approved Directory scope boundary

The existing adapter is read-only and requires these Google Admin SDK Directory API OAuth scopes:

| Scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/admin.directory.group.readonly` | Search Google Workspace groups within the configured domain |
| `https://www.googleapis.com/auth/admin.directory.group.member.readonly` | List members of a selected group for matching to existing local workspace users |

Directory members are only a discovery source. They are matched by email to people who have already authenticated to the local workspace; the integration does not create local users or assign roles automatically.

## Secure activation checklist

1. Create or approve an OAuth client in the intended Google Workspace tenant and enable the Admin SDK Directory API.
2. Grant only the two read-only Directory scopes above to the delegated administrator or consented identity. Do not request Gmail send scopes for the current Directory adapter.
3. Configure the exact redirect URI when using an authorization-code flow. It must match the OAuth client configuration exactly.
4. Place `GOOGLE_WORKSPACE_CLIENT_ID`, `GOOGLE_WORKSPACE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_REFRESH_TOKEN`, and `GOOGLE_WORKSPACE_DOMAIN` only in secure server-side project configuration.
5. Verify the status changes to configured, test read-only group discovery, and confirm that matching produces only existing local users.

> The project-owner push notification generated after a scheduled retention review is separate from per-administrator in-app and queued-email preferences. It is a metadata-only project-owner alert and never contains attachment names, contents, or storage links.
