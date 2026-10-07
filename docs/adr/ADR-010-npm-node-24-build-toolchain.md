# ADR-010: npm and Node 24 for the JavaScript build toolchain

## Status

Accepted

Source: /flow:design for 001-settings-ui-redesign (plan.md, Stage A). Settles the input
technical spec's D7 (Node version) and the `TODO: confirm` in `.agent/conventions.md`
(package manager). Recorded 2026-10-06.

## Context

This fork has no `package.json` anywhere: `settings/webpack.config.js` (extends
`@wordpress/scripts`) and the root `gulpfile.js` exist, but neither the settings app nor
the root CSS can be built from this checkout (clarify C-R3). Feature 001 needs two
manifests (one in `settings/`, one at the root for gulp and the e2e tooling) plus a
pinned runtime. The machine has npm 11, pnpm 11 and Node 24; the private premium
repository, which may adopt this work later (C-1), builds the same app with npm. Tailwind
v4 — still a candidate until Spike S1 (D1) — requires Node ≥ 20.

## Decision

We manage both new manifests with npm (committed `package-lock.json`, installs via
`npm ci`) and pin Node 24 (active LTS) in an `.nvmrc` and `engines` field.

## Alternatives considered

- **pnpm**: lost because the premium repository and the `@wordpress/scripts` / `wp-env`
  ecosystem assume npm layouts and `package-lock.json`; diverging would make the later
  premium adoption (C-1) and upstream comparisons needlessly harder for no measured gain
  on a project this size.
- **Node 20 (minimum that keeps Tailwind v4 possible)**: lost because the machine and CI
  images already run Node 24, which is the active LTS; pinning lower would mean testing
  on a runtime nothing uses.
- **No pin**: lost because an unpinned Node version drifts between the maintainer's
  machine and CI, and D7 exists precisely because the input spec found no pin.

## Consequences

- `settings/package.json` is reconstructed from the imports in `settings/src` and the
  webpack config (ADR-002/ADR-003 list the UI libraries; `@wordpress/scripts` stays on
  30.x per the input spec's non-goals); the root `package.json` carries gulp and the e2e
  tooling. Both lockfiles are committed; the fork is public, so no private registry
  entries may appear.
- Node 24 satisfies both Tailwind candidates, so D1 (Spike S1) is not constrained by the
  runtime.
- Harder: two manifests must stay coherent (e.g. one Playwright version), and any future
  premium sync must reconcile this lockfile with the premium one.

Related: ADR-001, ADR-002, ADR-011
