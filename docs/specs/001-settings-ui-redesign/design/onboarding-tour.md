# 001 — Onboarding / Tour design note & section sign-off record

Status: **awaiting sign-off** (G1–G4). This is the LAST Phase-4 (Stage-H) section; after it, Phase 5
(Stage I) does legacy removal + the marker move + i18n + release packaging.

Backed by a 5-dimension investigation + 4-target adversarial premise verification (workflow
`wf_a3e5d6a3-e4c`, 9 agents). The verification **corrected the two assumptions baked into the plan**
(see §3) — this note records the corrected plan.

## 1. What this is — the section the toast vendor was deferred to

The Onboarding/Tour section covers three retained widgets:

- the **Shepherd guided tour** (`settings/src/Tour/Tour.js`, `react-shepherd@4.3.0`; legacy
  `assets/css/admin/modules/shepherd.scss`, 102 lines, hand-authored);
- **react-toastify toasts** (`@9.1.3`; `<ToastContainer>` in `settings/src/Page.js` +
  `settings/src/Placeholder/PagePlaceholder.js`; `toast()` from `utils/api.js`, `CookieBannerData.js`,
  `MenuData.js`, `FieldsData.js`; legacy `assets/css/admin/modules/toast/` — **a verbatim vendored copy
  of react-toastify's own upstream SCSS**). The toast vendor file was explicitly **deferred here** from
  the Statistics/DateRange section (statistics-daterange.md §9);
- the legacy **`assets/css/admin/modules/onboarding.scss`** (34 lines).

## 2. Scope

**In scope:** re-theme the tour popover + toasts on the C-2 tokens; retire `shepherd.scss`,
`toast/`, and `onboarding.scss`; wire the toast vendor through the ADR-009 pipeline; the shepherd
footer-contrast a11y fix.

**Out of scope / deferred (see G3, G4):**
- the **live `NewOnboarding` websitescan modal** (`settings/src/Onboarding/NewOnboarding.js` +
  co-located `NewOnboarding.scss`, 281 lines) — free-reachable and genuinely migratable, but a
  separate, substantial surface the section name never covered; **deferred to its own
  preview+sign-off sub-task** (Radix-Dialog candidate, needs a `dialogs.spec` assertion-change
  approval). It is **not** gate-forced (its `--cmplz-legacy-*` refs live under
  `settings/src/Onboarding/`, outside the ADR-004 `components|styles` grep scope).
- **re-enabling tour element-attachment** (`data-tour`) — a behavior change with no live referent
  today; see G4.

## 3. Premise corrections from the investigation (why this note differs from the plan)

The plan's working assumptions were that **both** shepherd and toast would ride the ADR-009
auto-scope pipeline (the manifest comment literally says "Add toast/shepherd here"), and that
"Onboarding/Tour (tour targets to `data-tour`)" implied converting the tour to element-attachment.
The verification (high-confidence, with code evidence) corrected all three:

1. **Shepherd mounts at `document.body`, OUTSIDE `#complianz`.** `shepherd.js@11` appends every step
   (`.shepherd-element`) to `tour.options.stepsContainer || document.body`; `Tour.js` sets no
   `stepsContainer` (shepherd.esm.js:3763; Tour.js:13-22). So the ADR-009 auto-scope descendant prefix
   `:is(#complianz,#complianz-portal) [data-cmplz-isolate="…"] …` would match **nothing** → 100% dead
   CSS (the whole-widget version of the T-056 date-range-chrome dead-CSS bug). **Shepherd is forced to
   overrides-only** (G1), unless we reparent the widget — a behavior change rejected as out-of-scope.
2. **`toast/` IS react-toastify's own SCSS, verbatim** (byte-identical to
   `node_modules/react-toastify/scss/`, only the `--toastify-*` values remapped to `--cmplz-legacy-*`
   plus 3 structural tweaks), and the upstream CSS is **structurally required** (fixed positioning,
   flex, close-button/spinner, and the Bounce/zoom/flip/slide/spin **@keyframes**). The app loads no
   upstream dist CSS today. `<ToastContainer>` renders **inline inside `#complianz`** (no portal). So
   **toast is the real ADR-009 Path-A case** (G2) — and Path A finally retires the vendored copy the
   pipeline exists to kill.
3. **`onboarding.scss` is 100% orphaned.** Every rule is nested under
   `#complianz .cmplz-modal.cmplz-onboarding`, but the live modal renders `.cmplz-modal.cmplz-websitescan`
   (NewOnboarding.js:58); the only live `.cmplz-onboarding*` consumer, `OnboardingError.js`'s
   `.cmplz-onboarding__error`, is not styled by it. → **delete-only** (G3).
