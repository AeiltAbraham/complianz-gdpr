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
- 2026-10-07 T-032 done: a fresh source build reproduces the shipped app; two dependency drifts pinned to the shipped versions (styled-components 5.3.11, chart.js 4.5.0). Suite 10/10 clean. Every e2e proof now builds first.
- 2026-10-07 T-011 done: field + condition layers cover every free-reachable field type (53 types from live /fields/get); one behavior-free data-testid added to Field.js, visual baseline unchanged. 16/16 twice.
- 2026-10-08 T-012 done: six flow specs (wizard/dashboard/dialogs/tools/app-states/page-rules) + 2 attribute-only source hooks. Required a fresh-DB determinism fix (committed first: notices sidebar masked+height-pinned, page-rules uses a seeded rsp notice). Verified green on two reset-DB runs. Cadence from here: reset DB, one verify pass per task.
- 2026-10-08 T-013 done: RTL/min-WP/German projects. min-WP 19/19 on React 17 (no pin), German strings via wp.org plugin pack, tour spec, and a real RTL stylesheet bug fixed in gulpfile. Full-screen visual layer made NON-BLOCKING (maintainer decision) after determinism proved impractical; baselines kept. Stage C complete after T-033.
- 2026-10-08 Stage C complete: the whole-app characterization suite (smoke, axe, fields, conditions, flows, dialogs, tour, RTL, min-WP, German) is committed and green; the full-screen visual layer records drift non-blocking. T-033 (mask-selector cleanup) deferred into Phase 2-4. Next: Stage D spikes (the Tailwind investigation).
- 2026-10-08 CI (interim T-019): GitHub Actions `checks.yml` (build + e2e jobs) pushed and running on the fork. Caught a cross-platform `npm ci` break — `typescript`'s npm `latest` is now the native 7.x preview (platform-binary meta-package with no lockfile nodes); pinned to classic 5.9.3 via `overrides` (dev-only tooling; build parity intact). Build job GREEN. T-019 stays partial: the token-check/physical-utilities/stylelint steps wait on T-016/T-018.
- 2026-10-08 CI first Linux e2e run: build GREEN; e2e 74 passed / 1 flaky / 2 failed. The 2 failures are ENVIRONMENT, not product bugs: (1) isolation banner-preview `toHaveScreenshot` — cross-OS pixel diff (baselines captured on macOS, CI renders on Linux; snapshot template lacks `{platform}`); (2) admin-rtl smoke — Wizard h1 times out at 30s on he_IL (known content-load flake, hard-failing on Linux). Both need a maintainer test-contract decision (critical rule: no assertion changes without approval). AWAITING sign-off.
- 2026-10-08 T-014 done (Stage D, S1 spike): ADR-014 Accepted — Tailwind v3.4, prefix `tw-`, scope `:is(#complianz, #complianz-portal)` via `important:`, scoped base B1–B5 at 1,0,0, portal host `#complianz-portal-root`. v4 rejected (its `@layer utilities` loses to unlayered wp-admin CSS). No ADR overturned → R1 gate clear so far. Media-modal proof failure shown PRE-EXISTING via a clean-tree control run.
- 2026-10-08 admin-rtl smoke fix (CI failure ①): the Wizard showed the "temporarily locked by user 1" placeholder under admin-rtl because the prior `admin` project leaves a 2-min `cmplz_wizard_locked_by_user` transient on the shared DB. The e2e mu-plugin now reports the lock as owned by the current user (app-states' stubbed lock-UI test untouched). Committed.
- 2026-10-08 T-015 done (Stage D, S1 part 2): a11y-exemptions.md + axe-spec wiring (6 widget-internal exemptions, per-(rule,selector) scope; gate inert until MIGRATED_SCREENS fills). NO C-5 replacement candidates (CKEditor live audit pending = conditional). Two our-own-code must-fixes for Phase 2/4: data-table checkbox button-name, Editor HTML-view textarea label. Proof 4 passed + 5/5 scoping harness.
- 2026-10-08 T-016 done (Stage D, S2 spike): settings/scripts/check-physical-utilities.js (ADR-007 enforcement, full §4.6 banned family, strips tw- prefix + variants, rtl:/ltr: escape) + spikes/s2.md. Self-test PASS, real tree 189 files clean. Composition settled: WP preset must be spread (T-020), enqueue needs file_exists guard (T-021), vendor pipeline (prefix-selector + rtlcss) composes with Tailwind into one index.css (settles ADR-009). **Stage D complete** → re-plan gate R1 ready for maintainer sign-off.
- 2026-10-09 Gate R1 ratified by maintainer; CI screenshot decision = Option B. Starting Phase 1 foundation.
- 2026-10-09 Option B applied: every `toHaveScreenshot` in isolation.spec.js is now non-blocking (records drift), functional assertions stay blocking — resolves CI failure ② (cross-OS baseline mismatch). The full-screen visual layer was already non-blocking.
- 2026-10-09 T-017 done (Stage E, Phase 1): `--rsp-*`→`--cmplz-legacy-*` rename via the T-031 script — 57 source files, 2 orphans deleted, scope grep clean (697→0), upgrade/docs/build untouched, idempotent. Build textual-only (admin.css: 0 `--rsp-`, legacy decls on :root); compiled output restored per ADR-006. e2e deferred to CI. (Fixed one pre-existing space-before-tab in bullets.scss:9 the rename surfaced for the whitespace gate.)
- 2026-10-09 T-018 done (Stage E): two permanent token checks added to `.agent/gate.json` (no `--rsp-`/`$rsp-` in SCSS sources+settings/src; no `--cmplz-legacy-` in settings/src/components|styles, tolerant of absent dirs). Both pass post-T-017; planted-violation probe blocks correctly. conventions.md "Gate" updated (checks 4-5).
- 2026-10-09 T-019 done (Stage E): CI workflow completed — build job now also runs the ADR-004 token checks, the ADR-007 physical-utility check, and a non-blocking stylelint step (activated by T-020); e2e job unchanged (4 projects + report upload). YAML validated. testing.md documents the workflow and the Option-B non-blocking contract. First green run of the complete workflow verified on the Phase-1 push (below). Required-status-check marking is a manual maintainer repo setting.
- 2026-10-09 Fixed the pre-existing orphan var the review flagged: shepherd.scss:67 `var(--cmplz-legacy-text-color-hover)` (never defined — upstream `--rsp-text-color-hover` was equally undefined) → `var(--cmplz-legacy-white)`. The undefined var resolved by CSS invalid-at-computed-value fallback to the tour's inherited white (#fff), so making it the explicit white token is look-preserving (same #fff) and removes the orphan. Build verified; compiled CSS no longer references the orphan.
- 2026-10-09 T-020 done (Stage F start): ADR-014 Tailwind v3.4 pipeline in the build (postcss with spread WP preset + prod cssnano; tailwind.config prefix tw-/important scope/preflight off; base.css B1–B5 verbatim; tokens.css 21 semantic --cmplz-* on the scoped roots; tailwind.css entry; index.js import). LOOK-PRESERVING no-op (nothing uses tw-/data-cmplz-ui yet): built index.css has 0 !important, 0 :root, no-Preflight, 0 utilities. tokens.css uses CONCRETE look-preserving values (not var(--cmplz-legacy-*)) — the T-018 gate (b) correctly blocked the reference draft (semantic layer must not depend on legacy names / Phase-5 fragility); resolved by copying concrete values. Stylelint activated (deps + .stylelintrc + CI step flipped to blocking on tokens.css/base.css), completing T-019's deferral. Token vocabulary is a look-preserving proposal pending C-2 sign-off. Deps pinned; typescript stayed 5.x.
- 2026-10-09 Pre-push adversarial review (6-dimension workflow, each finding independently verified) caught TWO real exit-code defects in the token checks BEFORE push: (1) the CI token-hygiene step never gated — a non-final `! grep` is errexit-exempt under `bash -e`, and a `! grep` over a missing dir (exit 2) reads as clean; (2) the local gate check (b) false-passed a match when exactly one of settings/src/components|styles existed (grep exit 2 overrides the match). Both fixed: gate.json + checks.yml now grep only existing paths and fail on any match. Verified across all four cases (both absent / one present+match / both present+match / clean) with ugrep and GNU grep. Other four review dimensions (token-rename, Option B, backcompat, wizard-lock, build-hygiene) clean (one pre-existing info-level orphan var in shepherd.scss, not rename-caused).
