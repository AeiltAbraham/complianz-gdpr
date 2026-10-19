# Phase 5 (Stage I) — parallel-agent work plan

For running multiple agents (e.g. via cornercase, each in its own git worktree/branch) on the final
phase: legacy removal → release. Source of truth for scope is `tasks.md` "Phase 5" prose + `plan.md`
§5 Stage I. Each agent reads `CLAUDE.md` + `.agent/*` first (the flow framework), works in its own
worktree off `001-settings-ui-redesign`, and returns by PR.

## Why Phase 5 is only partly parallel

The **marker move** (put `data-cmplz-ui` on the app inner wrapper, drop the per-component markers) is a
**serializing dependency**: until it lands, every migrated component's `var(--cmplz-*, <literal>)`
fallback is resolving to the LITERAL (the tokens are declared only on `[data-cmplz-ui]` islands,
ADR-001). The legacy-CSS deletions (`legacy-globals.scss`, `variables.scss`, dropping the `admin.css`
enqueue) are only safe **after** the marker move makes those fallbacks resolve to the real tokens. So:
a first wave runs truly in parallel, the legacy-removal wave waits on the marker move, and release is
sequential.

```
Wave 1 (parallel, disjoint files):   A marker-move ──┐   B i18n   C readme
                                                      │
Wave 2 (after A merges):                              └─▶ D legacy-removal   E re-baseline
                                                                   │
Wave 3 (sequential, final gate):                                   └─▶ F release → RC → merge
```

## Wave 1 — start concurrently (disjoint file footprints)

### Bundle A — the marker move  ⟵ critical path, start first
- **Scope:** move `data-cmplz-ui` to the app inner wrapper (the React root wrapper / `#complianz-app`
  subtree) and **drop the per-component `data-cmplz-ui` markers** across `settings/src/**`. Reconcile
  `base.css` B1–B5 + `tokens.css` scope if needed (they already target `[data-cmplz-ui]`; confirm one
  app-root marker now covers every island). Keep the `[data-cmplz-isolate]` zones (preview, date-range,
  toastify, color-picker) exactly as-is.
- **Files:** `settings/src/**` (JSX markers), possibly `settings/settings.php` (the `#complianz-app`
  element) and `settings/src/styles/{base.css,tokens.css}`.
- **Verify:** `npm run build:all`; the token-hygiene + physical-utility + stylelint gates; a reset-DB
  `npm run e2e` across the 4 admin projects (markers moving must NOT change any rendered pixel — this is
  the big ADR-001 "defer to Phase 5" payoff, so expect ZERO visual drift beyond known flakes); confirm
  `var(--cmplz-*)` now resolves to the token (not the literal) in `build/index.css` on a sampled island.
- **Risk:** this is the highest-blast-radius change of the phase. Hard-assert no visual regression.

### Bundle B — i18n regeneration
- **Scope:** regenerate `pot`/`po`/`json` via wp-cli inside wp-env; verify German strings; add the
  chunk-string assertions (C-7, DB-14). Independent of the marker move.
- **Files:** `languages/**`, the i18n step in `deploy.sh` / a build script; a test asserting the chunk
  JSON strings exist.
- **Verify:** the German e2e project (`admin-i18n` / `admin-de`) stays green; the generated `.json`
  chunk files carry the translated strings.

### Bundle C — readme.txt changelog + release notes
- **Scope:** write the `readme.txt` changelog notices: admin markup/CSS classes changed (not a supported
  API, spec C-7), the banner-preview fidelity fix (ADR-008/DB-06), and the retained-widget a11y
  exemptions. No code.
- **Files:** `readme.txt` (and any `CHANGELOG`).
- **Verify:** prose only; cross-check the a11y-exemptions list against `a11y-exemptions.md`.

## Wave 2 — after Bundle A (marker move) merges

### Bundle D — legacy CSS + toolchain removal
- **Scope (ADR-005 risk — the big delete):** delete `assets/css/admin/legacy-globals.scss` (capture
  before/after wp-admin + media-modal screenshots per the ADR-005 risk); stop enqueueing `admin.css` on
  the settings screens + drop the `complianz-admin` dependency from the new style handle; retire the
  gulp admin target; then, once `grep -r -n -e '--cmplz-legacy-' settings/src` is EMPTY, delete
  `assets/css/variables.scss`. FR-017: no `*.css` chunk files in `settings/build`.
