# Stage H.5 — composite-body completion (the missing pre-step before the marker move)

**Why this exists.** Phase-5 Bundle A found that "Phase 4 complete / every body migrated" was false:
~14 **composite field-bodies** were never assigned to a Phase-4 section and are still legacy (raw
buttons/inputs/svgs that the base reset B1/B4/B5 would strip — the T-038/T-052 landmine). So the full
ADR-001 **marker move is blocked**, and with it Phase-5 **Bundle D** (legacy-CSS removal). Bundle A
shipped only the zero-drift token-broadening subset (`#complianz-app` token declaration, PR #7). This
stage migrates those bodies so the marker move — and then Bundle D and release — can proceed.

**These are intentional look changes (legacy → the C-2 design system), not zero-drift.** The design
system is already approved (tokens, the `components/ui` primitives, the card/field/button/table
patterns). Each body **applies** that system — **zero new tokens expected** — using the existing
primitives and token-with-literal-fallback discipline, deletes its **body-specific** legacy SCSS
(ADR-005: grep ALL consumers — JS *and* PHP/config — first; relocate anything shared to
`legacy-globals.scss`, never delete a shared module while another body still uses it), re-baselines its
screens, and runs the adversarial pre-push review. If a body has a non-obvious **look decision** (e.g.
the code editor, the cookie-scan table, the website-scan onboarding), the agent **stops and flags it for
a design sign-off** rather than guessing — same reserved-sign-off cadence as the Phase-4 sections.

## Bundles (parallel; each an agent in its own worktree off `001-settings-ui-redesign`)

All bodies live under `settings/src/Settings/<Body>/`. Each bundle owns a **dedicated wp-env port-pair**
so the e2e runs don't collide (the T-054 lesson): set an **uncommitted** `.wp-env.override.json`
(`"port"`, `"testsPort"`) and point the Playwright baseURL at it (env override), or run your e2e while
`:8888` is free — never two wp-env instances on one port.

| Bundle | Bodies | wp-env ports |
|---|---|---|
| **H1 · Documents** | `DocumentsMenu`, `Documents`, `ProcessorsThirdParties` (locate it), `Translations` | 8888/8889 |
| **H2 · Editor & scan** | `Editor`, `CookieScan`, `WebSiteScan` (heaviest — editor + scanning tables) | 8890/8891 |
| **H3 · Tools** | `Support`, `Debug`, `Export/ImportControl`, `Finish` (simpler tool screens) | 8892/8893 |
| **H4 · Security & a11y widgets** | `SecurityMeasures`, `WcagContrastChecker`, `PlaceholderPreview` | 8894/8895 |

Each bundle: apply the approved design system to its bodies (zero new tokens; reuse `components/ui/*` +
the established tw-/token patterns; markerless → `var(--cmplz-x, <literal>)`), delete body-specific SCSS
+ drop its `admin.scss` import (relocate shared rules to `legacy-globals.scss`), reset-DB re-baseline the
affected screens (non-blocking visual, Option B) + axe where the body is a gated screen, adversarial
pre-push review, restore compiled output (ADR-006), open a PR. **Flag any look decision for sign-off.**

## After H1–H4 merge — the consolidation that unblocks Phase 5

- **H5 · shared-SCSS consolidation + the full marker move.** Once every composite body is migrated:
  delete the now-orphaned shared modules (`bullets`, `icons`, `tooltip`, `animations`, `errorboundary`,
  `wizard/panel`, `wizard/snackbar`, `wizard/suggested-plugins`/`suggested-plugins`, `new-features`,
  `modal`, `wizard/borderradius`, `other-plugins` — grep each for a surviving consumer first), relocating
  any survivor to `legacy-globals.scss`; **then** do the real ADR-001 marker move (one `data-cmplz-ui` on
  `#complianz-app`, drop the per-component markers, move the base reset) with its full re-baseline — now
  safe because every body is migrated. This replaces Phase-5 "Bundle A (full)" and unblocks **Bundle D**.

## Updated Phase-5 dependency chain

```
Stage H.5:  H1 ∥ H2 ∥ H3 ∥ H4   ──▶  H5 (shared-SCSS consolidation + FULL marker move)
Phase 5:                              └─▶ D (legacy-globals/variables.scss/admin.css enqueue) ─▶ F release
```

B (i18n, PR #6) and C (readme, PR #5) already merged and stand. The baseline-determinism cleanup
(`banner-general-768` / `proof-of-consent-768`) still rides whichever agent re-baselines.

## Ready-to-paste cornercase prompts

> Common: "Read CLAUDE.md + `.agent/{constitution,conventions,glossary,learnings}.md` + `docs/progress.md`,
> and `docs/specs/001-settings-ui-redesign/stage-h5-composite-bodies.md`. Apply the APPROVED C-2 design
> system to your bundle's bodies — zero new tokens, reuse `settings/src/components/ui/*` + the established
> tw-/token-with-literal-fallback patterns. Delete only body-specific legacy SCSS (grep ALL consumers incl.
> PHP first; relocate shared rules to legacy-globals, never delete a shared module with a surviving
> consumer). Use your bundle's dedicated wp-env ports. Reset-DB re-baseline the affected screens + axe.
> Run the adversarial pre-push review, restore compiled output (ADR-006), open a PR. If any body needs a
> non-obvious look decision, STOP and flag it for sign-off — do not guess."

- **H1:** "Migrate the Documents bodies: DocumentsMenu, Documents, ProcessorsThirdParties, Translations."
- **H2:** "Migrate the Editor & scan bodies: Editor, CookieScan, WebSiteScan (the heaviest — flag any editor/table look decision)."
- **H3:** "Migrate the Tools bodies: Support, Debug, Export/ImportControl, Finish."
- **H4:** "Migrate the Security & a11y bodies: SecurityMeasures, WcagContrastChecker, PlaceholderPreview."
