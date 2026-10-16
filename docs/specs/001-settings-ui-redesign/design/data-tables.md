# 001 — Data tables design note & section sign-off record

| | |
|---|---|
| Stage | H (Phase 4 — screens), section 5 of 7: **Tools/Settings data tables** (the 7 `react-data-table` consumers) |
| Produced by | T-053 (this note + `data-tables-preview.html`) |
| Status | **Proposal — awaiting maintainer sign-off** (the boxes at the end) |
| Serves | C-2, DB-11; Stage-H data-tables gate |
| Related | ADR-009 (vendor CSS import + autoscope — this section **partially** implements it, §3), ADR-001 (island/isolate), ADR-004 (token hygiene), ADR-005 (SCSS retirement), ADR-007 (logical), ADR-008 (the preview.css precedent this follows) |

## 1. What this is — the react-data-table owner section

Seven screens render `react-data-table-component`, all styled by **one** shared legacy module,
`assets/css/admin/modules/datatables.scss`. Every prior section DEFERRED the table internals to here
because `datatables.scss` can only die when its **last** consumer migrates (ADR-005). This section is
that last consumer: it restyles all 7 tables on the C-2 tokens, fixes the table a11y must-fixes, and
deletes `datatables.scss` (+ two co-located table SCSS files) in the coupled PR.

**The 7 consumers** (field-type → class, via `Field.js:102-191,304`):
- **Integrations group (2):** `ServicesControl` (`.cmplz-integrations-services`), `PluginsControl`
  (`.cmplz-integrations-plugins`) — SwitchInput cells, no select column. *(T-052 left these untouched.)*
- **Tools group (5):** `DatarequestsControl`, `ProcessingAgreementsControl`, `DataBreachReportsControl`,
  `ProofOfConsentControl`, `RecordsOfConsentControl` — a custom CheckboxGroup select-all column + bulk bar.

Reserved sign-offs (the boxes in §11): **(G1)** the **pipeline-depth decision** (§3 — the big one);
**(G2)** the **table LOOK** (§4), zero-new-tokens folded in. Nothing migrates (T-054) until both are ticked.

## 2. Scope

**IN (this section):** the table INTERNALS of all 7 consumers — the `.rdt_*` shell styling, zebra/hover,
cell padding/borders, the edge-to-edge full-bleed, pagination, the select-column width, the search input,
the empty/loading state — restyled on C-2 tokens; the **a11y must-fixes** (§6); the **ADR-005 deletions**
(§7). All in-cell controls are **already-migrated primitives** (SwitchInput, CheckboxGroup) — not re-migrated,
only given accessible names (§6).

**OUT / deferred (grounded in §3):**
- The **postcss auto-scope build step** (`postcss-prefix-selector` + `postcss-rtlcss`), **`readToken()`**,
  and **`createTheme()`** → the **Statistics/DateRange** section (their first real consumers: react-date-range
  has upstream CSS that needs auto-scoping; chart.js canvas needs `readToken()`). See §3.
- The **non-table Tools bodies** (support/debug, placeholders, tools-documents, multisite, security,
  tools-data, Statistics, settings-general/cd) and the sibling Create/Export forms on the table screens —
  other/later slices (they share `.cmplz-table-header` via `documents.scss`, which stays).
- The 3 **premium** tables (processing-agreements, data-breach-reports, records-of-consent) render **locked**
  in the free edition (no `.rdt_` DOM) — their customStyles/CSS migrate but are **code-review-only**, never
  visually/axe-verified in free (re-verified only if premium adopts the work).

## 3. The pipeline-depth decision (G1 — the big one)

My earlier framing said this section "lands the full ADR-009 pipeline — postcss-prefix-selector/postcss-rtlcss
+ the autoscope step + readToken()." **The investigation shows the data table does not actually exercise any
of that machinery**, so I'm bringing you a corrected, smaller proposal.

