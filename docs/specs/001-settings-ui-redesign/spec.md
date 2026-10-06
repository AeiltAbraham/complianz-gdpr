# 001 — Settings UI redesign

| | |
|---|---|
| Status | Approved 2026-10-06 (all sections signed off) |
| Created | 2026-10-06 |
| Branch | `001-settings-ui-redesign` |
| Input | Internal technical specification for the Settings UI migration and redesign (draft, 2026-10-01) |

This spec covers what and why only. Technical choices from the input document are recorded
as ADRs and carried into design.

## Problem

The Complianz admin app (Dashboard, Wizard, Consent banner, Integrations, Settings,
Tools) is inconsistent for admins and risky for the team to change:

1. **No shared visual language.** Screens are assembled from several unrelated
   component sets and two separate styling systems, so dialogs, tooltips, selects,
   buttons and form rows look and behave differently from screen to screen. There is
   no documented set of design values, so a consistent redesign, or a dark theme
   later, cannot be built on the current base.
2. **Styling is not contained.** On Complianz admin pages, the app's styles reset every
   button on the page and restyle WordPress's standard buttons, including in the admin
   bar, the admin menu and (not yet verified) the media library window. Some rules can
   also reach other plugins' pop-ups on the same page. In the other direction,
   WordPress's own form and text styles apply inside the app, which has to override
   them case by case.
3. **The banner preview is not faithful.** The preview in the admin inherits admin-only
   styling that the real banner on the website never receives, so admins can see a
   banner that differs from what visitors see.
4. **Quality is not verified.** Nothing checks the admin app against an accessibility
   standard, right-to-left layouts depend on automatic flipping of the old styles, and
   there is no automated end-to-end coverage of the admin app, so visual or behavioral
   breakage can ship unnoticed.
5. **Admins download more than they need.** Overlapping component sets add script and
   style weight to every load of the settings screens.

**Why now:** this project redesigns every section of the app. Doing that on the current
base would multiply the inconsistency; the redesign needs one design system, contained
styling and a safety net first.

## Users affected

- **Site owners and administrators** configuring Complianz in the WordPress admin.
  Every screen of the settings app changes: Dashboard, Wizard, Consent banner,
  Integrations, Settings, Tools, Statistics, onboarding and the guided tour.
- **Free and premium users alike.** This repository (the free plugin) contains the same
  settings app, premium screens included, so both editions are affected (to be
  confirmed, see Open questions).
- **Admins working in a right-to-left language**, whose screens must mirror correctly.
- **Admins who rely on a keyboard or a screen reader.**
- **Admins on the oldest supported WordPress versions** (5.9 and up), which provide
  older versions of the libraries the app runs on.
- **Agencies and developers** who add or change dashboard blocks through the plugin's
  public extension point; their blocks must keep their layout.
- **Site owners or plugins with custom admin CSS** aimed at Complianz admin markup.
  That markup changes; it is not a supported interface, and release notes will say so.
- **Translators**, who must translate new and changed strings before release.
- **Support and documentation**, whose screenshots and guides of the admin go stale.

**Not affected:** website visitors. The cookie banner, legal documents and consent
behavior on the site stay exactly as they are.

## Desired behavior

Statements describe the released product; each one names how it is checked.

**Contained styling**

- **DB-01** On a Complianz settings screen, everything outside the app (WordPress's admin
  bar, admin menu, media library window and standard buttons, and other plugins'
  pop-ups) looks the same as on a non-Complianz admin screen. _Check:_ screenshots of a
  Complianz and a non-Complianz screen compared.
- **DB-02** Admin screens of WordPress and other plugins are unchanged by this project.
  _Check:_ screenshots against a baseline taken before work starts.
- **DB-03** Controls inside the app (buttons, text fields, selects, checkboxes, radio
  buttons, switches, text areas) look the same whether or not WordPress's own admin form
  styles are loaded. _Check:_ each control rendered with and without those styles.
- **DB-04** Other plugins' admin notices stay hidden on Complianz screens while
  Complianz's own notices show, and the app's edges sit where they do today, in both
  left-to-right and right-to-left layouts. _Check:_ a test plugin that adds a notice;
  edge screenshots in both directions.

