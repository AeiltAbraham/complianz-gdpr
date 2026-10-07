# 001 — Settings UI redesign: tasks

Schema per the planning skill. Extra prose fields used here: `serves:` (DB-/SC-/C-/ADR
traceability), `settles:` (decision a task implements or writes), `gate:` (human
checkpoint a task waits for). Stages and gates are defined in [plan.md](plan.md) §5.

Conventions for this file:

- Proof commands run from the repository root; subshells `(cd settings && …)` are used
  instead of changing the caller's directory. They are POSIX-portable (local `grep` is
  ugrep 7.8.4; `/usr/bin/grep` is BSD grep — both verified today on match → exit 0,
  no match → exit 1, missing path → exit 2).
- Any proof that rebuilds tracked artifacts (`settings/build/`, `assets/css/*.css`)
  must leave the tree clean afterwards: restore tracked files and remove untracked build
  output (ADR-006: artifacts are not committed on work branches).
- E2E proofs go through two root scripts: `npm run e2e` (Playwright with
  `tests/e2e/playwright.config.js`; Playwright only finds a config in the working
  directory) and `npm run build:all` (admin CSS plus settings bundle). T-007..T-010 test
  the shipped bundle; T-032 proves a fresh source build reproduces it; every e2e proof
  from T-032 on runs `npm run build:all` first, so the suite tests the source being
  changed.
- Gate check 2 is `git diff --cached --check` against the master merge-base, so unstaged
  rebuilt artifacts never block a commit. Never stage build output (ADR-006).
- Failure-mode criteria that depend on a tool this plan introduces are marked
  `probe-at-build (introduced by T-xxx)`: the builder runs the real probe before checking
  the box, because the tool does not exist in the tree today. Criteria probed during
  planning carry the recorded evidence inline.
- **No fanout groups exist.** Every task below either invokes a package manager, runs
  the single wp-env instance (fixed ports 8888/8889), or writes/reads the shared visual
  baseline; the planning skill's shared-mutable-state rule disqualifies parallel
  execution for all of them.

---

## Stage A — Build tooling bootstrap

## T-001 Reconstruct the settings app's npm manifest
mode: agentic
status: done (2026-10-07)
files: settings/package.json, settings/package-lock.json, .nvmrc
proof: (cd settings && npm ci && npm run build && npm run lint:js -- --version) && php -r '$f = glob("settings/build/index.*.asset.php"); usort($f, function ($a, $b) { return filemtime($b) - filemtime($a); }); $a = require $f[0]; exit($a["dependencies"] === array("lodash", "react", "react-dom", "react-jsx-runtime", "wp-api-fetch", "wp-components", "wp-data", "wp-element", "wp-i18n") ? 0 : 1);'
serves: C-1, SC-06 (enables every later build); settles: ADR-010
acceptance:
- `npm ci` on Node 24 installs from the committed lockfile with zero `npm` errors; `@wordpress/scripts` is on the 30.x line (input-spec non-goal)
- `npm run build` exits 0 with no "Module not found": every import in `settings/src` resolves (verified import surface: `@wordpress/{element,i18n,components,api-fetch,data}`, `@mui/material`, `@radix-ui/react-{checkbox,radio-group,select,switch,popover}`, `@ckeditor/ckeditor5-{react,build-classic}`, react-select, react-color, react-date-range, react-data-table-component (+ styled-components peer), react-toastify, react-shepherd, react-use, react-tooltip, react-ace, chart.js, react-chartjs-2, react-confetti-explosion, zustand, immer, dompurify, axios, date-fns, prop-types, path-browserify, node-loader)
- the emitted `index.[hash].asset.php` dependency array equals the tracked one: lodash, react, react-dom, react-jsx-runtime, wp-api-fetch, wp-components, wp-data, wp-element, wp-i18n (proves React/wp packages stay externalized, FR-023 precondition)
- the `react-jsx-runtime` polyfill bundle is emitted to `settings/assets/js/react-jsx-runtime.js` as today
- `package.json` defines `build`, `start`, `lint:js` scripts; `.nvmrc` contains `24`; `engines.node` is `>=24`
- after the proof, the working tree is clean: tracked `settings/build/` restored, new untracked build files removed
outcome: `settings/package.json` + `package-lock.json` (npm, lockfile v3) and `.nvmrc` (24) shipped; `@wordpress/scripts` 30.27.0; React 18.3.1 is dev-only (externalized at runtime).
  Versions were inferred from how `settings/src` uses each API: immer 9 (default export), zustand 4.5 (named `create`, React 17 peer), react-toastify 9, react-shepherd 4.3 (`^17.0.2 || 18.x`), MUI 5.18, Radix 1.x. Required peers beyond the planned import list: `@emotion/react` and `@emotion/styled` (MUI), styled-components 6 (data table), ace-builds (react-ace), path-browserify.
  Evidence: build exits 0 with no unresolved imports; `lint:js -- --version` prints eslint v8.57.1; the emitted asset dependencies equal the shipped list.
  Deviation: the proof now evaluates the asset file with `php -r` instead of grepping one line, because `@wordpress/dependency-extraction-webpack-plugin` 6.56+ pretty-prints it; an implementer-added version override that only served the old grep was removed. The rebuilt bundle hash and jsx-runtime polyfill bytes differ from the shipped ones (toolchain output target); visual parity is T-032's job.

## T-002 Root npm manifest for the gulp CSS build
mode: agentic
status: done (2026-10-07)
depends: T-001
files: package.json, package-lock.json
proof: npm ci && npx gulp 'build:css:admin' && test -s assets/css/admin.css && grep -q -e '--rsp-' assets/css/admin.css && npx gulp 'build:css:all' && npx gulp 'build:js:all' && npm run build:all
serves: ADR-004 (rename needs a rebuildable admin.css), SC-02, SC-03
acceptance:
- `npm ci` installs gulp, gulp-rtlcss, gulp-concat, gulp-cssbeautify, gulp-uglifycss, gulp-uglify, gulp-sass + sass (the exact set `gulpfile.js` requires) with zero errors on Node 24
- `npx gulp 'build:css:admin'` exits 0 and regenerates `assets/css/admin.css`, `assets/css/admin.min.css` and `assets/css/rtl/admin.min.css`
- the freshly built `admin.css` is non-empty and still contains `--rsp-` (rename has not run yet — guards against a silently empty sass build)
- `npx gulp 'build:css:all'` and `npx gulp 'build:js:all'` exit 0
- `package.json` defines `build:all` (`gulp build:css:admin`, then `npm --prefix settings run build`), the build that every e2e proof from T-032 on runs first
- tree restored after the proof (tracked compiled CSS unchanged in git)
outcome: Root `package.json` + `package-lock.json` (npm, lockfile v3) shipped: gulp 5.0.1, gulp-sass 5.1.0, sass pinned exactly at 1.76.0, plus gulp-concat, gulp-cssbeautify, gulp-rtlcss, gulp-uglify and gulp-uglifycss; `build:all` script added.
  Evidence: the full proof exits 0 (re-run by the dispatcher); `admin.css` rebuilds with its `--rsp-` references intact; the cookieblocker CSS and `cookiebanner/js/complianz.min.js` rebuild byte-identical.
  sass is pinned exactly because 1.77+ reorders mixed declarations; 1.76.0 cuts the rebuilt `admin.css` diff from 207 to 69 lines.
  Flags for T-010/T-032: the shipped `admin.css` predates its SCSS (a rebuild adds the Burst Statistics other-plugins colour and a pulse animation), so that drift may surface as a real dashboard diff that version pins cannot remove; SCSS `random()` gives placeholder lines new widths on every build, so screenshots must mask them. `npm audit` reports high-severity advisories in the dev-only gulp/uglify stack (never shipped). `build:css:all` reformats front-end CSS cosmetically (cssbeautify 3), so release builds keep using `build:all`, which leaves front-end CSS untouched.

