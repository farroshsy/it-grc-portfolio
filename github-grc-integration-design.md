# GitHub Issues Integration — GRC Product Design

## Business Problem

Engineering teams frequently track remediation work in an issue tracker while GRC teams track control failures, evidence, risk decisions, and management reporting somewhere else. This separation creates a gap: a finding can exist without accountable engineering delivery, and an engineering issue can close without GRC validating whether the control is actually effective.

The product will solve this by making the GRC workspace the source of truth for the **control-assurance lifecycle** and GitHub Issues the execution system for engineering remediation. A control test exception creates a GRC finding. The GRC user creates or links one GitHub issue. GitHub issue state is synchronized into the remediation record, and GRC makes the final closure or risk-acceptance decision.

## Free Connection Boundary

The integration will use a fine-grained GitHub personal access token scoped to **one selected repository** with only the repository **Issues: Read and write** permission required for the intended create, read, and update operations. The token will remain a server-side secret and must never be exposed in client code. If a repository is not connected, the app remains fully usable in local workflow mode and records a pending synchronization state.

| Workflow event | GRC product action | GitHub action | Final authority |
|---|---|---|---|
| Control test exception | Create finding and assign treatment owner | None until owner requests remediation | GRC analyst |
| Remediation approved | Create or link a remediation record | Create issue with GRC identifiers and acceptance criteria | GRC analyst |
| Engineering progress | Read current issue state | Update state/comments in GitHub | Engineering owner |
| Engineering closure | Record sync snapshot | Issue becomes closed | Engineering owner |
| Final risk disposition | Retest control or formally accept residual risk | Issue remains linked as evidence | GRC approver |

## Integration API Contract

The server boundary will implement provider-agnostic `createRemediationIssue`, `getIssueStatus`, and `syncRemediation` operations. The first provider is GitHub REST. The required GitHub operations are repository issue creation, retrieval/listing, and updates. GitHub documents repository issue REST endpoints and supports fine-grained personal access tokens. GitHub recommends fine-grained tokens where available and allows limiting them to a single owner and selected repositories.[1] [2]

## Connection Setup

1. Create a free GitHub repository to hold remediation work.
2. Create a fine-grained personal access token under GitHub settings, limited to that repository and with **Issues: Read and write** permission.
3. Store the token only as a server-side project secret together with repository owner and repository name.
4. Use the GRC connection page to verify access before creating an issue.

## References

[1] [GitHub Docs, *REST API endpoints for issues*](https://docs.github.com/en/rest/issues/issues)

[2] [GitHub Docs, *Managing your personal access tokens*](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
