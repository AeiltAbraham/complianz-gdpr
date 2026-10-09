/**
 * Button — a plain native `<button>` styled with Tailwind (ADR-002: no Radix; the native
 * button already gives us keyboard operation, `disabled` and the `button` role). Look-preserving
 * replacement for the legacy `.button--*` set (`assets/css/admin/legacy-globals.scss` + the
 * `:root --button-*` vars). Expresses everything with `tw-` utilities and carries NO WordPress
 * core classes (`.button`/`button-primary`), per FR-020 — so the font metrics, min-height and
 * padding that wp-admin's `.button` used to supply are reproduced here from the `--button-*`
 * values. One component per file; variants are hand-written literal class maps composed with
 * `clsx` (ADR-013). No consumer is migrated here (T-025).
 *
 * Props: `variant` (primary | secondary | tertiary | error), `type` (default `button` so the
 * primitive never submits a form by accident), plus any native button props — `disabled`,
 * `onClick`, `children`, `className`, `aria-*` — spread through, and the ref forwarded.
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

// Shared base — the legacy `a.button, button.button` restyle PLUS the font-size and min-height
// that wp-admin's `.button` contributed (now forbidden by FR-020), as COMPLETE literal Tailwind
// classes (ADR-013). What the legacy buttons ACTUALLY render (the `--button-font-weight`/
// `-letter-spacing`/`-line-height` :root vars are dead — never referenced by any rule — so they are
// NOT reproduced): font-size 0.8125rem (13px), font-weight 400 (normal, inherited; `tw-font-normal`
// pins it so it never picks up a lighter ancestor), letter-spacing normal, transition all 0.3s ease,
// min-height 30px, padding 0 10px, border-radius 4px. Centering is `inline-flex` + `min-h-[30px]`, so
// the single-line label is vertically centred regardless of line-height (the WP `.button` used
// line-height for this; the visual result is unchanged). The `focus-visible` outline replaces
// wp-admin's focus ring (no legacy focus style to preserve) for WCAG 2.2 AA keyboard focus; disabled
// is a neutral dim (the legacy set has no disabled style).
const base = clsx(
	'tw-inline-flex tw-items-center tw-justify-center',
	'tw-m-0 tw-min-h-[30px] tw-py-0 tw-px-[10px]',
	'tw-rounded-[4px] tw-border tw-text-center tw-no-underline',
	'tw-text-[0.8125rem] tw-font-normal',
	'tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-[ease]',
	'focus:tw-outline-none',
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong)]',
	'disabled:tw-cursor-not-allowed disabled:tw-opacity-50'
);

// Variant map — each value is a COMPLETE literal class string (ADR-013), reproducing the legacy
// `.button--*` colours. The primary blue (#2271b1) and the neutral grey scale (grey-100..400:
// #fafafa/#f7f7f7/#ededed/#c6c6c6) are the wp-admin button palette, which has no `--cmplz-*`
// semantic counterpart, so they are concrete look-preserving literals (same approach as Tooltip's
// dark surface). The error red is the semantic danger colour, so it uses `--cmplz-danger`
// (#d7263d, exact) and `--cmplz-text-on-accent` (rgba(255,255,255,0.95), exact) — never the
// renamed legacy token names (ADR-004 / T-018 gate).
const variants = {
	// primary: blue fill, white text; hover only adds the focus-style ring (bg/text/border unchanged).
	primary: clsx(
		'tw-bg-[#2271b1] tw-text-[#fff] tw-border-[#2271b1]',
		'hover:tw-shadow-[0_0_0_3px_rgba(34,113,177,0.3)]'
	),
	// secondary: white fill, blue text/border; hover greys the fill (grey-200).
	secondary: clsx(
		'tw-bg-[#fff] tw-text-[#2271b1] tw-border-[#2271b1]',
		'hover:tw-bg-[#f7f7f7]'
	),
	// tertiary: grey fill (grey-200) + grey border (grey-300), blue text; hover lightens (grey-100)
	// and darkens the border (grey-400).
	tertiary: clsx(
		'tw-bg-[#f7f7f7] tw-text-[#2271b1] tw-border-[#ededed]',
		'hover:tw-bg-[#fafafa] hover:tw-border-[#c6c6c6]'
	),
	// error: red fill, near-white text; hover inverts to a faded-red fill with red text/border and a
	// red ring.
	error: clsx(
		'tw-bg-[var(--cmplz-danger)] tw-text-[color:var(--cmplz-text-on-accent)] tw-border-[color:var(--cmplz-danger)]',
		'hover:tw-bg-[#fbebed] hover:tw-text-[color:var(--cmplz-danger)] hover:tw-border-[color:var(--cmplz-danger)]',
		'hover:tw-shadow-[0_0_0_3px_rgba(255,0,0,0.3)]'
	),
};

const Button = forwardRef(
	(
		{ variant = 'primary', type = 'button', className, children, ...props },
		ref
	) => (
		// eslint-disable-next-line react/button-has-type -- `type` is a constrained string prop.
		<button
			ref={ ref }
			type={ type }
			className={ clsx( base, variants[ variant ], className ) }
			{ ...props }
		>
			{ children }
		</button>
	)
);
Button.displayName = 'Button';

export { Button };
