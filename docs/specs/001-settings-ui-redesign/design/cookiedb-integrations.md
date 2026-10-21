# Stage H7 — Cookiedatabase editing + Integrations detail rows + the shared Panel primitive

Design note for Bundle H7 (the remaining still-legacy bodies that block the ADR-001 marker move).
Companion to `stage-h5-composite-bodies.md`. Zero new tokens — applies the approved C-2 system.

## Bodies in scope

- **Cookiedatabase editing**: `Cookie`, `Service`, `CookieDatabaseSyncControl` (raw `<input>`/`<button>`/
  `<select>`, the `.cmplz-details-row` rows, the `.cmplz-cookiedatabase-controls` sync chrome, the
  `#cmplz-scan-progress .cmplz-progress-bar` sync bar).
- **Integrations detail rows**: `ThirdPartyScript`, `Urls`, `Placeholder` (exports `Category`),
  `Dependency`, `Category`, `PluginsOverviewControl`, `PluginsPrivacyStatements/SinglePrivacyStatement`,
  `ThirdParties/ThirdPartyElement`, `Processors/ProcessorElement`. Their buttons/inputs were already
  migrated to `ui/Button` + the `Inputs/*` primitives at T-052; the residual legacy surface is the
  `.cmplz-details-row` layout, plus raw `<input>`/`<select>`/`<button>` in `ProcessorElement`/
  `ThirdPartyElement`/`SinglePrivacyStatement`.
- **The shared `Panel` accordion** (`settings/src/Settings/Panel.js`) — OWNED by H7; also rendered by
  H6's merged work? No (H6 doc-tools no longer use it); still shared with **CookieScan (H2, merged)**
  and H8. See coordination below.

## Maintainer sign-off (2026-10-21)

1. **Panel → MODERNIZE to a C-2 card** (NOT look-preserving): white `--cmplz-surface` item, slate
   `--cmplz-border`, token radius; KEEP the summary grid + chevron + open/close rotation.
2. **Cookiedatabase sync progress bar → `--cmplz-accent`**, decoupled from the shared legacy
   `#cmplz-scan-progress .cmplz-progress-bar` rule, exactly as H2 did for the cookie-scan bar (sign-off
   C) — so the Dashboard ProgressBlock + premium sync bar stay blue with no re-baseline.

## Coordination (shared primitive)

`Panel.js` is shared with **CookieScan (H2, merged)** and **H8 (not yet landed)**. Modernizing it drifts
their Panel screens too. Per maintainer: do NOT re-baseline other bundles' screens here — the FULL
marker-move re-baseline (H5 Part 2, after H6/H7/H8 all land) is the single cleanup point that re-captures
every Panel screen across all bundles. The visual layer is non-blocking (Option B), so interim drift on
other bundles' screens is tolerated. **This bundle re-baselines only H7's own screens** and verifies the
modernized Panel renders correctly on an H7 Panel screen.

