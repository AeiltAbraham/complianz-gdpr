# 001 — Settings UI redesign: plan

| | |
|---|---|
| Status | Approved 2026-10-06: maintainer sign-off with review fixes (§4) |
| Spec | [spec.md](spec.md) (approved; DB-01..DB-18, SC-01..SC-07, C-1..C-9) |
| Tasks | [tasks.md](tasks.md) |
| Decisions | ADR-001..ADR-009 (from spec), ADR-010..ADR-013 (this plan; ADR-012 accepted at sign-off), ADR-014 reserved for Spike S1 |
| Input | Internal technical spec for the migration (outside the repo), adapted to this fork — see "Adapting the input document" |

## 1. Approach and justification

The strategy is fixed by the accepted ADRs: Tailwind utilities scoped and prefixed under
the admin root and a portal host (ADR-001), Radix primitives (ADR-002) plus a Downshift
combobox (ADR-003), the `--rsp-*` → `--cmplz-legacy-*` rename (ADR-004), module-by-module
legacy SCSS retirement (ADR-005), one long-lived integration branch and a single release
(ADR-006), logical-properties RTL with one stylesheet (ADR-007), banner-preview fidelity
(ADR-008), and build-time-scoped vendor CSS (ADR-009).

What this plan adds:

1. **Bootstrap before anything** (C-1). This fork cannot build the app: there is no
   `package.json` anywhere, the PHP dev tools are pinned to versions that predate PHP 8.5,
   and `phpunit.xml.dist` points at a missing `tests/legacy/`. Stage A reconstructs the
   two npm manifests (ADR-010: npm, Node 24), Stage B repairs the PHP toolchain and
   extends the commit gate (constitution §2).
2. **Safety net before change** (SC-06, constitution §4). Stage C builds the whole-app
   characterization e2e suite against today's UI on wp-env + Playwright with a stub
   mu-plugin for server-side external calls (ADR-011). Its screenshots are the Phase 1–2
   visual baseline; its functional specs are the DB-16 contract. A parity task (T-032)
   proves a fresh source build reproduces the shipped app before anything changes. CI
   runs on GitHub Actions (ADR-012, accepted at sign-off).
3. **Spikes settle what facts cannot** (spec "Open questions" hand-off). Stage D runs
   S1 (Tailwind version, exact scope selector, portal-host placement, scoped-base rule
   list, stacking — writes ADR-014), the retained-widget accessibility audit (C-5 input),
   and S2 (PostCSS composition, enqueue, vendor pipeline prototype, the
   physical-utilities check script). Node version (D7) and package manager needed no
   spike — settled now by ADR-010; primitive conventions (D4/D5) by ADR-013.
4. **Look-preserving phases are fully tasked; redesign phases are gated on design
   approval** (C-2). Stages E (Phase 1) and F (Phase 2) change no pixels by contract, so
   their tasks are written now. Phases 3–5 need per-section design sign-off and spike
   outcomes; they are planned as named slices with explicit re-plan gates (see §5 and
   tasks.md "Not yet tasked").

### Scope judgment (why this cut)

Phase 2's task boundaries are component-set boundaries (which files, which legacy SCSS
module dies with them) and its acceptance is "visual baseline unchanged, suite green" —
none of that moves whichever Tailwind version or selector syntax S1 picks; only class
spelling inside the files does. So Phase 2 is tasked now. Phase 3 is the first redesign
phase: its markup, token values and layout depend on the shell design preview the
maintainer has not yet approved (C-2), so tasking it now would invent visual design,
which this plan must not do. Phase 4 additionally depends on the Phase 3 shell and on
per-section approvals; Phase 5 on everything before it. Each gets a named slice list and
a re-plan gate instead of guessed tasks.

### Adapting the input document to this repo

The input technical spec was written for the private premium repository. Deviations, each
deliberate:

