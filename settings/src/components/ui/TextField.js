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
 * `aria-*` and any other native input props spread through, and the ref is forwarded.
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

// Complete literal class string (ADR-013) matching Input.scss: 1px field border, 5px field radius,
// 5px/10px padding (--cmplz-space-xs is 10px; the 5px vertical has no token, kept concrete), 13px
// font (0.8125rem, the legacy fs-300 value; concrete, not a token), line-height 1.5, text
// colour and field surface tokens. Focus mirrors the legacy `:focus`: accent-strong border + a 2px
// accent-strong ring (--cmplz-accent-strong is #1e73be, the legacy dark-blue). Disabled greys the
// fill (grey-200 #f7f7f7) and the text (grey-400 #c6c6c6) — neither has a `--cmplz-*` token, so
// they stay concrete, and never the renamed legacy token names.
const base = clsx(
	'tw-border tw-border-[color:var(--cmplz-field-border)] tw-rounded-[var(--cmplz-radius-field)]',
	'tw-py-[5px] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-leading-normal tw-text-[color:var(--cmplz-text)] tw-bg-[var(--cmplz-field-surface)]',
	'tw-outline-none',
	'focus:tw-border-[color:var(--cmplz-accent-strong)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]',
	'disabled:tw-bg-[#f7f7f7] disabled:tw-text-[color:#c6c6c6] disabled:tw-cursor-not-allowed'
);

const TextField = forwardRef(
	( { type = 'text', className, ...props }, ref ) => (
		<input
			ref={ ref }
			type={ type }
			className={ clsx( base, className ) }
			{ ...props }
		/>
	)
);
TextField.displayName = 'TextField';

export { TextField };
