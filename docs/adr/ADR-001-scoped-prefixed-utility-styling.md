# ADR-001: Scoped, prefixed utility styling for the settings app

## Status

Accepted

Source: input technical spec (draft 2026-10-01), project premise (no single D-number), §1, §3.2, §4.1, §4.4, §4.5. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

Not accepted yet, so not part of this decision: the Tailwind version (D1, Open) and with it the Node version for the build (D7, Open; v4 needs Node 20 or later); the utility prefix `tw` (D2, Proposed); the exact scope-selector syntax (proposed: `:is(#complianz, #complianz-portal)`) and the placement of the portal host (proposed: inside `#complianz`, fallback: end of `body`). These are Phase 0 outputs (Spike S1 settles the version, the selector and the placement) and will get their own ADR.

## Context

The settings app in `settings/src` is styled by two SCSS systems: the global admin SCSS under `assets/css/admin/` (compiled into `assets/css/admin.css`) and per-component SCSS inside `settings/src` (§3.2). Scoping is partial: next to rules under `.cmplz`/`#complianz`, the legacy CSS ships unscoped `.cmplz-*` rules, global element and WordPress-class rules (`button { all: unset; }`, restyled `.button`) and unscoped third-party selectors such as `[data-radix-popper-content-wrapper]`, which reach wp-admin chrome and other plugins' poppers on Complianz screens. In the other direction, wp-admin's unlayered element styles (`forms.css`, `common.css`) bleed into the app. The banner preview injects the real frontend banner into `#complianz` without an iframe or shadow root, and Radix portals render to `document.body` unless given a container (§3.4). Legacy SCSS and the new styling have to coexist until Phase 5.

## Decision

We style everything authored in `settings/src` with Tailwind utilities that are prefixed and scoped to `#complianz` plus a PHP-rendered portal host, emit no global Preflight, and add a scoped base that applies only inside `data-cmplz-ui` subtrees at specificity 1,0,0 (above wp-admin core CSS, below utilities) and never inside `data-cmplz-isolate` zones (the banner preview and retained third-party widgets).

## Alternatives considered

- **Status quo** (two SCSS systems, partial scoping, global rules; §3.2): lost because its rules leak onto wp-admin and other plugins' markup, and wp-admin's form styles leak into the app.
- **Global Preflight, or unscoped or unprefixed utilities**: lost because Preflight would restyle all of wp-admin, unscoped utilities would apply anywhere on the page and, at 0,1,0, lose to wp-admin element rules such as `input[type=text]` (0,1,1), and unprefixed classes collide with WordPress core classes (`.hidden`, `.button`, `.notice`, `.container`) and legacy `cmplz-*` classes (§4.1).
- **No base, or a zero-specificity base** (`:where(#complianz p)`, 0,0,0): lost because utilities assume Preflight's resets (in v3, `border` relies on Preflight's `border-style: solid`) and wp-admin's `forms.css` (e.g. `input[type=text]`, 0,1,1) would beat such a base (§4.1).
- **A base over the whole app from the start**: lost because at 1,0,0 it beats most legacy SCSS (`.cmplz …`, `.cmplz-*`, `button.button`) and would break unmigrated screens during coexistence (§4.1).

## Consequences

- wp-admin, other plugins' screens and the banner preview are protected by construction (goal G5). Enforced by FR-001, FR-002, FR-003, FR-005, FR-006 and FR-007 of the input spec; Spike S1 must show zero difference on an unmigrated legacy screen and on every isolated zone with the base loaded.
- Specificity becomes part of the contract: base rules are the scope ID plus `:where(…)` (1,0,0), utilities are the scope selector plus a class (1,1,0), and the isolate exclusion must sit inside `:where()`, because a `:not()` outside it would lift the base above the utilities. If S1 picks cascade layers instead, it must prove the same order against unlayered wp-admin CSS.
- PHP renders the mount markup: `#complianz` holds `#complianz-app` (the React root, so `createRoot` moves off `#complianz`) and `#complianz-portal` > `#complianz-portal-root[data-cmplz-ui]`; the unused `#complianz-modal` (`settings/settings.php:409`) goes. No utility class is placed on `#complianz` or `#complianz-portal`; the root typography is one rule on both inner wrappers (FR-003).
- Every overlay mounts in the portal inner wrapper through a shared `PortalContainer` (FR-004). CKEditor's body-level `.ck-body-wrapper` overrides are the one documented unscoped exception, and the WP media modal stays out of scope (§4.4).
- Harder: until Phase 5 every migrated root element must carry `data-cmplz-ui` (then the marker moves to `#complianz-app-root`), and every retained widget needs a `data-cmplz-isolate` wrapper plus a row in the §4.1 zone table (`preview`, `ckeditor`, `ace`, `date-range`, `data-table`, `color-picker`, `shepherd`, `toastify`).
- Harder: Tailwind sees only complete literal class names, so classes supplied by PHP or built by concatenation (the `cmplz_blocks` `'class'` key, `settings/src/Dashboard/GridBlock.js:39`) must become whitelisted mappings (§4.3.4, §4.3.5, FR-020, FR-024).
- Harder: adding `settings/postcss.config.js` makes wp-scripts drop its default PostCSS options, so `@wordpress/postcss-plugins-preset` and production `cssnano` must be re-added (§3.4, §11).
- The only unscoped CSS left is `settings/src/styles/page.css` (hiding other plugins' notices, the mount-point offset; §4.7). All CSS ships in one entry stylesheet, `build/index.css`, enqueued on `admin_enqueue_scripts` for the settings page only (FR-016, FR-017).

Related: ADR-002, ADR-004, ADR-005, ADR-007, ADR-008, ADR-009
