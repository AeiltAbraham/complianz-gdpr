# 001 — Wizard-fields design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 1 of 7: **Wizard fields** (field-row chrome) |
| Produced by | T-044 (this note + `wizard-fields-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (see the boxes at the end) |
| Serves | C-2, DB-07, DB-08; Stage-H section-1 gate |
| Related | ADR-001, ADR-004, ADR-007, ADR-013; shell.md (the C-2 token set this extends) |

## 1. What this is

The single sign-off record for **Stage H section 1 (wizard fields)**. Per plan.md §5 and
decision §4 item 7 (C-2), each Phase-4 section needs one maintainer approval — its HTML
preview — before it migrates. This section's approval covers two things:

1. **the new token VALUES** — seven additions to `tokens.css` the field bodies need and the
   approved C-2 set lacks (§3, rendered in `wizard-fields-preview.html`);
2. **the field-row look** — the redesigned field-row chrome rendered with those values
   (`wizard-fields-preview.html`).

Nothing migrates (T-045) until the box in §7 is ticked. These are **proposals**; no
`settings/src`, `assets/css`, `tokens.css` or build/test file is touched by T-044.

**Ratified scope decisions carried in (2026-10-11, maintainer):** section 1 = the **field-row
chrome only** (not the screen frame); tints are **modernized / C-2-consistent** (derived from
the redesign hues, not the old palette); the shipped Phase-2 primitives **are de-hardcoded**
to the new tokens in this section's PR.

## 2. Scope

**IN (this section):** the field-row chrome over the already-migrated Phase-2 input primitives —
`Settings/Fields/Field.js` (row wrapper, comment, error-text, highlight), `Fields/LabelWrapper.js`
(label, required, parent-label), `Settings/Premium.js` (the upsell label). Legacy SCSS retired:
`modules/wizard/fields.scss` and `modules/wizard/premium-fields.scss` (ADR-005). The shipped
primitives are de-hardcoded to the new `--cmplz-accent-subtle` / disabled tokens in the same PR.

**OUT (later slices), with rationale:**

- **Settings-screen frame** — `SettingsGroup.js` (the card), `Settings.js` (two-column + footer +
  help sidebar), `Help.js`; SCSS `wizard.scss`, `wizard/notice.scss`. The card already draws its
  look from the relocated `legacy-globals.scss` (T-038) until Phase 5, so field rows migrate
  independently. This is the **immediately-following slice** (section 1b).
- **Panel / list accordion** — `Settings/Panel.js` + `.cmplz-details-row`; SCSS `wizard/panel.scss`.
  It is genuinely **cross-section** (consumed by cookie-database, integrations, processors,
  third-parties, plugins-overview — 8+ sites), so it migrates with those sections, **not** here.
  `.cmplz-radio-buttons__list*` in that file is dead code (no JS consumer) — drop on deletion.
- **Icon chrome** (`icons.scss`/`tooltip.scss`), the **composite section bodies** (`finish`,
  `plugins_overview`, `documents_menu`, `cookiedatabase_sync`, `create-documents`, `cookie_scan`),
  and the **`DocumentControl` raw URL `<input>` + loader divs** — handled in their own slices;
  in the field row the composites stay legacy and are shielded by marker discipline (§5).

## 3. New token proposal — 7 additions to `tokens.css`

One row per new token. **Legacy source** = the `--cmplz-legacy-*`/hardcoded value it replaces.
**Proposed** = the modernized, C-2-consistent value for sign-off. All are declared on the island
selector `:is(#complianz, #complianz-portal) :where([data-cmplz-ui])`, never `:root`
(ADR-001/004); none collides with the two reserved frontend-banner names.

### Status-surface tints (new family — the critical gap)

Field error rings, the save-highlight, `cmplz-comment-<status>` callouts and the radio-card
selected state all need a faded status background. The C-2 set has only the solid status hues.

| Token | Legacy source | Proposed | Use |
|---|---|---|---|
| `--cmplz-success-surface` | `green-faded #ecf4ed` | `#e9f6ec` | Save-highlight flash; success comment; selected radio-card tint. |
| `--cmplz-danger-surface` | `red-faded #fbebed` | `#fdebed` | Invalid-field halo (2px, paired with a solid `--cmplz-danger` border); error comment. |
| `--cmplz-warning-surface` | `yellow-faded #fdf4df` | `#fbf4da` | Caution comment; scan-status callout. |
| `--cmplz-accent-subtle` | `blue-faded #E7F1F9` | `#e3f2ff` | Info comment; **and** the interactive selected/hover tint (toggle-on, selected option, segmented-on) — **replaces the `#E7F1F9` hardcoded 7× in the shipped primitives.** |

Each is a light wash derived from its C-2 hue (success `#1f7a34`, danger `#d7263d`, warning
`#eab308`, accent `#009fff`), so they sit coherently inside the Phase-3 modernized shell rather
than carrying the old palette forward. Body text (`#0f172a`) stays ≥15:1 on every tint.

### Disabled state

| Token | Legacy source | Proposed | Use |
|---|---|---|---|
| `--cmplz-surface-disabled` | `grey-200 #f7f7f7` | `#f1f5f9` | Disabled field surface — **replaces `#f7f7f7` hardcoded ~5× in the primitives.** |
| `--cmplz-text-disabled` | `grey-400 #c6c6c6` | `#94a3b8` | Disabled text / labels — **replaces `#c6c6c6` hardcoded in the primitives.** A readable slate-400 vs the near-invisible legacy grey. |

### Spacing

| Token | Legacy source | Proposed | Use |
|---|---|---|---|
| `--cmplz-space-2xs` | `xxs 5px` | `4px` | The missing 4px-grid step for tight gaps (error-text icon gap, label/asterisk gap). |

**Not added (mapped to existing tokens):** the legacy `fs-200` (0.75rem) used by error-text /
comments maps to `--cmplz-font-size-sm` (0.8125rem); no new type-scale token. The focus ring
keeps its tokenized color (`--cmplz-accent-strong`) with a literal 2px geometry, matching the
shipped primitives; the error ring reuses `--cmplz-danger` (border) + `--cmplz-danger-surface`
(halo), keeping error visually distinct from focus.

## 4. State design (the behavior-bearing bits)

The legacy error/highlight styling lives in `fields.scss` as **wrapper → descendant** selectors
(`.cmplz-field-wrap.cmplz-error input {…}`, the `cmplz-highlight` `fadeIt` keyframes). Because the
inputs are now isolated primitive islands, these move to **primitive/row-level state**, not
wrapper SCSS:

- **Error:** the field renders its own `--cmplz-danger` border + `--cmplz-danger-surface` halo
  (driven by the existing `error`/`aria-invalid` path), and `Field.js` renders the `.error-text`
  row (icon + message) beneath. No cross-boundary descendant selector.
- **Save-highlight:** `Field.js`'s `cmplz-highlight` becomes a `--cmplz-success-surface` row flash
  via a tw- utility on the row (no `@keyframes` reaching into the input).
- **Comment:** `cmplz-comment-<status>` maps to the four tint callouts (info/success/warning/error).
- **Required / tooltip / premium:** `LabelWrapper`'s asterisk uses `--cmplz-danger`; the tooltip
  keeps the Phase-2 Radix Tooltip; `Premium.js`'s upsell becomes the `--cmplz-accent-subtle` pill.

## 5. Marker discipline (ADR-001, learnings 2026-10-11)

**No `data-cmplz-ui` on the field-row wrapper.** The row can still contain unmigrated composite
bodies (`finish`, `plugins_overview`, …) and the raw `document` URL `<input>`; marking the row
would push the (1,0,0) base reset onto those and strip their legacy styling with nothing to
restore (the T-038 regression). So the row chrome is styled with **`tw-` utilities + token-literal
fallbacks** (`var(--cmplz-space-m, 16px)`) — scoped by the `important:` config, not the marker —
exactly as the shell frame was. The input primitives keep their own self-marked islands.

## 6. Migration plan (T-045, runs after sign-off)

1. Add the 7 tokens to `tokens.css` on the island selector (+ confirm no banner-name collision).
2. Migrate `Field.js` + `LabelWrapper.js` + `Premium.js` chrome to `tw-` + token-literal fallbacks
   (no row marker); re-implement error / highlight / comment / required as primitive/row state (§4).
3. De-hardcode the shipped primitives (`TextField`, `Textarea`, `SelectInput`, `BorderInput`,
   `Combobox`, `SwitchInput`, `RadioGroup`, `CheckboxGroup`, `Menu/MenuItem`) to the new
   accent-subtle / disabled tokens; fix the stale JSDoc values while there.
4. Relocate any shared-global `fields.scss` rules to `legacy-globals.scss`, then delete
   `fields.scss` + `premium-fields.scss` and drop their `@import`s (ADR-005; no dangling).
5. Re-baseline the affected screenshots; evaluate axe gating (likely none yet — the screen frame
   and composite bodies remain legacy, so no whole-page body qualifies for `MIGRATED_SCREENS`).

Adversarial review + CI-green under the implement → review → commit → push gate.

---

## 7. Sign-off

Wizard-fields migration (T-045) starts only when this is approved.

- **Token values + field-row look approved:** [ ] — maintainer, ____________

Maintainer notes / requested changes:

```
(awaiting review)
```
