# 001 — Dashboard design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 2 of 7: **Dashboard** |
| Produced by | T-047 (this note + `dashboard-preview.html` + ADR-015) |
| Status | **Proposal — awaiting maintainer sign-off** (two boxes at the end) |
| Serves | C-2, C-4, DB-07, DB-08, DB-17; Stage-H Dashboard section |
| Related | ADR-015 (the block extension point, proposed alongside this), shell.md / shell-preview.html, ADR-001, ADR-004, ADR-005, ADR-007, ADR-013 |

## 1. What this is — two sign-off gates

The dashboard is the one screen not rendered by `Settings.js`: `DashboardPage` maps `cmplz_blocks()` to `GridBlock`, which renders five blocks (Progress, Documents, Tools, Tips & Tricks, Other Plugins). This section needs **two** maintainer approvals before it migrates (gate-G3 style):

1. **ADR-015 — the forward `width`/`variant` block vocabulary** (the public-contract part; see the companion ADR). Everything else about the contract (the DB-17 legacy mapping, explicit-wins, borderless-on-conflict, unknown-dropped, `_doing_it_wrong`, normalize-on-output) is already fixed by the spec; the only open call is the vocabulary, recommended minimal: `width ∈ {1,2}`, `variant ∈ {default, edge-to-edge, borderless}`.
2. **the dashboard look + the small token decision** (`dashboard-preview.html`, §3–4 below).

Nothing migrates (T-048) until both boxes in §7 are ticked. Proposals only — no `settings/src`, `assets/css`, `tokens.css`, `blocks.php`, `settings.php` or test file is touched by T-047.

## 2. Scope

**IN:** `GridBlock.js` (read `width`/`variant` via complete-literal `tw-` maps per ADR-015; keep `cmplz-grid-item` + `cmplz-<id>` hooks), the five block bodies + their headers/footers under `settings/src/Dashboard/*`, `settings/config/blocks.php` (the new `cmplz_normalize_blocks()` + rewrite the five blocks to `width`/`variant`), `settings/settings.php:247` (wrap in normalize), and `tests/test-blocks.php` (new PHPUnit coverage).

**OUT (later slices / stays), with rationale:**
- **chart.js / `readToken()` / ADR-009 / the Statistics screen / DateRange** — the dashboard Statistics is **summary tiles only** (no `<canvas>`); the chart lives on the separate Statistics screen → the later Statistics/DateRange section.
- **the shared `.cmplz-grid-item*` base family + the `-footer` base** (`legacy-globals.scss`) — still consumed by the unmigrated `PagePlaceholder`/`SettingsPlaceholder` → **stays until Phase 5**. The migrated blocks layer `tw-` (1,1,0) on top.
- **`.cmplz-task-status`** (progress.scss) and **`.cmplz-hidden`** (dashboard.scss) are **cross-section** (consumed by SettingsGroup/SecurityMeasures/CreateProcessingAgreements/CreateDataBreachReport and PreloadFields/CookieBannerPreview) → **relocate** to `legacy-globals.scss`, don't delete.
- **`new-features.scss`, `bullets.scss`, and the stale ~60% of `other-plugins.scss`** have no live free-edition consumer but may back premium blocks via the `cmplz_blocks` filter — **leave untouched** (do not delete without premium verification; the T-046 `.no-background` landmine recurring).

## 3. Token decision (small — folded into this sign-off)

The approved token set (21 base + the section-1 additions) + the already-migrated `Icon.js` cover almost everything (card shell, status hues, pills, sync/validate + dial icons, type/spacing/motion). The only gaps, with recommended defaults:

