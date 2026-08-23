# Architecture Upgrade Decision

## Current repository signal

Control Ledger has a sound functional foundation: React pages are separated from the Express/tRPC server, database schema and migrations are isolated under `drizzle/`, and tests cover contracts and user interactions. The main maintainability pressure is not framework choice; it is **concentration**. The administrative page and the control-assurance data layer have accumulated multiple operating concerns, while the newer tutorial capability spans a page, shared navigation, protected progress persistence, and contextual links.

> **Decision principle:** avoid a directory-only rewrite. A refactor is selected only when it creates a clearer ownership boundary while preserving contracts and limiting migration risk.

| Upgrade option | Advantages | Disadvantages | Cost and risk | Decision |
|---|---|---|---|---|
| Full vertical-slice rewrite of all portfolio and GRC features | Consistent feature ownership; less cross-folder searching in the long term | Touches nearly every import, test mock, and route; creates a large review surface without improving current user flows | High cost and high regression risk | **Defer** |
| Split the entire control-assurance data layer and administrator page at once | Reduces the two largest custom modules; enables focused ownership per GRC workflow | The role, retention, notification, evidence, and remediation workflows share query helpers and transaction assumptions; a single migration would be difficult to verify incrementally | High cost and medium-to-high regression risk | **Defer; split one bounded domain at a time later** |
| Introduce a feature slice for the tutorial and progress capability | Gives the cross-cutting tutorial one owner for step metadata and deep-link construction; removes repeated step arithmetic; aligns client and server feature boundaries | Adds a small amount of indirection and a new folder convention that maintainers must follow | Low cost and low regression risk | **Proceed** |
| Lazy-load route-level pages | The public shell no longer eagerly ships every administration, chart, PDF, and workspace screen; directly addresses the production bundle warning | First navigation to an unloaded route has a small loading state and each route becomes a separate network request | Low cost and low regression risk | **Proceed** |
| Replace current tooling or move to a different application framework | Could standardize with a different ecosystem preference | Does not solve the current ownership problem, requires retraining, and risks auth/database/runtime compatibility | Very high cost and high regression risk | **Reject** |

## Selected upgrade

The selected upgrade is an **incremental tutorial feature slice plus route-level code splitting**. Client tutorial step definitions and deep-link construction move under `client/src/features/tutorial/`; server-side progress persistence moves under `server/features/tutorial/`. Route pages are loaded through React lazy boundaries, with a deliberate loading fallback. URLs and tRPC contracts stay stable.

| Area | Before | After | Benefit |
|---|---|---|---|
| Tutorial steps | Local page constant and repeated numeric link arithmetic | Feature-owned model with named step count and link helper | A contextual link and the guide cannot drift to different step numbers |
| Client ownership | Tutorial page and common shell jointly own tutorial behavior | `features/tutorial` owns model and deep-link semantics; common shell only renders a reusable link | Clearer dependency direction |
| Server ownership | Progress database helper sits beside unrelated server modules | `features/tutorial/progressDb.ts` owns only private walkthrough state | Directory structure mirrors the product capability |
| Future refactors | Broad all-at-once migration | Reuse this pattern only for bounded domains with stable tests | Preserves delivery pace and reduces regression exposure |

### Verification outcome

The production build now emits distinct route chunks for the workspace, administration, compliance dashboard, executive briefing, policy pack, audit surfaces, and tutorial. The original all-pages application chunk was approximately 1.9 MB before compression; the shared entry is now approximately 624 KB before compression, while heavier route-only code is deferred. The build still reports a size warning for a shared dependency chunk and the executive briefing/PDF route. That warning is retained as an explicit future optimization opportunity rather than forcing risky manual chunking in this release.

## Deferred follow-up

The next worthwhile structural split is likely the **administrator configuration domain**: role assignments, retention policies, reminder preferences, audit views, and Directory delivery readiness can become a bounded server/client feature slice after its shared data access has contract tests. The evidence, test, finding, and remediation lifecycle should remain together until a transaction boundary is explicitly designed and tested.
