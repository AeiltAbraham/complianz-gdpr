# ADR-003: A Downshift-based Combobox replaces react-select for async search

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D13, §3.3, §4.3.2. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

## Context

The wizard's `document` field type (four fields in `settings/config/fields/wizard/general.php`) renders `settings/src/Settings/DocumentControl.js`, which uses `react-select/async` (imported on line 1, rendered on line 121) as an async, searchable page selector. `react-select` brings emotion and its own styling system, which conflicts with a single Tailwind styling system and with removing emotion from the bundle (FR-011). Radix, the chosen primitive library (ADR-002), has no combobox (§4.3.1). Whatever replaces it must run on React 17 (FR-023) and render into the portal host like every other select authored in `settings/src` (FR-010).

## Decision

We build a `Combobox` primitive on Downshift's `useCombobox` hook with Radix Popover for positioning and portal, styled with Tailwind, migrate `DocumentControl` to it in Phase 2 with today's behavior as its contract, and remove `react-select`.

## Alternatives considered

- **Keep `react-select`**: lost because it brings emotion and a separate styling system; once MUI and `react-select` are gone, no emotion package remains in the bundle (§7.3, FR-011).
- **Radix alone**: lost because Radix has no combobox primitive (§4.3.1).

## Consequences

- The contract is today's `DocumentControl` behavior: single value, not clearable, options searched through the existing `get_pages_list` action, initial value accepted as an object or as a one-element array, loading and empty states as today. A debounce may replace today's fixed 1000 ms wait only if it sends the same requests. Props and the saved value format stay unchanged (FR-019).
- Downshift is headless, follows the ARIA 1.2 combobox pattern and, per §4.3.2, declares `react >=16.12` as its peer, so it fits FR-023.
- Harder: two libraries have to be wired together by hand: `Popover.Anchor` on the input (no trigger button), `modal={false}`, `onOpenAutoFocus` prevented so focus stays in the input, the menu kept mounted (`forceMount`, or `getMenuProps` with `suppressRefError` and a documented reason), the open state owned by Downshift (`isOpen` passed to `Popover.Root`), and `onInteractOutside` ignoring events on the anchor input, which Radix would otherwise treat as outside clicks.
- The listbox renders in the portal inner wrapper, so it gets `data-cmplz-ui`, the scoped base and the root typography; unlike retained widgets it is not an isolated zone (ADR-001).
- Enforced by FR-010, FR-011, FR-019 and FR-023 of the input spec. The removal is confirmed with `npm ls @emotion/react` and knip in Phase 2 (§7.3), and the document fields are covered by the field layer of the e2e suite planned in the doc.

Related: ADR-001, ADR-002
