# ADR-011: The e2e suite runs on wp-env with Playwright; external services are stubbed by a test mu-plugin

## Status

Accepted

Source: /flow:design for 001-settings-ui-redesign (plan.md, Stage C), adapting the input
technical spec's e2e-suite design (its §8.1) to this fork, which has no e2e tests, no
`.wp-env.json` and no Playwright config. Recorded 2026-10-06.

## Context

SC-06 and DB-16 require a whole-app characterization suite that is green on today's UI
before any migration work, covering latest WordPress and the WordPress 5.9 / PHP 7.4
floor (DB-15), RTL (DB-13) and German (DB-14). A Playwright project cannot switch
WordPress instance or site locale, so the environments must come from the WordPress side.
The plugin makes server-side HTTP calls (cookiedatabase.org, the website-scan service,
complianz.io feeds, api.wordpress.org) that Playwright's network interception can never
see, because they happen in PHP, not in the browser. Docker 29 is installed locally.

## Decision

We build the suite on `@wordpress/env` (two instances from one `.wp-env.json`: latest
WordPress on 8888 and WordPress 5.9 / PHP 7.4 on 8889) with Playwright projects selecting
instance and user locale (`admin`, `admin-rtl` as `he_IL`, `admin-de` as `de_DE`,
`admin-min-wp`), and stub every server-side external call with a test-only mu-plugin that
short-circuits `pre_http_request`, mapped into the environment only by `.wp-env.json`.

## Alternatives considered

- **WordPress Playground CLI (PHP-WASM + SQLite, no Docker)**: lost because it cannot
  faithfully pin PHP 7.4 with a MySQL-backed WordPress 5.9, and fidelity to the supported
  floor is the point of DB-15; kept as a fallback if CI cannot run Docker (ADR-012 shows
  it can).
- **A single instance, switching WordPress versions between runs**: lost because the
  suite must run both environments in one invocation at every checkpoint, and re-provisioning
  between projects is slower and stateful.
- **Stubbing external services in Playwright (route interception)**: lost because the
  calls are made by PHP on the server; the browser never sees them.
- **Stubbing via constants/filters only, no mu-plugin**: lost because no existing
  constant covers all of the cookiedatabase sync, website scan and feed calls in this
  codebase; a mu-plugin can both short-circuit and log any outbound request, giving the
  suite a "no real network" assertion.

## Consequences

- Suite layout: `tests/e2e/playwright.config.js`, specs in `tests/e2e/admin/`, setup
  projects instead of a `globalSetup`, seeded fixture via each instance's wp-cli wrapper,
  `workers: 1`, fixed clock, reduced motion, masked dynamic regions, baselines committed
  under `tests/e2e/admin/__screenshots__/`. wp-cli and web-server invocations are
  configurable by environment variable so the same setup runs locally and in CI
  (ADR-012).
- The mu-plugin also injects a third-party admin notice (DB-04's check) and lives under
  `tests/e2e/`; it is never shipped and never active outside wp-env.
- Free-edition limits are explicit: groups flagged `premium` render locked in this
  repository (`cmplz_settings.is_premium` is false), so the suite characterizes their
  locked rendering; full premium flows are out of scope until premium adoption (C-1).
- The visual-comparison threshold starts at `maxDiffPixelRatio: 0.001` and is calibrated
  by the S3 tasks; the calibrated value is recorded in the suite config with a comment,
  not in a separate ADR.
- Harder: wp-env requires Docker and fixed ports (8888/8889), so only one suite run per
  machine at a time — e2e-proving tasks can never run in parallel (tasks.md honors this).

Related: ADR-006, ADR-008, ADR-010, ADR-012
