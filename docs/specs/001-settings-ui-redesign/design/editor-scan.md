# 001 — Editor & scan bodies design note & sign-off record (Stage H.5, Bundle H2)

| | |
|---|---|
| Stage | H.5 (composite-body completion), Bundle **H2 — Editor & scan** (the heaviest) |
| Bodies | `Editor` (CKEditor WYSIWYG + Ace code editor), `CookieScan`, `WebSiteScan` (status + actions) |
| Produced by | this note + `editor-scan-preview.html` |
| Status | **Proposal — awaiting maintainer sign-off** (the box in §8) |
| Serves | C-2, C-5, DB-08, DB-12; Stage-H.5 → ADR-001 marker move → Bundle D |
| Related | ADR-001 (§4.1 isolate-zone table reserves `ckeditor` + `ace`), ADR-005, ADR-009, ADR-013/014, a11y-exemptions.md, learnings 2026-10-11/12/13/16 |
| wp-env ports | 8890 / 8891 (uncommitted `.wp-env.override.json`, git-excluded) |

## 1. What this is

These composite field-bodies were never assigned to a Phase-4 section and are still legacy (raw
`button button-default`, raw `<textarea>`, inline-SVG icons, dark Ace canvas) — the raw elements the base
reset B1/B4/B5 would strip once the ADR-001 marker moves onto `#complianz-app`. This bundle **applies the
already-approved C-2 system** to them so the marker move (and then Bundle D) is safe. **Zero new tokens.**

Two of the three bodies carry **retained third-party widgets** (C-5, "Replacing specialized widgets" is a
non-goal): **CKEditor 5** and **react-ace**. ADR-001 §4.1 already reserves the `data-cmplz-isolate="ckeditor"`
and `data-cmplz-isolate="ace"` zones for exactly these — so isolating them is executing the ADR contract,
not a new decision. The base reset (base.css B1–B5) already excludes `[data-cmplz-isolate]` and its
descendants, so inside a zone the widget renders exactly as upstream.

## 2. Where each body renders (re-baseline reachability)

| Body | Field type | Screen | Free-reachable? |
|---|---|---|---|
| `AceEditorControl` (Ace, mode=css) | `css` | `#tools/tools-documents/tools-documents-css` (Custom document CSS); also Script Center | **Yes** (Document CSS) |
| `Editor` (CKEditor) | `editor` | Data Requests → `notification_email_content`, gated by `cmplz_datarequests_or_dnsmpi_active()` | **No** on a fresh install (LIVE AUDIT PENDING, a11y doc) |
| `CookieScan` | `cookie_scan` | Wizard → `cookie-scan` step ("Website Scan") | **Yes** |
| `WebSiteScanStatus` / `WebSiteScanActions` | `websitescan_status` / `websitescan_actions` | **No free config exists** (grep: zero `websitescan_*` field configs) — premium-only | **No** |

Consequence: only **Document CSS (Ace)** and the **cookie-scan wizard step** re-baseline in the free e2e.
CKEditor and the WebSiteScan status/actions are migrated at source with full markerless + isolate
discipline but **cannot be visually verified in the free wp-env** — noted in §6/§7 as a known gap, same as
the a11y doc's "LIVE AUDIT PENDING" for CKEditor.

## 3. SCSS consumer analysis (ADR-005 — grep ALL consumers, JS + PHP + e2e)

Delete only **body-specific** rules; **relocate** anything with a surviving consumer to `legacy-globals.scss`.

| File / rule | Consumers found | Action |
|---|---|---|
| `modules/wizard/editor.scss` → `.cmplz-block-editor` | **none** (only compiled admin.css; no JS/PHP; CKEditor does not render it) | **DELETE** file + drop `@import` (dead) |
| `Editor/Editor.scss` → `.ck.ck-powered-by{display:none}` | CKEditor internal DOM (Editor.js only) | **MOVE** into the `ckeditor` isolate scope (a co-located `Editor.scss` kept but rescoped, or fold to a scoped block); hide stays |
| `Editor/AceEditor.scss` → `.cmplz-editor-disabled`, `.ace-monokai .ace_comment` | AceEditorControl.js only (`.ace_comment` = Ace internal DOM) | **MOVE** into the `ace` isolate scope; disabled-opacity → tw- on wrapper |
| `modules/cookiescan.scss` → `#cmplz-scan-progress`, `.cmplz-progress-bar` | **shared**: Dashboard `ProgressBlock.js` (migrated), `CookieDatabaseSyncControl.js` (legacy), CookieScan | **RELOCATE** to legacy-globals (never delete) |
| `modules/cookiescan.scss` → `#cmplz-sync-progress`, `.cmplz-sync-progress-bar` | `CookieDatabaseSyncControl` sync bar (premium/legacy) | **RELOCATE** to legacy-globals |
| `modules/cookiescan.scss` → `button.button.cmplz-reset-button` | **11 consumers** (DataRequests, RecordsOfConsent, ThirdParties, ProofOfConsent, Processors, ProcessingAgreements, DataBreachReports, Cookiedatabase, Integrations/ThirdPartyScript, CookieScan…) | **RELOCATE** to legacy-globals (heavily shared — the T-030/T-046 landmine) |
| `modules/cookiescan.scss` → `.cmplz-cookiedatabase-controls` | `CookieDatabaseSyncControl.js` (not this bundle) | **RELOCATE** to legacy-globals |
| `modules/cookiescan.scss` → `.cmplz-cookie-scan` (hyphen) block | **dead** (only a commented `attachTo` in Tour.js; the field class is `.cmplz-cookie_scan`, underscore) | **DELETE** (dead) |
| `WebSiteScan/WebSiteScanStatus.scss` → `.cmplz-wsc-status-*`, `.cmplz-wsc-alert-*` | WebSiteScanStatus.js only | **DELETE** file (migrated to tw-), drop import |
| `WebSiteScan/WebSiteScanActions.scss` → `.cmplz-wsc_actions-*` | WebSiteScanActions.js only | **DELETE** file (migrated to tw-), drop import |

