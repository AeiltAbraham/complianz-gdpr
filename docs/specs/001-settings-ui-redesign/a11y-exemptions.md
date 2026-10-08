# Retained-widget accessibility audit and §8.2 exemption table (T-015, S1 part 2)

Serves DB-12, SC-05, C-5. Depends on the T-009 axe inventory (77 serious/critical across
the legacy screens). This is the single audit of the seven third-party widgets feature 001
keeps and re-themes (C-5, Non-goals "Replacing specialized widgets"): react-date-range,
react-data-table-component, react-shepherd, react-color, CKEditor
(`@ckeditor/ckeditor5-*`), Ace (react-ace) and react-toastify.

The exemption table at the end is consumed by the axe gate
(`tests/e2e/admin/helpers/axe.js` → `EXEMPTIONS`), each row scoped to exactly one axe rule
on exactly one widget-root selector (never page-wide, never a whole-widget blanket mute).

## Method and its limits

For each widget, on the screen where the free edition actually renders it:

1. **axe** (`@axe-core/playwright`) run **scoped to the widget's own root** (`AxeBuilder
   .include(<widget root>)`), not page-wide, so only the widget's DOM is judged. Impacts
   below serious (moderate/minor) are recorded but never gate (§8.1).
2. **Keyboard pass driven programmatically with Playwright**: focus the first control, walk
   Tab/Shift-Tab, record the focus order (tag/role/accessible-name of each stop), whether
   focus is trapped where it should be, and whether Escape closes the overlay.
3. **ARIA / screen-reader analysis from the rendered markup** — roles, names and states read
   off the live DOM. **This is a markup analysis, not a live assistive-technology pass.** It
   is reliable for "is there an accessible name / role / state", but it does **not** prove
   the announced experience. Every widget below is flagged for whether a true manual
   **NVDA / VoiceOver** pass is still required before its Phase 4 migration lands.

Evidence was gathered in one wp-env run (latest WordPress, en_US admin, fresh DB) with a
throwaway Playwright spec that opened each widget, ran the scoped axe analysis and the
keyboard walk, and captured the rendered markup; the spec was deleted afterward (not part of
the suite). Two widgets could not be reached on a fresh install and are analysed from source
plus library behaviour, and are flagged **LIVE AUDIT PENDING** (see react-toastify toast
state and CKEditor).

## Verdict rules applied

- A serious/critical finding whose DOM node is **rendered by the third-party library**
  (the widget's internal DOM) is a candidate for the exemption table. If it can be removed
  via the library's props/config or our vendor CSS/wrapper, it is **fixable in Phase 4** and
  carries a scoped exemption row now (removed when the fix lands). If it cannot, it is a
  **replacement candidate** (per C-5) and goes to the maintainer — this audit does **not**
  pick the replacement.
- A serious/critical finding whose DOM node is **rendered by our own React components**
  (our wrappers / labels / markup) is **must-fix**, never an exemption — even when it
  surfaces inside a third-party widget (e.g. a select-all checkbox we inject into a data
  table). These are listed in "Our-own-code must-fix findings".

## Summary

| Widget | Screen audited | Serious/critical (widget-internal) | Fixable in Phase 4 | Replacement candidate | Our-own-code must-fix nearby | Needs manual AT pass |
|---|---|---|---|---|---|---|
| react-color (ChromePicker) | `#banner/colors/colors-general` | 1 | 1 | 0 | – | Yes (keyboard colour-canvas) |
| react-date-range | `#tools/data-requests/datarequest-entries` | 3 findings / 8 nodes | 3 | 0 | – | Yes |
| react-data-table-component | `#tools/data-requests/datarequest-entries` | 0 (library) | 0 | 0 | 1 (our select-all checkbox) | Recommended |
| react-shepherd (tour) | tour over `#dashboard` | 1 | 1 | 0 | – | Yes |
| react-ace | `#tools/tools-documents/tools-documents-css` | 0 | 0 | 0 | – | Yes (code-grid SR support) |
| react-toastify | `#settings/settings-general` | 0 (container) | 0 | 0 | – | Yes (live toast — PENDING) |
| CKEditor 5 | `#tools/data-requests` (settings group) | LIVE AUDIT PENDING | – | – | 1 (HTML-view textarea) | Yes (PENDING) |

