# ADR-007: RTL through logical properties and a single stylesheet

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D12, §4.6. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

Depends on open choices: if D1 (Tailwind version, Open) picks v3, the logical utilities need Tailwind 3.3 or later; the prefix the check strips (`tw-` or `tw:`) follows D1 and D2 (Proposed).

## Context

RTL support today relies on generated copies. The root SCSS build runs rtlcss into `assets/css/rtl/`, and `class-admin.php` picks that copy through `is_rtl()` (line 215). For lazy chunks, wp-scripts' `RtlCssPlugin` emits `-rtl.css` siblings, but the mini-css-extract runtime always loads `[name].css`, so legacy chunk CSS is LTR-only on RTL sites today. Once `index.js` imports CSS, wp-scripts will also generate `build/index-rtl.css` next to `build/index.css`. WordPress sets `dir="rtl"` on `<html>` for RTL locales, so with logical properties the browser resolves the direction itself. Goal G7 keeps RTL at parity or better.

## Decision

We write layout with logical utilities and properties only, enqueue the same `build/index.css` for both directions and leave the generated `index-rtl.css` unused, allow `rtl:`/`ltr:` variants only where logical properties cannot express the intent, and ban physical utilities with a check script plus stylelint.

## Alternatives considered

- **An rtlcss-generated second stylesheet** (`index-rtl.css`, switched with `is_rtl()` the way `admin.css` is today): lost because running rtlcss over logical CSS plus `rtl:` variants would flip rules twice, and the per-chunk form of this model already fails today (legacy lazy-chunk CSS is LTR-only on RTL sites).

## Consequences

- One file and no `is_rtl()` switch for the new CSS (FR-016). `rtl:`/`ltr:` variants are kept for what logical properties cannot express: mirrored directional icons (`rtl:-scale-x-100`), `translate-x-*`, background positions and gradient direction.
- Banned in `settings/src` (full list in §4.6): physical spacing and position (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*` and the `scroll-` forms), `text-left`/`text-right`, left/right floats and clears, left/right borders and radii (including corner radii), `space-x-*`, `divide-x-*`, left/right `origin-*`, `bg-left*`/`bg-right*` and left/right gradient directions. The replacements are `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`, `rounded-s/e-*`, `border-s/e-*` and `gap-*`.
- Enforced by FR-013 of the input spec through a planned `settings/scripts/check-physical-utilities.js`, run in CI and in the pre-commit hook: it extracts class tokens from `className` values and `clsx`/variant maps, strips the prefix, a leading `-` and the variant segments, and fails on a banned utility unless its variant chain contains `rtl:` or `ltr:`. For CSS under `settings/src/styles/`, stylelint with a logical-properties plugin (e.g. `stylelint-use-logical`) rejects physical left/right properties; documented exceptions carry a disable comment with the reason, such as the `[dir="rtl"]` translate in `vendors/preview.css` (ADR-008).
- The same rule covers the scoped base, `page.css` and our vendor overrides. Imported upstream vendor CSS instead gets `[dir="rtl"]` variants in the same file from `postcss-rtlcss` (ADR-009).
- Coexistence: the legacy `admin.css` keeps its rtlcss copy until Phase 5, and legacy chunk CSS stays LTR-only on RTL sites until it disappears at release (FR-017). Phase 5 also keeps the unused `index-rtl.css` out of the release package.
- Verification: Spike S2 checks logical utilities and `rtl:` variants on an RTL locale with the single file; the `admin-rtl` project of the e2e suite planned in the doc runs smoke and visual specs as a `he_IL` admin.
- Harder: the familiar physical utilities are off limits, and every physical CSS exception needs a written reason.

Related: ADR-001, ADR-008, ADR-009