4. **The tour is free-reachable** (trigger = the ungated `restart_tour` button on Settings→General,
   `?tour=1#dashboard`, auto-starts on #dashboard; settings.php general-settings:100-113, Page.js:70),
   so its re-theme is a required, user-visible deliverable — **not** dead/premium CSS. `data-tour`
   attachment has **no live referent**: every `attachTo` in Tour.js is commented out and no `data-tour`
   attribute exists, so plan §5's "tour targets to `data-tour`" is net-new behavior, not a conversion.

## 4. Shepherd (tour) vendor approach — G1

**Recommendation: Option B — overrides-only, hand-scoped.** A new
`settings/src/styles/vendors/shepherd.css`, scoped by the widget's own top-level `.cmplz-shepherd`
class (every step carries `classes:'cmplz-shepherd'`), token-literal (`var(--cmplz-x, <literal>)`),
logical props, imported directly by `tailwind.css`, added to the CI stylelint list — **NOT** in the
`build-vendor-css.js` manifest, and the widget **stays at `document.body`**.

Why not Path A: the app never loaded upstream `shepherd.css`; `shepherd.scss` is already a complete,
self-contained theme (arrow geometry, header/footer/text; buttons are WP-classed; no `@keyframes`);
and the body-mount makes auto-scoping dead CSS. This is the **react-data-table Option-B analogue** and
**refines ADR-009/ADR-014** (which assumed shepherd = Path A / mount-into-scoped-host) — the migration
will record that refinement, exactly as react-data-table's was recorded.

## 5. Toast vendor approach — G2

**Recommendation: Path A — the ADR-009 pipeline (the date-range pipeline's second consumer).**
A new `settings/src/styles/vendors/toast.src.css` = `@import "react-toastify/dist/ReactToastify.css";`
+ a `--toastify-* → --cmplz-*` override block (literal fallbacks) + the 3 structural tweaks
(border / min-height / radius); one MANIFEST row `{src:'toast.src.css', zone:'toastify'}`;
`@import './vendors/toast.built.css'` in `tailwind.css`; **both** `<ToastContainer>`s (Page.js +
PagePlaceholder.js, identical props) wrapped in `<div data-cmplz-isolate="toastify">`. The generated
`toast.built.css` is gitignored (ADR-006); the `.src.css` is stylelint-gated. `postcss-rtlcss`
**override** mode handles the container's physical `right`/`left` positioning (same as date-range).

One dimension argued for Path B (hand-authored overrides-only). The verification resolved it to Path A:
a Path-B file would be a full hand-ported copy of react-toastify's own CSS — perpetuating exactly the
vendored-copy maintenance burden ADR-009 was built to eliminate — and the DOM (inline, inside
`#complianz`) makes Path A viable. (Path B remains the fallback if you prefer no new manifest row.)

## 6. The looks — G3 (zero new tokens)

**Tour popover → the redesign's LIGHT-surface look** (today it is dark `#333`/white). The whole C-2
redesign is light surfaces on the slate ramp (every dialog/popover + the date-range picker); there is
no dark-surface token, so "keep dark" would mean misusing `--cmplz-text` as a background. Mapping:

| element | legacy | → token (zero new) |
|---|---|---|
| popover bg | `#333` | `--cmplz-surface` #fff + 1px `--cmplz-border` |
| text / title | white | `--cmplz-text` #0f172a |
| elevation | hand shadow | `--cmplz-shadow-lg` |
| radius | `border-radius-input` ~5px | `--cmplz-radius-field` 6px |
| arrow | `#333` | `--cmplz-surface` (bordered) |
| cancel-X | grey-500 → white hover | `--cmplz-text-muted` → `--cmplz-text` |
| footer buttons | WP `button-default`/`-primary` | unchanged WP classes; **on white they clear AA** |

**Toasts → the light theme on tokens** (`theme="light"`, `hideProgressBar` — so no progress bar to
theme): white `--cmplz-surface`, `--cmplz-text`, 1px `--cmplz-border`, `--cmplz-radius` 12px,
`--cmplz-shadow`; close-× `--cmplz-text-muted`; the per-type **icon** colors
success `--cmplz-success` / error `--cmplz-danger` / warning `--cmplz-warning` / info `--cmplz-accent`.
Every value has a 1:1 existing-token counterpart → **zero new tokens** (`tokens.css` byte-unchanged),
the same outcome as data-table and date-range. Sub-choice to confirm: the **info-icon color**
(`--cmplz-accent` proposed).

See `onboarding-tour-preview.html`.

## 7. Tour attachment — G4

**Recommendation: keep the tour as centered modals; do NOT add `data-tour` this section.** Scope the
work to look + a11y + SCSS retirement. Re-enabling element-attachment (adding stable `data-tour` hooks
+ un-commenting `attachTo`) is net-new behavior with positioning-regression risk and belongs in a
separate, explicit decision — the shipped free tour already works (and is e2e-tested) as a
centered-modal + hash-nav flow.

## 8. a11y

- **Shepherd footer contrast** (the T-015 `.shepherd-button.button-default` exemption, `#3858e9` on
  `#333` = 2.25:1): **fixed by the light-surface move** (blue WP-button text on white clears AA) →
  **drop the exemption row**. The `landmark-no-duplicate-contentinfo` (moderate) stays recorded-only;
  `keyboardNavigation:false` is left as-is (a config/behavior choice, out of scope).
- **Toasts**: `role="alert"` + `aria-live`, close `aria-label="close"`, light theme. Text
  (`--cmplz-text` on white ≈17:1) and close-× (`--cmplz-text-muted` ≈7:1) are **AA by token
  construction**; the status icons are non-text. Toasts are **transient** (`autoClose:2000`) and the
  T-015 live audit could not raise one, so the toast body is **recorded, not gated** (no new
  `MIGRATED_SCREEN` for it; gating a self-dismissing element is unreliable) — mirroring the
  a11y-exemptions policy "no exemption until a real finding exists."

## 9. ADR-005 retirement + token hygiene

- `shepherd.scss` → `git rm`, drop its `admin.scss:107` import; its rules move to the new hand-scoped
  `vendors/shepherd.css` (no `legacy-globals` relocation — Tour.js is the only consumer). The two
  top-level overlay rules are dropped (`useModalOverlay:false` → overlay never created; the
  `.dashboard_page_burst` rule is cross-plugin dead weight).
- `toast/` (the whole directory incl. `main.scss` + partials + `animations/`) → `git rm -r`, drop its
  `admin.scss:84` import; replaced by the `@import` of the upstream dist CSS in `toast.src.css`.
- `onboarding.scss` → `git rm`, drop its `admin.scss:34` import; no relocation (orphaned).
- Token hygiene: the new `shepherd.css` + `toast.src.css` use concrete literals + file:line refs, never
  `--cmplz-legacy-*`/`--rsp-*` names (the gate greps whole files incl. comments).

## 10. MIGRATED_SCREENS, re-baseline, task breakdown

- **Re-baseline:** the tour renders on `#dashboard` (`?tour=1`); toasts are transient. Re-baseline the
  dashboard tour shot (admin + admin-rtl) if the tour spec captures it; toasts are not in the
  visual baselines (transient). All visual baselines are non-blocking (Option B).
- **MIGRATED_SCREENS / axe:** no new gated screen for the transient toast (§8); the tour's footer fix
  removes its exemption. No new blocking-gate surface beyond dropping the shepherd exemption.
- **Proposed task breakdown (one section commit, mirroring prior sections):** (a) `toast.src.css` +
  manifest row + `tailwind.css` import + wrap both `ToastContainer`s; (b) `vendors/shepherd.css`
  (light look) + `tailwind.css` import + stylelint list; (c) delete `shepherd.scss` + `toast/` +
  `onboarding.scss` + drop the 3 `admin.scss` imports; (d) drop the shepherd a11y exemption row +
  reconcile `a11y-exemptions.md`; (e) build + the 3 fast gates + e2e (tour spec + axe) + reset-DB
  re-baseline; (f) adversarial pre-push review → fix → restore compiled output (ADR-006) → commit →
  push → CI-green.

## 11. Sign-off

Migration starts only when **G1 + G2 + G3 + G4** are approved.

- **G1 — Shepherd vendor approach:** [x] — maintainer, 2026-10-19, choice: **Option B** overrides-only /
  hand-scoped `.cmplz-shepherd`, widget stays at `document.body` (refines ADR-009/ADR-014).
- **G2 — Toast vendor approach:** [x] — maintainer, 2026-10-19, choice: **Path A** ADR-009 pipeline.
- **G3 — The looks + zero new tokens:** [x] — maintainer, 2026-10-19, AS PROPOSED (tour → light surface;
  toasts → light theme on tokens; info-icon = `--cmplz-accent`).
- **G4 — Tour attachment:** [x] — maintainer, 2026-10-19, **keep centered modals**, defer `data-tour`.
- **Scope note — the live `NewOnboarding` modal:** DEFERRED to its own sub-task — maintainer, 2026-10-19.

Migration authorized to run autonomously (implement → adversarial-review → commit → push → CI-green).

Maintainer notes / requested changes:

```
Approved: G1 Option B, G2 Path A, G3 as proposed, G4 keep centered; NewOnboarding deferred. Proceed autonomously.
```