| Need | Legacy | Recommendation |
|---|---|---|
| Progress-bar **track** | `#f7f7f7` | **reuse `--cmplz-surface-sunken` (#f1f5f9)** — no new token. |
| Progress-bar **fill** + `<80%` color | green / `.cmplz-orange` | **`--cmplz-success`** fill, **`--cmplz-warning`** below 80% — existing tokens. |
| Status **pills** (completed/open/urgent/premium) | legacy hues | **`--cmplz-success` / `--cmplz-warning` / `--cmplz-danger` / `--cmplz-accent-subtle`** (dark text), all existing. |
| Legacy **pink `#E35899`** | `bullets.scss` / `other-plugins.scss` | **DROP** — the free dashboard renders `.cmplz-suggested-plugin` (img), not the `.cmplz-bullet`/`.cmplz-other-plugins-element` the pink styles; it is dead here. No token added. |

**Net: zero new tokens** (recommended). If you'd rather have a dedicated `--cmplz-progress-track`, say so and I'll add it.

**Icon fallbacks (implementation note):** the dashboard blocks are markerless (§4), and `Icon.js` fills are `var(--cmplz-*)` which resolve only inside a `[data-cmplz-ui]` island. So T-048 adds **literal fallbacks** to `Icon.js`'s token refs (`var(--cmplz-success, #1f7a34)` …) — a small, cross-cutting robustness fix so icons render colored outside islands (benefits the already-migrated markerless field rows too).

## 4. Marker discipline + the block look

**No `data-cmplz-ui`** on any block or the grid container — every block body still wraps unmigrated content (wp-admin `button button-*`, `DOMPurify`-sanitized task HTML, plugin install/activate buttons). The look comes from `tw-` utilities (scoped by the `important:` config) + token refs **with literal fallbacks**, exactly as sections 1/1b. Embedded migrated primitives (the region/consent `SelectInput`, the loading `Placeholder`) already self-island.

`dashboard-preview.html` renders the block internals on the approved tokens: the **Progress** card (percentage + bar, the All/Remaining task filter, task rows with status pills + View/dismiss, the footer legend + Continue Wizard), **Documents** (region selector + document rows with sync/validate/shortcode icons + legend), **Tools** (tool rows / the summary Statistics tiles), **Tips & Tricks** (bullet list + View all), and **Other Plugins** (the borderless suggested-plugin card with Install). C-3 unchanged.

## 5. Behavior to preserve (T-048)

The task filter (All/Remaining + `sessionStorage` persistence), task dismiss/restore, highlight-field menu nav + Continue-Wizard, the region + consent selectors + the Tools/Statistics title toggle, shortcode copy-to-clipboard, plugin install/activate, and all outbound links — unchanged. The `DOMPurify.sanitize` + `nosemgrep` comments stay.

## 6. Migration plan (T-048, after both sign-offs)

1. **PHP:** add `cmplz_normalize_blocks()` to `blocks.php` (outside the pluggable guard) per ADR-015; rewrite the five blocks to `width`/`variant`; wrap `settings.php:247` in it. Every PHP change escapes/sanitizes/caps as required (CLAUDE.md).
2. **Tests:** `tests/test-blocks.php` per ADR-015 §Consequences (run under the PHP gate).
3. **React:** `GridBlock.js` reads `width`/`variant` via complete-literal `tw-` maps; migrate the five block bodies + headers/footers to `tw-` + token-literal fallbacks, no marker; add `Icon.js` literal fallbacks.
4. **SCSS (ADR-005):** relocate `.cmplz-task-status` + `.cmplz-hidden` to `legacy-globals`; delete the dashboard-exclusive modules (`dashboard/documents.scss`, `dashboard/tools.scss`, `dashboard/statistics.scss`, the dashboard-only parts of `progress.scss` + `tips-tricks.scss`) and the `.cmplz-grid-item.no-background` sub-rule (other-plugins moves to the `borderless` variant); keep the grid-item base + the likely-dead premium modules; drop retired imports.
5. **Re-baseline** the dashboard screens; evaluate axe gating (the dashboard has no chart/table/date-range/picker — it *can* later qualify for `MIGRATED_SCREENS`, but only after the toast live-audit + a clean CookieScan DOM check; likely still deferred this section).

Adversarial review + CI-green under the implement → review → commit → push gate.

---

## 7. Sign-off

Dashboard migration (T-048) starts only when **both** are approved.

- **ADR-015 forward `width`/`variant` vocabulary approved:** [x] — maintainer, 2026-10-13, AS PROPOSED (`width ∈ {1,2}`, `variant ∈ {default, edge-to-edge, borderless}`).
- **Dashboard look + token decision approved:** [x] — maintainer, 2026-10-13, AS PROPOSED (zero new tokens; progress-track reuses `--cmplz-surface-sunken`; legacy pink dropped).

Dashboard migration (T-048) authorized to run autonomously under the implement → adversarial-review → commit → push → CI-green gate.

Maintainer notes / requested changes:

```
Approved as-is; no requested changes. Proceed autonomously through T-048.
```
