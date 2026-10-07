# Progress

Session handoff log. `/flow:handoff` rewrites the "Current" section before `/clear`;
`/flow:catchup` reads it after.

## Current (2026-10-06)

- **Feature:** 001-settings-ui-redesign (`docs/specs/001-settings-ui-redesign/`).
- **Branch:** `001-settings-ui-redesign`, the integration branch, cut from `master` at
  7.5.5 (`8bc8bb00`).
- **Phase:** design approved. Next: `/flow:build`, starting with Stage A (T-001).
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
  - Open for the maintainer: T-006 plans to skip the coding-standards check silently
    when `vendor/bin/phpcs` is missing; failing with an install hint was recommended.
- **Problems:** pinned PHP dev tools likely fail on PHP 8.5 (T-004 fixes);
  `phpunit.xml.dist` points at a missing `tests/legacy/` (T-005 fixes).
- **Failing tests:** none known; no runnable suite yet.
- **Pushed:** no; the branch exists only locally.
