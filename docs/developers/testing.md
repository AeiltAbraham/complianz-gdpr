# Testing

How to run the automated tests for this plugin locally. For now this covers the PHPUnit
suite (PHP logic against the WordPress test library). The JavaScript/end-to-end suite is
added by a later feature-001 task and will be documented in its own section below.

## PHPUnit suite

The PHP tests live in `tests/test-*.php` and run against the **WordPress test library**
(`bin/install-wp-tests.sh`), which needs a MySQL-compatible database. `phpunit.xml.dist`
is the suite configuration; `tests/bootstrap.php` boots WordPress and loads the plugin.

Tests that reach the network are tagged `@group external-http` (WordPress core's own
convention) and are excluded from the default run.

### Prerequisites

- PHP 8.x with the `mysqli` extension (verified on PHP 8.5.4, mysqlnd).
- Composer dev dependencies installed: `composer install` (provides
  `vendor/bin/phpunit`, PHPUnit 9.6).
- Docker, plus the host tools `svn` and `curl` (used by `bin/install-wp-tests.sh`).

### 1. Start a database container

We use **MariaDB**, not MySQL. The Homebrew MySQL 9.6 client no longer ships the
`mysql_native_password` *client* plugin, so it cannot authenticate to the server over TCP;
PHP's `mysqli`/mysqlnd has that auth method built in and connects to MariaDB without
trouble. Because the host client can't connect, we drive the one-time database setup
through the container's own client (steps 2) and tell the installer to skip database
creation (step 3).

The password below is a throwaway, **local-only** credential — never reuse it anywhere.

```bash
docker run -d --name cmplz-phpunit-db \
  -p 127.0.0.1:13306:3306 \
  -e MARIADB_ROOT_PASSWORD=root_local_only \
  mariadb:11.4
```

Port `13306` is bound to `127.0.0.1` only. Wait a second or two for it to come up:

```bash
docker exec cmplz-phpunit-db mariadb-admin ping -uroot -proot_local_only --silent
```

### 2. Create the test user and database

Run these through the container client (the host client can't authenticate — see step 1).
The `wp@'%'` user may connect from the host over the published port.

```bash
docker exec cmplz-phpunit-db mariadb -uroot -proot_local_only -e \
  "CREATE USER IF NOT EXISTS 'wp'@'%' IDENTIFIED BY 'wp_local_only'; \
   GRANT ALL PRIVILEGES ON *.* TO 'wp'@'%' WITH GRANT OPTION; \
   FLUSH PRIVILEGES;"

docker exec cmplz-phpunit-db mariadb -uroot -proot_local_only -e \
  "CREATE DATABASE IF NOT EXISTS wordpress_test;"
```

### 3. Install the WordPress test library

The final `true` is the installer's `skip-database-creation` flag: the database already
exists (step 2) and the host `mysql`/`mysqladmin` client can't connect, so we skip the
installer's own database step. Everything else (WordPress core, the test suite,
`wp-tests-config.php`) is still provisioned.

```bash
bash bin/install-wp-tests.sh wordpress_test wp wp_local_only 127.0.0.1:13306 latest true
```

This writes WordPress core to `$TMPDIR/wordpress` and the test library to
`$TMPDIR/wordpress-tests-lib` (on macOS, `$TMPDIR` is the per-user
`/var/folders/.../T` path). That is also where `tests/bootstrap.php` looks by default
(`sys_get_temp_dir() . '/wordpress-tests-lib'`), so no environment variable is needed when
running PHPUnit. To install elsewhere, export `WP_TESTS_DIR` and `WP_CORE_DIR` for both the
installer and PHPUnit.

> Note: the installer downloads a `wp-content/db.php` drop-in from `raw.github.com`, which
> now redirects; with `curl` (no `-L`) the file lands empty (0 bytes). This is harmless —
> WordPress falls back to its built-in `mysqli` database layer.

### 4. Run the suite

The default run excludes the `external-http` group. Both existing tests are in that group,
so today the default run executes no tests (PHPUnit prints `No tests executed!` and exits
0); offline unit tests added later, such as the Phase 4 dashboard-block tests, run here:

