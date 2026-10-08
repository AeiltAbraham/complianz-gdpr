# ADR-014: Tailwind v3.4, the scope selector, the scoped base and the portal host

## Status

Accepted

Source: Spike S1 (`docs/specs/001-settings-ui-redesign/spikes/s1.md`), task T-014. Settles
D1 (Tailwind version), D2 (utility prefix + exact syntax), the scope-selector syntax, the
portal-host placement and the exact scoped-base rule list — the items ADR-001, ADR-007 and
ADR-009 left open. Recorded 2026-10-08.

## Context

ADR-001 chose scoped, prefixed, Preflight-less utility styling but deferred four things to
Spike S1: the Tailwind version (D1), the prefix syntax (D2), the exact scope selector and
the portal-host placement. ADR-007 and ADR-009 depend on those same choices. ADR-010 pins
Node 24, which runs both Tailwind v4 and v3.4, so the runtime (old D7) no longer constrains
the choice. The settings app mounts into PHP-rendered markup (`settings/settings.php:408`,
`<div id="complianz" class="cmplz">`; the unused `#complianz-modal` at line 409 goes) and
its CSS is enqueued on Complianz admin screens (`class-admin.php` `enqueue_assets`), where
it must coexist with wp-admin's **unlayered** `forms.css`/`common.css` and legacy
`admin.css` until Phase 5. S1 built both Tailwind versions and probed the cascade, the
specificity contract and portal stacking in a real browser.

## Decision

We adopt **Tailwind v3.4** with the class-prefix **`tw-`**, scope every utility and base
rule to **`:is(#complianz, #complianz-portal)`**, ship the scoped base at specificity
**1,0,0** (scope ID + `:where()`, matching only `data-cmplz-ui` subtrees and excluding
`data-cmplz-isolate` **inside** the `:where()`), and mount overlays into **`#complianz >
#complianz-portal > #complianz-portal-root[data-cmplz-ui]`** (a sibling of `#complianz-app`,
`z-index: 100001`), falling back to the end of `<body>` when a transform/filter/contain
ancestor would trap `position: fixed`.

## Alternatives considered

- **Tailwind v4**: lost because it emits utilities inside native `@layer utilities`, and
  unlayered wp-admin CSS beats any layered declaration regardless of specificity — S1's
  browser probe showed an identically-specific v4 utility (1,1,0) losing to `forms.css`
  (`padding-left` stayed 8px) while the v3 flat utility won (12px). Forcing it with
  `important: true` would then override the `data-cmplz-isolate` vendor CSS. v4 also ships a
  global `*,::before,::after,::backdrop{--tw-*}` rule and 21 global `@property` registrations
  (against FR-002 / ADR-001's "no global"), is ~1.9× the minified size for the same
  utilities, and is harder to scope cleanly (no `important:` scope hook; `@layer`/`@property`
  resist `postcss-prefix-selector`).
- **`tw:` variant-style prefix**: tied to v4, so rejected with it; v3 uses the `tw-`
  class-prefix (`hover:tw-bg-blue-700`).
- **Portal host as a descendant of `#complianz-app`**: lost because the app wrapper's
  off-canvas `translateX` (<1800px) creates a containing block that would trap Radix's
  `position: fixed` overlays; a sibling escapes it (verified).
- **Portal host always at end of `<body>`**: kept only as the fallback; the in-`#complianz`
  placement keeps overlays inside the style scope by default (so the scoped base/utilities
  apply) without an extra top-level node, and the scope selector already names
  `#complianz-portal` to cover the fallback.
- **Cascade layers for our own CSS / a `:not()` outside `:where()` for the isolate
  exclusion / a zero-specificity base**: all rejected per ADR-001, now with S1 evidence
  (layers lose to unlayered wp-admin; a `:not()` outside `:where()` lifts the base to 1,1,0
  over the utilities; a no/zero base loses to `forms.css` and breaks v3's `border` utility).

## Consequences

- **Version/prefix:** `tailwindcss` pins to 3.4.x with `prefix: 'tw-'` and
  `corePlugins.preflight: false`. Utilities read `tw-bg-blue-600`; variants precede the
  prefix (`hover:tw-bg-blue-700`, `focus:tw-ring-2`, `rtl:tw--scale-x-100`).
  `check-physical-utilities.js` (ADR-007 / T-016) strips the **`tw-`** prefix.
- **Scope:** scoping is applied with Tailwind's `important: ':is(#complianz,
  #complianz-portal)'`, which prefixes every utility to specificity 1,1,0 **without**
  `!important` (verified) and needs no extra plugin. The `:is()` is 1,0,0, so utilities beat
  `forms.css` (0,1,1) and legacy `.cmplz …`; the base (scope + `:where()`) is 1,0,0 — above
  wp-admin element rules, below utilities.
- **Scoped base rule list** (the minimal Preflight replacement; full text and the browser
  proof in s1.md): B1 box-sizing + border defaults on the subtree and its `::before/::after`;
  B2 root typography as one rule on `#complianz-app-root`/`#complianz-portal-root`; B3 form
  controls `font: inherit`; B4 button reset; B5 replaced-element defaults. Each uses the
  exclusion token `:not([data-cmplz-isolate] *):not([data-cmplz-isolate])` **inside**
  `:where()`.
- **Mount markup (PHP):** `#complianz` holds `#complianz-app` (React root) and a sibling
  `#complianz-portal > #complianz-portal-root[data-cmplz-ui]` at `z-index: 100001` with
  `isolation: isolate`; `#complianz-modal` is removed. A runtime guard appends
  `#complianz-portal` to `<body>` if an ancestor would trap `position: fixed`. z-index 100001
  clears the admin bar (99999) and the responsive admin menu (100000) and stays below the WP
  media modal (160000), which remains out of scope.
- **Overlays:** Radix Dialog/Popover/Tooltip (via a shared `PortalContainer` `container`
  prop) and react-shepherd mount into the scoped host and receive the base + utilities;
  react-toastify (z 9999) stacks within it. CKEditor's body-level `.ck-body-wrapper` panels
  are the one documented **unscoped** exception: raise their `--ck-z-*`/panel z-index to
  100002 so panels opened from an editor inside a dialog are not clipped (draft in s1.md).
- **Harder:** the scope prefix adds ~1.5 KB to the utility CSS (repeated `:is(#complianz,
  #complianz-portal)`, which cssnano does not dedupe); every migrated root carries
  `data-cmplz-ui` and every retained widget a `data-cmplz-isolate` wrapper (ADR-001 zone
  table); choosing v3.4 means living on a mature-but-frozen major (reversible on Node 24 if
  wp-admin ever adopts cascade layers).
- **Reconciliation (never editing ADR-001's Decision):** S1 confirms ADR-001's Decision and
  specificity contract in full; this ADR records the concrete version, prefix, selector,
  base list and portal placement that ADR-001 deferred. ADR-007's logical utilities are
  confirmed present in v3.4 and its check strips `tw-`; ADR-009's zone prefix uses this scope
  selector, with the `postcss-prefix-selector` + `postcss-rtlcss` composition left to Spike
  S2 (T-016), now unblocked. No S1 finding overturns ADR-001, ADR-007 or ADR-009.

Related: ADR-001, ADR-005, ADR-007, ADR-009, ADR-010