Totals: **5 widget-internal serious/critical findings** carried as scoped exemptions (all
fixable in Phase 4), **0 replacement candidates at this time** (one conditional — see
CKEditor), **2 our-own-code must-fix findings**.

---

## react-color (ChromePicker) — `settings/src/Settings/Inputs/ColorPicker.js`

Rendered by `ColorPickerElement.js` inside a Radix popover on the banner colour screens
(`#banner/colors/colors-general`, `/colors-toggles`, `/colors-buttons`). Root:
`.chrome-picker`.

### axe (scoped to `.chrome-picker`)

| Rule | Impact | Node | Verdict |
|---|---|---|---|
| `color-contrast` | serious | `label[for="rc-editable-input-1"]` — the HEX/R/G/B field labels, `#969696` on `#fff` = 2.95:1 (needs 4.5:1) | **fixable in Phase 4** |

The label colour is an **inline style react-color writes at runtime** (`color: rgb(150,150,
150)`), so it is the widget's internal DOM, not our markup.

### Keyboard pass

Tab order inside the open picker is the HEX and R/G/B `<input>`s only (10 focus stops, all
`<input>`). The **saturation square and hue strip are plain `<div>`s** — not focusable and
not keyboard-operable (axe does not flag this; it is a custom-widget keyboard gap). A
keyboard user can still set any colour by typing into the HEX / RGB inputs, so a keyboard
alternative exists, which is why this is not a replacement trigger — but it must be confirmed
by a real AT pass.

### ARIA / SR markup analysis

Inputs are associated by `<label for>` (axe raised no `label` finding), so each field has an
accessible name. The colour canvas has no `role`/`aria` and no text alternative for the
current value beyond the HEX input. **Markup analysis only — needs a live NVDA/VoiceOver
pass** to confirm the HEX input is a sufficient announced path.

### Phase 4 fix

ChromePicker accepts a `styles` prop; override the `.chrome-picker` label colour to a
token that meets 4.5:1 (e.g. `--cmplz-*` text token), then drop the exemption row. Consider
exposing a labelled text input for the chosen colour value as the documented keyboard path.

---

## react-date-range — `settings/src/DateRange/DateRange.js`

Opened from `#cmplz-date-range-picker-open-button` into a MUI `Popover`; used by
`ExportDatarequests.js`, `ExportRecordsOfConsent.js` and the Statistics screen. Root:
`.rdrDateRangePickerWrapper`. The theme is our vendored copy at
`assets/css/admin/modules/date-range.scss` (ADR-009 vendor pipeline); the offending DOM
nodes are react-date-range's.

### axe (scoped to `.rdrDateRangePickerWrapper`)

| Rule | Impact | Node(s) | Verdict |
|---|---|---|---|
| `button-name` | critical | `.rdrPprevButton`, `.rdrNextButton` — the prev/next month icon buttons (`<button><i></i></button>`, no text/aria) | **fixable in Phase 4** |
| `select-name` | critical | `.rdrMonthPicker > select`, `.rdrYearPicker > select` — month/year dropdowns, no label | **fixable in Phase 4** |
| `color-contrast` | serious | `.rdrDateDisplayItem input` (start/end date fields, ~1.3:1) and `.rdrStaticRangeLabel` (preset labels "Today"/"Yesterday", ~1.29:1) | **fixable in Phase 4** |

### Keyboard pass

The eight preset ranges are real `<button>`s with text and are reachable and named
("Today" … "Year to date"). The start/end date `<input>`s, the prev/next buttons and the
month/year `<select>`s are all in the tab order, but the prev/next buttons and the selects
have **no accessible name** (the findings above). **Escape closes the picker** (handled by
the MUI Popover — `escapeClosed: true`). Day-grid arrow-key navigation was not exercised and
needs the manual pass.