**Why the data table is the trivial vendor case:** it uses `styled-components` (runtime-injected CSS), so it
has **no upstream library stylesheet to import or auto-scope** (unlike react-date-range/toast/shepherd). Its
override styling is fully **CSS-expressible** against the stable `.rdt_*` classes (that's exactly what
`datatables.scss` does today). The field-wrap it renders in is **markerless** (`Field.js`, T-045), so a scoped
override file resolves tokens via **literal fallbacks** — the **exact `preview.css` pattern** (ADR-008), which
ADR-009 already blesses for an "overrides-only" vendor file. No JS color is fed to styled-components, so
**`readToken()` is not needed here**; its first real need is chart.js's canvas (next section).

| | **Option A — build it all now** (my earlier framing / plan.md literal) | **Option B — land what the table needs; defer the infra** (RECOMMENDED) |
|---|---|---|
| postcss-prefix-selector + postcss-rtlcss + the build step | install + wire now | **defer** to Statistics/DateRange (react-date-range = its first real upstream-CSS consumer) |
| `readToken()` | implement now | **defer** to Statistics/DateRange (chart.js canvas = its first real need) |
| `createTheme('really-simple-plugins')` | register now | **not needed** — the inert `theme=` prop stays inert; styling lives in the scoped CSS |
| data-table vendor styling | a scoped override file | a scoped override file `vendors/data-table.css` (hand-authored, logical, token-literals — the preview.css pattern) |
| new npm deps / isolate zone | yes / yes | **none / no isolate zone** (an isolate zone would strip our in-cell primitives — the markerless-Button lesson) |
| risk / validation | speculative infra validated against a consumer that doesn't use it | minimal, validated against its real consumer |

**Recommendation: Option B.** It is YAGNI-correct, lower-risk, and the heavy ADR-009 machinery lands in the
section where it is first genuinely exercised (and can be validated). It does **not** overturn ADR-009 — it
refines "the data-table vendor file is overrides-only" into "a hand-authored scoped override file (preview.css
pattern)," and records that the autoscope step + readToken() land with their first real consumer. If you
prefer Option A (build the full pipeline now, even unused), say so and I'll land it.

*(This is the one genuine plan-scope reinterpretation; everything else follows the established cadence.)*

## 4. The table LOOK (G2 — the design sign-off)

`data-tables-preview.html` renders the table on the approved tokens. The port of `datatables.scss` (all
values → C-2 tokens, logical properties, token-literal fallbacks):

- **Header row** — `--cmplz-text-muted` uppercase-free labels, weight 600, a `--cmplz-border` bottom divider;
  sort affordance preserved.
