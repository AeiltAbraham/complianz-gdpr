# ADR-005: Retire legacy admin SCSS module by module, global rules last

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D6, §7.3, §7.6, §11. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

## Context

The legacy styling lives in the partials under `assets/css/admin/` (compiled into `admin.css`) and in 17 per-component SCSS files inside `settings/src`, and it must coexist with Tailwind on the integration branch until every screen is migrated (§1, §3.2). Most of it targets the components that use it, but some rules are global: the `button { all: unset; }` reset (duplicated in `modules/inputs/Buttons.scss` and `modules/inputs/SwitchInput.scss`), the `a.button, button.button, input.button` and `.button--*` rules with their `:root` variables, and the `:root` token declarations. These global rules style every `<button>` and WordPress `.button` in the app (51 files in `settings/src` contain a `<button>`), most of which migrate only in Phase 4 (§7.3). Some legacy containers also style inputs through ID-prefixed descendant selectors that outrank utilities, such as `#complianz .cmplz-modal.cmplz-onboarding .cmplz-modal-content input[type=email]` (1,3,1). The doc's risk table names the long coexistence of two systems, with conflicting styles and slower delivery, as a risk (§11).

## Decision

We delete each `assets/css/admin/**` module in the MR that migrates its last consumer, collect the global rules (bare element selectors, WordPress core classes, `:root` declarations) in `assets/css/admin/legacy-globals.scss` in Phase 2 and delete that file only in Phase 5, and remove legacy container rules that target a replaced input in the same MR that replaces the input.

## Alternatives considered

The doc names no alternatives; these are the ones its rules and risk table imply.

- **Remove the legacy SCSS in one pass at the end**: lost because a long coexistence of two systems means conflicting styles and slower delivery (§11).
- **Delete the global rules together with the input modules that hold them**: lost because they still style the buttons of screens that migrate only in Phase 4 (§7.3).
- **Keep container rules until the container itself migrates**: lost because their ID-prefixed descendant selectors outrank utilities and would restyle the rebuilt input (§7.3).

## Consequences

- Legacy CSS shrinks with every MR and conflicts stay local; per-component SCSS in `settings/src` follows the same rule (§4.3.3, §7.5). Enforced by FR-015 of the input spec; the end state is SC-1: no `assets/css/admin/**` or `settings/src/**/*.scss` left, and `admin.css` no longer enqueued on the settings screens.
- `legacy-globals.scss` is imported from `assets/css/admin.scss`, carries a "delete in Phase 5" header and must exist before any input SCSS is deleted; the two `button` resets merge into one rule.
- Harder: each MR has to establish the last consumer of a module, and container-rule removals are narrowed to the replaced input while the rest of the container's legacy rules stay. Spike S1 checks that this removal rule is sufficient.
- Deleting `legacy-globals.scss` in Phase 5 changes how WordPress core buttons, and possibly the media modal, look on Complianz screens: they revert to WordPress defaults. The wp-admin isolation screenshots are compared before and after (§11). The deletion also ends the legacy leaks onto the banner preview (ADR-008).
- Phase 5 (§7.6): once nothing in `assets/css/admin/**` is left for the settings screens, `admin.css` stops being enqueued there, the admin target leaves the root CSS build (`gulpfile.js` in this checkout), and `assets/css/variables.scss` is deleted after the `--cmplz-legacy-` entry gate (ADR-004). Still open in the doc: confirming that no non-React markup on Complianz admin pages depends on `admin.css`.
- The vendored third-party copies in the legacy tree (date range, toast, Shepherd, data table) are deleted in the MR that adds each widget's vendor stylesheet (ADR-009).

Related: ADR-004, ADR-006, ADR-008, ADR-009
