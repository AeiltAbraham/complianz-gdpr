# ADR-012: CI for the integration branch runs on GitHub Actions

## Status

Accepted (maintainer sign-off at /flow:design on 2026-10-06; plan.md §4 item 1)

Source: /flow:design for 001-settings-ui-redesign (plan.md, Stage E). Replaces the input
technical spec's GitLab CI job design, which cannot run on this GitHub fork. Recorded
2026-10-06.

## Context

FR-021/FR-022 of the input spec and SC-06 require the e2e suite to run on every change
into the integration branch and to block merges when red; ADR-004 and ADR-007 add
permanent text checks that must run in the same place. The inherited `.gitlab-ci.yml` and
`.travis.yml` are inert on GitHub. GitHub-hosted Ubuntu runners ship Docker, so wp-env
(ADR-011) runs unchanged. Actions minutes are free for public repositories. Without CI,
the only enforcement point is the local commit gate, which a contributor's machine can
skip and which cannot protect merges.

## Decision

We add one GitHub Actions workflow that, on pull requests into and pushes to
`001-settings-ui-redesign`, builds both bundles, runs the permanent checks (token greps,
physical-utilities check, stylelint) and the admin e2e projects on wp-env, uploads the
Playwright report and screenshot diffs as artifacts, and is marked as a required status
check on the integration branch.

## Alternatives considered

- **No CI; rely on the local gate and manual suite runs**: lost because FR-022 requires a
  merge-blocking run, weekly `master` merges land without any check otherwise, and a
  full local suite run before every merge does not scale over a months-long branch. This
  remains the fallback if this ADR is declined.
- **Self-hosted runner**: lost because a public fork with free hosted minutes gains
  nothing from maintaining runner infrastructure, and a public repo's self-hosted runner
  is a security liability.
- **WordPress Playground CLI in CI instead of wp-env**: lost because hosted runners have
  Docker, so the lower-fidelity environment solves a problem this fork does not have
  (see ADR-011).

## Consequences

- One environment definition (`.wp-env.json`) serves local runs and CI; the suite's
  wp-cli/webServer indirection (ADR-011) stays, so a different CI host later needs no
  spec changes.
- Branch protection (required status check on `001-settings-ui-redesign`) is a repository
  setting the maintainer applies by hand; the workflow alone does not block merges.
- The release-stage i18n regeneration (C-7) runs inside the workflow's wp-env, replacing
  the premium repository's deploy-script steps.
- Harder: the suite (two WordPress instances, four Playwright projects, visual baselines)
  is heavy for hosted runners; the workflow caches npm and Docker layers where it can,
  and runtime is reviewed at the Phase 1 checkpoint. A flaky suite would block merges —
  retries are CI-only and flaky tests are quarantined with an owner.
- If declined: tasks keep their proofs runnable locally; only the merge-blocking
  guarantee (FR-022) is lost and `.agent/gate.json` becomes the single enforcement point.

Related: ADR-004, ADR-006, ADR-007, ADR-011
