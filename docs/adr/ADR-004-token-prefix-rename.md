# ADR-004: Rename legacy tokens to `--cmplz-legacy-*` and keep `--cmplz-*` for semantic tokens

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D9, §4.2, §4.2.1. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

## Context

Today's design tokens are `--rsp-*` custom properties (`rsp` for Really Simple Plugins) declared on `:root` in `assets/css/variables.scss`, with SCSS breakpoints named `$rsp-break-*`. They are read by hundreds of references across the legacy admin SCSS, by SCSS in `settings/src` and by inline styles in five JS files (`Modal.js`, `utils/Icon.js`, `DateRange/DateRange.js`, `Dashboard/TipsTricks/TipsTricks.js`, `Settings/Cookiedatabase/Cookie.js`). The redesign gets a new semantic token set (`--cmplz-color-surface`, `--cmplz-color-text-muted`) with its own names and values, while legacy SCSS keeps using its variables until it is deleted (§4.2). The frontend banner CSS already uses `--cmplz-manage-consent-height` and `--cmplz-manage-consent-offset`, and the banner preview runs inside `#complianz`. Legacy SCSS changed on the mainline keeps arriving with `--rsp-*` through the regular merges into the integration branch (ADR-006).

## Decision

We rename every `--rsp-*` custom property to `--cmplz-legacy-*` and every `$rsp-break-*` variable to `$cmplz-legacy-break-*` up front, in one Phase 1 MR and with no alias, and reserve the clean `--cmplz-*` namespace for the new semantic tokens, which we declare on `#complianz` and the portal host instead of `:root`.

## Alternatives considered

- **Keep `--rsp-*` alive through an alias to the new names**: lost because the new UX has its own token set, so an alias would only keep the old namespace alive (§4.2.1).
- **Rename the legacy set straight into `--cmplz-*`**: lost because legacy and semantic names could then collide; the separate namespace keeps `--cmplz-legacy-color-error` apart from `--cmplz-color-error` (§4.2.1).
- **Declare the new tokens on `:root`**, where today's live: lost because other plugins in wp-admin could override them (§4.2.1).

## Consequences

- Step 1 is a purely textual, look-preserving rename (visual baseline unchanged); the legacy declarations stay on `:root` until they are deleted with the legacy SCSS. The tracked compiled root CSS is not committed in that MR; CI builds it for testing (§7.0).
- The orphaned compiled files `assets/css/admin/theme.css` (already out of sync with `theme.scss`) and `assets/css/variables.css` are deleted instead of renamed; nothing references them.
- `upgrade/` (the self-contained upgrade-to-pro screen, which declares its own `--rsp-*` set) and `settings/build/` are excluded from the rename.
- Enforced by FR-018 of the input spec: a permanent CI grep for `--rsp-` and `$rsp-` over the SCSS sources in `assets/css`, over `settings/src` and over the freshly built `admin*.css`, on every MR into and every push to the integration branch. A second grep keeps `--cmplz-legacy-*` out of new code in `settings/src/components/` and `settings/src/styles/`.
- The semantic tokens live in `settings/src/styles/tokens.css` and must not declare any `--cmplz-manage-consent-*` name, or any other `--cmplz-*` variable the frontend banner CSS uses, so they cannot override the preview (ADR-008).
- Phase 5 entry gate: `grep -r -- '--cmplz-legacy-' settings/src` returns nothing before `assets/css/variables.scss` is deleted (ADR-005).
- Harder: the rename touches most legacy SCSS files at once, and every mainline change to legacy SCSS that brings `--rsp-*` back has to be renamed in the merge MR that brings it in.

Related: ADR-001, ADR-005, ADR-006, ADR-008
