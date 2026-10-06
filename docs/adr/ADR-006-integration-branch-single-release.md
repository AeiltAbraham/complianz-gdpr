# ADR-006: Long-lived integration branch and a single release

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D11, §7.0, §11. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

## Context

The migration and redesign touch every screen of the settings app and run in phases 0–5, with legacy SCSS and Tailwind coexisting until Phase 5 (§1). Between phase checkpoints the app is visually mixed, with some sections redesigned and some not (§7.0). Interim builds also carry legacy lazy-chunk CSS without cache busting, and the doc relies on the single release to keep it from customers (§4.1). Fixes to the current admin UI must keep reaching customers during the project, and Phases 3–4 wait for mockups that do not exist yet (D8, Open).

## Decision

We develop the whole project on one long-lived integration branch fed by short-lived work branches, merge the mainline (`development` in the doc) into it at least weekly, and ship it once, as a single release after Phase 5, with no feature flag and the previous plugin version as the rollback.

## Alternatives considered

- **Release phase by phase through the mainline**: lost because phases are internal checkpoints and the branch may be visually mixed between them; interim releases would also ship the chunk CSS without cache busting (§7.0, §4.1).
- **A runtime feature flag between the legacy and the new UI**: rejected in §7.0, which names the previous plugin version as the rollback instead. The doc gives no further reason; a flag would also clash with its end state, in which the legacy SCSS is deleted and `admin.css` is no longer enqueued on the settings screens (SC-1).

## Consequences

- Customers never see a mixed UI. One release carries the whole change, its release notes (the deprecated `cmplz_blocks` `'class'` key, the preview fidelity fix, the changed admin markup) and translations regenerated from the final build (§6.3).
- Workflow (§7.0): work branches are cut from the integration branch and merged back through MRs, never into the mainline. The mainline is merged in at least weekly, and right after any mainline MR that touches `settings/src`, `settings/config`, `settings/settings.php`, `class-admin.php` or `assets/css/admin*`; the project team resolves the conflicts.
- Harder: fixes to the current UI land on the mainline and must be re-applied by hand to components already migrated on the branch; the author of the mainline MR flags them. Drift and merge pain grow with the branch's lifetime, which depends on when the design arrives (§11).
- Harder: a big-bang release puts many changes in front of customers at once and makes regressions harder to bisect. The mitigation is the full §8 suite on the branch before the release MR plus a release-candidate QA window whose process the doc has yet to define (§11).
- Gates: the whole-app e2e suite planned in the doc must be green before Phase 1, at every phase checkpoint and before the release MR, and its CI job blocks merges into the integration branch (FR-021, FR-022 of the input spec). Because legacy changes keep arriving through the merges, the token-rename check runs on every MR into and push to the branch (ADR-004).
- `settings/build/` and the compiled root CSS are not committed on work branches; they are rebuilt once on the integration branch before the release MR (§7.0).
- ~~To settle before the first work branch is cut: the doc names the integration branch `enhance/settings-tailwind-migration`, while the flow framework names feature branches `NNN-slug` (this repo uses `001-settings-ui-redesign`, cut from `master`), so which name the integration branch uses is still open. This fork also has no `development` branch, so the branch that feeds the weekly merges and receives the release MR needs to be named too.~~ Settled 2026-10-06 (clarify Q-08): `001-settings-ui-redesign` is the integration branch; `master` is the mainline for weekly merges and the release merge.

Related: ADR-004, ADR-005