Mitigation that limits even H7's own drift: `visual.spec.js` masks `.cmplz-panel__list`,
`.cmplz-cookiedatabase-controls` and `.cmplz-progress-bar` (dynamic regions). Every Panel instance EXCEPT
ScriptCenter's sits inside a masked `.cmplz-panel__list`, so the only unmasked Panel drift is
**`#integrations/integrations-plugins`** (ScriptCenter's three script panels). Those class names are KEPT
as bare DOM hooks on the migrated markup so the masks keep working without editing the spec (test changes
need approval).

## Panel — C-2 card spec (tw- + semantic tokens, with literal fallbacks)

The modernized accordion carries its own styling (self-sufficient for Bundle D). It drops the
`.cmplz-panel__list__item*` class hooks (replaced by tw-); callers keep the `.cmplz-panel__list`
wrapper class (mask hook + CookieScan). The marker move will later make base.css B1 reach these elements;
we set `tw-border-solid` explicitly so the border never depends on B1 (the T-052 landmine).

| Element | Legacy | C-2 (this note) |
|---|---|---|
| item root | bg `grey-200` #f7f7f7, radius 12px | `tw-bg-[var(--cmplz-surface,#fff)]`, `tw-rounded-[var(--cmplz-radius,12px)]` |
| `<details>` border | 1px solid `grey-300` #ededed, radius 12px | `tw-border tw-border-solid tw-border-[color:var(--cmplz-border,#e2e8f0)] tw-rounded-[var(--cmplz-radius,12px)]` |
| `<summary>` | padding 5px 15px, grid `auto 1fr auto auto auto`, gap 15px, min-h 40px, list-style none | `tw-grid tw-grid-cols-[auto_1fr_auto_auto_auto] tw-items-center tw-gap-[var(--cmplz-space-s,12px)] tw-py-[var(--cmplz-space-xs,8px)] tw-px-[var(--cmplz-space-s,12px)] tw-min-h-[40px] tw-list-none tw-cursor-pointer` + hide marker |
| title `<h5>` | weight 500, 12px | `tw-m-0 tw-font-medium tw-text-[var(--cmplz-font-size-sm,0.8125rem)]` (13px, the C-2 small step; 12px→13px is within the modernization) |
| comment | — | `tw-text-[color:var(--cmplz-text-muted)] tw-text-[var(--cmplz-font-size-xs,0.6875rem)]` |
| icons group | grid-column -2, flex, gap 5px | `[grid-column:-2] tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,4px)]` |
| chevron | grid-column -1, rotate 0↔180, .25s | `[grid-column:-1] tw-transition-transform tw-duration-[250ms]` + `tw-rotate-180` when open |
| `[open] summary` | border-bottom 1px `grey-300` | `tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,#e2e8f0)]` when open |
| details body | padding 5px 15px | `tw-py-[var(--cmplz-space-xs,8px)] tw-px-[var(--cmplz-space-s,12px)]` |
| cookie-list tone (`Cookie`) | nested item bg #fff, deleted bg `red-faded` | `tone` prop: `nested` = `tw-bg-[#fff]`, `deleted` = `tw-bg-[var(--cmplz-danger-surface,#fdebed)]`, both `tw-my-[10px]` |

`tone` is a complete-literal class map on the item root (ADR-013, no tailwind-merge); default = surface.
The item root is NOT given `data-cmplz-ui` (it wraps arbitrary/unmigrated body content — the T-038
landmine); its tw- chrome applies via the `important:#complianz` scope regardless of marker.

## Detail-row layout (reproduced on every H7 row, dropping `.cmplz-details-row`)

- row: `tw-flex tw-flex-col tw-py-[5px]`
- row label (`<label>`): `tw-mt-[var(--cmplz-space-s,12px)] tw-mb-[var(--cmplz-space-xs,8px)] tw-font-medium`
- button row: `data-cmplz-ui tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,8px)] tw-mt-[var(--cmplz-space-s,12px)] tw-pb-[5px]`
  (the established T-052 ThirdPartyScript pattern; `data-cmplz-ui` so `ui/Button` gets B1 border-style +
  the `error` variant's `--cmplz-danger`).
- raw `<input type="text">` → `Inputs/TextInput`; raw `<select>` → `Inputs/SelectInput`; raw
  `button.button.cmplz-reset-button` → `ui/Button variant="error"`; raw `button.button-default`
  (Save/Add) → `ui/Button variant="secondary"` (or `primary` for the sync Start action).

## SCSS surgery (ADR-005; grepped JS + PHP + config + e2e)

- **DELETE** `.cmplz-details-row*` (H7-exclusive, all nine consumers migrated; no PHP/e2e consumer).
- **DELETE** the `.cmplz-panel` chrome subtree — `&__cookie_list`, `&__buttons`, and `&__list &__item {…}`
  (Panel.js reproduces the item/details/summary chrome and drops the hooks; Service/Sync migrate their
  `__cookie_list`/`__buttons` wrappers). **KEEP** `.cmplz-panel__list { display:flex; … }` (surviving
  consumer CookieScan + the H7 list wrappers; it is a mask hook and marker-move-safe at (1,1,0)).
- **DELETE** `.cmplz-cookiedatabase-controls` (body-specific; migrated to tw-, class kept only as the
  visual.spec mask hook).
- **DELETE** `.cmplz-button-icon` (last consumer SinglePrivacyStatement, migrated).
- **KEEP** `button.button.cmplz-reset-button` (shared-origin; dead after H7 but matches only raw
  `button.button`, harmless; removed in Bundle D) and the `#cmplz-scan-progress`/`#cmplz-sync-progress`
  block (premium sync bar sibling; CookieScan + CookieDatabaseSync both decoupled, Bundle D removes it).
- **KEEP** `.cmplz-input-group` (carried by the TextInput/SelectInput primitives) and `.cmplz-comment`
  (Service unsaved-service hint + PlaceholderPreview; hook retained).

## Verify

Reset-DB re-baseline on the H7 wp-env ports (8890/8891) + fresh `build:all`; expect the real drift on
`#integrations/integrations-plugins` (unmasked ScriptCenter panels + rows) and the unmasked button rows;
Panel regions under `.cmplz-panel__list` / `.cmplz-cookiedatabase-controls` stay masked. Keep axe green on
the already-gated `#integrations/integrations-plugins` + `#integrations/integrations-services`. Adversarial
pre-push review; restore compiled output (ADR-006). No new screens added to MIGRATED_SCREENS (reserved for
H5 Part 2).
