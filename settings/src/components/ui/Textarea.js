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
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

// Complete literal class string (ADR-013) matching TextAreaInput.scss: full width, 50px min-height,
// no resize, 8px padding, 13px font (0.8125rem), text-colour token, 1px field border, 4px radius
// (TextAreaInput.scss uses a literal 4px, kept concrete so it is not shifted to the 5px field-radius
// token), hidden overflow and a border-colour transition. Focus and disabled match TextField, and
// never the renamed legacy token names.
const base = clsx(
	'tw-w-full tw-min-h-[50px] tw-resize-none tw-overflow-hidden',
	'tw-p-[8px] tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text)]',
	'tw-border tw-border-[color:var(--cmplz-field-border)] tw-rounded-[4px]',
	'tw-bg-[var(--cmplz-field-surface)] tw-outline-none',
	'tw-transition-[border-color] tw-duration-200 tw-ease-[ease-in-out]',
	'focus:tw-border-[color:var(--cmplz-accent-strong)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]',
	'disabled:tw-bg-[#f7f7f7] disabled:tw-text-[color:#c6c6c6] disabled:tw-cursor-not-allowed'
);

const Textarea = forwardRef( ( { className, ...props }, ref ) => (
	<textarea ref={ ref } className={ clsx( base, className ) } { ...props } />
) );
Textarea.displayName = 'Textarea';

export { Textarea };
