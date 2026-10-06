# ADR-009: Import retained widgets' own CSS and scope it at build time

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D15, §4.8. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

Depends on open work: the zone prefix uses the scope selector of ADR-001, whose exact syntax waits for Spike S1, and Spike S2 confirms that both PostCSS plugins compose with the chosen Tailwind/PostCSS setup.

## Context

Several retained widgets have no stylesheet of their own in the app. Their base styles are copies vendored into the legacy admin SCSS that this project deletes: `assets/css/admin/modules/date-range.scss` (react-date-range, 615 lines), `modules/toast/**` (react-toastify), `modules/shepherd.scss` and `modules/datatables.scss` (overrides for react-data-table-component). The copies are unscoped and were RTL-flipped by rtlcss (§3.2, §4.8). Retained widgets sit in `data-cmplz-isolate` zones that the scoped base skips, so their own CSS has to style them (ADR-001), and no unscoped vendor selector may ship (FR-002).

## Decision

We import each retained library's own stylesheet into `settings/src/styles/vendors/<name>.css`, followed by our overrides, run a PostCSS step on those files only that prefixes every selector with the widget's zone selector (`postcss-prefix-selector`) and emits `[dir="rtl"]` variants in the same file (`postcss-rtlcss`), and delete each vendored legacy copy in the same MR that adds its vendor file.

## Alternatives considered

- **Keep the vendored copies**: lost because they are unscoped (FR-002), were flipped by rtlcss for a separate RTL stylesheet that the single-file model drops (ADR-007), sit in the legacy tree that is being deleted (ADR-005), and drift from upstream, since library upgrades do not bring their CSS along (§4.8).

## Consequences

- Sources, as listed in §4.8: the `date-range` zone imports `react-date-range/dist/styles.css` and `react-date-range/dist/theme/default.css`, `toastify` imports `react-toastify/dist/ReactToastify.css`, and `shepherd` imports `shepherd.js/dist/css/shepherd.css` (the copy `react-shepherd` uses). The data table (styled through styled-components), CKEditor, Ace and react-color inject their styles at runtime, so their vendor files hold overrides only, and the data table's `customStyles` read tokens through `readToken()`.
- Scoping: every imported selector gets `:is(#complianz, #complianz-portal) [data-cmplz-isolate="<name>"]` (syntax pending S1); `:root`, `html` and `body` selectors map to the zone element, so a library's custom properties land on the zone; `@keyframes` names stay as they are. With the hand-written overrides scoped the same way, this meets FR-002 and FR-005 of the input spec; the CKEditor `.ck-body-wrapper` overrides remain the documented exception (ADR-001).
- Upgrades bring their CSS along, and the visual baseline from Spike S3 catches regressions. Our overrides use tokens and logical properties and are linted by the physical-property checks; the imported upstream rules are not (ADR-007).
- Harder: the build gains a vendor-only PostCSS step that must compose with Tailwind and the re-added wp-scripts preset; Spike S2 prototypes it on react-date-range. Both plugins are build-time only and are not shipped.
- Harder: every new retained widget needs a zone value, a row in the §4.1 zone table and its own vendor file. Until a widget's vendor file lands, its legacy copy keeps styling it.

Related: ADR-001, ADR-005, ADR-007
