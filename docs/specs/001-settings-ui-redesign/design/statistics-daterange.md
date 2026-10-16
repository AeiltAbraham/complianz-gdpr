# 001 — Statistics / DateRange design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 6 of 7: **Statistics / DateRange** (the ADR-009 vendor pipeline lands here) |
| Produced by | T-055 (this note + `statistics-daterange-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (the boxes at the end) |
| Serves | C-2, DB-11, DB-12; Stage-H Statistics/DateRange gate |
| Related | **ADR-009** (vendor CSS import + autoscope — this section **implements it for real**, §3), ADR-001 (isolate zones), ADR-004 (token hygiene), ADR-005, ADR-006 (build output not committed), ADR-007 |

## 1. What this is — the section the ADR-009 pipeline was deferred to

Data-tables (T-054) took "Option B" (a hand-authored overrides file, no pipeline) because the styled-components
data table had **no upstream stylesheet**. This section is different: **react-date-range ships an upstream
stylesheet**, so it is the first genuine consumer of the ADR-009 **postcss auto-scope pipeline**. The
investigation (`wf3nf52a2`) also corrected two premises:

- **The Statistics chart is premium-LOCKED in free** (menu `ab-testing`, both groups premium) — it mounts
  behind an 80%-white `.cmplz-locked` scrim with on-brand hardcoded bar colors. `readToken()` has **no
  verifiable consumer** (date-range themes via a CSS var; the chart's bars are on-brand literals).
- **The axe gate is vacuous unless the picker is opened** — the `.rdr*` calendar nodes only exist when the
  Radix Popover is open, and the current axe.spec/visual.spec never open it.

Reserved sign-offs (the boxes in §9): **G1** the **ADR-009 pipeline approach** (the big one); **G2** the
**readToken()/chart build-vs-defer** decision; **G3** the **DateRange picker look** (zero new tokens folded in).

## 2. Scope

**IN (this section):**
- **The ADR-009 postcss vendor pipeline** (§3) + **`settings/src/styles/vendors/date-range` vendor CSS**,
  replacing the 616-line legacy `assets/css/admin/modules/date-range.scss`.
- **`DateRange.js`** — pass react-date-range's `ariaLabels` prop (fixes the exempted button-name + select-name)
  + fix the latent `defaultStart/defaultEnd` undefined ref; the `.rdr*` calendar restyled on tokens (§7 look),
  the 2 color-contrast exemptions fixed to ≥4.5:1.
- **`StatisticsFeedback` notice** (`.cmplz-statistics-status`) → `tw-`, retiring the trivial 7-line
  `statistics.scss` (ADR-005).
- **axe**: add `#tools/data-requests` to `MIGRATED_SCREENS` **with an open-the-picker axe step** (else the
  gate is vacuous); remove the 4 now-fixed date-range exemption rows.

**OUT / deferred (grounded in §3/G2):**
- **The Statistics chart migration + `readToken()` + `createTheme`** — premium-locked, scrim-obscured, bars
  already on-brand; no verifiable free consumer (G2 recommends **defer**). The chart stays legacy; its
  recorded (non-gated) a11y findings stay recorded (status quo, not a regression).
- **`shepherd.scss`** → the **Onboarding/Tour** section (plan §5). **`toast/` (react-toastify)** is unassigned
  to any plan section — **flagged as an open scope question** (natural home: ride the new pipeline here, or
  Onboarding/Tour, or Phase 5). Not migrated here.
- The 3 premium screens' date range / records-of-consent export (premium/absent in free).

## 3. The ADR-009 pipeline approach (G1 — the big decision)

react-date-range HAS an upstream stylesheet (`react-date-range/dist/styles.css` + `theme/default.css`),
which is exactly the case ADR-009 §25 designed the **import + auto-scope** pipeline for (distinct from the
overrides-only data-table/CKEditor/Ace). Two paths:

| | **Path A — build the real pipeline** (RECOMMENDED, = ADR-009 §25) | **Path B — hand-author like data-table (Option B)** |
|---|---|---|
| vendor CSS | `date-range.src.css` `@import`s the 2 upstream files + our unscoped overrides → **postcss** (prefix-selector scopes to the zone + rtlcss) → generated `date-range.built.css` | hand-author a scoped token-literal `date-range.css` by porting the 616-line legacy hand-merge |
| upstream updates | re-import (automated) | re-merge 616 lines by hand (drift-prone) |
| deps | `postcss-prefix-selector@1.16.1` + `postcss-rtlcss@5.7.1` (+ `postcss-import`, build-time only) | none |
| reusable for toast/shepherd | **yes** | no (each hand-authored) |
| ADR-009 §25 | **honored** | **contradicted** (needs an ADR-009 refinement) |
| risk | the pipeline is net-new infra (build-ordering) | lower, but perpetuates a brittle hand-merge + abandons ADR-009's mechanism |

**Recommendation: Path A.** date-range is the case ADR-009's pipeline exists for; it replaces a drift-prone
616-line hand-merge with an automated import and builds the reusable pipeline (toast/shepherd reuse it). The
investigation resolved the S2-open mechanics:

- **Invocation:** a committed `settings/scripts/build-vendor-css.js` (a manifest `[{src, zone}]`, runs
  `postcss([postcss-import, prefix-selector({prefix, transform}), rtlcss])` per entry) + an npm
  `build:vendors` script **prepended** to `build` and `start` (`build:vendors && wp-scripts …`). Root
  `build:all` cascades unchanged.
- **Generated output (`*.built.css`) is GITIGNORED** and regenerated by `build:vendors` (ADR-006 — build
  output is never committed), source of truth = `date-range.src.css` + the script.
