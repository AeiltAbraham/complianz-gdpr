# ADR-002: Radix for headless interactive primitives, styled with Tailwind

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D3 (decided 2026-10-01), §3.3, §4.3.1–§4.3.3. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

Not accepted yet, so not part of this decision: the primitives folder `settings/src/components/ui/` (D4, Proposed) and the variant helper, `clsx` plus hand-written variant maps with `class-variance-authority`/`tailwind-merge` to be revisited (D5, Proposed). The wider "keep the logic, rewrite the presentation" rule (D10) is also only Proposed in the doc, although its FR-019 already requires migrated components to keep their props.

## Context

The app draws its UI from four overlapping sources (§1, §3.3): `@mui/material` (Dialog in `Modal.js` and `Settings/AreYouSureModal.js`, Popover in `DateRange/DateRange.js`), `react-tooltip` (`utils/Icon.js`, whose MUI Tooltip import is already commented out in this checkout), `@wordpress/components` in seven files (`__experimentalConfirmDialog`, `TextareaControl`, `FormFileUpload`) and Radix (Checkbox, RadioGroup, Select, Switch, Popover). The same primitive therefore looks and behaves differently from screen to screen, MUI brings the emotion runtime, and `@wordpress/components` relies on the `wp-components` stylesheet and WordPress core classes. React is not bundled: WordPress 5.9–6.1 ship React 17 and later versions React 18, so every bundled dependency must run on both (§2.2). The redesign needs one headless primitive library under one styling system (goals G1, G3).

## Decision

We use Radix for the behavior and accessibility of every interactive primitive authored in `settings/src` (dialog, alert dialog, popover, tooltip, select, checkbox, radio group, switch, tabs), let Tailwind do all of their styling, and replace every `@mui/material`, `react-tooltip` and `@wordpress/components` usage with these primitives.

## Alternatives considered

- **Keep MUI** for dialogs and popovers: lost because it brings the emotion CSS-in-JS runtime and a styling system of its own next to Tailwind; dropping MUI and emotion is an explicit goal (§1, SC-4, FR-011).
- **Build on `@wordpress/components`**: lost because its components need the `wp-components` stylesheet and carry `components-*` classes, whose unlayered wp-admin rules conflict with utilities on the same element (§4.3.4).

## Consequences

- One primitive library and one styling system for code authored in `settings/src` (SC-2). Enforced by FR-010, FR-011, FR-019 and FR-023 of the input spec.
- Layering (§4.3.1): Radix plus Tailwind for Dialog, AlertDialog, Popover, Tooltip, Select, Checkbox, RadioGroup, Switch and Tabs; plain JSX plus Tailwind where native behavior is enough (Button, TextField, Textarea, Card, Badge, Skeleton, Spinner); Downshift for the async combobox (ADR-003). Retained third-party widgets (CKEditor, Ace, data table, date range, charts, Shepherd, toastify, react-color) are themed, not replaced.
- Phase 2 (§7.3) rebuilds the 16 `Settings/Inputs/*`, `Modal.js`, `AreYouSureModal.js`, the `Icon.js` tooltip and the `DateRange` popover on the primitives. The four `ConfirmDialog` usages become `AlertDialog` in the portal host, `TextareaControl` becomes `Textarea`, and the two `FormFileUpload` usages become a native file input triggered by `Button`. Then `@mui/material`, `react-tooltip` and `@wordpress/components` are removed; knip checks for leftovers after Phases 1, 2 and 5.
- Field components keep their props and the `Field.js` type map, so callers and PHP field definitions do not change (FR-012, FR-019); Zustand stores and API calls stay untouched (§4.3.3).
- Radix packages are added per primitive and upgraded together so they share compatible internals. Each one must accept React 17 as a peer and avoid React 18-only APIs, checked in Spike S1 and on every dependency MR (FR-023).
- Harder: being headless, Radix leaves the styling, variants and states of every primitive to us, and anything Radix lacks (the combobox) needs a second headless library. The legacy `complianz-admin` handle keeps its `wp-components` stylesheet dependency (`class-admin.php:218`) until Phase 5.

Related: ADR-001, ADR-003, ADR-005