**Banner and preview**

- **DB-05** The cookie banner, legal documents and consent behavior on the website are
  unchanged for every banner layout. _Check:_ website banner screenshots per layout.
- **DB-06** The banner preview in the admin matches the website banner with the same
  settings, for every layout. The only allowed difference is typography the banner
  inherits from its surroundings, which stays at today's admin values. _Check:_
  preview and website screenshots compared per layout at 1920×1080.

**One design system**

- **DB-07** Every section uses one set of interface patterns: one card, one button set,
  one form-row layout, one table style, and one style each for dialogs, pop-overs,
  tooltips, selects and notifications. _Check:_ design review of every section against
  the mockups.
- **DB-08** All visual values (color, spacing, corner radius, typography, shadow,
  layering, motion, breakpoints) come from one documented set of named design values.
  Changing a value changes it everywhere; one-off values exist only with a recorded
  reason. Swapping the set, for example for a dark theme, needs no screen changes.
  _Check:_ automated scan for unnamed values; a test theme applied by swapping values.
- **DB-09** Dialogs, confirmations, pop-overs, tooltips and selects behave alike: they
  work by keyboard and mouse, dialogs keep focus inside while open, Escape closes them,
  focus returns to whatever opened them, and they appear above WordPress's admin bar
  and menu. _Check:_ end-to-end tests on every dialog; stacking screenshots.
- **DB-10** Every action that takes time (save, scan, sync, generate) shows a loading
  state and then a success or error state, and the result is announced to screen
  readers. _Check:_ each action tested with a forced success and a forced error.
- **DB-11** The dashboard shows progress, open tasks and scan status before any
  configuration. _Check:_ dashboard order verified against the mockup.

**Accessible, mirrored, translated**

- **DB-12** Every screen meets WCAG 2.2 level AA: no serious or critical automated
  accessibility findings on any page, except reviewed exemptions inside retained
  specialized widgets, each listed with a reason. Every control is labelled, focus is
  always visible, everything works by keyboard, and animations respect the
  reduced-motion setting. _Check:_ automated scan of every page, plus a manual keyboard
  pass on dialogs, selects and menus.
- **DB-13** For admins in a right-to-left language, every screen mirrors correctly
  (layout, alignment, direction-dependent icons, pop-up placement), at least as well as
  today. _Check:_ right-to-left screenshots of every page at desktop and tablet widths.
- **DB-14** All new or changed interface text is translatable, with context for
  translators. Text whose meaning is unchanged keeps its wording, so existing
  translations still apply. _Check:_ in German, menu titles and field labels show
  translated on every build, and unchanged app text shows translated at release.

**Compatible and unchanged in function**

- **DB-15** Every screen works on every supported WordPress version (5.9 and later) and
  PHP version (7.4 and later). On the oldest, every page loads without errors, and the
  fields, the wizard's finish step and the guided tour work. _Check:_ page-load and
  field tests on WordPress 5.9 with PHP 7.4.
- **DB-16** What each screen does is unchanged: same data, same actions, same results,
  same saved values. Every field type renders, saves and reloads its value as today,
  and show/hide conditions between fields behave as today. _Check:_ the end-to-end
  suite written against today's app passes at release, with no test changed to
  accommodate a behavior change.
- **DB-17** Dashboard blocks that extensions declare the old way, through the public
  extension point, keep their layout (width, border and background). In debug mode
  only, developers get a deprecation notice that names the replacement. _Check:_ unit
  tests covering old-style declarations, combinations, unknown values and precedence.

**Delivery**

- **DB-18** Customers receive the change in one plugin release. No customer-facing
  release mixes old and new screens, there is no switch between old and new UI, and
  rolling back means reinstalling the previous plugin version. _Check:_ release
  checklist.

## Non-goals

- **The website side.** The cookie banner, legal documents and consent behavior visitors
  see are not redesigned or restyled.
- **Block-editor blocks and the TCF consent interface.** Both stay as they are.
- **Logic and data.** How settings are defined, stored, validated and saved does not
  change. Existing field definitions keep rendering without changes; new visual
  variants can only be optional additions.
- **Platform range.** WordPress 5.9 and PHP 7.4 remain the minimums, and the app keeps
  running on the interface libraries WordPress provides instead of shipping its own.
