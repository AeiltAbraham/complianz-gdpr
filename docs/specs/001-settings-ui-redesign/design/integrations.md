# 001 — Integrations design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 4 of 7: **Integrations** (Services, Plugins, Script Center) |
| Produced by | T-051 (this note + `integrations-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (the boxes at the end) |
| Serves | C-2, DB-07; Stage-H Integrations gate |
| Related | ADR-001 (island/marker), ADR-004 (token hygiene), ADR-005 (SCSS retirement), ADR-007 (logical utilities), ADR-009 (vendor pipeline — **deferred here**, §6), ADR-013 (primitives) |

## 1. What this is — two reserved gates

The Integrations group is three screens — **Services**, **Plugins**, **Script Center** — rendered
through the already-migrated frame (`Settings.js`, T-046) and field row (`Field.js`, T-045). The outer
card/footer/help chrome is **done**; what remains is the **integrations-specific bodies**.

Two maintainer sign-offs (the boxes in §8):

1. **The bodies look** (§3) — the Script Center + the `.cmplz-details-row` detail layout migrated to
   `tw-` on the approved tokens.
2. **The scope cut** (§2 / §6) — confirming we **defer** the Services/Plugins data-table internals and
   the shared **Panel accordion** to their later sections, migrating only the non-table bodies now.

A **zero-new-token** confirmation (§4) is folded into gate 1 (no separate reserved-token gate). Nothing
migrates (T-052) until both boxes are ticked.

## 2. Scope

**IN (migrate to `tw-` + token-literal fallbacks, this section):**

- **`ScriptCenterControl.js`** — the three `<h5>` list sections (add / block / whitelist), the
  **"Add new"** wp-core buttons → the **Button primitive** (`secondary`), and the **safe-mode overlay**
  (`.cmplz-settings-overlay` scrim + message card) → `tw-` on tokens (keep the `.cmplz-settings-overlay`
  class as a hook — the legacy rule is shared with Records-of-Consent and **stays**; `tw-` wins via the
  island `important` specificity, no conflict).
- **`ThirdPartyScript.js`** — the `.cmplz-details-row` detail layout (Name / editor / async / category /
  placeholder / dependency / URLs), the raw **`<input type=text>` Name field → the `TextField` primitive**
  (ADR-013; same `onChange`/`value`/`placeholder`/`disabled`, gains the migrated field look + invalid ring),
  and the **Save / Delete** buttons → the Button primitive (`secondary` / **`error`** for Delete).
- **`Dependency.js`, `Placeholder.js`, `Category.js`, `Urls.js`** — their `.cmplz-details-row` /
  `__checkbox` rows + the integrations-only `.cmplz-scriptcenter-url` / `.cmplz-scriptcenter-dependencies`
  flex layouts → `tw-`; the URL add/remove **icon** buttons → the Button primitive (icon child).
- **ADR-005 delete:** the co-located **`settings/src/Settings/Integrations/integrations.scss`**
  (integrations-exclusive — only consumers are `Urls.js` + `Dependency.js`; retired once those move to `tw-`)
  + drop its `@import` (`ScriptCenterControl.js:7`).

**DEFER (stays legacy this section — grounded in §6):**

- **The Panel accordion** — `Panel.js` + `assets/css/admin/modules/wizard/panel.scss` (`.cmplz-panel` /
  `.cmplz-details-row` base). Cross-section: **8 importers** across cookie-database / processors /
  thirdparties / plugins-overview. `ThirdPartyScript` keeps its `<Panel>` accordion **chrome** on legacy
  `panel.scss`; we migrate only the detail-row **bodies** nested inside it. Migrating the accordion itself
  would restyle ~16 still-legacy screens before their sections are signed off. (T-042 + `wizard-fields.md`
  already deferred it; no section has claimed last-consumer.)
- **The Services/Plugins data-table internals** — the `react-data-table-component` `.rdt_*` body +
  `datatables.scss` + the **ADR-009 vendor pipeline + `readToken()`**. Deferred to the dedicated
  **Tools/Settings data-tables** section (plan.md §5). The tables keep their current look via the
  still-enqueued `admin.css` — **no visual regression in the interim** (§6).
- **The legacy `assets/css/admin/modules/integrations/integrations.scss`** (`.cmplz-table-header`,
  `.cmplz-settings-overlay`, `.cmplz-integrations-placeholder`, `.cmplz-no-documents`) — **cross-section**
  (shared with Tools / Records-of-Consent / Data-requests per the T-015 consumer map). **Stays** (ADR-005);
  migrates with the data-tables section.

**OUT (Phase 5):** the `data-cmplz-ui` marker move; `admin.css` de-enqueue; legacy-globals deletion.

## 3. The bodies design (the one look sign-off)

`integrations-preview.html` renders the Script Center on the approved tokens:

- **Script Center sections** — the `<h5>` section headings use the type scale + `--cmplz-text`; each list
  is a stack of accordion rows (the **accordion chrome shown as baseline-identical context** — it stays
  legacy this section); **"Add new"** is a `secondary` Button beneath each list.
- **Detail rows** (`.cmplz-details-row`) — a vertical stack: a `500`-weight label
  (`--cmplz-text`, the `2xs`/`xs` spacing rhythm) above its control. `__checkbox` rows keep the
  checkbox + inline label; `__buttons` is a horizontal Save/Delete group.
- **Primitives inside rows** — unchanged: `SwitchInput`, `SelectInput`, `TextField`, `CheckboxGroup`,
  `RadioGroup`, the Ace editor (its own isolate zone). The **Name field becomes `TextField`** (replacing
  the lone raw `<input>`) so every text field in the section reads identically.
- **Dependency / URLs rows** — the `.cmplz-scriptcenter-url` row is `flex` (input grows, icon button
  trails); the `.cmplz-scriptcenter-dependencies` row is `flex`/`align-center` (select + "waits for:"
  caption). Both ported to logical `tw-` (ADR-007) — the legacy `margin-right` becomes `margin-inline-end`.
- **Safe-mode overlay** — the scrim is `--cmplz-surface` at 0.8 alpha (the frame's literal-port
  precedent, `frame.md §3.1`); the message is a `--cmplz-surface` card with `--cmplz-shadow` + field radius.
- **Buttons** — Save = `secondary`, **Delete = `error`** (the `--cmplz-danger` treatment), Add new =
  `secondary`, URL ±  = icon Buttons. No competing second page-primary (the footer Save stays the only
  `primary`, per the 1b single-primary rule).

**AA note (constitution §5):** no interactive-text-on-tint pairing is introduced here (the T-045 lesson);
labels/captions are `--cmplz-text` / `--cmplz-text-muted` on `--cmplz-surface`. The `error` Button reuses
the already-shipped primitive treatment.

## 4. Zero new tokens

The C-2 set (21 G3 base + 8 section-1 additions in `tokens.css`) covers every value: the detail-row
spacing → the 4px grid (incl. `--cmplz-space-2xs`); label weight/colour → `--cmplz-text` + the type scale;
the overlay scrim/card → `--cmplz-surface` + `--cmplz-shadow` + radius; the danger button → the existing
`--cmplz-danger` family. **Zero new tokens** (`tokens.css` stays byte-unchanged — matching dashboard and
consent-banner). No reserved-name collision (no `--cmplz-manage-consent-*`; no `--cmplz-legacy-` / `--rsp-`
names anywhere, comments included — the ADR-004/T-018 gate greps the whole file).

## 5. Marker discipline (ADR-001)

The migrated bodies nest **inside the still-legacy `Panel` accordion**, so the wrapper that hosts the
accordion **must NOT carry `data-cmplz-ui`** — otherwise the scoped base reset (B1–B5) would strip the
legacy accordion chrome. This is the exact `Field.js`-markerless pattern from section 1: migrate the leaf
bodies with `tw-` utilities + token-literal fallbacks (`var(--cmplz-…,_<literal>)`), **no marker** on the
Script Center / `ThirdPartyScript` wrappers while they still host legacy `Panel`/table children. The Ace
editor keeps its own isolate zone.

## 6. The ADR-009 / data-table boundary (recorded — defer; not an ADR change)

**Decision: defer the data-table vendor pipeline + `readToken()` to the Tools/Settings data-tables
section.** This changes **no** ADR — it is forced by the existing plan + ADRs. Three independent facts:

1. **plan.md §5 ordering** attaches "(vendor pipeline per ADR-009, `readToken()`)" **only** to
   "Tools/Settings data tables," which comes **after** Integrations. `consent-banner.md §4` already
   forward-noted the pipeline "lands (tables/date-range section)."
2. **`datatables.scss` is one shared module for all 7 data-table consumers** (2 Integrations + 5 Tools).
   ADR-005 forbids deleting it until the **last** consumer migrates; ADR-009 couples the vendor-file add
   with the legacy-copy delete in **one** PR. Integrations is only 2 of 7, so the coupled PR structurally
   belongs to the Tools section.
3. **The pipeline is net-new, unbuilt infra** — `postcss-prefix-selector` / `postcss-rtlcss` not installed,
   no vendor PostCSS step in `settings/postcss.config.js`, `readToken()` absent tree-wide, `vendors/` holds
   only `preview.css`, and `createTheme('really-simple-plugins')` is never registered (the tables render via
   legacy `datatables.scss` today). Building it twice is the duplication the task warns against.

**Interim styling is free:** `admin.css` (carrying `datatables.scss` + the legacy integrations table-chrome)
stays enqueued through all of Phase 4 — the Services/Plugins tables look **identical to today** until the
Tools section migrates them. The current padding-only `customStyles` (`'0'` literals, no tokens) need no
`readToken()`, so nothing here forces the ADR-009 dependency.

**Re-baseline carve-out (write into the section gate):** the Integrations re-baseline + axe gate expects the
**table internals to look unchanged** (legacy-styled), **not** migrated. Only the migrated bodies change.

## 7. Migration plan (T-052, after sign-off)

1. Migrate `ScriptCenterControl.js`, `ThirdPartyScript.js`, `Dependency.js`, `Placeholder.js`,
   `Category.js`, `Urls.js` to `tw-` + token-literal fallbacks (§2/§3); swap the raw Name `<input>` → the
   `TextField` primitive; swap the wp-core buttons → the Button primitive (`secondary` / `error` / icon).
   **No `data-cmplz-ui`** on the Panel-/table-hosting wrappers (§5).
2. **ADR-005:** delete the co-located `settings/src/Settings/Integrations/integrations.scss` + drop its
   `@import`. **Grep ALL consumers first — JS + PHP (`settings/config/*.php`) + e2e** (the T-046
   `.no-background` landmine). Leave `panel.scss`, `datatables.scss`, and the legacy
   `modules/integrations/integrations.scss` untouched (shared — §2/§6).
3. Re-baseline the `#integrations/*` screens (services / plugins / script-center) across the 4 admin
   projects on a **reset wp-env DB + fresh build** (`--update-snapshots`; screenshots non-blocking —
   Option B). Services/Plugins table internals must render **identical** (legacy-styled — §6).
4. Evaluate axe `MIGRATED_SCREENS` — almost certainly **still deferred** (the screens embed the retained
   react-data-table widget, the shared legacy Panel accordion, and the Ace isolate zone).

Adversarial pre-push review (5-dimension workflow, each finding verified) → CI-green under the
implement → review → commit → push gate. Compiled output restored (ADR-006).

---

## 8. Sign-off

Integrations migration (T-052) starts only when **both** are approved.

- **Bodies look (Script Center + detail rows on tokens; Name→TextField; Save/Delete/Add-new→Button
  primitive, Delete=`error`) + zero new tokens:** [x] — maintainer, 2026-10-14, AS PROPOSED.
- **Scope cut (defer the data-table internals + the shared Panel accordion to their later sections;
  migrate only the non-table bodies + retire the co-located `integrations.scss`):** [x] — maintainer, 2026-10-14, AS PROPOSED.

Integrations migration (T-052) authorized to run autonomously under the implement → adversarial-review →
commit → push → CI-green gate.

Maintainer notes / requested changes:

```
Approved as-is; no requested changes. Proceed autonomously through T-052.
```