- **Files:** `assets/css/admin.scss` + `legacy-globals.scss` + `variables.scss` (delete),
  `settings/settings.php` / `class-admin.php` (enqueue), `gulpfile.js`.
- **Verify:** `npm run build:all`; the full e2e suite green on all 4 projects (nothing should lose
  styling — if it does, a legacy rule had a live consumer the marker move did not cover); the
  before/after wp-admin screenshots show no regression outside `#complianz`.
- **Depends on A.** Do NOT start before the marker move is merged (the fallbacks must resolve first).

### Bundle E — banner-preview + final re-baseline
- **Scope:** re-baseline the banner preview against the frontend banner with a reviewed diff (ADR-008,
  DB-06); refresh any visual baselines the marker move / legacy removal legitimately changed; SC-03/SC-04
  asset-weight comparison against `baselines.md`.
- **Files:** `tests/e2e/admin/__screenshots__/**` (isolation + visual baselines), `baselines.md`.
- **Verify:** reset-DB `--update-snapshots`; review every changed baseline (expect only the
  banner-preview + genuine marker/legacy diffs; revert the known `banner-general-768` /
  `proof-of-consent-768` nondeterminism — see the separate determinism cleanup).
- **Depends on A (and ideally D).** Coordinate with D on baseline files if both run — or run E after D.

## Wave 3 — release (sequential, one agent or you)

### Bundle F — release
- CP5 gate (all sections migrated, suite green) → rebuild + commit the release artifacts ONCE on the
  integration branch → RC tag → one-week RC self-QA (C-6, SC-07) → the single release merge to `master`
  (DB-18, ADR-006). Not parallelizable; it's the final gate.

## Ready-to-paste cornercase prompts (one per bundle)

> Each assumes a fresh worktree off `001-settings-ui-redesign`. Start with: "Read CLAUDE.md and
> `.agent/{constitution,conventions,glossary,learnings}.md` and `docs/progress.md` first. Follow the flow
> framework. This is Phase 5 (Stage I); scope is in `docs/specs/001-settings-ui-redesign/phase5-parallel-plan.md`
> Bundle <X> and the tasks.md Phase-5 prose. Run the adversarial pre-push review before committing; restore
> compiled output (ADR-006); do not commit build output."

- **A:** "Do Bundle A: the ADR-001 marker move — put `data-cmplz-ui` on the app inner wrapper and remove the
  per-component markers across settings/src, keeping the `[data-cmplz-isolate]` zones. Prove ZERO visual
  drift across the 4 e2e projects."
- **B:** "Do Bundle B: regenerate i18n (pot/po/json via wp-cli in wp-env), verify German, add the C-7/DB-14
  chunk-string assertions. Do not touch settings/src markers (Bundle A owns those)."
- **C:** "Do Bundle C: write the readme.txt Phase-5 changelog notices (admin markup changed, preview
  fidelity fix, a11y exemptions). Prose only."
- **D (after A merges):** "Do Bundle D: delete legacy-globals.scss + variables.scss (only once the
  `--cmplz-legacy-` grep over settings/src is empty), drop the admin.css enqueue + the complianz-admin dep,
  retire the gulp admin target, FR-017. Capture the ADR-005 before/after wp-admin + media-modal
  screenshots. Full e2e must stay green."
- **E (after A, ideally after D):** "Do Bundle E: re-baseline the banner preview vs the frontend banner
  (reviewed diff, ADR-008/DB-06) + the final visual baselines + SC-03/04 vs baselines.md; revert the known
  nondeterministic shots."
- **F (sequential):** "Do Bundle F: the release — rebuild artifacts, RC tag, self-QA, merge to master."

## Also worth spinning off (independent of the waves)

A small **test-determinism cleanup**: the `banner-general-768` and `proof-of-consent-768` visual baselines
drift every run (banner = a nondeterministic flake; proof-of-consent = date-seeded consent records that
grow with the calendar). Pin the seed dates or mask the date column so these stop churning. Self-contained,
touches only the seed/mask helpers + those baselines; a good standalone agent task.
