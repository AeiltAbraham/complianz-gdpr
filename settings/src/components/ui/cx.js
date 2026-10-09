/**
 * Shared class-name helper for the UI primitives.
 *
 * ADR-013: primitives compose variants with `clsx` and hand-written literal class maps —
 * never runtime class merging (no `class-variance-authority`, no `tailwind-merge`). Every
 * primitive imports `{ clsx }` from here so the merge strategy stays a single source of truth.
 */
export { default as clsx } from 'clsx';
