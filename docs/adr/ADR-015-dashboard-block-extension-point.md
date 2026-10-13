# ADR-015: Dashboard block width/variant keys + consumer-side normalization

## Status

Proposed

Source: spec DB-17 + C-4, clarify Q-04, plan.md §2 + §5 (Dashboard section). Recorded 2026-10-13 during the Phase-4 Dashboard section of 001-settings-ui-redesign. **Awaiting maintainer ratification of the forward vocabulary (§Decision) — nothing migrates until this is Accepted.**

## Context

Dashboard blocks are declared by `cmplz_blocks()` (`settings/config/blocks.php`, pluggable via a `function_exists` guard, extended by third parties through `apply_filters('cmplz_blocks', $blocks)`), localized to React at `settings/settings.php:247`, and rendered by `GridBlock.js`, which at line 39 concatenates a legacy CSS `class` string into `className = "cmplz-grid-item " + blockData.class + " cmplz-" + blockData.id`. That raw, PHP-supplied class string is exactly what ADR-001/FR-020 forbids under Tailwind (unscannable, un-whitelisted). The five free blocks use four legacy tokens: `cmplz-column-2`, `border-to-border`, `no-background`, and `no-border` (which has **no CSS rule at all** today — a no-op). DB-17 already fixes the legacy→property mapping; clarify Q-04 + C-4 leave only the **forward value vocabulary** open, and it changes a public extension point, so it needs this ADR. Backward compatibility is mandatory (CLAUDE.md): third-party/premium blocks pushing the legacy `class` string, and the pluggable `cmplz_blocks()` signature, must keep working.

## Decision

We add two forward keys to the block schema — **`width`** (an integer column span; the current blocks use `1` (default) and `2`) and **`variant`** (an open enum; the current blocks use `default`, `edge-to-edge`, and `borderless`) — and introduce a new consumer-side **`cmplz_normalize_blocks( $blocks )`** (defined in `blocks.php` **outside** the `function_exists` guard, called in `settings.php` as `cmplz_normalize_blocks( cmplz_blocks() )` so it processes filter additions **and** a pluggable override) that: maps the legacy `class` tokens to `width`/`variant` per DB-17 (`cmplz-column-2`→`width 2`; `border-to-border`→`variant edge-to-edge`; `no-border`/`no-background`→`variant borderless`); lets an explicit `width`/`variant` key **win** over `class`; resolves multiple variant tokens to **borderless** (precedence `borderless > edge-to-edge > default`); **drops unknown tokens**; and calls `_doing_it_wrong()` under `WP_DEBUG` when a block carries a legacy `class` and no explicit key. `GridBlock.js` then reads `width`/`variant` through **complete-literal `tw-` class maps** (ADR-013), keeping the `cmplz-grid-item` + `cmplz-<id>` hooks and emitting **no** raw `class` string.

Forward vocabulary (the ratifiable part): **`width` ∈ {1, 2}**, **`variant` ∈ {default, edge-to-edge, borderless}** — the minimal set that round-trips every current block and keeps full back-compat. `width` is defined as an integer column span (so a future block may request 3+ without a schema change — GridBlock maps only the spans it has literals for and ignores the rest with a `_doing_it_wrong`), and `variant` is an open enum (unknown values are dropped). No height/row axis (`cmplz-row-2` is used only by placeholders, never by a block).

## Alternatives considered

- **Normalize inside `cmplz_blocks()`**: lost — the function is pluggable, so a premium full-function override would bypass it; normalizing the *output* at the consumer covers overrides and filter additions alike.
- **Keep emitting a cleaned `class` string for GridBlock**: lost — it re-introduces an unscannable concatenated class into `GridBlock.js:39` (the exact ADR-001 problem); reading `width`/`variant` via literal maps is Tailwind-scannable and typed.
- **A richer vocabulary now (widths 3/4/full, more variants)**: deferred — no current or known block needs it; `width` being an integer span and `variant` an open enum leaves the door open without committing to literals we cannot yet see used (YAGNI + keeps the literal `tw-` map minimal).
- **Drop `no-border` from the mapping** (it is a CSS no-op today): rejected — DB-17 fixes it to `borderless`, and a third party may rely on the token's intent; mapping both `no-border` and `no-background` to `borderless` is the safe, spec-aligned choice.

## Consequences

- Public contract grows additively and back-compatibly: existing `class`-string blocks (core, filter, premium) keep rendering identically via normalization; the `cmplz_blocks` filter name and the pluggable `cmplz_blocks()` signature are unchanged; no saved option is touched (blocks are config). Extenders gain the typed `width`/`variant` keys and a deprecation nudge (`_doing_it_wrong`, WP_DEBUG only) steering them off the legacy string.
- `tests/test-blocks.php` (new, PHPUnit) covers: each token→prop; the `other-plugins` combination (`cmplz-column-2 no-border no-background` → `width 2` + `borderless`); variant conflicts → borderless; explicit keys win; unknown tokens dropped; leading/trailing whitespace tolerated; idempotency; the empty-array (no-capability) case; and `_doing_it_wrong` firing under WP_DEBUG for legacy-class blocks but not for new-key-only blocks.
- Harder: every new `width` literal a block needs must be added to GridBlock's complete-literal `tw-` map (ADR-013, no concatenation); spans without a literal degrade to span-1 with a `_doing_it_wrong`.
- The release notes flag the new keys and the legacy-`class` deprecation (spec C-7).

Related: ADR-001, ADR-013; DB-17, C-4, clarify Q-04.
