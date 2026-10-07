# Progress

Session handoff log. `/flow:handoff` rewrites the "Current" section before `/clear`;
`/flow:catchup` reads it after.

## Current (2026-10-06)

- **Feature:** 001-settings-ui-redesign (`docs/specs/001-settings-ui-redesign/`).
- **Branch:** `001-settings-ui-redesign`, the integration branch, cut from `master` at
  7.5.5 (`8bc8bb00`).
- **Phase:** build in progress (started 2026-10-07, running until blocked).
- **Done:** spec approved (DB-01 to DB-18, SC-01 to SC-07); clarifications C-1 to C-9
  (`clarify.md`); ADR-001 to ADR-013 (ADR-012 accepted at sign-off; ADR-014 reserved for
  spike T-014); `plan.md` and `tasks.md` approved with review fixes (32 tasks: stages A–F
  tasked, G–I gated slices; T-017 signed off as the only script task); flow initialized.
- **In progress:** nothing.
- **Carry into build:**
  - The input technical spec lives outside the repo
    (`~/Downloads/SETTINGS-UI/TAILWIND-MIGRATION-SPEC.md`); builders use it for detail.
  - E2E proofs run through `npm run e2e`; from T-032 on they build first
    (`npm run build:all`). Never stage or commit build output (ADR-006).
  - Tasks land as direct commits on the integration branch until T-019 brings CI
    (plan §4 item 8); T-006's gate fails with an install hint when phpcs is missing
    (item 9).
- **Problems:** pinned PHP dev tools likely fail on PHP 8.5 (T-004 fixes);
  `phpunit.xml.dist` points at a missing `tests/legacy/` (T-005 fixes).
- **Failing tests:** none known; no runnable suite yet.
- **Pushed:** no; the branch exists only locally.

## Build log (001)

One line per finished task; `tasks.md` holds the durable `outcome:` records.

- 2026-10-07 T-001 done: settings app builds from source (npm, @wordpress/scripts 30.27.0, Node 24); asset check made format-agnostic.
- 2026-10-07 T-002 done: root gulp toolchain rebuilds the admin CSS (sass pinned at 1.76.0 for parity). Flag for T-032: the shipped admin.css is stale against its SCSS, and placeholder widths are random per build.
- 2026-10-07 T-003 done: weight baselines recorded; the fresh build is the SC-03/SC-04 reference, with the shipped bundle listed for context.
- 2026-10-07 T-004 done: PHPCS 3.13.6, WPCS 3.4.1 and PHPUnit 9.6.38 run on PHP 8.5; ruleset filled for this plugin. Repo baseline: 12,135 WPCS errors (not enforced).
- 2026-10-07 T-005 done: PHPUnit runs against the WordPress test library (MariaDB in Docker); the stale installer test now targets a supported slug (maintainer-approved), and both network tests sit in the external-http group.
- 2026-10-07 T-006 done: the gate blocks coding-standard findings on changed PHP lines (measured against HEAD); legacy findings elsewhere pass.
- 2026-10-07 T-007 done: wp-env runs WordPress 7.1.3 (8888) and 5.9 on PHP 7.4 (8889); Playwright defines the six projects and the setup creates the locale users.
- 2026-10-07 T-008 done: outbound HTTP is stubbed in both test sites (unknown hosts logged) and an idempotent seed fixes the plugin state; fixture spec green.
- 2026-10-07 T-009 done: smoke and axe layers cover all 37 screens; today: no console errors or failed REST calls, 77 serious/critical axe findings recorded.
- 2026-10-07 T-031 done: the token-rename script and its fixture test are ready for script-mode T-017; real tree untouched.
- 2026-10-07 T-010 done (after dispatcher takeover): visual + isolation baselines deterministic — seeded real legal documents for the banner preview, hardened the setup login with retries, accepted under the plan CI retry policy (3x green, retries unused). Follow-up T-033 added for the class-selector cleanup.
