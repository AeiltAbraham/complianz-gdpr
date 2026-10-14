# 001 — Consent banner design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 3 of 7: **Consent banner** (the preview chrome + the ADR-008 preview.css) |
| Produced by | T-049 (this note + `consent-banner-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (the box at the end) |
| Serves | C-2, DB-06, DB-07, DB-08; Stage-H Consent-banner gate |
| Related | ADR-008 (banner-preview fidelity, Accepted — this section IMPLEMENTS it), ADR-007 §27, ADR-001, ADR-004, ADR-005, ADR-009 |

## 1. What this is — one small reserved gate

The banner SETTINGS screens (general/texts/colors/appearance/custom-css) are ordinary field
screens and are **already migrated** (sections 1 + 1b). What remains for this section is:

1. **the preview CHROME** — the switcher controls + reset + logo-preview box around the live banner;
2. **the ADR-008 `vendors/preview.css`** — pins the isolate-zone so the live banner stays faithful.

Only **one** maintainer sign-off is needed: the **controls-chrome look** (§3), with a **zero-new-token**
confirmation folded in. **ADR-008 is already Accepted**, so `preview.css` implements it — the pinned
typography literals and the `[dir="rtl"]` exception are code-review items, not a gate. Nothing migrates
(T-050) until the box in §7 is ticked.

## 2. Scope

**IN:**
- **Chrome → tw-** (markerless-safe; reuses the approved tokens): `CookieBannerControls.js` (the two
  segmented switcher groups — A/B banners + consent types — with active/inactive/loading states),
  `ResetBannerButton.js` (reuse the tertiary/Button look), `BannerLogoControl.js` (the `.cmplz-logo-preview`
  dashed box; **keep the `.cmplz-logo-preview`/`.cmplz-clickable` class hooks** — e2e isolation.spec:291),
  and the `.cmplz-grid.cmplz-banner { margin-bottom: 200px }` save-clearance (→ a tw- utility on the banner grid).
- **`settings/src/styles/vendors/preview.css`** (NEW, created this section — §4), wired into the CSS entry
  chain (`@import` in `tailwind.css` after `base.css`) and added to the CI stylelint file list (checks.yml:79).
- **Marker:** add `data-cmplz-isolate="preview"` to `#cmplz-preview-banner-container` (CookieBannerPreview.js:460);
  remove the `data-cmplz-isolate="banner-controls"` wrapper (Menu.js:72) once the controls migrate.
- **ADR-005:** delete `modules/CookieBannerPreview.scss` (positioning → preview.css; chrome → tw-; the stale
  controls sub-block is dead) + drop its `@import`; delete the relocated `.cmplz-cookiebanner-preview-controls`
  block from `legacy-globals.scss` (last consumer migrated). Keep `.cmplz-hidden` (shared).

**OUT (Phase 5 / stays):**
- **The injected banner mockup itself** — held **byte-identical** to its baseline (ADR-008). NOT redesigned,
  NOT given tw- classes. Its screenshots are **re-baselined in Phase 5** against the frontend banner — **this
  section does NOT re-baseline the `isolation.spec` preview shots** (they stay blocking + identical).
- The shared `.cmplz-grid-item*` base + `.cmplz-hidden` (Phase 5).

## 3. The controls-chrome design (the one sign-off)

`consent-banner-preview.html` renders the preview-sidebar controls on the approved tokens. The legacy
switcher is a grey/blue button group; the redesign makes it the **approved segmented control** (the same
pattern as the field segmented control / the active-nav tint): resting = `--cmplz-surface` with a
`--cmplz-border`; **active = `--cmplz-accent-subtle` tint + `--cmplz-accent-on-subtle` text** (AA-safe,
the section-1 pairing); hover = `--cmplz-surface-sunken`; loading = muted + a spinner. The reset button
reuses the **tertiary** button; the logo-preview keeps its dashed-box affordance on tokens.

**Zero new tokens** — the C-2 set covers all of it (surface/sunken/border/accent-subtle/accent-on-subtle/
text-muted + the 4px spacing + radius). No reserved token sign-off. No name collides with the frontend
banner's reserved `--cmplz-manage-consent-*` (and all other banner vars are underscore-form).

## 4. ADR-008 `vendors/preview.css` (implements the Accepted ADR — recorded, not a gate)

Created this section, scoped to `:is(#complianz, #complianz-portal) [data-cmplz-isolate="preview"]`:
- **Typography pinned** on the zone root as commented literals of the legacy `.cmplz` values (DB-06 — the
  one permitted preview-vs-frontend difference): `font-variant-numeric: tabular-nums; font-size: 0.8125rem;
  color: rgba(15,23,42,0.95); font-weight: 400; line-height: 1.5;` (legacy var names in comments only — the
  token-hygiene gate greps `settings/src/styles`, so literals, not `--cmplz-legacy-*`). `font-family`/
  `letter-spacing` are NOT pinned (not set on `.cmplz`; unchanged by the redesign).
- **Positioning relocated** from `CookieBannerPreview.scss` `#cmplz-cookiebanner-container` with logical
  properties (`inset-inline-*`/`inset-block-*`/`margin-inline-end`; keep `width` per the config exception),
  plus the `slideBannerIn` keyframes and the `@media (max-width: 1800px)` off-canvas blocks.
- **The one `[dir="rtl"]` exception** (ADR-007 §27): the `<1800px` off-canvas `translateX(calc(0.3 * var(
  --cmplz_banner_width)))` is physical; add an explicit `[dir="rtl"]` rule flipping the sign, carrying a
  `stylelint-disable` + written reason.
- **Why now:** `CookieBannerPreview.scss` is deleted in this PR (ADR-005), so the positioning needs a home;
  pinning the typography now holds the preview identical across Phase 5's legacy-base deletion.
- **Forward note:** when the ADR-009 vendor PostCSS pipeline lands (tables/date-range section), it must
  **exclude** `preview.css` (already hand-scoped + hand-RTL'd — re-prefixing would double it).

## 5. Marker discipline + behavior

The injected banner is shielded by `data-cmplz-isolate="preview"` (the base reset skips it — ADR-001), so
it keeps its frontend styling; the chrome migrates with tw- utilities (no `data-cmplz-ui` needed on the
switcher — it's leaf chrome, but may self-mark once fully tw-). Preserve: the consent-type + A/B switch
behavior (active/inactive/loading gating on `cssLoading`), the reset flow (`AreYouSureModal`), the logo
upload (`.cmplz-clickable` → WP media modal), the automatic banner-width correction, live re-render on
settings change, and the DOMPurify-sanitized logo HTML.

## 6. Migration plan (T-050, after sign-off)

1. Create `settings/src/styles/vendors/preview.css` (§4); add `data-cmplz-isolate="preview"` to the zone
   root; wire the `@import` in `tailwind.css`; add the file to `checks.yml:79` stylelint list.
2. Migrate `CookieBannerControls.js` (segmented look), `ResetBannerButton.js`, `BannerLogoControl.js`, and
   the `.cmplz-grid.cmplz-banner` save-clearance to tw- + token-literal fallbacks; remove the Menu.js:72
   `banner-controls` isolate wrapper.
3. ADR-005: delete `CookieBannerPreview.scss` + drop its `@import`; delete the relocated controls block from
   `legacy-globals.scss`. Grep ALL consumers (JS + PHP + e2e) before deleting (the T-046 lesson).
4. Re-baseline the controls-chrome screens ONLY (exclude the `isolation.spec` preview shots — Phase 5 owns
   them; they must stay identical). Evaluate axe gating (likely still deferred — the injected preview markup
   is unaudited; `#banner` waits for a scoped preview axe pass).

Adversarial review + CI-green under the implement → review → commit → push gate. The preview must render
**pixel-identical** in the isolate zone (verify the `isolation.spec` shots do not drift).

---

## 7. Sign-off

Consent-banner migration (T-050) starts only when this is approved.

- **Controls-chrome look (segmented control) + zero new tokens approved:** [x] — maintainer, 2026-10-14, AS PROPOSED (segmented switcher with the accent-subtle active tint; zero new tokens).

Consent-banner migration (T-050) authorized to run autonomously under the implement → adversarial-review → commit → push → CI-green gate.

Maintainer notes / requested changes:

```
Approved as-is; no requested changes. Proceed autonomously through T-050.
```
