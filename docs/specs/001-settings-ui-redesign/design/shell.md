# 001 — Shell design note & gate-G3 sign-off record

| | |
|---|---|
| Stage | G (Phase 3 — the shell), re-plan after gate **G3** |
| Produced by | T-034 (this note + `token-preview.html`) and T-035 (`shell-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (see the two check-boxes at the end) |
| Serves | C-2, DB-07, DB-08, C-3; gate G3 |
| Related | ADR-001, ADR-004, ADR-007, ADR-008, ADR-014; clarify Q-02, Q-03 |

## 1. What this is

This is the single sign-off record for **gate G3**, the gate that lets Phase 3 (the shell:
`Page.js` grid, `Header.js`, `Menu/*`, `Placeholder/*` → `Skeleton`, panels, notices)
begin. Gate G3 needs two maintainer approvals (plan §5, decision §4 item 7, C-2):

1. **the C-2 token VALUES** — the concrete redesign values that replace the look-preserving
   placeholders now in `settings/src/styles/tokens.css` (§3 below, rendered in
   `token-preview.html`);
2. **the shell preview** — the redesigned shell frame rendered with those values
   (`shell-preview.html`, the DB-07 review reference; notes appended by T-035 in §8).

Nothing in Phase 3+ migrates (T-036 onward) until both boxes in §9 are ticked. These are
**proposals**; no `settings/src`, `assets/css`, `tokens.css` or build/test file is touched
by T-034/T-035.

**Ratified decision carried in, not re-litigated:** the `base.css` **B2 / Phase-5 marker
reconciliation = OPTION A** (re-scope B2 root typography to the shell `[data-cmplz-ui]`
islands — the same island model already used for the tokens — keep the Phase-5 marker move
intact, and do **not** introduce `#complianz-app-root` early). Recorded in §7.

## 2. Redesign direction (per clarify Q-02)

Q-02 fixes the brief: **Claude proposes, the maintainer approves; derive the design from the
current UI plus modern WP-admin conventions — a tasteful modernization that keeps the
recognizable Complianz identity, not a new brand.** Concretely, this proposal:

- **Keeps the Complianz brand hues** — the signature bright blue (`#009fff`), the dark blue
  (`#1e73be`), the brand red (`#d7263d`) are unchanged; the green is deepened only enough to
  pass contrast as text.
- **Modernizes the neutrals** into one cohesive cool-grey (slate) ramp. The app already
  reaches for slate text (`rgba(15,23,42,…)`); this formalizes it as solid, predictable
  neutrals and gives "muted" a genuinely lighter value instead of near-black at 85% alpha.
- **Regularizes structure** — a 4px spacing grid, a tidied radius step (6/8/12), and a named
  type scale — so the shell reads as one system (DB-07) from one value set (DB-08).
- **Targets WCAG 2.2 AA** (constitution §5): body/interactive colors clear 4.5:1 on their
  surface; the two judgment calls where a value sits between "today" and "strict AA" are
  flagged in §6.

The split between a bright **accent** (fills, tints, toggles, focus ring, selected tints —
never text) and a contrast-safe **accent-strong** (links, active nav, interactive text and
icons) is the existing pattern in the app (e.g. the active menu item already uses the dark
blue); this proposal makes it an explicit token rule.

## 3. C-2 token proposal — the 21 semantic `--cmplz-*` tokens

One row per token now declared in `tokens.css`. **Current** = the look-preserving placeholder
(today's look). **Proposed** = the redesign value for maintainer sign-off. Contrast figures
are against the surface the token sits on (`#fff` unless noted).

### Surfaces & neutrals

| Token | Current | Proposed | Rationale |
|---|---|---|---|
| `--cmplz-surface` | `#fff` | `#ffffff` | Keep cards/panels clean white; the app's base surface and the frame of the design system. |
| `--cmplz-surface-sunken` | `#f0f0f1` | `#f1f5f9` | Page background cooled to slate-100 so it harmonizes with the slate text ramp; near-identical lightness to WP's `#f0f0f1`, so it still sits naturally inside wp-admin. |
| `--cmplz-field-surface` | `#fff` | `#ffffff` | Keep inputs white for maximum field legibility against the sunken page. |
| `--cmplz-text` | `rgba(15,23,42,0.95)` | `#0f172a` | Primary text as solid slate-900 (~18:1). Dropping the alpha makes contrast predictable on any surface (alpha text shifts with whatever is behind it). |
| `--cmplz-text-muted` | `rgba(15,23,42,0.85)` | `#475569` | A real secondary grey (slate-600, ~7.6:1). Today's "muted" is near-black at 85% alpha — barely distinct from body text, so the hierarchy reads flat. |
| `--cmplz-text-on-accent` | `rgba(255,255,255,0.95)` | `#ffffff` | Solid white for text on `accent-strong`/`success`/`danger` fills (≥4.9:1 on each). Not for use on the bright `accent` (see that row). |
| `--cmplz-border` | `#dfdfdf` | `#e2e8f0` | Hairline dividers / card edges as slate-200 — a cooler, lighter line that matches the ramp. Decorative (cards are also set apart by surface + shadow). |
| `--cmplz-field-border` | `#c6c6c6` | `#94a3b8` | A clearly visible resting input border (slate-400, ~2.6:1 vs the ~1.5:1 of `#c6c6c6`, which is nearly invisible). See the non-text-contrast judgment call in §6. |

### Brand & status

| Token | Current | Proposed | Rationale |
|---|---|---|---|
| `--cmplz-accent` | `#009fff` | `#009fff` | **Keep** the signature Complianz blue. Role: fills, tints, toggle-on, progress fill, focus ring, selected-row tint. It is ~2.8:1 on white, so **never** body text — text/icons use `accent-strong`. |
| `--cmplz-accent-strong` | `#1e73be` | `#1e73be` | **Keep** the Complianz dark blue; ~4.9:1 on white (AA for text). The token for links, active navigation, and interactive text/icons. |
| `--cmplz-success` | `#2e8a37` | `#1f7a34` | Keep the brand green, deepened ~8% so it clears 4.5:1 (~5.4:1) as status text/icons; today's `#2e8a37` is ~4.4:1, just under AA. |
| `--cmplz-warning` | `#f4bf3e` | `#eab308` | A confident, slightly deeper gold in the Complianz yellow family — more legible as an icon/fill on white and visually absorbs the retired legacy orange (see §5 icon map). A fill/status hue; pair with dark text, not white. |
| `--cmplz-danger` | `#d7263d` | `#d7263d` | **Keep** the brand red; ~5.0:1 on white (AA for text and icons). |

### Radius

| Token | Current | Proposed | Rationale |
|---|---|---|---|
| `--cmplz-radius` | `12px` | `12px` | **Keep** — the rounded 12px card is core to the Complianz look. |
| `--cmplz-radius-s` | `8px` | `8px` | **Keep** — menu items, pills, inner blocks, skeletons. |
| `--cmplz-radius-field` | `5px` | `6px` | Nudge +1px so inputs read a touch softer and the scale steps cleanly 6 → 8 → 12. |

### Spacing — proposed 4px grid (see the density judgment call in §6)

| Token | Current | Proposed | Rationale |
|---|---|---|---|
| `--cmplz-space-xs` | `10px` | `8px` | Onto a 4px base; the off-grid 10/15 rhythm becomes a clean 8/12/16/24 scale that composes predictably. |
| `--cmplz-space-s` | `15px` | `12px` | 4px grid. |
| `--cmplz-space-m` | `20px` | `16px` | 4px grid. This is the card's block padding (with `l` as inline) — see §6 before approving. |
| `--cmplz-space-l` | `25px` | `24px` | 4px grid; card inline padding, section gaps. |

### Typography

| Token | Current | Proposed | Rationale |
|---|---|---|---|
| `--cmplz-font-size` | `0.875rem` | `0.875rem` | **Keep** the 14px base — it matches wp-admin and the B2 root rule. The heading/caption steps are added as a new type-scale family (§5). |

All 21 keep their names and their declaration site: the scoped islands
`:is(#complianz, #complianz-portal) :where([data-cmplz-ui])`, never `:root` (ADR-001,
ADR-004). No name here is one the frontend banner uses (§6, constraints).

## 4. Rendered proposal

`token-preview.html` (this folder) renders every proposed value standalone in a browser:
color swatches (name + value + a sample on the light surface), the type scale, the spacing
scale, radius samples, and samples of the new shadow and motion families (§5). It is a
review aid only — not production code — so it declares the tokens on `:root` for the demo;
in production they stay on the scoped islands.

## 5. Vocabulary-growth decision (DB-08 families the shell needs, `tokens.css` lacks)

DB-08 says **all** visual values come from one named set (color, spacing, radius,
typography, **shadow, layering, motion, breakpoints**). The shell uses shadow, z-index and
motion today as hard-coded values; `tokens.css` has none. Decision per family:

### ADD — shadow

The shell's cards, sticky settings footer, active menu item, and locked overlay all lift
with a shadow (today: one hard-coded `box-shadow`). Add three steps:

| New token | Value | Use |
|---|---|---|
| `--cmplz-shadow-sm` | `0 1px 2px 0 rgba(15, 23, 42, 0.06)` | Inputs, the active menu item's subtle lift. |
| `--cmplz-shadow` | `0 1px 3px 0 rgba(15, 23, 42, 0.10), 0 1px 2px -1px rgba(15, 23, 42, 0.06)` | Cards / panels — a tighter, softer modern take on the legacy card shadow. |
| `--cmplz-shadow-lg` | `0 10px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.10)` | Dialogs, popovers, dropdown menus (the Radix overlays). |

### ADD — layering / z-index

ADR-014 already fixes the overlay stacking; the in-app shell also stacks a sticky footer
(legacy z 12) and a locked overlay (legacy z 10) as magic numbers. Add a documented scale:

| New token | Value | Use |
|---|---|---|
| `--cmplz-z-sticky` | `20` | Sticky settings footer / in-app sticky headers. |
| `--cmplz-z-overlay` | `30` | In-card locked (premium / wizard-lock) overlay. |
| `--cmplz-z-dropdown` | `1000` | Menus/comboboxes that stay within the app flow. |
| `--cmplz-z-toast` | `9999` | **Mirrors** ADR-014's react-toastify stack (documentation value). |
| `--cmplz-z-portal` | `100001` | **Mirrors** ADR-014's portal host (above admin bar 99999 / menu 100000, below the WP media modal 160000). The authoritative value stays in PHP per ADR-014; this token documents it for CSS that must reason about the same stack. |

### ADD — motion / transition

The shell transitions the menu (`0.2s`), the header underline (`0.3s`), fades panels in,
and pulses the skeleton. DB-12 also requires reduced-motion support. Add:

| New token | Value | Use |
|---|---|---|
| `--cmplz-duration-fast` | `120ms` | Hover/active state changes. |
| `--cmplz-duration` | `200ms` | Default transition (matches today's menu). |
| `--cmplz-duration-slow` | `300ms` | Larger moves (matches today's header underline). |
| `--cmplz-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing for all of the above. |

Paired with one global rule under `@media (prefers-reduced-motion: reduce)` that zeroes the
durations (DB-12) — a behavior note for T-036, not a token.

### DEFER — breakpoint

**Do not** add breakpoint custom properties. CSS custom properties cannot be used in
`@media` conditions (`@media (min-width: var(--x))` is invalid), so a breakpoint "token" in
`tokens.css` would be dead weight. Per ADR-014 the shell's responsive behavior uses Tailwind
v3.4 variants, whose breakpoints belong in **one** place — `tailwind.config.js`
`theme.screens`. Recommendation: define the named scale there (the single source) and
document it in this folder. Proposed named scale for `screens` (preserving the breakpoints
the grid actually depends on — the content grid collapses around the legacy `s` = 1080px):
`sm 768px`, `md 1080px`, `lg 1280px`, `xl 1440px`. No CSS custom-property family.

### ADD (recommended) — type scale

`--cmplz-font-size` is only the base; the shell has headings (the menu/section title, panel
`h5`) and captions (submenu, pills, legends) that today pull from the legacy `fs-*` set. Add
a small scale so the shell's type comes from the token set too (DB-08 "typography"):

| New token | Value (≈px at 16px root) | Use |
|---|---|---|
| `--cmplz-font-size-xs` | `0.6875rem` (11px) | Pills, grid-item legends. |
| `--cmplz-font-size-sm` | `0.8125rem` (13px) | Submenu items, captions. |
| `--cmplz-font-size-lg` | `1rem` (16px) | Section / menu titles (the `h4`). |
| `--cmplz-font-size-xl` | `1.25rem` (20px) | Page / panel headings. |
| `--cmplz-line-height` | `1.5` | Matches the B2 root line-height. |

## 6. Constraints honored (explicit)

- **No legacy token names.** The proposal introduces no `rsp`-era names and no
  `cmplz-legacy-*` names; every token is a clean semantic `--cmplz-*` (ADR-004). The eight
  legacy icon variables are **removed**, not referenced — §5 of this note deliberately lists
  the icon *colour keys* and hex values rather than the old variable spellings, so the gate
  grep over `design/` stays clean (T-034 proof).
- **No reserved frontend-banner names.** The banner CSS declares `cmplz-manage-consent-height`
  and `cmplz-manage-consent-offset`; because tokens declared on `#complianz` reach the
  banner-preview isolate zone (ADR-004 / ADR-008), **no** proposed token uses those names, or
  any other `--cmplz-*` the banner reads. Verified against a repo-wide grep of the banner CSS;
  the proposed names (surface/text/accent/shadow/z/duration/font-size families) do not collide.
- **Declared on the scoped islands, never `:root`.** Production tokens keep the current
  selector `:is(#complianz, #complianz-portal) :where([data-cmplz-ui])` (the island model —
  learnings 2026-10-10). Only the standalone review HTML uses `:root`, for the demo.
- **AA two flagged exceptions** (§ judgment calls below): the resting `field-border` and the
  spacing density sit between "today" and "strict AA/no-change" and need an explicit call.

## 7. B2 / marker reconciliation = **Option A** (recorded, not re-litigated)

Adopt **Option A**: when the shell migrates, re-scope the B2 root-typography rule in
`base.css` to the shell `[data-cmplz-ui]` islands — the same island model already used for
`tokens.css` and the rest of `base.css` — **keep** the Phase-5 marker move intact, and do
**not** introduce `#complianz-app-root` early. One sentence why: it is consistent with the
tokens/base island fix (learnings 2026-10-10, which caught exactly the breakage from keying
styles to a future `#complianz-app-root`), and it avoids pre-empting the Phase-5 marker move
(ADR-001). This is the ratified gate decision; it is recorded here and not reopened.

## 8. Shell preview notes (appended by T-035)

`shell-preview.html` is the static, self-contained DB-07 review reference for the redesigned
shell **frame**, rendered with the proposed C-2 tokens and the new families from §5. It
mirrors the real shell components:

- **Page grid** (`Page.js`): the centered `max-width` content area; sidebar menu column +
  content columns (`28ch 1fr 1fr 1fr`), the dashboard auto-fit variant shown as a note.
- **Header** (`Header.js`): logo, top-level section tabs with the active underline,
  Documentation link + the black "Go Pro" / "Support" button.
- **Menu** (`Menu/*`): the section title and the per-section sub-menu with step icons
  (not-started / current / complete), the "New" featured pill, nested submenu items —
  **C-3 honored**: top-level section tabs + per-section sub-menu, a *visual* redesign only;
  the navigation **model** is unchanged.
- **Panels / cards**: a settings card with header, body rows and a sticky footer + Save
  button; a radio-card group; representative placeholder content blocks (the frame is being
  mocked, not real screens).
- **Skeleton loading state** (`components/ui/Skeleton.js`): the pulse-over-sunken-surface
  blocks that replace the legacy shine lines.
- **Notice**: an in-app notice/callout.

It uses logical CSS properties only (`margin-inline`, `inset-inline`, `padding-inline`, etc.
— ADR-007), semantic tokens and the new families; no physical `left/right`, no legacy names.

## 9. Open questions / judgment calls for the maintainer

1. **Spacing density (biggest call).** The 4px grid moves the card's block padding from
   `20px 25px` to `16px 24px` (`space-m` 20→16, `space-l` 25→24) — slightly tighter
   vertically. If you prefer today's roominess, keep `space-m: 20px` (the scale then reads
   8/12/20/24, one uneven step). The preview uses the 16px proposal; say which you want.
2. **`field-border` vs strict non-text contrast.** `#94a3b8` (~2.6:1) is a clear improvement
   over today's `#c6c6c6` (~1.5:1) but still below SC 1.4.11's 3:1 for an essential control
   boundary; the 3:1 affordance is instead met on **focus** (a 2px `accent-strong` ring) —
   the common pattern. If you want the resting border itself to pass 1.4.11, use slate-500
   `#64748b` (~4.8:1), which looks heavier at rest. Proposal keeps `#94a3b8` + strong focus.
3. **Deepened green.** `success` is deepened `#2e8a37` → `#1f7a34` purely to clear AA as
   text. If success is only ever a fill (never small text), the original brand green can
   stay; confirm how it is used before Dashboard/Wizard migration.
4. **Warning/orange consolidation.** `warning` `#eab308` absorbs the retired legacy orange.
   Orange is unused in the free-reachable code today (grep: no `color="orange"`), so the
   consolidation is safe here; re-check if premium adopts this work (C-1).
5. **`radius-field` 5→6px** and the exact **shadow/duration** values are taste calls — easy
   to adjust in the preview before sign-off.
6. **Breakpoint home.** This proposal puts breakpoints in `tailwind.config.js` `screens`
   (§5 DEFER), not in `tokens.css`. If you want a documented CSS-side mirror for non-utility
   CSS, that is a separate, small follow-up — flag it and it can be added.

## Icon.js legacy → semantic replacements (so T-036 can drop them)

`settings/src/utils/Icon.js` maps eight colour keys to eight legacy colour custom
properties. The redesign replaces each with a semantic `--cmplz-*` token (listed by colour
key + today's resolved hex; the old variable spellings are intentionally omitted to keep the
gate grep over `design/` clean). Live keys in the free app: black, green, red, grey, and
dark-blue (set internally by the menu step logic); blue, yellow and orange are defined but
not currently passed.

| Icon colour key | Today's resolved value | Proposed semantic token | Note |
|---|---|---|---|
| `black` | `#333` | `--cmplz-text` | Icons default to the foreground colour. |
| `green` | `#2e8a37` | `--cmplz-success` | Status "complete" (menu check). |
| `blue` | `#009fff` | `--cmplz-accent` | Brand accent fill. |
| `dark-blue` | `#1e73be` | `--cmplz-accent-strong` | Current/selected (menu bullet), interactive. |
| `yellow` | `#f4bf3e` | `--cmplz-warning` | Caution/attention. |
| `orange` | `#f39c12` | `--cmplz-warning` | Consolidated into warning (orange unused in free; §9.4). |
| `red` | `#d7263d` | `--cmplz-danger` | Error/destructive. |
| `grey` | `#c6c6c6` | `--cmplz-text-muted` | "Not-started" bullet. Shifts a near-invisible `#c6c6c6` (~1.5:1) to a readable muted slate — a deliberate legibility gain; if you want to keep it faint, `--cmplz-field-border` (`#94a3b8`) is the lighter alternative. |

Five map exactly or near-exactly by value (green→success, blue→accent, dark-blue→accent-strong,
red→danger, and black→text as the foreground); yellow+orange fold into `warning`; grey→muted
is the one intentional shift (noted). With these, T-036 can delete all eight legacy icon
variables.

---

## Sign-off

Phase 3 (shell) migration (T-036+) starts only when **both** are approved here.

- **C-2 token values approved:** [x] — maintainer, 2026-10-11, AS PROPOSED (no changes to the §9 judgment calls: 4px spacing grid incl. space-m 16, field-border `#94a3b8`, success deepened to `#1f7a34`, warning/orange folded to `#eab308`, radius-field 6, shadow/motion/z-index/type-scale families added, breakpoints in tailwind.config.screens).
- **Shell preview approved:** [x] — maintainer, 2026-10-11.

Phase 3 shell migration (T-036→T-043) authorized to run autonomously under the implement → adversarial-review → commit → push → CI-green gate. B2/marker = Option A (island model).

Maintainer notes / requested changes:

```
Approved as-is; no requested changes. Proceed autonomously through T-043.
```