| Input doc | Here | Why |
|---|---|---|
| Branch `enhance/settings-tailwind-migration`, mainline `development` | `001-settings-ui-redesign`, mainline `master` | C-9, ADR-006 |
| `deploy.sh` release/i18n steps | Fork-local release; i18n regenerated via wp-cli inside wp-env (CI workspace or local) | C-7 |
| GitLab CI `e2e:admin` job | GitHub Actions workflow (Proposed) | ADR-012 |
| `tests/e2e/` already exists with frontend specs | No e2e tests exist; the suite is created from scratch; no frontend-spec compatibility work | verified in repo |
| `complianz.build.js` root build | `gulpfile.js` (`npx gulp 'build:css:admin'`) | verified in repo |
| `tests/unit/settings/test-blocks.php` | `tests/test-blocks.php` (Phase 4 slice) | conventions: tests live in `tests/test-*.php` |
| knip for dependency-removal verification | `npm ls <pkg>` exit codes + import greps; knip optional later | no knip config exists here; smaller surface |
| One-time Prettier bulk format of `settings/src` before Phase 2 | **Not done** | this fork's gate runs no Prettier, and a whole-tree reformat would multiply conflicts in every weekly `master` merge (ADR-006 risk) |
| Pro-only concerns: `pro/` screens, TCF admin, premium translation fetcher, license-server stubbing | Out of scope / absent; premium groups render locked here | C-1; see "What is testable here" |
| `docs/DEVELOPMENT/*` references | Replaced by `docs/developers/testing.md` (Stage B/C deliverables) | files do not exist here |

### What is testable in this repository (and what is not)

`cmplz_settings.is_premium` is false here (`settings/settings.php:248` checks the
`cmplz_premium` constant; `pro/` is absent). Menu groups flagged `premium` in
`settings/config/menu.php` (premium support, processing agreements, data breach reports,
records of consent) render **locked** with upsell text (`settings/src/Settings/
SettingsGroup.js:77-85`). Consequences, stated once and honored by the suite:

- The e2e suite characterizes the **free-rendered** app: locked groups are asserted as
  locked (rendered, disabled, upsell visible); their full CRUD flows (premium REST
  routes) cannot run here and are re-verified only if/when premium adopts this work (C-1).
- Testable in full: dashboard, wizard (all free field types incl. the four `document`
  fields → ADR-003), consent banner + preview, integrations, data requests (DNSMPD is a
  free feature), proof of consent, export/import, debug, support form, onboarding, tour,
  cookie scan (stubbed), cookiedatabase sync (stubbed).
- `Statistics/Statistics.js`, chart.js and `DateRange` ship in this repo's source and are
  reachable where free config renders them; the suite covers exactly what renders free.
- DB-16's "same data, same actions" is therefore verified for everything reachable in the
  free edition; the spec's premium-screen wording is satisfied here by "renders exactly as
  today (locked)".

## 2. Data model / API contract deltas

No data-model changes (spec non-goal "Logic and data"). Public-contract deltas, all
backward compatible (constitution §3):

| Contract | Delta | Where decided |
|---|---|---|
| `cmplz_blocks` filter / pluggable `cmplz_blocks()` | New `width`/`variant` keys; legacy `'class'` normalized at the consumer by a new `cmplz_normalize_blocks()`; `_doing_it_wrong` under WP_DEBUG; explicit keys win; unknown tokens dropped | DB-17, FR-024; final value set + its ADR at the Dashboard section sign-off (C-4); Phase 4 slice |
| Settings-page mount markup | `#complianz` gains `#complianz-app` and the PHP-rendered portal host; `#complianz-modal` (unreferenced) removed | ADR-001; exact placement by ADR-014 (S1); task T-021 |
| Enqueued assets | New style handle (entry CSS) on the settings screens only, `filemtime`-versioned, depending on `complianz-admin` until Phase 5 | FR-016; T-021 |
| Admin DOM / CSS classes | `cmplz-*` styling classes disappear from migrated markup; not a supported API; release notes flag it | spec C-7; Phase 4–5 |
| REST routes, `cmplz_options`, field definitions, deep links, tour path | Unchanged | DB-16, C-3 |

## 3. Risks and rollback

- **Rollback of the whole feature** is reinstalling the previous plugin release (DB-18,
  ADR-006). On the branch, every task lands by PR into `001-settings-ui-redesign`;
  rollback of a task is reverting its merge.
- **Suite cost and flakiness** (biggest new risk): the characterization suite is the
  largest Phase 0 item; flaky tests would block all merges once CI gates. Mitigations:
  deterministic fixture and stubs (ADR-011), role-based waits, `workers: 1`, CI-only
  retries with flagged flakes, threshold calibration in Stage C.
- **PHP dev-tool upgrade** may surface many pre-existing WPCS violations; the gate runs
  only on *changed* PHP (constitution §2), so the baseline noise stays out of the gate.
- **Weekly `master` merges** keep re-introducing `--rsp-*` and legacy SCSS edits; the
  permanent gate checks (T-018) catch them in the merge PR (ADR-004).
