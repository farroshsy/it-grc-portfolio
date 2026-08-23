# Principal Architecture Review

## Executive assessment

Control Ledger has progressed beyond a portfolio mock-up into a credible, bounded control-assurance product. Its strongest quality is **intentional boundaries**: role checks stay on the server, evidence bytes stay out of the database, raw trace exports are not persisted, scheduled work uses the managed scheduler rather than in-process timers, and Google secrets are kept outside the browser. Those are the correct design instincts for an IT GRC-oriented application.

The primary concern is no longer functional completeness. It is **operational repeatability**. The repository needs a deterministic quality gate, a package-manager configuration that is actually honored by the installed pnpm version, and an explicit long-term plan for the remaining high-concentration domains. A wholesale rewrite would reduce delivery safety rather than improve it.

## Quality-attribute scorecard

| Quality attribute | Assessment | Evidence and reasoning | Direction |
|---|---|---|---|
| Security boundaries | Strong | Server-side RBAC, S3-backed evidence, expiry link revocation, metadata-only trace retention, secret-free browser configuration, and inactive-by-default integrations are present. | Preserve and extend cautiously. |
| Domain integrity | Good | Evidence, tests, findings, remediation, and risk acceptance form a recognizable control-assurance lifecycle with provenance labels. | Preserve the core lifecycle as one unit until transaction semantics are designed. |
| Contract safety | Good | tRPC procedures and focused Vitest router tests provide typed client/server contracts. | Add delivery gates rather than changing the contract model. |
| Delivery repeatability | Improved | A frozen pnpm install and one deterministic verification command now back the GitHub Actions quality gate. | Preserve and enforce. |
| Dependency posture | Needs managed upgrade | Installation reports a deprecated Recharts 2 branch and a Vite 7 peer-range mismatch for the development-only JSX-location plugin. | Upgrade deliberately, not opportunistically. |
| Performance | Improving | Route-level lazy loading now defers large workspace and PDF/chart routes, but shared dependency chunks remain significant. | Measure first; defer manual chunking. |
| Maintainability | Mixed | The tutorial now demonstrates a bounded feature slice; administration and the control-assurance data layer remain concentrated. | Split one cohesive domain at a time. |
| Operational observability | Basic | Errors are surfaced in local logs and UI states, but there is no deliberate correlation-ID, structured-event, or health-readiness strategy. | Design before implementation. |

## What is good and should not be destabilized

The current **tRPC-first** interaction model is appropriate. Replacing it with parallel REST endpoints would duplicate contracts without resolving domain complexity. The existing role model should remain server-authoritative, and the deliberate use of managed storage instead of database file blobs is correct. Likewise, the Heartbeat-based retention-review path and the Google OAuth-pending status are safer than prematurely activating an unverified delivery channel.

The incremental feature-slice approach should also remain. It has already reduced tutorial coupling without creating a repository-wide migration. This is the right migration posture for an active product: stabilize a bounded seam, prove it with tests, and reuse the pattern only when the next domain is ready.

## Upgrade decision matrix

| Candidate | Benefit | Cost and trade-off | Priority | Decision |
|---|---|---|---|---|
| CI quality gate for tests, type checks, and production build | Prevents regressions from merging; turns existing quality work into a repeatable delivery control | Adds several minutes to pull-request feedback and requires a GitHub runner | P1 | **Implement now** |
| Move pnpm overrides and patch metadata into `pnpm-workspace.yaml` | Makes package patches and overrides effective under pnpm 10; removes misleading install warnings | Requires a one-time config move and frozen-lockfile verification | P1 | **Implement now** |
| `pnpm verify` command | Gives developers and CI one deterministic local quality command | Slightly longer local command | P1 | **Implement now** |
| Split administrator configuration domain | Reduces page/data-layer concentration and makes roles, retention, reminders, views, and Directory integration independently testable | Requires careful extraction of shared queries and state; risks regressions in a security-sensitive screen | P2 | **Defer until contract-first extraction plan** |
| Transactional outbox for scheduled reminder delivery | Makes retention-run and reminder-dispatch behavior resilient to mid-run failures and external email retry ambiguity | Requires schema, idempotency semantics, and operational monitoring | P2 | **Design before implementing** |
| Structured event logging and readiness endpoint | Improves incident diagnosis and production support | Needs a clear event schema, redaction rules, and monitoring consumer | P2 | **Design before implementing** |
| Recharts 3 and Vite-plugin compatibility upgrade | Removes deprecated/peer-range warnings and aligns library support windows | Requires chart behavior review and possible visual regression work; the chart library is a stated product requirement | P2 | **Plan as a dedicated compatibility release** |
| Manual Vite chunk topology | Could reduce the remaining shared bundle warning | May create cache churn or poor navigation waterfalls without measured real-user performance data | P3 | **Defer; keep route splitting** |
| Broad framework or router rewrite | No clear user-facing gain | Very high migration risk across auth, data, storage, and testing | P3 | **Reject** |

## Implemented principal-level upgrades

The selected release adds the delivery controls that have the best benefit-to-risk ratio: a GitHub Actions quality gate, a canonical package-manager configuration file for pnpm 10, and a `pnpm verify` command used by both people and automation. A frozen installation and the verification command completed successfully after the lockfile was reconciled to the new pnpm configuration. These changes strengthen repeatability without changing business data, authorization semantics, or evidence lifecycle behavior.

## Sequenced next architecture moves

The next extraction should be the **administrator configuration domain**. First create focused contracts and tests for role assignment, retention templates, reminder preferences, saved audit views, and Google readiness. Then move server helpers and client sections behind that seam. Do not split the core control-assurance lifecycle until transaction boundaries and recovery behavior are explicit.

Before enabling Gmail delivery in production, design an outbox with delivery attempt identity, a retry policy, safe redaction, and reconciliation reporting. Before adding observability, define an event taxonomy that never records evidence contents, secrets, or raw telemetry.
