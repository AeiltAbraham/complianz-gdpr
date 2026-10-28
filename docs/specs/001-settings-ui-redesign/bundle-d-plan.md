# Bundle D execution plan (post-marker-move)

**Scoped against the merged post-move tree** (HEAD `77171c7d`, #17 marker move + #18 ColorPicker merged).
Supersedes the pre-move `bundle-d-readiness.md` where they differ. The marker move killed **zero** B2
chrome rules (base.css B1–B5 only supply reset/typography/button-reset), so all B2 chrome stays LIVE and
must be re-homed before `legacy-globals.scss` can go.

## Relocation target
A new **`settings/src/styles/components.css`**, `@import`ed into `settings/src/styles/tailwind.css` **after**
`@import './base.css';`, every selector **island-scoped under `[data-cmplz-ui]`** (the one `#complianz-app`
marker now covers the whole app). postcss-import folds it into `settings/build/index.css`, which ships via the
surviving `cmplz-settings` handle (`settings/settings.php:415`). Document-global (outside islands) → `page.css`.

## B2 — the ~18 chrome survivors (AGENT B2, the bulk)
**RELOCATE (verbatim, island-scoped → components.css):**
- `.cmplz-icon` / `.cmplz-icon-loading` / `@keyframes spin` / `.cmplz-click-animation` **+ fold in** the
  in-button spinner rule `button.button .cmplz-icon.cmplz-icon-loading` (~:717) so the button-in-progress case
  survives the B3 button-block delete. (Highest blast radius — shared `Icon.js:561,572`, ~10+ files.)
- `.cmplz-input-group` (8 bare input primitives + Integrations/Urls.js)
- `.cmplz-grid` + `.cmplz-grid-item` family (drop now-redundant `box-sizing`; Dashboard not migrated here)
- `.cmplz-legend` / `.cmplz-flex-push-right` / `-left` (Dashboard footers; nested in grid-item-footer scope)
- `#complianz div[class^=cmplz-wizard-]` block (~:409) — `.cmplz-field-button` + @wordpress toggle tweaks
- `.cmplz-locked` / `.cmplz-locked-overlay` — **VERBATIM** (migrating to the C-2 scrim is a visual change → out of scope; judgment call, default = relocate)
- `.cmplz-task-status` pill + variants — **preserve** the `.cmplz-warning` colour gap as-is (no behaviour change)
- `.cmplz-panel__list` (keep the class as a visual.spec mask hook) + `.cmplz-suggested-plugin` + `.cmplz-settings-overlay`

**MIGRATE (inline into the component as tw-/token, then drop the legacy rule):**
- `.cmplz-header-container` → `PagePlaceholder.js:35` (sole consumer)
- `.cmplz-loading-container` → `Statistics.js:90`
- `.cmplz-error-text` → `CreateProcessingAgreements.js:208` (pattern: AceEditorControl.js:54)
- `.cmplz-comment` → `PlaceholderPreview.js:23` + `Cookiedatabase/Service.js:288` (add `tw-italic`)
- `.cmplz-license` block → `License.js:51,63` (scoped under `.cmplz-license`, Dashboard TaskElement unaffected)
- `.cmplz-integrations-placeholder` → `DatarequestsControl.js:29` + `ServicesControl.js:258`

**Keep in JSX (mask hooks, never remove the class):** `.cmplz-panel__list`, `.cmplz-progress-bar`.
**Verify (judgment #3):** `.cmplz-hidden` is toggled via classList on CookieBannerPreview's docElement
(`CookieBannerPreview.js:313,320`) — confirm that element sits under `#complianz`; if so relocate island-scoped,
else keep a standalone unscoped rule so the runtime toggle still works.

B2 moves the rules OUT of `legacy-globals.scss` (into components.css / the component) but does **not** delete
the file or touch enqueue/gulp — that's teardown. B2 re-baselines the affected screens (should be ~zero-drift;
rules now served from index.css instead of admin.css) and opens its own PR.

## B3 + teardown (AGENT B3, small/mechanical — gated on the premium decision)
**B3 button block → DELETE entirely, zero relocation** (`legacy-globals.scss:11,16,31,40`): the in-app role is
already in `components/ui/Button.js` + base.css:23 B4 `[data-cmplz-ui] button`; the rules are purely additive
leakage over wp-core buttons.css, so removal **restores native wp-admin rendering**. Cross-area gates before
the delete: (a) confirm `shepherd.css` tour-footer re-theme is self-sufficient without `button{all:unset}`
(Tour.js:42, document.body) + capture a tour-popover before/after; (b) the in-button spinner rule is folded
into the relocated `.cmplz-icon` by B2.

**De-enqueue — STEP 1 then STEP 2, never reversed:**
1. `class-admin.php:218` — remove the `wp_enqueue_style('complianz-admin', …)` + its enclosing `enqueue_assets()`
   body + the `add_action` hooking it. (The `settings.php:414` guard then yields `array()`; index.css still wins.)
2. `settings/settings.php:414` — set `$deps = array('wp-components')` (NOT `array()` — **corrected 2026-10-23**). ⚠️ **wp-components landmine:** `admin.css` is the *sole* enqueuer of WP's `wp-components` stylesheet, which `cmplz-settings` inherits transitively; the still-legacy `CheckboxControl` toggle (checkbox field) + `Password.js` render raw `.components-*` markup with no C-2 reproduction. Collapsing to `array()` would drop `wp-components` and break them app-wide. Keeping `wp-components` as the entry-CSS dep is zero-drift (maintainer decision 2026-10-23). The `.cmplz input` global is **relocated** to components.css (not deleted) for the same reason (Password's `.components-text-control__input` may layer it).