After relocation, `modules/cookiescan.scss` is empty → **DELETE** file + drop its `@import`. `.cmplz-table-header`
(CookieScan button row) is **already relocated** to legacy-globals (T-054) and shared — keep the hook.
`.cmplz-wscscan-alert` (the `<Alert>` component) and `.cmplz-panel__list` (the `<Panel>` cookie list) are
**shared retained chrome** (suggested-plugins.scss / wizard/panel.scss) — left for the H5 consolidation.

## 4. Per-body migration (markerless → `var(--cmplz-x, <literal>)`; marker discipline)

**AceEditorControl (Ace).** Wrap the editor in `data-cmplz-isolate="ace"` (ADR-001 §4.1). Frame it in a C-2
field container: `tw-rounded-[var(--cmplz-radius-field,6px)] tw-overflow-hidden tw-border tw-border-solid
tw-border-[var(--cmplz-field-border,#94a3b8)]` — **explicit `border-style:solid`** because B1 is skipped
inside an isolate zone (the T-052 Preflight-off lesson). Disabled → `tw-opacity-[0.125]` on the wrapper.
The script-warning keeps the Field error pattern (danger icon + text) on tokens. `.ace_comment` recolor →
scoped inside the zone. **The Ace THEME is a reserved look decision (§5-A).**