- **Dark mode.** Not part of this release; DB-08 keeps it possible later.
- **WordPress's own interface.** The media library window, admin bar and menu are not
  styled by this project; they keep WordPress's defaults.
- **Third-party custom admin CSS.** Styles that site owners or other plugins aimed at
  Complianz admin markup are not preserved; release notes flag the change.
- **Replacing specialized widgets.** The rich-text and code editors, data tables, date
  picker, charts, guided tour, notifications and color picker are kept and re-themed,
  unless one has accessibility problems that can't be fixed (see Open questions).
- **Screens outside the settings app**, such as the upgrade screen, are not redesigned.
- **New translations.** No new languages are added; right-to-left support covers layout.

## Success criteria

- **SC-01** Every desired-behavior check (DB-01 to DB-18) passes at release.
- **SC-02** No screen of the settings app uses the old styling, and the old admin
  stylesheet is no longer loaded on the settings screens.
- **SC-03** The settings screens download less styling than today. Baseline measured
  before work starts.
- **SC-04** The settings screens download less script than today, by at least the
  weight of the overlapping component sets that are removed. Baseline measured before
  work starts.
- **SC-05** Zero serious or critical automated accessibility findings across all
  sections, apart from the listed exemptions.
- **SC-06** The end-to-end suite written against today's app is green before work
  starts, at every internal checkpoint, and at release.
- **SC-07** Zero confirmed regressions in the WordPress admin, the banner preview or the
  website banner during the pre-release window (one week, see Clarifications C-6).

## Clarifications

Resolved 2026-10-06; full record with context in [clarify.md](clarify.md). The original
eleven open questions are all closed or deferred with an owner.

- **C-1 — This repository ships the redesign** (was open question 4). This fork is the
  workspace; the design phase first adds the build tooling the app is missing here.
  Adoption by the premium edition is a later, separate project.
- **C-2 — Design source: proposed in-repo, approved per section** (was open question 1).
  No external designer. Design values and per-section previews are produced in this
  repository and signed off by the maintainer before that section is migrated; the
  approved preview is the review reference for DB-07 and DB-11, the value set for DB-08.
- **C-3 — Navigation keeps its model** (was open question 2): top-level section tabs
  with per-section sub-menus, redesigned visually, not structurally. Deep links and the
  tour's path keep working.
- **C-4 — Per-section design details are decided at that section's sign-off** (were open
  questions 3 and 10): progressive disclosure of advanced and premium fields, dashboard
  block layout options, empty-state treatments. Each outcome is recorded in the
  section's design note; changes to the public extension point also get a decision
  record.
- **C-5 — All specialized widgets are kept and re-themed** (was open question 5); the
  accessibility audit is the only replacement trigger.
- **C-6 — Pre-release window: one week of release-candidate self-QA** (was open
  question 6): every section walked through, German locale, right-to-left layout,
  oldest and newest supported WordPress. A confirmed regression resets the window after
  the fix.
- **C-7 — Fork-local release process** (were open questions 7, 8, 11). Translation
  files are regenerated mechanically at release with German as the verification locale;
  the plugin changelog carries the three notices: admin markup changed, banner-preview
  fidelity fixed, accessibility exemptions listed. No standalone accessibility
  statement.
- **C-8 — Nothing outside the app relies on the old styling** (was open question 9),
  verified in this codebase: the old stylesheet loads only on the settings app's own
  pages, and the plugin's notices on other pages style themselves. Re-verify in the
  premium repository if the work is ever ported there.
- **C-9 — Branching:** `001-settings-ui-redesign` is the long-lived integration branch;
  work branches are cut from it and merged back by pull request; `master` is the
  mainline, merged in at least weekly, and the target of the single release merge
  (DB-18).

## Open questions

None for this spec. Technical open items (styling-framework version, build toolchain,
where overlays attach, the test environment in CI, stubbing of licensing and external
services in tests, the visual-comparison threshold) are owned by `/flow:design`.

## Decision records

Accepted decisions carried over from the input technical specification are recorded in
`docs/adr/` (ADR-001 through ADR-009) and referenced by the design phase; the spec body
above stays free of technology choices by design.