- **wp-env fidelity**: WordPress 5.9 images with PHP 7.4 are old; if wp-env cannot
  provision them, fall back per ADR-011's alternatives (recorded there).
- **Un-probed tool behavior**: several failure-mode criteria depend on tools this plan
  introduces (eslint, stylelint, Tailwind, Playwright, the check script). They are marked
  `probe-at-build (introduced by T-xxx)` in tasks.md instead of guessed messages. Probed
  today with existing tools and recorded in tasks.md: `php -l` parse-error output and
  exit 255; grep match/no-match exit codes (ugrep 7.8.4 and BSD grep); the fact that
  `docs/adr/ADR-004` itself contains `--rsp-`, so the permanent checks must scope to
  `assets/css` SCSS, `settings/src` and freshly built `admin*.css`, never `docs/`.
- **Build artifacts are tracked** (`settings/build/`, compiled root CSS) but must not be
  committed on work branches (ADR-006). Every build-running proof restores the tree;
  tasks say so explicitly.
- **Testing the right build.** Stage C baselines are captured on the shipped bundle;
  T-032 proves a fresh build from the reconstructed manifests matches it (drift is fixed
  by version pins, never by baseline updates). From T-032 on, every e2e proof runs
  `npm run build:all` first, so the suite tests the source being changed.
- **Big-bang release** risk is unchanged from ADR-006; the mitigation is SC-06 at every
  checkpoint plus the RC week (C-6).

## 4. Decisions (signed off 2026-10-06)

Every item below was put to the maintainer at plan sign-off; the outcome leads each item.

1. **CI on GitHub Actions (ADR-012): accepted.** Free for public repos; Docker-capable
   runners run wp-env unchanged. T-019 implements it.
2. **Non-agentic task modes: T-017 signed off as script.** It runs the deterministic
   `--rsp-` → `--cmplz-legacy-` rename (761 occurrences; diff > 200 lines, inherent to a
   bulk rename). The script itself is written and tested in agentic T-031, so T-017 only
   executes it. No fanout tasks exist: every proof needs npm, the one wp-env instance
   (fixed ports) or the shared visual baseline, which the planning skill rules out as
   shared mutable state. No ratchet tasks: no outcome here reduces to one steerable
   metric.
3. **npm + Node 24 (ADR-010): confirmed.** Facts (premium parity, ecosystem default,
   installed toolchain) settled it; the `TODO: confirm` in conventions.md is resolved.
4. **No one-time Prettier bulk format of `settings/src`: confirmed** (deviation from the
   input doc, see table above). Revisit at Phase 5 only if formatting noise hurt reviews.
5. **readme.txt minimum-WP alignment: dropped.** This repository's `readme.txt` already
   says "Requires at least: 5.9"; the mismatch existed only in the input doc's repository.
6. **Accessibility replacement candidates (standing)**: if the T-015 audit finds unfixable
   serious/critical violations in a retained widget, replacing it needs your sign-off
   (C-5). The audit report is the decision input; no default is pre-committed.
7. **Per-section design approvals (C-2, standing)**: checkpoints — token set before
   Phase 3; each section's HTML preview before that section's Phase 3/4 migration. The
   preview tasks produce proposals; nothing migrates without your approval recorded in
   the section's design note.
8. **Task landing until CI: direct commits on the integration branch** (2026-10-07).
   Each task lands as one atomic commit on `001-settings-ui-redesign`, unpushed; the C-9
   pull-request flow starts once T-019 puts CI on GitHub.
9. **T-006 gate behavior: fail, don't skip** (2026-10-07). When PHP files changed and
   `vendor/bin/phpcs` is missing, the gate blocks with an install hint, so constitution
   §2 stays enforced on every machine.

### Review fixes applied at sign-off

- T-031 (new, agentic) writes and tests the rename script that script-mode T-017 runs.
- T-032 (new, agentic) proves a fresh source build reproduces the shipped app; every later
  e2e proof builds first (`npm run build:all`).
- Proofs now assert their criteria: T-001 (bundle dependency list), T-002 (built admin
  CSS), T-019 (CI run concluded `success`). Playwright proofs go through `npm run e2e`,
  which passes the config path Playwright does not find on its own.
- T-017's file counts corrected (9 SCSS + 5 JS files); item 5 dropped.
- The gate's diff check reads the index (`git diff --cached --check`), so unstaged rebuilt
  artifacts never block a commit.