**Deletion order (each precondition stated):** B2 re-home ✓ → enqueue STEP 1→2 → **retire gulp admin target**
(`gulpfile.js`: `buildCssAdmin` from series :64, `buildCssAdminRtlExpanded` :129, `exports['build:css:admin']`
:136, watch :20 — AFTER enqueue STEP 1, else `filemtime()` 404s) → **[premium re-home per judgment #1]** →
delete compiled `admin*.css` + `rtl/admin*.css` → delete `legacy-globals.scss` (re-grep every class across
JS+PHP+e2e+dynamic classnames first) → delete `variables.scss` (preconditions: `--cmplz-legacy-`/`--rsp-`
greps = 0 over settings/src **✓ verified**, no PHP/cookiebanner/document consumer, admin.scss:28 @import removed,
premium re-homed) → **FR-017** (switch webpack so no code-split `*.css` chunks ship; delete the 74 tracked
`settings/build/*.css`).

## ADR-005 before/after screenshots (complianz-page surfaces only)
- **media-modal** via the banner-logo upload on the settings page (`BannerLogoControl.js:52` → wp.media) — Select/Insert/Cancel/Upload
- admin notices (incl. the dismiss `×`) on a complianz page
- Screen Options / Help toggles (`button#show-settings-link.button`)
- adminbar button controls on a complianz page
- shepherd tour popover footer (document.body) — confirms shepherd.css re-theme self-sufficiency
- **EXCLUDED** (correction to readiness doc): the standalone Plugins page — admin.css does **not** enqueue there (`strpos($hook,'complianz')`).

## Verification
Full 4-project reset-DB e2e (no regressions on migrated/relocated bodies; mask-hook locators resolve) · the
ADR-005 before/after set · whole-`settings/src` `--cmplz-legacy-`/`--rsp-` greps = 0 (+ extend to
cookiebanner/document/PHP before deleting variables.scss) · per-class consumer grep before each stylesheet
delete · fresh `npm run build` → index.css still carries all component CSS incl. ColorPicker, no `*.css` chunk ·
commit gate (php -l + phpcs-changed-lines on the 2 PHP edits).

## Decomposition
**AGENT B2** (≈60%, ~20 React files) — relocate/migrate, re-baseline, PR. Independent of the premium decision; **start now.**
**AGENT B3 + teardown** (≈25%, mechanical) — B3 delete + enqueue + gulp + compiled/legacy-globals/variables deletes + FR-017. **Gated** on B2 landing + the premium decision.
**PREMIUM re-home** (≈15%, the critical blocker for the variables.scss delete) — judgment #1.

## Judgment calls
1. **DECIDED 2026-10-22 → option (a): slim premium-only stylesheet.** The teardown agent compiles ONLY
   `bullets`/`new-features`/`other-plugins` + the handful of tokens they use into a dedicated small stylesheet
   (e.g. `premium.scss`) under its own handle on complianz pages (trimmed gulp target). Bundle D retires the
   MAIN-APP `admin.css` + deletes `legacy-globals.scss`. **Prefer inlining those few tokens into the premium
   stylesheet so `variables.scss` can be fully deleted in Bundle D too**; if the token set is large, keep a
   minimal `variables` subset and make the full `variables.scss` deletion a thin follow-up. ORIGINAL options:
   The premium `cmplz_blocks` set (`bullets.scss`/`new-features.scss`/`other-plugins.scss`)
   is `#complianz`-scoped, consumes `variables.scss --cmplz-legacy-*` tokens, and `admin.css` is its **only** delivery
   vehicle — de-enqueuing admin.css drops both their tokens and their stylesheet. This blocks fully retiring admin.css
   + deleting variables.scss. **Options:** (a) slim premium-only stylesheet (only those 3 modules + needed tokens, own
   handle, trimmed gulp) — Bundle D retires main-app admin.css + deletes legacy-globals now; full admin.css/variables.scss
   deletion is a thin follow-up [**recommended**]; (b) fold the 3 modules + tokens into index.css under `#complianz` scope;
   (c) defer admin.css retirement — Bundle D deletes only legacy-globals.scss. No live FREE renderer emits these classes,
   but they may back PREMIUM blocks (blocks.php:72), so they can't just be dropped.
2. `.cmplz-locked` → relocate verbatim (default; migrating is a visual change, out of CSS-removal scope).
3. `.cmplz-hidden` → verify under `#complianz` (relocate island-scoped) vs detached preview doc (standalone rule).
4. `.cmplz-task-status .cmplz-warning` colourless variant → preserve the gap (no behaviour change).
5. wp-admin chrome after B3 delete → expect/accept native wp-core restoration; gate on the ADR-005 shots.