### ARIA / SR markup analysis

Month/year selects and prev/next buttons expose no name to SR (confirmed by `select-name` /
`button-name`). The day cells are buttons with visible numbers. **Markup analysis only — a
live NVDA/VoiceOver pass on the day grid and range announcement is required.**

### Phase 4 fix

react-date-range exposes an **`ariaLabels` prop**
(`{ prevButton, nextButton, monthPicker, yearPicker, dateInput }`) — pass translated labels
to clear `button-name` and `select-name` with no DOM wrapper. Fix the two contrast values in
the vendored `date-range.scss` (date-input text and preset-label colours) to meet 4.5:1.
Then drop these exemption rows.

---

## react-data-table-component — e.g. `settings/src/Settings/DataRequests/DatarequestsControl.js`

Used on seven controls (integrations services/plugins, data requests, records of consent,
proof of consent, processing agreements, data-breach reports). Root: `.rdt_Table`
(`[role="table"]`). Audited on `#tools/data-requests/datarequest-entries`.

### axe (scoped to `[role="table"]`)

| Rule | Impact | Node | Verdict |
|---|---|---|---|
| `button-name` | critical | `button#undefined_true.cmplz-checkbox-group__checkbox` (the select-all header checkbox) | **OUR CODE → must-fix (not exempted)** |
| `empty-table-header` | minor | sortable header of the checkbox column | recorded only (not gated) |

**The react-data-table-component library itself produced no serious/critical finding** — its
`role="table"/row/columnheader/cell` structure is sound. The only critical is **our own**
`CheckboxGroup` component (`settings/src/Settings/Inputs/CheckboxGroup.js`), which
`DatarequestsControl.js` renders as the table's select-all and per-row selector with no `id`
and no `label`/`aria-label` and an empty option label — so it builds `id="undefined_true"`
and an empty `<label>`, leaving the checkbox with no accessible name. See must-fix below. No
exemption row for this widget.

### Keyboard pass

Column headers (`role="columnheader"`, `tabindex="-1"`) and the select-all checkbox are
reachable; the surrounding controls (search, export, pagination) are standard focusable
controls. Our select-all button (`role="checkbox"`) is reachable but **unnamed** (the
must-fix). Pagination was not present (no data rows); confirm in the manual pass.

### ARIA / SR markup analysis

Library grid roles are correct. The blocking gap is our unnamed checkbox. **Markup analysis
only — a live AT pass on sort/select/pagination announcements is recommended** once the
must-fix lands.

---

## react-shepherd (guided tour) — `settings/src/Tour/Tour.js`

Launched with the `?tour` query param; the step renders as `.shepherd-element`
(`role="dialog"`) centred over the dashboard. Our theme is
`assets/css/admin/modules/shepherd.scss` (`.cmplz-shepherd`).

### axe (scoped to `.shepherd-element`)

| Rule | Impact | Node | Verdict |
|---|---|---|---|
| `color-contrast` | serious | `.shepherd-footer .shepherd-button.button-default` — footer buttons, `#3858e9` text on `#333` background = 2.25:1 | **fixable in Phase 4** |
| `landmark-no-duplicate-contentinfo` | moderate | `footer.shepherd-footer` (Shepherd uses a second `<footer>`) | recorded only (not gated) |

The low contrast comes from **our** theme (`.cmplz-shepherd { background:#333 }` combined
with the WP `button button-default` link-blue text chosen in `Tour.js`) applied to
**Shepherd's internal `.shepherd-button` DOM**. The node is widget-internal, so it is
exemptable; the fix, however, is entirely ours (re-theme), so it is scheduled for Phase 4
and the row is removed then.

### Keyboard pass

Focus is **trapped and cycles** across the three controls: Close-Tour icon → "Configure" →
"Start tour" → back. **Escape closes the tour** (`escapeClosed: true`). Note: `Tour.js` sets
`keyboardNavigation: false`, which disables Shepherd's own arrow/Enter step navigation — a
config choice to revisit in Phase 4 (enabling it restores keyboard step-through).

### ARIA / SR markup analysis

