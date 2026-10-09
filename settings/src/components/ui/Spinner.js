/**
 * Spinner — a loading indicator styled with Tailwind (ADR-002: no Radix). The app has no dedicated
 * legacy spinner (loading states use the skeleton placeholders), so this is a conventional circular
 * CSS spinner (`tw-animate-spin`) drawn with the semantic `--cmplz-*` tokens. One component per
 * file; the size map is a hand-written literal class map composed with `clsx` (ADR-013). No consumer
 * is migrated here (T-025).
 *
 * Accessibility (DB-12, WCAG 2.2 AA): `role="status"` with a visually-hidden text label (`tw-sr-only`)
 * gives the control an accessible name; the rotating ring is `aria-hidden`. The label defaults to a
 * translated "Loading" and can be overridden with `label`.
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { clsx } from './cx';

// Size map — complete literal class strings (ADR-013). Square dimensions (h/w are axis-symmetric, so
// RTL-safe under ADR-007).
const sizes = {
	sm: 'tw-h-4 tw-w-4',
	md: 'tw-h-6 tw-w-6',
	lg: 'tw-h-8 tw-w-8',
};

const Spinner = forwardRef(
	( { size = 'md', label, className, ...props }, ref ) => (
		<span
			ref={ ref }
			role="status"
			className={ clsx( 'tw-inline-flex', className ) }
			{ ...props }
		>
			<span
				aria-hidden="true"
				className={ clsx(
					'tw-inline-block tw-animate-spin tw-rounded-full tw-border-2',
					'tw-border-[color:var(--cmplz-border)] tw-border-t-[color:var(--cmplz-accent-strong)]',
					sizes[ size ]
				) }
			/>
			<span className="tw-sr-only">
				{ label || __( 'Loading', 'complianz-gdpr' ) }
			</span>
		</span>
	)
);
Spinner.displayName = 'Spinner';

export { Spinner };
