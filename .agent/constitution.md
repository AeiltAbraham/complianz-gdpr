# Constitution

Non-negotiable standards for this repository, set at `/flow:init` on 2026-10-06 from the
maintainer's answers. Change them only by an explicit decision recorded here with a date
(usually proposed by `/flow:retro`).

## Code quality

1. **Security review on every PHP change.** Output is escaped, input is sanitized, and
   nonces and capabilities are verified. Every PHP change is reviewed for this before it
   merges.
2. **WordPress Coding Standards on touched PHP.** "Touched" means the lines a change adds
   or edits; existing findings elsewhere in the same file are not part of this rule
   (clarified 2026-10-07). Enforced in review until the commit gate can enforce it
   (tracked in `conventions.md`, section "Gate").
3. **Stable public API.** The plugin's `cmplz_` filters and actions, its REST routes and
   its saved options never break without a deprecation path.

## Testing

4. **TDD for logic, characterization for UI.** PHP and JS logic follows
   red-green-refactor, with evidence. UI changes are protected by end-to-end and
   screenshot tests written against the current behavior before the UI changes.

## User experience

5. **WCAG 2.2 AA** for any UI that is touched.
6. **RTL parity** for any UI that is touched: right-to-left layouts work at least as well
   as before the change.
