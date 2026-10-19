/**
 * Textarea — a plain native `<textarea>` styled with Tailwind, the multi-line sibling of
 * `TextField` (ADR-002: no Radix). Look-preserving replacement for the current textarea look
 * (`assets/css/admin/modules/inputs/TextAreaInput.scss`). One component per file (ADR-013). No
 * consumer is migrated here (T-025).
 *
 * forms.css independence (DB-03): as with `TextField`, the primitive draws its own border, radius,
 * padding, background, colour and focus ring with `tw-` utilities; the font comes from the
 * S1-derived scoped base (base.css B3 `font: inherit`, inheriting B2's app-root typography), and
 * `tw-border` is required because base.css B1 resets `border-width` to 0.
 *
 * Props: label association left to the caller (`id` + external `<label htmlFor>`, or
 * `aria-labelledby` / `aria-label`); `id`, `value`, `onChange`, `disabled`, `placeholder`,
 * `rows`, `aria-*` and any other native textarea props spread through, and the ref is forwarded.
 * `invalid` (T-045) renders the error ring and sets `aria-invalid`, matching TextField — the
 * field-row validation state moved off the deleted `.cmplz-error textarea` selector.
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

// Complete literal class string (ADR-013) matching TextAreaInput.scss: full width, 50px min-height,
// no resize, 8px padding, 13px font (0.8125rem), text-colour token, 1px field border, 4px radius
// (TextAreaInput.scss uses a literal 4px, kept concrete so it is not shifted to the 6px field-radius
// token), hidden overflow and a border-colour transition. Disabled greys the fill and text via the
// --cmplz-surface-disabled / --cmplz-text-disabled tokens (T-045, literal fallback), never a legacy name.
const base = clsx(
	'tw-w-full tw-min-h-[50px] tw-resize-none tw-overflow-hidden',
	// LITERAL FALLBACKS on every token ref (== the token value) so this primitive is look-identical
	// whether it renders inside a `data-cmplz-ui` island (TextAreaInput) OR markerless (Support.js renders
	// a standalone <Textarea> with no marker ancestor) — matching TextField's discipline. Without them the
	// markerless Support textarea resolved these to invalid-at-computed-value; the Phase-5 token broadening
	// (tokens.css now declares on #complianz-app) would otherwise change its computed colour/fill/border.
	// With the fallback == token, both the broadening and a future marker move are a genuine no-op here.
	'tw-p-[8px] tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text,_#0f172a)]',
	'tw-border tw-rounded-[4px]',
	'tw-bg-[var(--cmplz-field-surface,_#ffffff)] tw-outline-none',
	'tw-transition-[border-color] tw-duration-200 tw-ease-[ease-in-out]',
	'disabled:tw-bg-[var(--cmplz-surface-disabled,_#f1f5f9)] disabled:tw-text-[color:var(--cmplz-text-disabled,_#94a3b8)] disabled:tw-cursor-not-allowed'
);
// Ring variants as complete-literal maps (ADR-013: no merge), matching TextField: the default field
// border + accent-strong focus ring, or the --cmplz-danger border + --cmplz-danger-surface halo when
// invalid, with the focus ring still winning while focused.
const FOCUS_RING = 'focus:tw-border-[color:var(--cmplz-accent-strong,_#1e73be)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong,_#1e73be)]';
const defaultRing = clsx( 'tw-border-[color:var(--cmplz-field-border,_#94a3b8)]', FOCUS_RING );
const invalidRing = clsx(
	'tw-border-[color:var(--cmplz-danger,_#d7263d)] tw-shadow-[0_0_0_2px_var(--cmplz-danger-surface,_#fdebed)]',
	FOCUS_RING
);

const Textarea = forwardRef( ( { className, invalid, ...props }, ref ) => (
	<textarea
		ref={ ref }
		aria-invalid={ invalid ? 'true' : undefined }
		className={ clsx( base, invalid ? invalidRing : defaultRing, className ) }
		{ ...props }
	/>
) );
Textarea.displayName = 'Textarea';

export { Textarea };
