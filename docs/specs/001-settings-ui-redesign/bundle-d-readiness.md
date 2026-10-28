# Bundle D readiness — Phase-5 Wave-2 legacy-CSS removal (pre-flight)

**Pre-flight date:** 2026-10-22. **Tree:** `7b876a7e` (post-H.9, **PRE-marker-move**). The
in-app DEAD/LIVE classifications below are **PROVISIONAL** — the ADR-001 marker move (in flight on
`stage-h5-part2-marker-move`) changes which legacy rules are dead. **Re-run the `legacy-globals.scss`
consumer map against the post-marker-move tree before executing Bundle D.**

## Headline — Bundle D is NOT a simple delete

`admin.css` (handle `complianz-admin`, enqueued in `settings/class-admin.php:210-218` on **every**
`complianz`-hook admin page, **unscoped**) is the runtime delivery vehicle for ~20 still-live
`legacy-globals.scss` rules **and** the `--cmplz-legacy-grey-*` tokens that `ColorPicker.scss`
consumes. De-enqueuing or deleting before those survivors are relocated/migrated **drops real pixels**.

## Ready NOW (stable, marker-move-independent)

1. **Retire the gulp admin target** — `gulpfile.js`: remove `buildCssAdmin` (:105) + `buildCssAdminRtlExpanded`
   (:128) from the `buildCssAll` series (:64), the `exports['build:css:admin']` (:136), and the admin.scss
   watch (:20). **Sequence** with the de-enqueue so a fresh build never references a gone handle.
2. **FR-017** — 74 tracked `*.css` chunk files in `settings/build` (e.g. `567.css`, `952.css`, `1030.css`
   ship stale pre-rename `--rsp-grey-*`). Switch webpack MiniCssExtract/inline so CSS ships inside the JS
   bundle / `index.css`. Verify ColorPicker + all component CSS still ship after the change.

## BLOCKERS (clear before the delete / de-enqueue)

### B1 — ColorPicker legacy-token dependency (the cross-bundle surprise)
`settings/src/Settings/ColorPicker/ColorPicker.scss:10,30` consume `var(--cmplz-legacy-grey-400)` /
`var(--cmplz-legacy-grey-300)`, whose **only** source is `variables.scss :root` (68-69), delivered at
runtime by `admin.css`. This single consumer blocks **both** the `admin.css` de-enqueue **and** the
`variables.scss` delete — and the **marker move will NOT clear it** (ColorPicker isn't in the migrate
list). **Fix:** swap the 2 refs to a semantic `settings/src/styles` token or the resolved literals
(`#c6c6c6` / `#ededed`); re-baseline ColorPicker shots.

### B2 — ~20 shared `legacy-globals.scss` rules with live in-app consumers (no tw- reproduction)
Highest blast radius: **`.cmplz-icon` / `.cmplz-icon-loading` + `@keyframes spin` / `.cmplz-click-animation`**
(:691) — `Icon.js:561/572` renders `cmplz-icon` **app-wide**; every `name=loading` spinner (Service.js:285,
CookieScanControl.js:194, CookieBannerControls.js:129, Onboarding/Button.js:76) needs it. Plus ~17 more,
each the **sole** styling source with live raw consumers:
`.cmplz-input-group` (:106), `.cmplz-grid*` (:175/:188), `.cmplz-legend`/`.cmplz-flex-push-*` (:271),
`.cmplz-header-container` (:308), `.cmplz-loading-container` (:338), `.cmplz-field-button` (:409),
`.cmplz-error-text` (:436), `.cmplz-comment` (:448), `.cmplz-license*` (:453), `.cmplz-locked`/`-overlay`
(:478), `.cmplz-task-status` pills (:523), `.cmplz-hidden` (:567 — SOLE admin def: PreloadFields.js:24,
CookieBannerPreview.js:313/320), `.cmplz-integrations-placeholder` (:579), `.cmplz-table-header` (:587,
~12 consumers), `.cmplz-settings-overlay` (:600), `.cmplz-panel__list` (:739 — also a `visual.spec` mask
hook, class must stay), `.cmplz-suggested-plugin` (:754).
**Each must be migrated into its component OR relocated to the surviving settings style handle
(`index.css`, app-scoped) BEFORE `legacy-globals.scss` is deleted.**

### B3 — wp-admin-global button rules (ADR-005 screenshot subjects)
`button { all: unset }` (:11) and `a.button, button.button, input.button {…}` + BEM
`--primary/--secondary/--tertiary/--error` (:31) are **unscoped** → they reset wp-admin's own buttons
incl. the `wp.media` media-modal (Select / Insert / Cancel). **Capture before/after wp-admin + media-modal
screenshots; relocate the in-app modifiers scoped under the app root.** The in-app `--*` modifiers are
consumed only by `Inputs/Button.js:115` (the dead `link` variant the marker move deletes).

## CI gate gap (flag)
`.agent/gate.json:7` token-hygiene scan covers only `settings/src/components` + `settings/src/styles`, so
ColorPicker's `--cmplz-legacy-` usage (in `settings/src/Settings/ColorPicker/`) passes CI **green** despite
being a real blocker. **Bundle D must assert the WHOLE `settings/src` grep**, not the gate's narrower one —
and consider widening the gate.

## Grep status (2026-10-22, tree 7b876a7e)
- `grep -rn -- '--cmplz-legacy-' settings/src` → **2 hits** (ColorPicker.scss:10,30) — blocks `variables.scss` delete.
- `grep -rn -- '--rsp-' settings/src` → **empty**.
- `variables.scss` deletable now? **No** (B1).

## admin.scss @import graph
`variables.scss` (:28) → … → `legacy-globals.scss` (:178). **TBD:** the dedicated ADR-005 finder returned a
stub this run — re-verify the complete `admin.scss` @import list + the premium `cmplz_blocks` preservation
set (bullets/new-features/other-plugins, kept in H5 Part 1, dashboard.md:28) before executing.

## Sequencing
marker move merges → **re-run the consumer map on the post-move tree** → clear **B1** (ColorPicker token
swap) + **B2** (relocate/migrate the ~20 shared rules) + **B3** (relocate wp-admin globals + screenshots)
→ drop the enqueue + the `complianz-admin` dep (one change) → retire gulp + FR-017 → delete
`legacy-globals.scss`, then `variables.scss` once the grep is empty → full e2e + wp-admin/media-modal
before/after → **Bundle F release**.
