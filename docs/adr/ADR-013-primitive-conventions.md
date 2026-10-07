# ADR-013: Primitives live in `settings/src/components/ui/` and vary through clsx plus hand-written variant maps

## Status

Accepted

Source: /flow:design for 001-settings-ui-redesign (plan.md, Stage F). Settles the input
technical spec's D4 and D5, which ADR-002 explicitly left open. Recorded 2026-10-06.

## Context

ADR-002 fixes Radix plus Tailwind as the primitive layer but not where primitives live or
how their variants (primary/secondary, sizes, states) are expressed. Phase 2 rebuilds the
16 `Settings/Inputs/*` components and the dialog/tooltip/popover consumers on these
primitives, so the convention must be fixed before the first primitive is written.
Tailwind can only see complete literal class names (ADR-001), which rules out any helper
that assembles class fragments. The candidate extra dependencies
(`class-variance-authority`, `tailwind-merge`) are small, but `tailwind-merge` must be
configured for the utility prefix chosen by Spike S1 and adds a second source of truth
for which class wins.

## Decision

We put every primitive in `settings/src/components/ui/` (one component per file, a shared
`cx.js` exporting `clsx`) and express variants as hand-written maps from variant name to a
complete literal Tailwind class string, with no runtime class merging.

## Alternatives considered

- **`class-variance-authority` + `tailwind-merge`**: lost for now because variant logic is
  not yet complex enough to pay for two dependencies, a prefix-aware merge configuration
  and a second precedence mechanism next to the cascade; revisited (by a superseding ADR)
  if variant maps grow unmanageable in Phase 4.
- **Primitives colocated under `Settings/Inputs/`**: lost because the inputs are
  consumers of the primitives (ADR-002's layering), and the folder is already the name of
  a field-component contract that must not change (FR-019).
- **String concatenation for variants**: lost because Tailwind's scanner only sees
  complete literal class names (ADR-001); concatenated classes silently produce no CSS.

## Consequences

- Callers compose states as `clsx(variants[variant], sizes[size], className)`; every
  value in a variant map is a complete literal string, so the Tailwind content scan and
  the physical-utilities check (ADR-007) both see every class.
- The variant maps are plain objects, so the check script can statically extract their
  class tokens.
- Harder: without `tailwind-merge`, a caller-supplied `className` cannot safely override
  a variant's utility of the same property; primitives therefore expose variants and
  slots instead of inviting arbitrary class overrides.

Related: ADR-001, ADR-002, ADR-003