Good: `role="dialog"`, `aria-labelledby` → title, `aria-describedby` → body, and the close
icon carries `aria-label="Close Tour"` with the `×` glyph `aria-hidden`. **Markup analysis
only — a live pass should confirm focus moves into the dialog on open and returns on close,
and that `useModalOverlay:false` does not leave background content announced.**

### Phase 4 fix

Re-theme the Shepherd buttons (token-based background/foreground meeting 4.5:1); reconsider
`keyboardNavigation` and the single-`<footer>` landmark. Then drop the exemption row.

---

## react-ace — `settings/src/Settings/Editor/AceEditorControl.js`

`css`-type fields (banner Custom CSS, Document CSS) and the integrations Script Center.
Audited on `#tools/tools-documents/tools-documents-css`. Root: `.ace_editor`.

### axe (scoped to `.ace_editor`)

**No serious/critical (or any) violations.** Ace renders a real `<textarea
role="textbox">` with a dynamic `aria-label` ("Cursor at row N"); the gutter is
`aria-hidden`.

### Keyboard pass

The `.ace_text-input` textarea is the first and correct focus stop and is editable by
keyboard; focus then moves to the normal page controls. No trap, no Escape concern.

### ARIA / SR markup analysis

The textarea is labelled and has `role="textbox"`; the syntax-highlighted lines live in
`aria-hidden` layers, so a screen reader reads the editing textarea, not the decorative
grid — standard Ace behaviour. **Markup analysis only — a live NVDA/VoiceOver pass is
advisable** to confirm the editing experience (Ace's SR support for the code content is
known to be limited), but there is **nothing to exempt**.

---

## react-toastify — `settings/src/Page.js`

`ToastContainer` is mounted once, bottom-right, on every screen. Root: `.Toastify`.

### axe (scoped to `.Toastify`)

**No violations.** The empty container is clean. A **live toast could not be raised** in the
audit run (no autosave toast fired from a field toggle), so the toast body itself was not
scanned — **LIVE AUDIT PENDING**.

### ARIA / SR markup analysis (from library + source)

react-toastify renders each toast with `role="alert"` inside an `aria-live` region and a
close control with `aria-label="close"`; we use `theme="light"`. The likely risk on a live
toast is `color-contrast` of the light theme text and of the close/progress elements.

### Follow-up

Before the first screen that shows toasts enters `MIGRATED_SCREENS`, run a scoped axe pass
on a visible `.Toastify__toast` and a manual AT pass (is the toast announced; is the
auto-dismiss timing acceptable). No exemption is recorded until a real finding exists —
adding a speculative row would be a blanket mute, which is forbidden.

---

## CKEditor 5 — `settings/src/Settings/Editor/Editor.js`