```bash
composer test
# equivalently:
vendor/bin/phpunit --configuration phpunit.xml.dist --exclude-group external-http
```

List the discovered tests (does not touch the network; this is task T-005's proof command):

```bash
vendor/bin/phpunit --configuration phpunit.xml.dist --list-tests
```

`--list-tests` always enumerates the whole suite (group filters do not affect listing), so
both `CmplzTestUrls::test_external_links` and `CmplzInstallerTest::test_plugin_installation`
appear.

### 5. The external-http group

Two tests need the network and are tagged `@group external-http`:
`CmplzTestUrls::test_external_links` (`tests/test-404.php`) calls `wp_remote_get()` against
live URLs, and `CmplzInstallerTest::test_plugin_installation` (`tests/test-installer.php`)
downloads and activates `complianz-terms-conditions` from wordpress.org. Selecting the group
on the command line overrides the exclusion in `phpunit.xml.dist`:

```bash
vendor/bin/phpunit --configuration phpunit.xml.dist --group external-http
```

### 6. Stop and remove the database

```bash
docker stop cmplz-phpunit-db
docker rm cmplz-phpunit-db
```

### Known issues

- **`CmplzInstallerTest` used to target `burst-statistics`,** a slug `class-installer.php`
  never supported, so it failed on every run. With the maintainer's approval (2026-10-07)
  it now installs `complianz-terms-conditions`, a supported slug; its assertions are
  unchanged. PHPUnit reports it as risky ("did not (only) close its own output buffers")
  because of the test's existing `ob_get_clean()` call; all four assertions pass.
- The harmless warning `Constant WP_DEBUG already defined` comes from both
  `tests/bootstrap.php` and the generated `wp-tests-config.php` defining it.

## End-to-end / JavaScript tests

The characterization e2e suite for the React settings app (SC-06) runs on **Playwright**
against **two WordPress instances** provided by `@wordpress/env` (ADR-011). It is written
against today's UI and kept green through the migration. The harness lives in `tests/e2e/`
(`playwright.config.js`, `admin/setup/`); the specs and baselines land in later tasks
(T-008..T-013). The config is found only in the working directory, so every command below
runs from the repository root.

### Prerequisites

- Docker running (OrbStack is fine). The suite uses fixed ports **8888** and **8889**, so
  only one run per machine at a time.
- Node 24 and the root dependencies: `npm install`.
- The Playwright Chromium browser: `npx playwright install chromium` (one-time; re-run
  after a Playwright upgrade).

### The two instances (`.wp-env.json`)

| wp-env env | Port | WordPress | PHP | Used by projects |
|------------|------|-----------|-----|------------------|
| `development` (default) | 8888 | latest | default | `admin`, `admin-rtl`, `admin-i18n` |
| `tests` | 8889 | 5.9 (pinned) | 7.4 | `admin-min-wp` |

Both map this checkout as `wp-content/plugins/complianz-gdpr`. RTL (`he_IL`) and German
(`de_DE`) come from the logged-in user's WordPress locale, created by the setup projects —
not from a browser option.

### Start the environment

```bash
npx wp-env start
```

The **first** start downloads the Docker images and WordPress 5.9 (pinned as
`WordPress/WordPress#5.9`) and can take several minutes; later starts are fast. It brings
up both instances and only returns once both are healthy. Leave it running between suite
runs; Playwright's `webServer` reuses it.

### Run the suite

```bash
npm run e2e                              # = playwright test --config tests/e2e/playwright.config.js
npm run e2e -- --project=admin           # one project
npm run e2e -- --list                    # list discovered tests
```

The **setup projects** run first (as dependencies): `setup-latest` activates the plugin,
installs the `he_IL`/`de_DE` language packs, creates the `admin-rtl`/`admin-de` users and
saves one `storageState` per user; `setup-min-wp` activates the plugin on 8889 and saves the
`admin` state. Authentication state is written to the git-ignored `tests/e2e/.auth/`.

> `--list` only shows projects that currently contain spec files, so until T-009+ add the
> specs it lists only `setup-latest`/`setup-min-wp`. To see all six projects and their
> dependency wiring without a run:
>
> ```bash
> node -e "const c=require('./tests/e2e/playwright.config.js'); for (const p of c.projects) console.log(p.name, '<-', JSON.stringify(p.dependencies||[]))"
> ```

### Build from source before every e2e proof (the T-032 rule)

**From T-032 onward, every e2e proof command runs `npm run build:all` first.** The tracked
build output (`settings/build/`, `assets/css/admin*.css`, `settings/assets/js/`) can lag its
own source, so the characterization suite must validate what the **current source + committed
manifests** produce, not a possibly-stale committed artifact. The proof commands in `tasks.md`
from T-032 on are written as `npm run build:all && npx wp-env start && npm run e2e -- …`, and
`package.json`'s `build:all` script (`gulp build:css:admin`, then `npm --prefix settings run
build`) is the single entry point. Restore the tracked build output afterwards (ADR-006):
nothing built is committed.

#### Fresh-build parity (T-032 investigation)

T-010 captured the visual/isolation/smoke baselines against the **shipped, tracked** bundle.
T-032 proved a **fresh source build** reproduces that app pixel-for-pixel. The reconstructed
npm toolchain (T-001/T-002) resolved two JS libraries to newer patch/major versions than the
shipped bundle was built with, each causing a deterministic diff. Both were fixed by pinning
the library to the shipped version in `settings/package.json` + `settings/package-lock.json`
— never by touching a spec, mask, threshold or baseline. The shipped versions were read
directly out of the committed `settings/build/` chunks.

| Diffing screen(s) | Layer | Category | Root cause | Resolution |
|---|---|---|---|---|
| `#tools/data-requests`, `#tools/processing-agreements`, `#tools/data-breach-reports`, `#tools/proof-of-consent` | smoke (console) | B — JS dependency version | `react-data-table-component` forwards `minWidth`/`maxWidth`/`button`/… as non-transient props to a `styled.div`. styled-components **v5** filtered unknown props off the DOM; **v6** forwards them, so React logs `Received … for a non-boolean attribute minwidth` / `does not recognize the minWidth prop`. The fresh install pulled styled-components 6.5.3; the shipped bundle was built with 5.3.11. | Pin `styled-components` to **5.3.11**. |
| `#tools/ab-testing` @1440 and @768 | visual | B — JS dependency version | The A/B-testing Statistics bar chart renders to a chart.js `<canvas>`. chart.js 4.5.1 changed canvas rendering vs the shipped 4.5.0, giving a deterministic antialiasing delta confined to the chart region (ratio 0.0026 @1440, 0.0055 @768 vs the 0.001 threshold; identical on all retries → not nondeterminism). | Pin `chart.js` to **4.5.0**. |

After both pins, `npm run build:all` + the three proof specs (`smoke`, `visual`, `isolation`)
pass against the **committed T-010 baselines** with **no baseline, spec, mask or threshold
change**. One screen (`#banner/banner-general` @768) can flake on a `react_conditions`
cascade re-layout; it is the pre-existing T-010 banner flake (independent of the build), is
absorbed by the CI retry policy (plan §8.1.4: green with `--retries=2`, a retry-only pass
flagged flaky), and is not a build-parity diff.

Version pins recorded for parity (all exact, like sass 1.76.0 in the root manifest):

- **`settings/package.json` `chart.js` = `4.5.0`** — matches the shipped bundle's chart.js;
  4.5.1 shifts canvas antialiasing on the A/B-testing chart.
- **`settings/package.json` `styled-components` = `5.3.11`** — matches the shipped bundle;
  v6 forwards `react-data-table-component`'s layout props to the DOM, which React warns on.

Not fixed by pins — a known, benign **stale-CSS** drift (category A), reported for a reviewed
decision, **not** a parity regression: the shipped `admin.css` predates its own SCSS, so a
rebuild correctly **adds** rules the committed file lacks — a Burst Statistics "other plugins"
colour (`.cmplz-burst-statistics` → `--rsp-other-plugins-color: var(--rsp-green)`), a `pulse`
keyframe + `.burst-icon-live` animation, and a `.dashboard_page_burst` overlay rule. sass is
already pinned at 1.76.0 and these are real, more-correct CSS, so no pin removes them. In the
seeded e2e state they surface on **no** baselined screen (the dashboard "other plugins" block
does not render a Burst element, and the visual spec freezes animations), so they produce
**zero** visual diff and need no re-baseline today; they are flagged here for the dispatcher's
look-preserving-net call if a later seed makes them visible.

### Update visual baselines

### Visual layer is non-blocking (advisory)

**No `toHaveScreenshot` assertion fails the run; functional assertions gate.** The full-screen
visual-regression layer (`visual.spec.js`) went non-blocking on 2026-10-08, and on 2026-10-09
(maintainer decision "Option B") the remaining blocking **isolation** screenshots followed. The
reason for the second step was concrete: the first Linux CI run failed the `banner-preview`
`toHaveScreenshot` purely from a cross-OS pixel mismatch — the baselines were captured on the macOS
dev host, CI renders on Linux, and `snapshotPathTemplate` carries no `{platform}` token, so a macOS
baseline can never match a Linux render. Rather than maintain a second (Linux) baseline set, every
`toHaveScreenshot` in both `visual.spec.js` and `isolation.spec.js` now records drift (logged, and
attached as `visual-drift.txt` for the full-screen layer; `console.warn('[isolation non-blocking] …')`
for the isolation shots) but never gates.

What stays **blocking** everywhere: every functional spec (smoke, fields, conditions, flows,
dialogs, tour, i18n), the minimum-WP React-17 run, and — within `isolation.spec.js` — the
*functional* assertions that each screenshot sits beside: the banner preview must mount and resolve
its real document links, and the manage-consent widget, `#wpadminbar`, `#adminmenuwrap` and the
General-Settings heading must be visible. Those catch a genuinely broken or unscoped surface;
pixel-level look-preservation is confirmed by the per-section design review the redesign already
requires. The committed PNGs under `__screenshots__/` are kept for local (macOS) pixel review and
as the Phase-5 ADR-008 re-baseline starting point.

Screenshot baselines live under `tests/e2e/admin/__screenshots__/` and are updated only by
an explicit, reviewed change:

```bash
npm run e2e -- --update-snapshots
```

**Always capture and verify visual baselines on a freshly reset database.** CI (GitHub
Actions, T-019) runs against a clean WordPress install, so the baselines must reproduce
there. Reset first, then start, rebuild and (re)capture:

```bash
npx wp-env reset        # NOT the deprecated `clean`; the setup project reseeds on next run
npx wp-env start
npm run build:all
# Capture by running the SAME spec set the CI/verification run uses, not visual.spec.js alone:
npm run e2e -- --project=admin --update-snapshots=changed \
  tests/e2e/admin/smoke.spec.js tests/e2e/admin/visual.spec.js tests/e2e/admin/isolation.spec.js \
  tests/e2e/admin/fields.spec.js tests/e2e/admin/conditions.spec.js tests/e2e/admin/wizard.spec.js \
  tests/e2e/admin/dashboard.spec.js tests/e2e/admin/dialogs.spec.js tests/e2e/admin/tools.spec.js \
  tests/e2e/admin/app-states.spec.js tests/e2e/admin/page-rules.spec.js
```

Capturing against an accumulated database bakes incidental, machine-specific plugin state
into the PNGs, which then fails on a fresh CI database. Use `--update-snapshots=changed` so
only the baselines whose pixels actually moved are rewritten (a bare `--update-snapshots`
/ `=all` rewrites every executed PNG with sub-threshold re-encoding noise).

**Capture with the full suite, not `visual.spec.js` alone.** The suite shares one wp-env DB
(single worker, serial), so specs that run before `visual.spec.js` leave deterministic state
behind — e.g. the wizard/progress, cookie-descriptions and integrations screens reflect
earlier saves/scans. Baselines captured by running `visual.spec.js` on its own miss that
state and then mismatch during a full-suite run. Capture with the same spec set you verify
with, so the pre-`visual` state is identical at capture and verify time.

**The Notifications sidebar is masked AND height-pinned.** The right-hand `.cmplz-wizard-help`
panel (Settings.js) renders live, non-deterministic plugin state — notification dates, warnings,
scan results and incidental review notices — so it cannot be baselined. Two measures make the
app-container shot deterministic:

1. **Mask** — `visual.spec.js` adds it to `dynamicMasks()`, hiding the varying content (the same
   "mask the dynamic region, don't loosen the threshold" approach as the scan-progress and
   placeholder masks).
2. **Height pin** — masking the content is not enough on its own: the panel's *height* still
   jitters a few pixels run-to-run (and on a fresh vs accumulated DB), and because it is often the
   tallest column it changed the `#complianz` element's pixel height, so `toHaveScreenshot` failed
   on a hard image-*dimension* mismatch (which bypasses `maxDiffPixelRatio` and cannot be absorbed
   by retries). `tests/e2e/admin/disable-animations.css` (injected before every screenshot via
   `toHaveScreenshot.stylePath`, so it applies identically at capture and compare) pins
   `.cmplz-wizard-help { height: 1100px !important; overflow: hidden; }`. 1100px is above the
   largest natural sidebar height across the settings/wizard/tools/integrations screens (max
   measured 1017px); the layout is a CSS grid, so this sets only the sidebar's row height without
   reflowing the main content.

The panel is inside `#complianz`, so it is part of the app-container shot on every non-dashboard
screen (the Settings component — banner, integrations, settings, tools and wizard — renders it;
the Dashboard does not), which is why those baselines carry the masked, fixed-height region and the
two `dashboard-*.png` shots do not.

### CI / environment indirection

Every wp-cli and web-server invocation reads an environment variable that defaults to the
wp-env form, so CI (ADR-012) can substitute its own server without editing the config or
the specs:

| Variable | Default |
|----------|---------|
| `WP_BASE_URL_LATEST` | `http://localhost:8888` |
| `WP_BASE_URL_MIN` | `http://localhost:8889` |
| `E2E_WEBSERVER_CMD` | `npx wp-env start` |
| `WP_CLI_CMD_LATEST` | `npx wp-env run cli wp` |
| `WP_CLI_CMD_MIN` | `npx wp-env run tests-cli wp` |

### GitHub Actions workflow (`.github/workflows/checks.yml`, ADR-012 / T-019)

Runs on push and PR to `001-settings-ui-redesign`, with `concurrency` cancelling an older
in-flight run on the same ref. Two jobs, both on `ubuntu-latest` with Node from `.nvmrc`:

- **`build` (Build from source)** — `npm ci` (root and `settings`), `npm run build:all`, then:
  the FR-023 externalisation guard (React/wp-* stay external); the **ADR-004 token checks**
  (T-018, mirrored from the commit gate server-side, written as `! grep …` so they are
  `set -e`-safe); the **ADR-007 physical-utility check** (`node settings/scripts/check-physical-utilities.js`,
  T-016); and a **stylelint** step on `settings/src/styles/` that is a no-op + `continue-on-error`
  until T-020 creates that directory and its config.
- **`e2e` (Admin e2e suite)** — adds `npx playwright install --with-deps chromium`, `npx wp-env
  start`, and runs the four admin projects (`admin`, `admin-rtl`, `admin-min-wp`, `admin-i18n`).
  `CI=true` switches on `retries: 2`. The Playwright HTML report and `test-results/` (traces +
  screenshot diffs) upload as the `playwright-report` artifact (14-day retention, on success and
  failure).

Coding standards (WPCS) and `php -l` are NOT repeated here — the flow commit gate
(`.agent/gate.json`) already enforces them on every commit and push. Marking this workflow a
**required status check** is a manual branch-protection setting in the repo.

### Stop the environment

```bash
npx wp-env stop            # stop; keeps data
npx wp-env destroy         # remove containers and data
```