## T-003 Record the SC-03/SC-04 weight baselines
mode: agentic
depends: T-001, T-002
files: scripts/report-asset-weight.sh, docs/specs/001-settings-ui-redesign/baselines.md
proof: sh scripts/report-asset-weight.sh
serves: SC-03, SC-04
acceptance:
- the script prints, labelled, raw and gzip byte sizes for: `assets/css/admin.min.css`; the sum of `settings/build/*.css` (chunk CSS); the entry `settings/build/index.*.js`; the sum of all other `settings/build/*.js`
- it is POSIX sh (no bashisms, flags written out) and exits non-zero with a message naming the missing path when a build artifact is absent (probed by running it before T-001's build output exists — record the message in baselines.md)
- `baselines.md` records the numbers from a fresh build, the commit hash and date, and names SC-03/SC-04 as their consumers
- the script makes no network calls and writes nothing outside stdout

---

## Stage B — PHP toolchain and gate

## T-004 Upgrade the PHP dev tools and fill in the PHPCS ruleset
mode: agentic
files: composer.json, composer.lock, .phpcs.xml.dist, .agent/conventions.md
proof: composer install && vendor/bin/phpcs -i && vendor/bin/phpcs --standard=.phpcs.xml.dist --report=summary index.php
serves: constitution §1–2, C-1
acceptance:
- `composer install` succeeds on PHP 8.5; `vendor/bin/phpcs --version`, `vendor/bin/phpcbf --version` and `vendor/bin/phpunit --version` all run without fatal/deprecation errors (requires lifting the lock's PHPCS 3.7.1 / WPCS 2.3.0 / PHPUnit 9.5.28 pins to releases that support PHP 8.5)
- `vendor/bin/phpcs -i` lists the WordPress and PHPCompatibilityWP standards
- `.phpcs.xml.dist` is filled for this plugin: prefixes `cmplz`/`CMPLZ`, text domain `complianz-gdpr`, `testVersion` `7.4-`, `minimum_supported_wp_version` 5.9 (replacing the `my-plugin` / `5.6-` / WP 4.6 template values)
- a file containing an unescaped `echo $_GET['x'];` is flagged by `vendor/bin/phpcs --standard=.phpcs.xml.dist` with a security sniff — probe-at-build (introduced by this task): run it on a scratch file, record the sniff name in the task outcome, delete the file
- `.agent/conventions.md` "Lint" section updated with the working versions (replacing the "likely don't run on PHP 8.5" caveat)

## T-005 Make the PHPUnit suite runnable
mode: agentic
depends: T-004
files: phpunit.xml.dist, docs/developers/testing.md, composer.json
proof: vendor/bin/phpunit --configuration phpunit.xml.dist --list-tests
serves: constitution §4 (TDD for logic; DB-17 unit tests land in Phase 4)
acceptance:
- `phpunit.xml.dist` points at `./tests/` (prefix `test-`, suffix `.php`); the dangling `tests/legacy/` reference is gone
- `--list-tests` lists the test methods of `tests/test-404.php` and `tests/test-installer.php`
- a full run against the WordPress test library (provisioned per `bin/install-wp-tests.sh` with a Docker MySQL) is documented step-by-step in `docs/developers/testing.md` and executed once; tests that call the network (the external-links test) are tagged with a PHPUnit group named `external-http` and excluded in the default run
- `composer test` script runs the suite; exit 0 on the current tree
- no test assertion is changed (CLAUDE.md rule); only configuration and annotations

## T-006 Gate: coding standards on changed PHP
mode: agentic
depends: T-004
files: .agent/gate.json, .agent/conventions.md, CLAUDE.md
proof: sh -c "$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(".agent/gate.json","utf8")).commit.join(" && "))')"
serves: constitution §2 (WPCS enforced by the gate), C-1
acceptance:
- gate.json gains a check that runs `vendor/bin/phpcs --standard=.phpcs.xml.dist` on exactly the changed-or-untracked PHP files vs the `master` merge-base (same file-selection pipeline as the existing `php -l` check); when PHP files changed but `vendor/bin/phpcs` is missing, the check fails with a message to run `composer install` (maintainer decision 2026-10-07)
- the existing checks stay: `php -l` per changed PHP file (probed 2026-10-06: a parse error prints `PHP Parse error: syntax error, unexpected token …` and exits 255) and `git diff --cached --check` (staged changes vs the master merge-base)
- failure mode: a changed PHP file with a WPCS error makes the gate command exit non-zero — probe-at-build (introduced by T-004): stage a scratch violation, run the gate command string, record output, remove the file
- the full gate command sequence exits 0 on a clean tree (the proof)
- conventions.md "Gate" and CLAUDE.md "Checks" updated to match reality

---

## Stage C — Characterization e2e suite (S3)

## T-007 wp-env + Playwright scaffold with locale projects
mode: agentic
depends: T-002
files: .wp-env.json, tests/e2e/playwright.config.js, tests/e2e/admin/setup/latest.setup.js, tests/e2e/admin/setup/min-wp.setup.js, package.json, package-lock.json, .gitignore, docs/developers/testing.md
proof: npx wp-env start && npm run e2e -- --list
serves: SC-06, DB-15, DB-13, DB-14; settles: ADR-011
acceptance:
- `.wp-env.json` defines the default instance (latest WordPress, port 8888) and `env.tests` (core pinned to WordPress 5.9, `phpVersion` "7.4", port 8889), both mapping this checkout as the plugin
- `npm run e2e -- --list` (root script `e2e` = `playwright test --config tests/e2e/playwright.config.js`; Playwright only finds a config in the working directory) shows projects `setup-latest`, `setup-min-wp`, `admin`, `admin-rtl`, `admin-min-wp`, `admin-i18n` with the dependency wiring of ADR-011 (setup projects create `admin-rtl` (`he_IL`) and `admin-de` (`de_DE`) users and per-user storageState)
- wp-cli and webServer invocations go through environment variables defaulting to the wp-env forms, so CI (ADR-012) can substitute its own (no hard-coded `npx wp-env run` inside specs)
- config sets `workers: 1`, `retries: process.env.CI ? 2 : 0`, `reducedMotion: 'reduce'` plus an injected animation-disabling style, trace retain-on-failure in CI, screenshots dir `tests/e2e/admin/__screenshots__/`
- `.gitignore` gains Playwright outputs (`test-results/`, `tests/e2e/playwright-report/`, auth state files)
- `docs/developers/testing.md` documents start/run/update-snapshot commands

## T-008 Deterministic fixture and external-service stub mu-plugin
mode: agentic
depends: T-007
files: tests/e2e/mu-plugins/cmplz-e2e-stubs.php, tests/e2e/admin/fixtures/seed.php, tests/e2e/admin/fixture.spec.js, .wp-env.json
proof: npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fixture.spec.js
serves: SC-06, DB-04, DB-16; settles: ADR-011 (stub strategy)
acceptance:
- the mu-plugin short-circuits `pre_http_request` for every external host the plugin calls (cookiedatabase.org, the website-scan service, complianz.io/complianz.io feeds, api.wordpress.org) returning deterministic fixture responses, and logs any non-stubbed outbound request to an option the spec asserts is empty
- seeding (run via the instance's wp-cli) produces a stable `cmplz_options`, wizard progress, cookies/services and banner configuration; re-running seed restores the same state (idempotent)
- the mu-plugin registers the third-party `admin_notices` callback used by the DB-04 page-rules spec
- the mu-plugin is PHP 7.4-compatible, guarded by `defined( 'ABSPATH' )`, escapes/sanitizes per constitution §1, and is loaded only through the `.wp-env.json` mapping (never shipped: it lives under `tests/`)
- `fixture.spec.js` proves: seeded app loads, the outbound-request log is empty after a dashboard + wizard visit

## T-009 Smoke and axe layers over every screen
mode: agentic
depends: T-008
files: tests/e2e/admin/smoke.spec.js, tests/e2e/admin/axe.spec.js, tests/e2e/admin/helpers/menu.js, package.json, package-lock.json
proof: npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/smoke.spec.js tests/e2e/admin/axe.spec.js
serves: SC-06, SC-05, DB-12, DB-16
acceptance:
- the smoke spec iterates every section and sub-menu item discovered at runtime from the app's own menu REST response (new/removed items picked up automatically) and asserts: page renders, no console errors, no failed `/complianz/v1/` request, no error-boundary fallback, no placeholder stuck
- premium-locked groups (free edition) are asserted as rendered-and-locked with upsell text — the free-edition contract from plan.md §1
- the axe layer (`@axe-core/playwright`) runs on every smoke page; on the legacy UI results are **recorded** to an artifact (JSON per page), not gated; the gating rule (zero serious/critical on migrated screens, §8.2 exemptions aside) is wired but activated per screen from Phase 3 on
- selectors follow the contract: role/label/`data-testid` only — no `cmplz-*`, WP core, or utility classes anywhere in the specs
- two consecutive full runs are green (determinism check)

## T-010 Visual and isolation baselines
mode: agentic
depends: T-009
files: tests/e2e/admin/visual.spec.js, tests/e2e/admin/isolation.spec.js, tests/e2e/admin/__screenshots__/
proof: npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js && npm run e2e -- --project=admin tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js
serves: SC-06, SC-07, DB-01, DB-02, DB-05, DB-06, DB-08 baseline; ADR-008
acceptance:
- visual spec screenshots every smoke page at 1440px and 768px (LTR; RTL comes from the `admin-rtl` project in T-013), with dynamic regions (scan progress, relative dates, counters) masked
- isolation spec captures: banner-preview element shots per banner layout at 1920×1080 with animations disabled, using the legacy selectors `#cmplz-cookiebanner-container .cmplz-cookiebanner` and `#cmplz-manage-consent` (ADR-008: the marked selectors take over when the zone marker lands); wp-admin chrome (admin bar + menu); the WP media modal; one non-Complianz admin screen
- `maxDiffPixelRatio` starts at 0.001; the double-run proof passes twice in a row, and any masking/threshold adjustments made to get there are commented in the config (this is the S3 calibration)
- baselines are committed under `tests/e2e/admin/__screenshots__/`; snapshot updates only via an explicitly reviewed PR (documented in the spec file header)
- the website-side banner is screenshotted per layout on the frontend (DB-05 baseline) in the same spec

## T-032 Prove a fresh source build reproduces the shipped app
mode: agentic
depends: T-001, T-002, T-010
files: settings/package.json, settings/package-lock.json, package.json, package-lock.json, docs/developers/testing.md
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/smoke.spec.js tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js
serves: SC-06, DB-16, C-1 (the rebuilt toolchain must not change the app before migration starts)
acceptance:
- with the admin CSS and `settings/build/` rebuilt from source by the T-001/T-002 manifests, the smoke, visual and isolation specs pass against the baselines T-010 captured on the shipped bundle, with zero visual diff and no baseline updated
- any drift is fixed by pinning dependency versions in the manifests and lockfiles, never by changing specs, masks, thresholds or baselines; each pin is recorded with its reason in `docs/developers/testing.md`
- the freshly emitted `index.*.asset.php` lists exactly the shipped dependencies (lodash, react, react-dom, react-jsx-runtime, wp-api-fetch, wp-components, wp-data, wp-element, wp-i18n)
- `docs/developers/testing.md` states the rule that every e2e proof from this task on runs `npm run build:all` first
- tracked build output is restored after the run; nothing built is committed (ADR-006)

## T-011 Field and condition layers (every free-reachable field type)
mode: agentic
depends: T-008, T-032
files: tests/e2e/admin/fields.spec.js, tests/e2e/admin/conditions.spec.js, settings/src (only aria-label/htmlFor/data-testid additions where the legacy UI lacks an accessible name)
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fields.spec.js tests/e2e/admin/conditions.spec.js
serves: SC-06, DB-16, DB-03 groundwork; ADR-003 (document-field contract)
acceptance:
- for every field `type` present in this repo's `settings/config/` (~45 types incl. all 16 base inputs and the four `document` fields): render; for editable free fields also change → save → reload → value persisted; validation/error state exercised where the type has one
- premium-locked fields are asserted rendered-but-not-editable (free contract)
- `react_conditions` spec: toggling a controlling field shows/hides its dependants for seeded known pairs
- any change to `settings/src` in this task is behavior-free (only `aria-label`, `htmlFor`, `data-testid`); the task outcome lists each touched file and attribute, and the visual baseline (T-010) still passes
- the `document` field spec records today's `DocumentControl` behavior as the ADR-003 contract: single value, not clearable, options via `get_pages_list`, loading/empty states

## T-012 Flow layers: wizard, dashboard, dialogs, tools, app states, page rules
mode: agentic
depends: T-008, T-032
files: tests/e2e/admin/wizard.spec.js, tests/e2e/admin/dashboard.spec.js, tests/e2e/admin/dialogs.spec.js, tests/e2e/admin/tools.spec.js, tests/e2e/admin/app-states.spec.js, tests/e2e/admin/page-rules.spec.js
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/wizard.spec.js tests/e2e/admin/dashboard.spec.js tests/e2e/admin/dialogs.spec.js tests/e2e/admin/tools.spec.js tests/e2e/admin/app-states.spec.js tests/e2e/admin/page-rules.spec.js
serves: SC-06, DB-04, DB-09, DB-10, DB-11, DB-16, DB-17 baseline
acceptance:
- wizard: all steps via Next/Previous, progress indicator, Finish step, documents generated (seeded state)
- dashboard: progress block, task dismiss/links, Documents/Tools/Tips&Tricks/Other-plugins blocks render and act; current block layout recorded (DB-17 baseline)
- dialogs: every modal (`Modal.js`, `AreYouSureModal.js`, onboarding) open/confirm/cancel/Escape/focus-returns-to-trigger (DB-09 characterization before primitives replace them)
- tools: export/import settings, debug data, support form; async actions assert loading → success and loading → forced error (route interception), DB-10 baseline
- app states: locked-by-another-user placeholder, REST-error state, toast on save success/failure
- page rules: the mu-plugin's third-party notice is hidden on every Complianz screen while Complianz's own notice shows; app edge offset matches baseline (DB-04)

## T-013 RTL, minimum-WordPress and German projects
mode: agentic
depends: T-010, T-011, T-012
files: tests/e2e/playwright.config.js, tests/e2e/admin/i18n/strings.spec.js, tests/e2e/admin/__screenshots__/
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin-rtl --project=admin-min-wp --project=admin-i18n
serves: SC-06, DB-13, DB-14, DB-15 (React 17 paths, FR-023 baseline)
acceptance:
- `admin-rtl` (user locale `he_IL`) runs smoke + visual; RTL baselines at 1440px and 768px committed (DB-13's "desktop and tablet")
- `admin-min-wp` runs against the 8889 instance (WordPress 5.9 / PHP 7.4): smoke + fields + wizard finish + tour — exercising the React 17 `render` fallback and the jsx-runtime polyfill
- `admin-i18n` (user locale `de_DE`) asserts PHP-delivered strings (menu titles, field labels) render in German on every run (DB-14's every-build check; release-time chunk-string checks are a Phase 5 slice)
- all three projects green together with `admin` in one invocation
- SC-06 "green before work starts" gate: the full suite (all projects) passes twice consecutively; recorded in docs/progress.md by the builder
- runs against a fresh source build (the T-032 rule); if `admin-min-wp` fails because a reconstructed dependency needs React 18, the fix is a version pin in `settings/package.json`, never a test or baseline change (FR-023)

---

## Stage D — Spikes

## T-014 Spike S1: Tailwind version, scoping, specificity, portals → ADR-014
mode: agentic
depends: T-001, T-010, T-032
files: docs/adr/ADR-014-tailwind-version-scope-selector-portals.md, docs/specs/001-settings-ui-redesign/spikes/s1.md
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js
settles: D1 (Tailwind version), D2 (prefix syntax), scope selector, portal-host placement — the items ADR-001/ADR-007/ADR-009 left open
serves: DB-01, DB-02, DB-03, DB-08, DB-09
acceptance:
- a throwaway spike build (both Tailwind v4 and v3.4 variants) renders a prefixed, scoped, Preflight-less button/input/select inside the app on stock wp-admin; utilities beat `forms.css` and legacy `admin.css`; CSS size per variant recorded in s1.md
- coexistence evidence: a Tailwind button next to (and one carrying) WP `.button button-primary` with the legacy global button rules loaded is unaffected; one rebuilt input inside a legacy ID-prefixed container confirms ADR-005's narrow-removal rule suffices
- with the spike entry CSS loaded, the proof's visual spec shows zero diff on unmigrated screens and the isolation spec zero diff on the banner preview and each retained-widget zone (`data-cmplz-ui` restriction and `data-cmplz-isolate` exclusion hold)
- portal evidence: Radix Dialog/Popover/Tooltip and a Shepherd step render in the candidate portal host; stacking verified against admin bar, admin menu, media modal, toasts; CKEditor dropdown exception rules drafted
- ADR-014 is written (Status: Accepted) naming: the chosen Tailwind version, exact prefix and scope-selector syntax, portal-host placement, and the exact scoped-base rule list; ADR-001's "pending S1" notes are reconciled by cross-reference, never by editing ADR-001's decision
- no spike code remains in the tree (spike branch discarded; only the two docs land)

## T-015 Retained-widget accessibility audit (S1 part 2)
mode: agentic
depends: T-009, T-032
files: docs/specs/001-settings-ui-redesign/a11y-exemptions.md
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/axe.spec.js
serves: DB-12, SC-05, C-5
gate: replacement candidates (if any) go to maintainer sign-off (plan.md §4 item 6)
acceptance:
- for each retained widget (react-date-range, react-data-table-component, react-shepherd, react-color, CKEditor, Ace, react-toastify): axe findings on its current screen plus a manual keyboard/screen-reader pass, recorded per widget
- every serious/critical finding carries a verdict: fixable via configuration/props/wrapper (→ fix task noted for that widget's Phase 4 section) or not fixable (→ replacement candidate per C-5)
- the exemption table follows the input spec's §8.2 shape: axe rule ID, impact, widget root selector, reason — each exemption scoped to exactly that rule on exactly that selector
- the axe spec's exclusion wiring consumes this table (no page-wide exclusions)
- findings in our own wrappers/labels are listed as must-fix, never as exemptions

## T-016 Spike S2: build, enqueue and vendor-pipeline composition; physical-utilities check
mode: agentic
depends: T-013, T-014
files: docs/specs/001-settings-ui-redesign/spikes/s2.md, settings/scripts/check-physical-utilities.js
proof: node settings/scripts/check-physical-utilities.js --self-test
settles: ADR-009's pending composition check; ADR-007's enforcement script
serves: DB-13, SC-03, FR-016/FR-017 groundwork
acceptance:
- spike evidence in s2.md: a `postcss.config.js` with Tailwind plus the re-added `@wordpress/postcss-plugins-preset` and production `cssnano` builds; utilities used only inside a lazy chunk appear in the entry CSS; `filemtime`/`file_exists` enqueue probe shows no PHP warning in an unbuilt checkout
- logical utilities and `rtl:` variants verified on the `he_IL` project with the single `index.css` (ADR-007)
- vendor pipeline prototype on react-date-range: `postcss-prefix-selector` + `postcss-rtlcss` on `styles/vendors/` only, composing with the ADR-014 Tailwind setup; `:root`/`html`/`body` mapping to the zone element shown (ADR-009)
- `check-physical-utilities.js` extracts class tokens from `className` and clsx/variant maps, strips prefix (ADR-014 syntax), leading `-` and variant segments, and fails on the ADR-007 banned list unless the variant chain contains `rtl:`/`ltr:`
- the script's `--self-test` runs bundled fixtures: exits non-zero naming file/line for a banned `ml-4`-style token, exits 0 for its `rtl:`-variant form and for logical forms — probe-at-build (introduced by this task): record the actual failure message in s2.md
- no production file outside `settings/scripts/` changes; spike configs land for real in T-020

---

## Stage E — Phase 1 foundation (look-preserving)

## T-031 Write and test the token-rename script (no rename yet)
mode: agentic
files: scripts/rename-rsp-tokens.sh, scripts/test-rename-rsp-tokens.sh
proof: sh scripts/test-rename-rsp-tokens.sh
serves: ADR-004; makes script-mode T-017 runnable (signed off 2026-10-06)
acceptance:
- `scripts/rename-rsp-tokens.sh` (POSIX sh driving `perl -pi -e`) rewrites `--rsp-` → `--cmplz-legacy-` and `$rsp-` → `$cmplz-legacy-` (only `$rsp-break-*` variables exist today, verified 2026-10-06) in every `*.scss` under `assets/css/` and every `*.js`/`*.scss` under `settings/src/`, and deletes `assets/css/admin/theme.css` and `assets/css/variables.css` when present; it never touches `upgrade/`, `settings/build/` or `docs/`
- the test script copies fixture files (both token patterns, an already-renamed `--cmplz-legacy-` value, an `upgrade/` file) into a temporary directory, runs the rename there and asserts the exact expected output, including the untouched `upgrade/` file
- running the rename a second time on the same copy changes nothing (the test asserts an empty diff after the second run)
- in a directory without `assets/css/`, the script exits non-zero with a message and changes nothing
- the real tree is not renamed by this task: the count of `--rsp-` occurrences under `assets/css/admin/` is the same before and after the proof

## T-017 Rename `--rsp-*` → `--cmplz-legacy-*` and `$rsp-break-*` → `$cmplz-legacy-break-*`
mode: script
depends: T-002, T-013, T-031, T-032
files: assets/css/*.scss, assets/css/admin/ (all SCSS), settings/src (9 SCSS files; 5 JS files: Modal.js, utils/Icon.js, DateRange/DateRange.js, Dashboard/TipsTricks/TipsTricks.js, Settings/Cookiedatabase/Cookie.js), deletions: assets/css/admin/theme.css, assets/css/variables.css
run: sh scripts/rename-rsp-tokens.sh
proof: sh -c "grep -r -n -e '--rsp-' -e '[\$]rsp-' assets/css/admin assets/css/admin.scss assets/css/variables.scss settings/src; test \$? -eq 1" && npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js
serves: DB-08 groundwork, SC-02; settles: ADR-004
acceptance:
- runs `scripts/rename-rsp-tokens.sh` exactly as reviewed and committed in T-031 (no edits to the script in this task); `upgrade/` (its self-contained 67 `--rsp-` references), `settings/build/` and `docs/` stay untouched; a second run changes nothing
- after the run, the proof's grep finds zero `--rsp-`/`$rsp-` in scope (planning probe 2026-10-06: 683 occurrences on 620 lines under `assets/css`, 78 on 74 lines under `settings/src`; grep exit 1 = no match verified on ugrep and BSD grep)
- orphaned compiled files `assets/css/admin/theme.css` and `assets/css/variables.css` are deleted; a repo-wide reference search for their basenames in PHP/JS finds nothing
- freshly built `admin*.css` contains no `--rsp-` and the legacy declarations remain on `:root` (rename is textual only); rebuilt tracked CSS is restored, not committed (ADR-006)
- the visual and isolation specs pass unchanged (zero visual change)
- diff exceeds 200 lines by design (bulk rename) — flagged per the sizing rule and accepted as script mode

## T-018 Permanent token checks in the commit gate
mode: agentic
depends: T-017
files: .agent/gate.json, .agent/conventions.md
proof: sh -c "grep -r -n -e '--rsp-' -e '[\$]rsp-' assets/css/admin assets/css/admin.scss assets/css/variables.scss settings/src; test \$? -eq 1" && sh -c "grep -r -n -e '--cmplz-legacy-' settings/src/components settings/src/styles; test \$? -ne 0"
serves: ADR-004 (permanent check), ADR-006 (weekly merges re-introduce `--rsp-`)
acceptance:
- gate.json gains two checks: (a) no `--rsp-`/`$rsp-` in `assets/css` SCSS sources, `assets/css/admin.scss`, `assets/css/variables.scss` or `settings/src`; (b) no `--cmplz-legacy-` under `settings/src/components` or `settings/src/styles` (command tolerates the dirs not existing yet: missing-path grep exits 2, which the check treats as pass — exit codes probed 2026-10-06)
- the check scope deliberately excludes `docs/` (probed 2026-10-06: `docs/adr/ADR-004-token-prefix-rename.md` itself contains `--rsp-` and must not trip the gate), `upgrade/` and `settings/build/`
- failure mode: a scratch SCSS file under `assets/css/admin/` containing `--rsp-test` makes the gate check exit non-zero; probed at build with the real command (the grep semantics were probed in planning; the gate wiring is new here) — record the output, delete the file
- on the post-T-017 tree both checks pass (the proof)
- conventions.md "Gate" section documents both checks and their scope rationale

## T-019 CI workflow on GitHub Actions
mode: agentic
depends: T-013, T-018
files: .github/workflows/checks.yml, docs/developers/testing.md
proof: gh run list --workflow=checks.yml --branch 001-settings-ui-redesign --limit 1 --json conclusion --jq '.[0].conclusion' | grep -qx success
serves: FR-021/FR-022 of the input spec via ADR-012; SC-06
acceptance:
- the workflow triggers on pull requests into and pushes to `001-settings-ui-redesign`; steps: checkout, Node 24 from `.nvmrc`, `npm ci` (root and settings), both builds, the T-018 grep checks, `node settings/scripts/check-physical-utilities.js`, stylelint on `settings/src/styles/` (step added but non-blocking until T-020 creates the dir), `npx wp-env start`, the four admin Playwright projects
- Playwright HTML report and screenshot diffs upload as artifacts with 14-day retention, on failure and success
- the first run on the integration branch completes green (the proof shows status `completed`/`success`)
- the run is registered as a required status check — a repository setting; the task outcome records that the maintainer applied it (cannot be set from the workflow file)
- no secrets are referenced; everything runs against the public checkout (public-fork constraint)

## T-020 Tailwind foundation in the settings build
mode: agentic
depends: T-014, T-016, T-017
files: settings/postcss.config.js, settings/tailwind.config.js (per ADR-014; omitted if v4 CSS-config), settings/src/styles/tailwind.css, settings/src/styles/tokens.css, settings/src/styles/base.css, settings/src/index.js, settings/package.json, settings/package-lock.json
proof: (cd settings && npm run build) && sh -c "ls settings/build/index.css" && sh -c "grep -r -n -e '--cmplz-manage-consent' settings/src/styles/tokens.css; test \$? -eq 1" && node settings/scripts/check-physical-utilities.js
serves: DB-01, DB-02, DB-03, DB-08; executes ADR-001/ADR-014 in the build
acceptance:
- `npm run build` emits `settings/build/index.css`; in production mode it is minified and autoprefixed (the re-added wp-scripts preset + cssnano per T-016's findings)
- every utility in `index.css` carries the ADR-014 prefix and scope selector; no global Preflight is emitted: grep for an unscoped `*,::before,::after` or bare `html{`/`body{` rule at the top level of `index.css` finds nothing — probe-at-build (introduced by this task): record the grep used against both a correct and a deliberately unscoped build
- `tokens.css` declares the semantic set on the admin root and portal host, never `:root`, with initial values matching the current look (look-preserving; the redesign values come with the C-2 token sign-off before Phase 3); no `--cmplz-manage-consent-*` or other frontend-banner `--cmplz-*` name is declared (ADR-004/ADR-008 reserved names — the proof greps it)
- `base.css` implements exactly the ADR-014 scoped-base rule list (specificity 1,0,0: scope ID + `:where(…)`), matching only `data-cmplz-ui` subtrees and excluding `data-cmplz-isolate` zones inside the `:where()`
- legacy per-component SCSS still compiles to chunk CSS (coexistence; nothing deleted here)
- tree restored after build proofs (ADR-006)

## T-021 Mount markup, portal host and entry-CSS enqueue (PHP)
mode: agentic
depends: T-020
files: settings/settings.php, settings/src/index.js
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/smoke.spec.js tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js
serves: DB-01..DB-04, DB-06 (preview unaffected), FR-003/FR-016 of the input spec; executes ADR-001 + ADR-014 placement
acceptance:
- `cmplz_settings_page()` renders the ADR-014 mount markup: `#complianz` containing `#complianz-app` and the portal host with PHP-rendered `#complianz-portal-root[data-cmplz-ui]` (placement exactly as ADR-014 decided); `#complianz-modal` is removed and `grep -r -n 'complianz-modal'` over PHP/JS/SCSS finds no reference (verified absent in planning except the one render site, settings/settings.php:409)
- `settings/src/index.js` mounts React on `#complianz-app` (keeping the `createRoot`/`render` fallback); the portal root exists before any script runs (asserted by an e2e check)
- the entry CSS is enqueued on `admin_enqueue_scripts` guarded by the captured `$page_hook_suffix` (not in `cmplz_plugin_admin_scripts`, which prints too late), version `filemtime`, guarded by `file_exists` (no warning in an unbuilt checkout), depending on the `complianz-admin` handle while that exists
- no utility class or token sits on `#complianz`/the portal host themselves (root typography waits for Phase 3)
- changed PHP passes the gate (php -l + WPCS) and the constitution §1 security review: output escaped, capability check `cmplz_user_can_manage()` unchanged
- the whole suite stays green and the visual baseline is unchanged — Phase 1 checkpoint CP1 (SC-06)

---

## Stage F — Phase 2 primitives (look-preserving)

## T-022 Collect legacy global rules into legacy-globals.scss
mode: agentic
depends: T-017
files: assets/css/admin.scss, assets/css/admin/legacy-globals.scss, assets/css/admin/modules/inputs/Buttons.scss, assets/css/admin/modules/inputs/SwitchInput.scss
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/visual.spec.js
serves: ADR-005 (global rules last), DB-02
acceptance:
- `legacy-globals.scss` holds: one merged `button { all: unset; }` (today duplicated in Buttons.scss and SwitchInput.scss), the `a.button, button.button, input.button` and `.button--*` rules, and their `:root` button variables; header comment "delete in Phase 5 (ADR-005)"
- `admin.scss` imports it; the source modules keep only their input-scoped rules
- freshly built `admin.css` still contains each moved rule exactly once
- visual spec unchanged (rule order changes must not change rendering)
- tree restored after build proofs

## T-023 Primitive set A: PortalContainer, Dialog, AlertDialog, Popover, Tooltip
mode: agentic
depends: T-020, T-016
files: settings/src/components/ui/PortalContainer.js, settings/src/components/ui/Dialog.js, settings/src/components/ui/AlertDialog.js, settings/src/components/ui/Popover.js, settings/src/components/ui/Tooltip.js, settings/src/components/ui/cx.js, settings/package.json, settings/package-lock.json
proof: (cd settings && npm run build && npm run lint:js -- src/components/ui) && node settings/scripts/check-physical-utilities.js
serves: DB-07, DB-09; executes ADR-002 + ADR-013
acceptance:
- primitives follow ADR-013 (one file each, clsx + hand-written literal variant maps); styling visually matches today's dialogs/tooltips (look-preserving)
- every added/upgraded Radix package declares React 17 in `peerDependencies` (FR-023); existing Radix packages upgraded together; `npm ls` output recorded in the task outcome
- all overlay primitives portal into the PHP-rendered portal root via `PortalContainer` (read synchronously, no `document.body` fallback)
- physical-utilities check passes; failure mode of a banned utility in a variant map — probe-at-build (introduced by T-016)
- no consumer is migrated yet (that is T-024/T-026); bundle builds and suite smoke stays green

## T-024 Migrate dialog/tooltip/popover consumers; drop MUI and react-tooltip
mode: agentic
depends: T-023
files: settings/src/Modal.js, settings/src/Settings/AreYouSureModal.js, settings/src/utils/Icon.js, settings/src/DateRange/DateRange.js, settings/package.json, settings/package-lock.json
proof: npm run build:all && sh -c "(cd settings && npm ls @mui/material); test \$? -ne 0" && sh -c "(cd settings && npm ls react-tooltip); test \$? -ne 0" && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/dialogs.spec.js tests/e2e/admin/visual.spec.js
serves: DB-07, DB-09, SC-04 (first weight drop); ADR-002
acceptance:
- `Modal.js` and `AreYouSureModal.js` run on the Dialog/AlertDialog primitives; `Icon.js` tooltip on Tooltip; the DateRange popover on Popover — public props unchanged (FR-019), callers untouched
- the react-date-range calendar inside the popover gets its `data-cmplz-isolate="date-range"` wrapper (the portal root carries `data-cmplz-ui`, so without the zone the scoped base would reach the calendar); its legacy SCSS stays until Phase 4
- the dialogs spec passes unchanged: open/confirm/cancel/Escape/focus-return (DB-09) — no test assertion modified
- `@mui/material` and `react-tooltip` are gone from `settings/package.json`; `npm ls` exits non-zero for both — probe-at-build (introduced by T-001)
- visual baseline unchanged on all screenshotted dialogs/screens

## T-025 Primitive set B: Button, TextField, Textarea, Spinner, Skeleton
mode: agentic
depends: T-023
files: settings/src/components/ui/Button.js, settings/src/components/ui/TextField.js, settings/src/components/ui/Textarea.js, settings/src/components/ui/Spinner.js, settings/src/components/ui/Skeleton.js
proof: (cd settings && npm run build && npm run lint:js -- src/components/ui) && node settings/scripts/check-physical-utilities.js
serves: DB-03, DB-07; ADR-002 (plain JSX + Tailwind layer), ADR-013
acceptance:
- plain-JSX primitives with variant maps per ADR-013, visually matching today's buttons/inputs (look-preserving)
- form controls render identically with and without wp-admin's `forms.css` (DB-03): verified by the S1-derived scoped base — evidence screenshot pair in the task outcome
- Button exposes the variants today's screens use (primary/secondary/tertiary/error per the legacy `.button--*` set) without WP core classes (FR-020)
- no consumer migrated in this task; build green, physical-utilities check green
- each primitive is keyboard-operable and labelled per WCAG 2.2 AA (DB-12) — axe on a scratch render recorded in outcome

## T-026 Replace @wordpress/components usages and drop the dependency
mode: agentic
depends: T-025, T-023
files: settings/src/Settings/Inputs/Button.js, settings/src/Settings/ButtonControl.js, settings/src/Settings/CookieBannerPreview/ResetBannerButton.js, settings/src/Settings/Multisite/CopyMultisite.js, settings/src/Settings/Support/Support.js, settings/src/Settings/Export/ImportControl.js, settings/src/Settings/ProcessingAgreements/CreateProcessingAgreements.js, settings/package.json, settings/package-lock.json
proof: npm run build:all && sh -c "(cd settings && npm ls @wordpress/components); test \$? -ne 0" && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/dialogs.spec.js tests/e2e/admin/tools.spec.js tests/e2e/admin/visual.spec.js
serves: DB-07, SC-04; ADR-002 (removal list)
acceptance:
- the four `__experimentalConfirmDialog` usages become `AlertDialog` in the portal host; `TextareaControl` becomes `Textarea`; the two `FormFileUpload` usages become a visually hidden native file input triggered by `Button` — behavior identical (confirm flows, file selection), suite specs unchanged
- `@wordpress/components` is removed from `settings/package.json`; the freshly built `index.*.asset.php` no longer lists `wp-components` in its dependencies (the legacy `complianz-admin` stylesheet keeps its `wp-components` dependency until Phase 5, per ADR-002)
- no `components-*` class remains in the touched files (FR-020)
- visual baseline unchanged; dialogs and tools specs green
- tree restored after build proofs

## T-027 Combobox primitive; migrate DocumentControl; remove react-select
mode: agentic
depends: T-023
files: settings/src/components/ui/Combobox.js, settings/src/Settings/DocumentControl.js, settings/package.json, settings/package-lock.json
proof: npm run build:all && sh -c "(cd settings && npm ls react-select); test \$? -ne 0" && sh -c "(cd settings && npm ls @emotion/react); test \$? -ne 0" && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fields.spec.js
serves: DB-07, DB-16, SC-04; executes ADR-003
acceptance:
- `Combobox` is built on Downshift `useCombobox` + Radix Popover with the ADR-003 wiring (anchor on the input, `modal={false}`, open state owned by Downshift, `onInteractOutside` ignoring the anchor, menu mounted, listbox in the portal root)
- `DocumentControl` keeps its contract recorded by T-011: single value, not clearable, `get_pages_list` search, object-or-array initial value, loading/empty states; props and saved value format unchanged (FR-019) — the fields spec for the four `document` fields passes unmodified
- `react-select` is gone and no `@emotion/*` package remains in the tree (both `npm ls` probes exit non-zero — with T-024's MUI removal this completes the emotion exit, FR-011)
- Downshift declares React ≥16.12 as peer (FR-023); recorded in outcome
- keyboard pass: ARIA 1.2 combobox pattern verified manually + axe clean on the wizard document fields

## T-028 Rebuild text-family inputs on the primitives
mode: agentic
depends: T-025
files: settings/src/Settings/Inputs/TextInput.js, settings/src/Settings/Inputs/EmailInput.js, settings/src/Settings/Inputs/URLInput.js, settings/src/Settings/Inputs/PhoneInput.js, settings/src/Settings/Inputs/NumberInput.js, settings/src/Settings/Inputs/PasswordInput.js, settings/src/Settings/Inputs/InputHidden.js, settings/src/Settings/Inputs/TextAreaInput.js, assets/css/admin/modules/inputs/ (delete the rules these inputs consumed)
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fields.spec.js tests/e2e/admin/visual.spec.js
serves: DB-03, DB-07, DB-16; ADR-005 (delete with last consumer)
acceptance:
- the eight inputs render on TextField/Textarea primitives; props and the `Field.js` type map unchanged (FR-019/FR-012); fields spec passes unmodified for every covered type
- the legacy SCSS rules whose last consumers these inputs were are deleted in the same change; legacy container rules targeting the replaced inputs (ID-prefixed descendant selectors) are removed narrowed to those inputs (ADR-005; S1 evidence from T-014)
- each input carries `data-cmplz-ui` so the scoped base applies to it alone inside unmigrated screens
- visual baseline unchanged on unmigrated screens; the inputs themselves match current look
- estimated near the 200-line guide; builder splits into two PRs if exceeded (flagged)

## T-029 Rebuild choice inputs (Checkbox, Radio, Switch, TextSwitch, Select)
mode: agentic
depends: T-025, T-028
files: settings/src/Settings/Inputs/CheckboxGroup.js, settings/src/Settings/Inputs/RadioGroup.js, settings/src/Settings/Inputs/SwitchInput.js, settings/src/Settings/Inputs/TextSwitchInput.js, settings/src/Settings/Inputs/SelectInput.js, assets/css/admin/modules/inputs/ (delete consumed rules incl. SwitchInput.scss remnants)
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fields.spec.js tests/e2e/admin/conditions.spec.js tests/e2e/admin/visual.spec.js
serves: DB-03, DB-07, DB-09 (select behavior), DB-16
acceptance:
- the five inputs are restyled on the Radix-based primitives (existing Radix usage upgraded per ADR-002), selects render into the portal root; props/type map unchanged; fields + conditions specs pass unmodified
- `react_conditions` behavior proven unchanged by the conditions spec (toggling controller shows/hides dependants)
- consumed legacy input SCSS deleted in the same change; `data-cmplz-ui` markers on each input root
- keyboard and screen-reader behavior per DB-09/DB-12 (focus visible, arrow-key group navigation) — axe green on a wizard page containing all five
- visual baseline unchanged on unmigrated screens

## T-030 Rebuild Button/Border/ColorPicker inputs; empty the inputs SCSS module
mode: agentic
depends: T-029
files: settings/src/Settings/Inputs/Button.js, settings/src/Settings/Inputs/BorderInput.js, settings/src/Settings/Inputs/ColorPicker.js, assets/css/admin/modules/inputs/ (delete remaining module files), assets/css/admin.scss
proof: npm run build:all && npx wp-env start && npm run e2e -- --project=admin tests/e2e/admin/fields.spec.js tests/e2e/admin/visual.spec.js && sh -c "ls assets/css/admin/modules/inputs 2>/dev/null; test \$? -ne 0"
serves: DB-03, DB-07, DB-16, SC-02 (first legacy module fully gone)
acceptance:
- Button input renders on the Button primitive (its ConfirmDialog already replaced in T-026); BorderInput on TextField/variant utilities; the react-color picker is wrapped in `data-cmplz-isolate="color-picker"` inside its Popover (ADR-001 zone table)
- `assets/css/admin/modules/inputs/` is empty and removed from `admin.scss` imports; the global rules live on in `legacy-globals.scss` (T-022) — Phase 2 exit condition of ADR-005
- fields spec passes unmodified; visual baseline unchanged on unmigrated screens
- freshly built `admin.css` no longer contains the deleted input rules; tree restored
- Phase 2 checkpoint CP2: full suite green (all projects), recorded in docs/progress.md by the builder

---

## Not yet tasked — re-plan after gate G3 (Phase 3), per-section sign-off (Phase 4), CP4 (Phase 5)

Prose only, deliberately without `## T-` headings: these phases depend on per-section
design approval (C-2) and on ADR-014/audit outcomes, so tasking them now would guess at
visuals and boundaries. The slices below are the re-planning input; plan.md §5 maps them
to stages G–I with their gates.

**Phase 3 — shell (gate G3: CP2 green + token set and shell preview approved).**
Token-set proposal (design values + rationale, in-repo preview) → maintainer sign-off →
shell migration: `Page.js` grid, `Header.js`, `Menu/*` (navigation model unchanged, C-3),
`Placeholder/*` → Skeleton, panels, notices; delete `layout.scss`, `header.scss`,
`wizard/menu.scss`, `placeholder.scss`, `wizard/panel.scss`, `notices.scss`; root
typography to `base.css` on the two inner wrappers; page-level rules to
`styles/page.css` (other-plugins-notices hiding, mount-point offset as
`margin-inline-start`); first intentional re-baseline (redesigned screenshots become the
new baseline; axe gating activates per migrated screen).

**Phase 4 — screens, per section (gate: that section's preview approved; order: wizard
fields → dashboard → consent banner → integrations → tools/settings tables →
statistics/date-range → onboarding/tour).** Each section: HTML preview task → sign-off →
migrate + delete its legacy SCSS (both trees) in the same PR → re-baseline + axe gate
that section. Section specials, already fixed by decisions: dashboard carries the
`cmplz_normalize_blocks()` consumer-side normalization with TDD unit tests
(`tests/test-blocks.php`: legacy `'class'` mapping `cmplz-column-2`→width 2,
`border-to-border`→edge-to-edge, `no-border`/`no-background`→borderless, conflicts →
borderless wins, explicit keys win, unknown dropped, `_doing_it_wrong` under WP_DEBUG),
core blocks switched in the same PR, plus the extension-point ADR (C-4, DB-17); consent
banner adds `styles/vendors/preview.css` with pinned legacy typography and the one
documented `[dir="rtl"]` translate exception (ADR-008); data tables, date range, toast,
shepherd each get their vendor file + zone and their vendored legacy SCSS deleted in the
same PR (ADR-009), with `readToken()` for chart.js and data-table `customStyles`; the
tour switches to `data-tour` attributes; widget a11y fixes from T-015's "fixable"
verdicts land in their section's PR.

**Phase 5 — legacy removal and release (gate CP4: all sections migrated, suite green).**
Move the `data-cmplz-ui` marker to the app inner wrapper and drop per-component markers;
delete `legacy-globals.scss` with before/after wp-admin + media-modal screenshots
(ADR-005 risk); stop enqueueing `admin.css` on settings screens and drop the
`complianz-admin` dependency from the new handle; retire the gulp admin target; entry
gate `grep -r -n -e '--cmplz-legacy-' settings/src` empty, then delete
`assets/css/variables.scss`; banner-preview re-baseline against the frontend banner with
reviewed diff (ADR-008, DB-06); FR-017 check (no `*.css` chunk files in
`settings/build`); SC-03/SC-04 comparison against `baselines.md`; i18n regeneration
(pot/po/json) with German verification and the chunk-string assertions (C-7, DB-14);
readme.txt changelog notices (admin markup changed, preview fidelity fix, a11y
exemptions); rebuild and commit release
artifacts once on the integration branch; RC tag → one-week self-QA (C-6, SC-07) →
single release merge to `master` (DB-18, ADR-006).
