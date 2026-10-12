/**
 * TextField — a plain native `<input>` styled with Tailwind (ADR-002: no Radix; a native input
 * is keyboard-operable and programmatically labelable on its own). Look-preserving replacement for
 * the current text-input look (`assets/css/admin/modules/inputs/Input.scss`), styled with the
 * semantic `--cmplz-*` tokens. One component per file (ADR-013). No consumer is migrated here
 * (T-025).
 *
 * forms.css independence (DB-03): the primitive sets its own border, radius, padding, background,
 * colour and focus ring with `tw-` utilities, and never relies on wp-admin's `forms.css`. The only
 * thing forms.css used to carry — the control's font — is supplied by the S1-derived scoped base
 * (base.css B3 `:is(button,input,select,textarea) { font: inherit; color: inherit; margin: 0 }`),
 * which inherits the app-root typography (base.css B2). The border reset there (base.css B1
 * `border-width: 0; border-style: solid`) is why `tw-border` is required to draw the 1px edge.
 *
 * Props: label association is left to the caller (pass `id` + an external `<label htmlFor>`, or
 * `aria-labelledby` / `aria-label`); `type`, `value`, `onChange`, `disabled`, `placeholder`,
 * `aria-*` and any other native input props spread through, and the ref is forwarded. `invalid`
 * (T-045) renders the error ring and sets `aria-invalid` — the field-row's validation state, moved
 * off the deleted wrapper->descendant `.cmplz-error input` selector onto the primitive.
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

// Complete literal class string (ADR-013): 1px field border, the 6px --cmplz-radius-field, 5px/8px
// padding (vertical 5px is concrete, horizontal is --cmplz-space-xs = 8px), 13px font (0.8125rem;
// concrete, not a token), line-height 1.5, text colour and field surface tokens. Disabled greys the
// fill and text via the --cmplz-surface-disabled / --cmplz-text-disabled tokens (T-045, referenced
// with a literal fallback); never a legacy token name.
const base = clsx(
	'tw-border tw-rounded-[var(--cmplz-radius-field)]',
	'tw-py-[5px] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-leading-normal tw-text-[color:var(--cmplz-text)] tw-bg-[var(--cmplz-field-surface)]',
	'tw-outline-none',
	'disabled:tw-bg-[var(--cmplz-surface-disabled,_#f1f5f9)] disabled:tw-text-[color:var(--cmplz-text-disabled,_#94a3b8)] disabled:tw-cursor-not-allowed'
);
// Ring variants as complete-literal maps so the two never produce conflicting border-color/shadow
// utilities (ADR-013: no tailwind-merge). Default = field border + the legacy accent-strong focus ring
// (#1e73be). Invalid = a --cmplz-danger border + a 2px --cmplz-danger-surface halo (the deleted
// `.cmplz-error input` box-shadow), with the accent-strong focus ring still winning while focused —
// exactly the legacy cascade (`:focus` beat `.cmplz-error input`).
const FOCUS_RING = 'focus:tw-border-[color:var(--cmplz-accent-strong)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]';
const defaultRing = clsx( 'tw-border-[color:var(--cmplz-field-border)]', FOCUS_RING );
const invalidRing = clsx(
	'tw-border-[color:var(--cmplz-danger,_#d7263d)] tw-shadow-[0_0_0_2px_var(--cmplz-danger-surface,_#fdebed)]',
	FOCUS_RING
);

const TextField = forwardRef(
	( { type = 'text', className, invalid, ...props }, ref ) => (
		<input
			ref={ ref }
			type={ type }
			aria-invalid={ invalid ? 'true' : undefined }
			className={ clsx( base, invalid ? invalidRing : defaultRing, className ) }
			{ ...props }
		/>
	)
);
TextField.displayName = 'TextField';

export { TextField };