`editor`-type field. The only such field in the free edition is
`notification_email_content` on the Data Requests settings group, gated by
`cmplz_datarequests_or_dnsmpi_active()` — **not active on a fresh install, so CKEditor could
not be reached in the audit run. LIVE AUDIT PENDING** (enable Data Requests, then scope axe
to `.ck-editor` and run the keyboard + AT pass before this screen's Phase 4 work).

### Analysis from source + library

CKEditor 5 is accessibility-audited upstream (toolbar buttons carry `aria-label`s, the
editable is `role="textbox"` with an `aria-label`, Alt+F10 reaches the toolbar), so **no
serious/critical is expected from the library**; this must be confirmed live. If the live
pass surfaces an unfixable serious/critical in CKEditor's own DOM, it becomes a **C-5
replacement candidate for the maintainer** — do not decide it here.

### Our-own-code finding (independent of CKEditor)

In HTML view, `Editor.js` renders `<textarea rows="8">` with **no label / aria-label** →
must-fix (see below).

---

## Our-own-code must-fix findings (never exempted)

| # | Finding | Rule | Where (our code) | Fix |
|---|---|---|---|---|
| 1 | Data-table select-all / per-row checkbox has no accessible name (`id="undefined_true"`, empty `<label>`, empty `aria-label`) | `button-name` (critical) | `CheckboxGroup.js` used as a data-table selector in `DatarequestsControl.js` (and the other `react-data-table-component` controls that pass it as the selector) | Pass a unique `id` and a real accessible name (`label`/`aria-label`, e.g. "Select all data requests" / "Select data request"); make `CheckboxGroup` fall back to a generated id and require a name when the option label is empty |
| 2 | HTML-view editor textarea has no label | `label` / `aria-input-field-name` | `Editor.js` `<textarea rows="8">` | Associate a `<label>` / `aria-label` with the textarea |

These are tracked for Phase 2/4 (primitives + screen migration) and must be **fixed, not
exempted**, before their screens enter `MIGRATED_SCREENS`.

## Replacement candidates for maintainer sign-off (C-5 gate)

**None at this time.** Every widget-internal serious/critical finding is fixable via library
props/config or our vendor CSS (react-color `styles`, react-date-range `ariaLabels` +
vendored contrast, react-shepherd re-theme). One **conditional** item remains: CKEditor 5
has not had a live pass; if its forthcoming audit finds an unfixable serious/critical in its
own DOM, that becomes the only replacement candidate — to be raised with the maintainer then.

---

## §8.2 exemption table (consumed by the axe gate)

Shape: **axe rule ID | impact | widget root selector | reason**, each row scoped to exactly
that rule on exactly that selector. These mirror `EXEMPTIONS` in
`tests/e2e/admin/helpers/axe.js`. Each row also carries the migrated `screen` it applies to
(the gate activates per screen from Phase 3; add the same row to any further migrated screen
that renders the widget — listed in each widget section above). Every row here is a
**widget-internal, fixable-in-Phase-4** finding and is removed when its fix lands; our-own-
code findings are deliberately absent (they are must-fix).

| axe rule ID | impact | widget root selector | screen | reason |
|---|---|---|---|---|
| `color-contrast` | serious | `.chrome-picker` | `#banner/colors/colors-general` | react-color inline-styles the HEX/RGB field labels at 2.95:1; widget-internal DOM, overridable only via the ChromePicker `styles` prop (Phase 4) |
| `button-name` | critical | `.rdrMonthAndYearWrapper` | `#tools/data-requests/datarequest-entries` | react-date-range prev/next month icon buttons render `<button><i></i></button>` with no name; fixable via the library `ariaLabels` prop (Phase 4) |
| `select-name` | critical | `.rdrMonthAndYearPickers` | `#tools/data-requests/datarequest-entries` | react-date-range month/year `<select>`s render without a label; fixable via the library `ariaLabels` prop (Phase 4) |
| `color-contrast` | serious | `.rdrDateDisplayWrapper` | `#tools/data-requests/datarequest-entries` | react-date-range start/end date inputs at ~1.3:1; fixable in the vendored `date-range.scss` (Phase 4) |
| `color-contrast` | serious | `.rdrDefinedRangesWrapper` | `#tools/data-requests/datarequest-entries` | react-date-range preset-range labels at ~1.29:1; fixable in the vendored `date-range.scss` (Phase 4) |
| `color-contrast` | serious | `.shepherd-footer` | `dashboard` | Shepherd footer buttons at 2.25:1 from our `.cmplz-shepherd` theme on the widget's internal button DOM; fixable by re-theming (Phase 4) |

### How the axe spec consumes this table

`tests/e2e/admin/helpers/axe.js` holds these rows in `EXEMPTIONS`.
`unexemptedViolations(violations, pageInfo, page)` drops a serious/critical node only when a
row matches the page's hash **or** section **and** the rule **and** the offending node is
inside that row's `selector` (verified in the live DOM with `element.closest(selector)`), so
the exemption is scoped per **(rule, selector)** — never page-wide, never a whole-widget mute
of all rules. A node outside every matching selector (e.g. one of the two our-own-code
findings) stays a failure, so an exemption can never silence our own markup. `EXEMPTIONS` is
inert until a screen is added to `MIGRATED_SCREENS` (Phase 3+); on today's legacy UI the axe
layer only records.
