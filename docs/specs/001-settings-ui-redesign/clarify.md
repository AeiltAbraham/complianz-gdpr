# 001 — Clarifications

Spec: [spec.md](spec.md) · Started 2026-10-06 · Format: one question at a time; answers
recorded here verbatim-in-substance, then summarized in the spec's Clarifications section.

## Resolved from the codebase (no question needed)

- **C-R1 — Open question 9 (old styling outside the app): No dependency found.**
  `admin.css` loads only on admin pages whose hook contains `complianz`
  (class-admin.php `enqueue_assets`). The only such pages are the settings app's own
  menu and submenus (settings/settings.php:322-366) plus the Consent Banner submenu
  (cookiebanner/admin/cookiebanner.php:285), which is a deep link (`complianz#banner`)
  into the same React app. `settings/wizard.php` registers hooks only and renders no
  markup. The plugin's admin/review notices (class-admin.php:338, class-review.php:79)
  render on general admin pages where `admin.css` never loads and carry their own inline
  styles plus WP core notice classes, so they do not depend on it. The post-edit metabox
  is on non-`complianz` hooks. **Caveat:** verified for the free codebase only; the
  premium repo (`pro/`, TCF admin) must be re-checked there before Phase 5.
- **C-R2 — Roles and permissions: out of scope, unchanged.** Access is capability-gated
  today (`cmplz_user_can_manage()`, `apply_filters( 'cmplz_capability',
  'manage_privacy' )`); the project changes presentation only (spec: Non-goals "Logic
  and data", DB-16), so no permission behavior changes. Multisite screens follow DB-16.
- **C-R3 — Build-tooling fact relevant to the editions question.** This repository (the
  free plugin, public GitHub fork) ships a prebuilt `settings/build/` (274 files) and
  `settings/webpack.config.js`, but contains **no `package.json` anywhere**, no
  `complianz.build.js` (root CSS is built by `gulpfile.js` here), no `tests/e2e/`, no
  `pro/`, no `deploy.sh`, no knip config. The npm build pipeline the technical plan
  assumes lives in the private premium repository. The settings app cannot currently be
  rebuilt from this checkout.

## Checklist items the spec already answers (skipped per skill rule)

- Error cases: DB-10 (async loading/success/error announced), DB-16 (behavior incl.
  error states unchanged elsewhere).
- Empty/zero/max states: behavior unchanged (DB-16); their *visual* treatment is a design
  deliverable — tied to Q-02 below.
- Data/PII/migration: no data model changes (Non-goals "Logic and data"); saved values
  unchanged (DB-16, DB-17).
- Performance: no runtime latency target set; shipped-weight targets are SC-03/SC-04
  with baselines captured before work starts. Behavior and data flow unchanged (DB-16),
  so no interaction-latency regression vector is in scope.
- Accessibility/i18n/RTL: DB-12, DB-13, DB-14; exemption process in spec; RTL covers
  layout only (Non-goals).

## Questions

### Q-01 — Where does the work live? (spec open question 4) — ANSWERED 2026-10-06

Context: the input technical plan was written against the private premium repo; this
public fork of the free plugin ships a prebuilt bundle and has no npm tooling (C-R3).

**Answer: this fork is the workspace.** Work happens in this repository. The design
phase must add tasks that bootstrap the missing build tooling for `settings/`
(package manifest, build/lint scripts) before any migration work; the technical plan's
premium-only references (pro/ screens, deploy.sh, GitLab e2e jobs, knip) are adapted to
what exists here or re-created here. Syncing the result to the premium repository is
out of scope for this feature. Consequence for the spec: "Editions" ambiguity is
resolved as *this codebase ships the redesign*; premium adoption is a later, separate
project.

### Q-02 — Who produces the design source? (spec open question 1) — ANSWERED 2026-10-06

**Answer: Claude proposes, the user approves.** No external designer. During the design
and build phases, the design source is produced in-repo: a token set and per-section
mockups (HTML previews) derived from the current UI and modern admin-app conventions.
The user signs off on each section's design before that section is migrated; the
approved preview becomes the review reference for DB-07/DB-11 and the token set the
reference for DB-08. Design-dependent spec questions (navigation model, progressive
disclosure, dashboard block layout options, empty-state treatments) are settled at each
section's design sign-off rather than up front — recorded as Q-03..Q-05 outcomes below.

### Q-03 — Navigation model (spec open question 2) — ANSWERED 2026-10-06

**Answer: keep the current model — top-level section tabs with a per-section sub-menu —
redesigned visually, not structurally.** Navigation targets, deep links (`#banner` etc.)
and the tour's path through menus keep working unchanged (supports DB-16). The sidebar
alternative is explicitly not pursued in this release.

### Q-04 — Progressive disclosure & per-section design details (spec open questions 3, 10)
— DEFERRED BY DESIGN (per Q-02)

How advanced/premium fields are revealed, which layout options dashboard blocks offer
(width, border, background — the extension-point mapping in DB-17 fixes the *legacy*
values; the new value set may grow), and empty-state treatments are decided at each
section's design sign-off. Each decision is recorded in that section's design note; any
that changes a public contract (the block extension point) additionally gets an ADR.

### Q-05 — Specialized widgets (spec open question 5) — ANSWERED 2026-10-06

**Answer: keep and re-theme all retained widgets; the accessibility audit is the only
replacement trigger.** A widget is replaced only when the spike-phase audit finds
serious/critical violations in its own markup that cannot be fixed through its
configuration or our wrapper (per the spec's exemption rules). Proactive replacement
for bundle-size or taste reasons is out of scope for this release.

### Q-06 — Pre-release window (spec open question 6) — ANSWERED 2026-10-06

**Answer: a one-week release-candidate self-QA window.** Once the full test suite is
green on the integration branch, a release candidate is tagged and one week of
structured manual QA follows (the maintainer with Claude: every section walked through,
German locale, RTL layout, WordPress 5.9 and latest). SC-07's "pre-release window" is
defined as this week; a confirmed regression found in it resets the window after the fix.

### Q-07 — Translations, accessibility notes, custom-CSS warning (spec open questions
7, 8, 11) — ANSWERED 2026-10-06

**Answer: fork-local process.** Translation files are regenerated mechanically as a
release step; German (`de_DE`) is the verification locale and no external translator
window is reserved — DB-14's "at release" check means German renders translated.
The plugin changelog (readme.txt) carries all three notices: the admin markup changed
(for owners with custom admin CSS), the banner preview now matches the website banner
(fidelity fix), and the list of accessibility exemptions inside retained widgets. No
standalone accessibility statement is published.

### Q-08 — Integration branch and mainline (surfaced by ADR-006) — ANSWERED 2026-10-06

**Answer: `001-settings-ui-redesign` is the long-lived integration branch; `master` is
the mainline.** Work branches are cut from `001-settings-ui-redesign` and merged back
via pull request; `master` is merged into it at least weekly and is the target of the
single release merge after the final phase. The technical doc's branch name
(`enhance/settings-tailwind-migration`) and its `development` mainline are premium-repo
conventions and are not used here. ADR-006's open naming note is settled by this answer.

## Outcome

All 11 spec open questions are closed or deliberately deferred with an owner:
1→Q-02 · 2→Q-03 · 3→Q-04 (per-section sign-off) · 4→Q-01 · 5→Q-05 · 6→Q-06 ·
7/8→Q-07 · 9→C-R1 (resolved from code) · 10→Q-04 · 11→Q-07. Plus Q-08 (branching),
raised during ADR verification.
Technical open items (framework version, build toolchain, overlay attachment, CI
environment, service stubs, visual threshold) remain with `/flow:design`.