**Editor (CKEditor).** Toggle → `ui/Button` (secondary). HTML-view `<textarea>` → `ui/Textarea` **with an
`aria-label`** (fixes a11y-exemptions must-fix #2 — the unlabeled HTML-view textarea). Wrap the CKEditor in
`data-cmplz-isolate="ckeditor"`; frame it like Ace; keep `.ck-powered-by` hidden (scoped). CKEditor's own
toolbar/editable stay upstream-default (a11y-audited; C-5 retained). **Framing extent is §5-B.**

**CookieScan.** Scan button → `ui/Button` (primary); Clear Cookies → `ui/Button variant="error"` (the
ThirdPartyScript precedent). Button row keeps `.cmplz-table-header` (shared, relocated). Progress bar keeps
the shared `#cmplz-scan-progress`/`.cmplz-progress-bar` (relocated) — **its colour is §5-C.** `<Alert>` +
`<Panel>` cookie list retained (shared). Self-mark the pure-primitive button row `data-cmplz-ui` so the
`error` variant resolves `var(--cmplz-danger)` and the buttons get B1 border-style (the T-052 lesson).

**WebSiteScanStatus.** Status rows → `tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,12px)]`; icons
already tokened. Warning alerts → the C-2 callout: `--cmplz-warning-surface` bg + `--cmplz-radius` + border,
bold title (the Field `COMMENT_CALLOUT` pattern). Links keep AA (`--cmplz-accent-on-subtle` on the tint).

**WebSiteScanActions.** The action-bar footer → `--cmplz-surface-sunken` bg + top `--cmplz-border`,
**full-bleed as a CONSTANT** `tw-mx-[calc(var(--cmplz-space-l,24px)*-1)]` + `tw-mb-[...]` (NOT the legacy
stepped `-25px` — the field-wrap padding is a constant `space-l`, the T-054 lesson). Buttons → `ui/Button`
(enable=primary, disable=secondary, activate=primary, reset=error). Self-mark the button row `data-cmplz-ui`.

## 5. Reserved look decisions (STOP — do not guess; §8 sign-off)

**A. Ace code-editor theme (free-reachable, Document CSS).** The editor uses the **`monokai` dark** theme.
The surrounding app is light C-2. *Keep monokai dark* (conventional for code, strong syntax contrast,
retained-widget-faithful) framed in a C-2 border — **or** switch to a light Ace theme (`github`/`textmate`)
to match the system. Default recommendation: **keep monokai dark + C-2 frame.**

**B. CKEditor chrome (not free-reachable).** *Frame-only* — keep CKEditor's upstream light toolbar/editable
(a11y-audited, C-5 retained), add only the token frame + migrate our toggle/textarea — **or** re-theme the
toolbar to C-2 tokens. Default recommendation: **frame-only.**

**C. Cookie-scan progress bar (free-reachable).** *Keep the shared legacy blue* (`--cmplz-legacy-wp-blue`,
consistent with the migrated Dashboard `ProgressBlock` that renders the same `.cmplz-progress-bar`) — **or**
re-theme to `--cmplz-accent`. Default recommendation: **keep the shared blue** (consistency, zero drift on
the Dashboard).

## 6. Re-baseline & axe

Reset-DB (`npx wp-env clean all`) + `build:all`, then `--update-snapshots` for the affected screens:
**Document CSS (Ace)** and the **cookie-scan wizard step**. Visual/isolation stay **non-blocking** (Option B).
No screen is added to `MIGRATED_SCREENS` here (the Ace/cookie-scan screens are not gated; CKEditor is not
reachable). The a11y must-fix #2 (HTML-view textarea label) is fixed in code regardless. CKEditor and the
WebSiteScan premium screens cannot be captured in the free wp-env — a documented gap (§2).

## 7. Risks / landmines (from learnings)

- **Shared `.cmplz-reset-button` + `.cmplz-progress-bar`**: must RELOCATE, never delete (11 + 2 consumers).
- **Preflight-off border-style** inside isolate zones and on markerless button rows: frame borders need
  explicit `border-style:solid`; button rows self-mark `data-cmplz-ui` (T-052).
- **Constant full-bleed** on the WSC action footer (T-054) — one `-space-l`, no breakpoint steps.
- **CKEditor body-level DOM** (`.ck-body-wrapper`) is the documented unscoped exception (ADR-001) — the
  isolate zone covers the inline editor; the balloon/body layers stay upstream.

---

## 8. Sign-off

Migration starts (autonomously, under implement → adversarial-review → commit → push → CI-green) once the
three reserved look decisions are resolved. Everything else is obvious application of the approved system.

- **A. Ace theme:** [x] maintainer 2026-10-20 — **SWITCH TO A LIGHT Ace theme** (`github`/`textmate`) to match the light C-2 app (override of the recommended dark).
- **B. CKEditor chrome:** [x] maintainer 2026-10-20 — **frame-only** (keep upstream light toolbar), as recommended.
- **C. Cookie-scan progress bar:** [x] maintainer 2026-10-20 — **re-theme to `--cmplz-accent`** (override). Pick the cleaner scoping (Dashboard must not drift / re-baseline unless necessary); note which path in the PR; flag if non-trivial.
- **Zero new tokens confirmed:** [x] (the C-2 set covers every proposed look)

Maintainer notes / requested changes:

```
A = light Ace theme (github or textmate), not monokai. B = frame-only (as recommended).
C = accent progress bar; scope it so the shared Dashboard ProgressBlock stays blue with NO
Dashboard re-baseline if that is the cleaner path — decide, note in PR, flag if non-trivial.
Zero new tokens. Proceed autonomously through migrate → re-baseline → review → PR.
```

## 9. Implementation record (post sign-off)

- **A implemented:** AceEditorControl → `theme-github` (light). **B implemented:** CKEditor frame-only;
  our toggle → `ui/Button` secondary, HTML view → `ui/Textarea` (+`aria-label`). **C implemented, cleaner
  path chosen:** the cookie-scan bar was fully migrated to tw- (`--cmplz-surface-sunken` track +
  `--cmplz-accent` fill) and **decoupled** from the shared `#cmplz-scan-progress .cmplz-progress-bar` rule by
  dropping the `#cmplz-scan-progress` id wrapper. The shared rule relocated verbatim to `legacy-globals.scss`
  (serves the still-legacy `CookieDatabaseSyncControl`); the migrated Dashboard `ProgressBlock` never matched
  it (self-styled, not under `#cmplz-scan-progress`) → **Dashboard stays blue, no Dashboard re-baseline.**
- **Re-baseline:** reset-DB + fresh build; 8 legitimate shots committed (`tools-tools-documents` Ace +
  `wizard-cookie-scan`, ×1440/768 ×admin/admin-rtl). The other fresh-DB drift was nondeterministic
  dynamic-content churn on screens this bundle does not render on (provably source-independent) — reverted.
- **Adversarial review (flow:reviewer) — PASS WITH NOTES:**
  - *Fixed:* three markerless fallback literals did not equal their token values (latent only — the Bundle-A
    `#complianz-app` broadening makes the token always win — but it breaks the "fallback == token = provable
    no-op" guarantee). Corrected to `--cmplz-field-border` `#94a3b8` (Ace + CKEditor frames),
    `--cmplz-warning-surface` `#fbf4da` (WSC alert), `--cmplz-border` `#e2e8f0` (WSC footer).
  - *Flagged for maintainer (not changed):* the HTML-source `ui/Textarea` is `overflow-hidden`/`resize-none`
    (the shared primitive, mandated by sign-off B), so `notification_email_content` HTML longer than ~8 rows
    is clipped with no scrollbar — matching every other `ui/Textarea` consumer (Support, etc.). Not a new
    pattern introduced here; left as the sanctioned primitive. Raise if a scrollable code-source variant is
    wanted (gated, premium-adjacent screen; low priority).