## 5. Workflow

Stages run in order; a stage starts when its gate passes. **No tasks run in parallel**:
every task either invokes npm/composer, runs the single wp-env instance (fixed ports
8888/8889), or writes the shared visual baseline — the planning skill's shared-mutable-
state rule forbids fanout for all of them. The "parallel groups" of this workflow are
therefore empty by design; parallelism would have to come from disjoint doc-only tasks,
of which there are none worth splitting.

- **Stage A — Build tooling bootstrap** (T-001..T-003). Gate to start: this plan
  approved. Output: both manifests, reproducible builds, SC-03/SC-04 baselines.
- **Stage B — PHP toolchain and gate** (T-004..T-006). Output: PHPCS/WPCS and PHPUnit
  run on PHP 8.5; gate runs coding standards on changed PHP.
- **Stage C — Characterization e2e suite, S3** (T-007..T-010, T-032, T-011..T-013).
  T-032 proves the fresh source build matches the shipped bundle. Output: suite green on
  the legacy UI (SC-06 "before work starts"), visual + preview + wp-admin + RTL
  baselines, axe inventory. Gate out: full suite green twice in a row locally.
- **Stage D — Spikes** (T-014..T-016). Output: ADR-014 (Tailwind version, scope
  selector, portal placement, base rule list), a11y exemption draft (§8.2 of the input
  doc) + replacement candidates for sign-off, S2 build/vendor-pipeline findings, the
  physical-utilities check script. Re-plan gate R1: if S1 overturns any ADR-001/007/009
  assumption, amend affected tasks before Stage E.
- **Stage E — Phase 1 foundation, look-preserving** (T-031, T-017..T-021). Output: token
  rename done and permanently enforced; Tailwind builds
  into the entry CSS; new mount markup + enqueue live; visual baseline unchanged.
  Checkpoint CP1: full suite green (SC-06).
- **Stage F — Phase 2 primitives, look-preserving** (T-022..T-030). Output: primitives
  in `components/ui/`; MUI, react-tooltip, `@wordpress/components`, react-select and all
  `@emotion/*` gone from the manifest; 16 inputs rebuilt; inputs legacy SCSS deleted;
  `legacy-globals.scss` holding the global rules. Checkpoint CP2: full suite green;
  visual baseline unchanged on unmigrated screens.
- **Stage G — Phase 3 shell (re-plan after gate G3)**. Gate G3: CP2 passed + token set
  and shell preview approved (C-2). Slices: token-set proposal → approval → shell
  migration (`Page.js` grid, `Header.js`, `Menu/*`, `Placeholder/*` → Skeleton, panels,
  notices; delete `layout.scss`, `header.scss`, `wizard/menu.scss`, `placeholder.scss`,
  `wizard/panel.scss`, `notices.scss`), root typography to `base.css`, page-level rules
  to `page.css` (§4.7 of the input doc), first re-baseline of redesigned screenshots.
- **Stage H — Phase 4 screens (re-plan per section after its design sign-off)**. Order
  (most shared first): Wizard fields → Dashboard (incl. `cmplz_normalize_blocks()` + unit
  tests for DB-17 and the extension-point ADR per C-4) → Consent banner (preview vendor
  CSS per ADR-008) → Integrations → Tools/Settings data tables (vendor pipeline per
  ADR-009, `readToken()`) → Statistics/DateRange → Onboarding/Tour (tour targets to
  `data-tour`). Each section: preview task → approval → migrate + delete its legacy SCSS
  in the same PR (ADR-005) → re-baseline that section.
- **Stage I — Phase 5 legacy removal and release (re-plan after CP4: all sections
  migrated, suite green)**. Slices: move `data-cmplz-ui` marker to the app wrapper;
  delete `legacy-globals.scss` (+ wp-admin before/after shots); stop enqueueing
  `admin.css` on settings screens; retire the gulp admin target; `--cmplz-legacy-` entry
  gate then delete `variables.scss`; preview re-baseline against the frontend banner
  (ADR-008); FR-017 no-chunk-CSS check; SC-03/04 comparison against `baselines.md`;
  i18n regeneration with German verification (C-7); readme notices; release packaging;
  CP5 = release-candidate tag; then the
  one-week RC self-QA (C-6) and the single release merge to `master` (DB-18).

Traceability: every task in tasks.md carries `serves:` naming the DB-/SC-/C- items it
advances; the not-yet-tasked slices above inherit their IDs from the stage descriptions.
