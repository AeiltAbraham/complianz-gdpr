# 001 — Settings-screen frame design note (Stage-H section 1b)

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 1b of the frame work: **the settings-screen frame** |
| Produced by | T-046 |
| Status | Migrating autonomously (maintainer: "kick off section 1b, go autonomous", 2026-10-12) |
| Serves | C-2, DB-07, DB-08; Stage-H section 1b |
| Related | shell.md / shell-preview.html (the G3-approved card/footer look this reuses), wizard-fields.md (section 1), ADR-001, ADR-004, ADR-005, ADR-007 |

## 1. What this is + why no separate sign-off gate

`Settings.js` is the single generic renderer for **every** non-dashboard screen (wizard, banner,
integrations, tools, documents…), so `SettingsGroup.js` (the card) and `Help.js` (the sidebar)
restyle all of them. This section migrates that frame.

The per-section C-2 policy normally wants a fresh preview. Here the maintainer said **"go
autonomous"**, and that is sound because the frame is **~90% already approved at gate G3** — the
shell preview mocked the card (header/body/sticky footer + Save/Back), the scroll-progress bar,
the radio-card group and the in-app notice, all on the approved tokens — and the **token delta is
zero** (everything reuses the 21 G3 + 8 section-1 tokens). So this is execution of an approved
design, not a new one. The three small unmocked elements default to preserving the legacy look
(§3) and are **flagged in the T-046 report for veto**; none introduces new design language or a
new token.

## 2. Scope

**IN:** `SettingsGroup.js` (card: header/controls/content/intro + the premium-lock overlay),
`Settings.js` (two-column body, sticky footer save/nav bar + upsell bar + scroll-progress, help
sidebar, confetti position), `Help.js` (help-notice accordion), and `Placeholder/SettingsPlaceholder.js`
(the matching loading skeleton — migrated so the loading→loaded transition doesn't flash, and so
the two relocated content-body override rules can be retired).

**OUT (later slices), with rationale:**
- The `.cmplz-grid-item*` **base card family** in `legacy-globals.scss` (bg/shadow/radius/layout) —
  shared with the still-legacy Dashboard `GridBlock` + `PagePlaceholder`, so it **stays** (deleted
  in the Dashboard section / Phase 5). The migrated card layers `tw-` utilities (1,1,0, win over the
  `:where(.cmplz)` 0,1,0 base and the `wizard.scss` 0,3,0 overrides) on top of it.
- `wizard.scss`'s `.cmplz-cookiebanner-preview-controls` block → **consent-banner section**;
  relocated out of `wizard.scss`, not migrated here.
- The still-legacy composite bodies (finish/plugins_overview/documents_menu/cookiedatabase_sync/
  create-documents/cookie_scan), the `Panel.js` accordion, and the `.cmplz-task-status.cmplz-premium`
  pill SCSS (progress.scss) — their own slices.

## 3. The three unmocked choices (defaults applied; flagged for veto)