- **Rows** — zebra odd-row `--cmplz-surface-sunken` (was `grey-200` #f7f7f7), hover `--cmplz-surface-sunken`
  (slightly deeper), row padding on the 4px grid (`--cmplz-space-xs`), a `--cmplz-border` row divider.
- **Cells** — `--cmplz-text`; first/last cell inline padding `--cmplz-space-l`; the **edge-to-edge full-bleed**
  reconciled to the migrated field-wrap padding (24px `--cmplz-space-l`, closing the ~1px seam T-045 deferred);
  the 35px **select-column** width kept; status pills (`.cmplz-status-*`) keep their min-width.
- **Search input** — the migrated field look (border/radius/padding on tokens); **subheader** bulk-action bar
  on tokens; **pagination** chrome on tokens (the wp-core duplicate select-arrow stays hidden).
- **Empty / loading** — `.cmplz-no-documents` empty state + the placeholder skeleton on `--cmplz-surface-sunken`.
- **In-cell primitives** — SwitchInput / CheckboxGroup unchanged (already migrated); shown in-cell on tokens.
- **RTL** — logical properties throughout (was physical `margin-left/right`).

**Dead rules dropped** (not ported): the `input[type="checkbox"]` sizing block (`datatables.scss:14-24`) — the
migrated CheckboxGroup renders a **Radix button, not a native `<input>`**, so those rules match nothing.

**Zero new tokens** — the C-2 set covers it (surface/surface-sunken/border/text/text-muted + the 4px spacing +
status). `tokens.css` stays byte-unchanged (matching dashboard/consent-banner/integrations). No
`--cmplz-legacy-`/`--rsp-` names anywhere in the new vendor CSS (literals + file:line refs — ADR-004 gate).

## 5. The scoped vendor CSS (`vendors/data-table.css`) — the preview.css pattern

New file `settings/src/styles/vendors/data-table.css`, `@import`ed in `tailwind.css` after `preview.css`,
inlined by the existing postcss-import (no new build step under Option B):
- Scoped to `:is(#complianz,#complianz-portal) :is(.cmplz-integrations-services, .cmplz-integrations-plugins,
  .cmplz-datarequests, .cmplz-processing-agreements, .cmplz-data-breach-reports, .cmplz-records-of-consent,
  .cmplz-proof-of-consent) .rdt_*` (the 7 field-wrap classes) — like `datatables.scss` but token-driven.
- Token refs carry **literal fallbacks** (`var(--cmplz-surface-sunken,_#f1f5f9)`) — the `.rdt_*` markup is in
  the **markerless** field-wrap, so the literal applies now and auto-upgrades to the token at the Phase-5
  marker move (the preview.css/Field.js precedent).
- **No isolate zone.** The table has no upstream CSS to protect, and an `[data-cmplz-isolate]` zone would
  exclude our in-cell SwitchInput/CheckboxGroup from the base reset (stripping their box-sizing/border/font —
  the markerless-Button lesson). The in-cell primitives self-mark `data-cmplz-ui` and work as-is.
- **preview.css stays untouched and excluded** (it's a separate direct `@import`; no postcss step touches it).

## 6. The a11y must-fixes (must-fix, part of the migration)

1. **Select-column CheckboxGroup** (the 5 Tools consumers) — today the select-all header **and every row**
   checkbox render `id="undefined_true"` with an empty `<label>` (duplicate ids + no accessible name =
   axe **button-name critical**, T-015). Fix: pass a **unique `id`** (per screen for the header, per row for
   the selector) + a real **aria-label** ("Select all data requests" / "Select row N"); harden
   `CheckboxGroup.js` to generate an id and accept a name when the option label is empty — **without
   regressing** its other (cross-section) users.
2. **In-cell SwitchInput** (the 2 Integrations consumers) — a **second, un-inventoried** must-fix the T-015
   audit missed: the enable/placeholder SwitchInputs in the Services/Plugins cells render a Radix
   `role="switch"` button with **no accessible name**. Fix: pass an `aria-label` (the row's service/plugin name).
   Requires a **fresh scoped axe pass** on the Integrations tables before they enter MIGRATED_SCREENS.

## 7. ADR-005 deletions + survivor relocation + the full-bleed seam

- **Delete** (last consumer migrates here): `assets/css/admin/modules/datatables.scss` + its `admin.scss`
  `@import`; the co-located `DataRequests/requests.scss` (email-column wrap — port the `white-space:inherit`
  into the vendor CSS) and `ProofOfConsent/ProofOfConsentControl.scss` (already **stale/dead** — it targets the
  old CheckboxGroup BEM classes the Radix version no longer emits, and uses `--cmplz-legacy-*`).
- **`modules/integrations/integrations.scss`** (table-chrome: `.cmplz-table-header`, `.cmplz-settings-overlay`,
  `.cmplz-integrations-placeholder`) is **cross-section** — survivors **outside** the 7 keep it alive
  (`CookieScanControl` emits `.cmplz-table-header`; `ScriptCenterControl` keeps `.cmplz-settings-overlay` as a
  hook). So **relocate** the surviving rules to `legacy-globals.scss` (the T-045 pattern) and delete the file,
  rather than deleting rules with live consumers. **Grep ALL consumers (JS + `settings/config/*.php` + e2e)
  before any delete** (the T-046 `.no-background` landmine).
- **Full-bleed seam:** `Field.js` pads the field-wrap 24px (`--cmplz-space-l`) while `datatables.scss` pulls
  `-25px` (legacy `spacing-l`); the vendor CSS reconciles to **-24px** so the table is cleanly edge-to-edge.

## 8. MIGRATED_SCREENS + re-baseline

- **axe MIGRATED_SCREENS** (currently empty): this is the first section that can add table screens. Propose
  entering **`#integrations/integrations-services`, `#integrations/integrations-plugins`** (after the
  SwitchInput-name fix) and **`#tools/proof-of-consent`** (after the select-all fix). **Defer
  `#tools/data-requests`** — it embeds the still-legacy react-date-range whose 4 serious/critical remain
  exempt until the date-range section. The react-data-table library itself is axe-clean (no exemption row).
- **Re-baseline** (reset wp-env DB + fresh build + `--update-snapshots`, admin + admin-rtl, 1440 + 768;
  non-blocking Option B): the **4 free table screens** whose internals now change —
  `#integrations/integrations-services`, `#integrations/integrations-plugins`,
  `#tools/data-requests`, `#tools/proof-of-consent` (the discoverable 2-segment hashes). The 2 Integrations
  tables **intentionally drift** now (their T-052 baseline kept the internals legacy-styled). Premium locked
  screens + the banner-preview isolation shots: unchanged (spot-verify).

## 9. Migration plan (T-054, after sign-off — assumes Option B)

1. Create `settings/src/styles/vendors/data-table.css` (§4/§5); `@import` it in `tailwind.css` after
   `preview.css`; add it to the CI stylelint file list (`checks.yml`).
2. Restyle: port `datatables.scss` → the vendor CSS (tokens, logical, literals; drop the dead `input[type=checkbox]`
   block; reconcile the full-bleed). No consumer JS style changes needed for the look (CSS-driven); keep the
   padding-only customStyles (or move to CSS).
3. a11y (§6): CheckboxGroup id/aria-label across the 5 Tools consumers + harden CheckboxGroup.js; SwitchInput
   aria-label in Services/Plugins.
4. ADR-005 (§7): delete `datatables.scss` + `requests.scss` + `ProofOfConsentControl.scss` + drop imports;
   relocate the `integrations.scss` survivors to `legacy-globals.scss`; grep ALL consumers first.
5. axe: add the agreed screens to MIGRATED_SCREENS; fresh scoped axe pass on Services/Plugins. Re-baseline the
   4 free screens. Restore compiled output (ADR-006).

Adversarial pre-push review (5-dimension workflow, each finding verified) → CI-green.

---

## 10. Reserved decisions summary

- **G1 — pipeline depth:** Option A (build the full postcss+readToken+createTheme pipeline now) vs **Option B
  (recommended): land only the scoped `data-table.css` override file + the a11y fixes; defer the autoscope step
  + readToken() + createTheme to Statistics/DateRange.**
- **G2 — the table LOOK + zero new tokens** (§4).

## 11. Sign-off

Data-tables migration (T-054) starts only when **both** are approved.

- **G1 — pipeline depth (Option A / Option B):** [x] — maintainer, 2026-10-16, choice: **Option B** (land the scoped `data-table.css` + a11y fixes + SCSS deletions now; defer the postcss autoscope step + readToken() + createTheme to Statistics/DateRange).
- **G2 — table LOOK + zero new tokens:** [x] — maintainer, 2026-10-16, AS PROPOSED.

Migration (T-054) authorized to run autonomously under the implement → adversarial-review → commit → push →
CI-green gate.

Maintainer notes / requested changes:

```
Approved as proposed (Option B). Proceed autonomously through T-054.
```