- **prefix:** `:is(#complianz, #complianz-portal) [data-cmplz-isolate="date-range"]`, with the S2 transform
  mapping `:root`/`html`/`body` → the zone element and preserving `@keyframes`; `postcss-rtlcss` emits in-file
  `[dir=rtl]`. **preview.css + data-table.css stay EXCLUDED** (hand-scoped already; not in the manifest).
- **stylelint:** lint `date-range.src.css` (our overrides, logical); **exclude** `date-range.built.css`
  (upstream physical props are exempt per ADR-009). Token gate: upstream has no `--cmplz-legacy-`/`--rsp-`
  names; our overrides use token literals + `date-range.scss` file:line refs (the data-table.css convention).

This **implements** the Accepted ADR-009 (no overturn; S1/S2 resolved its deps). If you prefer Path B, say so
and I'll record an ADR-009 refinement.

## 4. readToken() + the Statistics chart (G2 — build vs defer)

plan §5 attached "`readToken()` for chart.js" to this section, but the investigation shows it is **YAGNI**:
- date-range resolves its one token via a CSS var (`rangeColors={['var(--cmplz-accent-strong)']}`, inherited
  into the isolate zone) — **no readToken needed**.
- the chart's A/B bar colors are **data-driven on-brand literals** (`#2e8a37`/`#f4bf3e` ≈ success/warning),
  and the chart is **premium-locked + scrim-obscured** (code-review-only, unverifiable in free).

So `readToken()` would serve only optional chart-*chrome* theming (axis/legend/grid text) on an unverifiable
screen, and the chart is its **only** consumer feature-wide.

**Recommendation: DEFER readToken() + the chart migration** (keep the chart legacy; its bars are already
on-brand). This supersedes plan §5's "readToken here" with the investigation's finding. *Alternative:* build
`readToken()` + theme the chart chrome **code-review-only** (like T-054's 3 premium tables) — say so and I'll
include it. Either way `createTheme` is **not** built (never needed).

## 5. The scoped vendor CSS + a11y fixes (the date-range deliverable)

- `date-range.src.css` (committed) → `date-range.built.css` (generated) `@import`ed in `tailwind.css` after
  `data-table.css`; the `.rdr*` markup is in the markerless `data-cmplz-isolate="date-range"` zone (already on
  `DateRange.js`), tokens resolve by inheritance from the portal-host island.
- **a11y (the 4 exemptions become real fixes):** `ariaLabels` prop on `<DateRangePicker>` (prev/next/month/
  year/dateInput, translated) fixes **button-name** + **select-name**; the 2 **color-contrast**
  (`.rdrDateDisplayItem input` ~1.3:1, `.rdrStaticRangeLabel` ~1.29:1) fixed with `--cmplz-text`/`-muted` on
  `--cmplz-surface`/`-sunken` (≥4.5:1). Remove all 4 `axe.js` rows + reconcile `a11y-exemptions.md`.
- **Residual (documented, not gated):** a manual NVDA/VoiceOver pass on the day-grid keyboard nav/announcement
  (axe can't test it).

## 6. ADR-005 retirement + token hygiene

Delete `assets/css/admin/modules/date-range.scss` (+ drop `admin.scss` import + the dead `.MuiPopover-root`
rule) and `assets/css/admin/modules/statistics.scss` (migrate its one `.cmplz-statistics-status` rule to
`tw-`). Grep ALL consumers (JS + PHP + e2e) first (the T-046 lesson). `shepherd.scss` + `toast/` stay. **Zero
new tokens** — the C-2 set covers date-range (success/surface/border/text/accent-strong + the 4px grid; off-grid
10px/5px as literals). `tokens.css` byte-unchanged.

## 7. The DateRange picker look (G3)

`statistics-daterange-preview.html` shows the `.rdr*` calendar on tokens: selected range =
`--cmplz-accent-strong` fill + `--cmplz-text-on-accent`; in-range = `--cmplz-accent-subtle`; today dot =
`--cmplz-success`; month-nav arrows + weekday labels `--cmplz-text-muted`; date-display inputs on
`--cmplz-field-surface` with `--cmplz-field-border` (AA text); the preset list with an accent-subtle active
state; the trigger button on tokens. Plus the premium-locked statistics/chart state (context).

## 8. MIGRATED_SCREENS + re-baseline

- **axe:** add `#tools/data-requests` (net-new; proof-of-consent already gated). **Mandatory:** add a scoped
  axe step that **opens the picker** (`#cmplz-date-range-picker-open-button`) before analyze — otherwise the
  gate is vacuous (closed calendar = no `.rdr*` nodes). The premium ab-testing screen is axe-inert (locked) —
  not added.
- **Re-baseline** (admin + admin-rtl, 1440 + 768; non-blocking): only `#tools/data-requests` (the trigger-
  button chrome) changes in the standing baselines; the calendar interior is in no standing shot (the suite
  never opens the popover) — verified via the preview + an optional open-calendar screenshot.

## 9. Sign-off

Migration (T-056) starts only when **G1 + G2 + G3** are approved.

- **G1 — ADR-009 pipeline approach (Path A / Path B):** [ ] — maintainer, 2026-10-__, choice: __________
- **G2 — readToken()/chart (defer / build code-review-only):** [ ] — maintainer, 2026-10-__, choice: __________
- **G3 — DateRange picker look + zero new tokens:** [ ] — maintainer, 2026-10-__,
- **Open scope note — react-toastify vendor file:** this section / Onboarding-Tour / Phase 5? __________

Migration authorized to run autonomously (implement → adversarial-review → commit → push → CI-green) once G1–G3
are ticked.

Maintainer notes / requested changes:

```

```