1. **Locked-overlay scrim** — port the legacy `rgba(255,255,255,0.8)` wash as a literal (zero new
   token, preserves today's look); overlay card = `--cmplz-surface` + `--cmplz-shadow` + radius +
   space padding; `--cmplz-z-overlay` (30, already documented for exactly this). **No backdrop blur**
   (none in legacy/preview).
2. **Footer "Get Premium" upsell CTA** — reuse the approved **secondary/tertiary button** look
   (matches the legacy `button button-default` emphasis and the migrated Back button), not the
   Header's prominent black Go-Pro button.
3. **Help-notice callout** — reuse the approved status-surface **tint fills** (`--cmplz-accent-subtle`
   for the default/info label, `--cmplz-warning-surface` for `warning`), matching the legacy
   faded-fill semantics (keep the default-tint fallback for unknown labels); help-control link =
   `--cmplz-accent-strong`.

## 4. Marker discipline (ADR-001)

**No `data-cmplz-ui`** on the card, the two-column body, or the help sidebar — each wraps unmigrated
composite bodies, the `Panel.js` accordion, the legacy `.cmplz-locked` overlay, and DOMPurify-
sanitized intro/help HTML. The frame gets its look from `tw-` utilities (scoped by the `important:`
config, 1,1,0) + token refs **with literal fallbacks**, exactly as the section-1 field row did.
`.cmplz-locked` is multi-consumer (SettingsGroup + still-legacy SecurityMeasures/
CreateProcessingAgreements/CreateDataBreachReport render their own), so its overlay look is `tw-` +
fallback, never under a marker.

## 5. ADR-005 SCSS retirement

- **`wizard/notice.scss` → DELETE** (only consumers are Help.js + the Settings.js sidebar, both
  migrated here); drop its `@import`.
- **`wizard.scss`**: migrate the frame rules to `tw-`; **relocate** the still-consumed parts
  (`.cmplz-wizard-settings`/`.cmplz-locked` — still used by `SettingsPlaceholder` and the composite
  bodies' own locks) and the `.cmplz-cookiebanner-preview-controls` block (consent-banner) to
  `legacy-globals.scss`; **delete** only the last-consumed `-footer-container`/`-scroll-progress*`/
  `-buttons`/`-upsell-bar`/`.cmplz-confetti` rules. The `@import` stays only if a relocated block
  remains there; otherwise drop it (no dangling).
- **`legacy-globals.scss` grid-item family** (206-331) and the shared `-footer` base **stay**
  (Dashboard/PagePlaceholder). The T-045 wizard-div `.cmplz-grid-item-content` override + `.cmplz-
  settings-block-intro` (453-469) **delete** iff SettingsPlaceholder is migrated off them (it is, here).
- Drop grep-verified dead rules: `.cmplz-grid-item-title`, `.cmplz-grid-item.no-background`,
  `.cmplz-progress-status`, `.cmplz-help-title`.

## 6. Preserve exactly (behavior)

Premium-lock gating (two overlay variants: premium-upgrade + banner-not-loaded; `cmplz-disabled`
min-height so content shows behind); nav logic (Save vs Continue via `saveButtonsRequired()`, the
Finish-only-on-wizard + confetti + hash + 2s timeout, smooth scroll-to-top on Previous/Save);
ScrollProgress (5–100% clamp, null when not scrollable); `toggleNotices` expand/collapse; the
DOMPurify sanitized intro/help HTML (+ nosemgrep comments); the last-card/footer corner-merge
(`nth-last-of-type(2)`); the `.cmplz-column-2` two-col span + its ≤1080px (below `md`) collapse to
match Page.js's content grid.

## 7. Re-baseline + axe

Reset-DB re-baseline of the affected screens (every settings screen). Evaluate axe gating —
likely still no `MIGRATED_SCREENS` addition, since the composite bodies + `Panel.js` accordion
inside the card remain legacy (no whole-page body is clean yet).

## 8. Post-review adjustments (T-046, 2026-10-13)

The pre-push adversarial review (5 dimensions, each finding verified) confirmed 11 findings (4
distinct). Fixes applied before push; none introduces new design or tokens:

- **≤1080 collapse (HIGH, reversed).** The body used `tw-col-span-1 md:tw-col-span-2` — span-1
  (a ~1/4-width sliver) below 1080 instead of the legacy full width. Fixed to
  `tw-col-span-4 md:tw-col-span-2` in `Settings.js` and `SettingsPlaceholder.js` (span-2 at ≥1080,
  full-width-row below, = legacy `.cmplz-column-2` `@media(max-width:1080){span 4}`). The full
  single-column reflow of Page.js's content grid stays deferred to the shell/Page.js.
- **`.cmplz-grid-item.no-background` (HIGH, wrongly deleted).** It is NOT dead — the dashboard
  `other-plugins` block sets it via `blocks.php` (rendered by the still-legacy `GridBlock`); a
  JS-scoped grep missed the PHP config. Restored in `legacy-globals.scss`; deletion deferred to the
  Dashboard section. (`.cmplz-grid-item-title` deletion kept — genuinely dead.)
- **Lock scrim over the sticky footer (MEDIUM).** The scrim `--cmplz-z-overlay` (30) leaked to the
  body context and painted over + click-blocked the sticky footer `--cmplz-z-sticky` (20). Fixed by
  adding `tw-isolate` to the card (contains the scrim's z within the card; the card sits at z-auto
  in the body, below the footer — restoring legacy footer-above-lock).
- **Save double-primary (LOW, flagged for veto → fixed).** Both Save and Save-and-Continue rendered
  primary blue; legacy Save was secondary. Save now uses the tertiary look, restoring one primary
  forward action. (Still veto-able if you want Save primary.)
- **Help-notice summary size (nit).** Restored the slightly larger header size (`--cmplz-font-size`)
  vs the body's `-sm`.

**Deferred (noted, not fixed):** the 0.2s card content fade-in (decorative, not in §6; would need a
global keyframe) and the lock-overlay clipping of a 3+-line license message under the card's
`overflow-hidden` (a premium edge case; field dropdowns are unaffected — SelectInput/Combobox
portal). The three §3 defaults (scrim / Get-Premium tertiary / help-notice tints) stand.
