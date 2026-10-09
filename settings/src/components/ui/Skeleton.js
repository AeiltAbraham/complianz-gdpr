/**
 * Skeleton — a loading placeholder block styled with Tailwind (ADR-002: no Radix). Stands in for the
 * legacy `.cmplz-placeholder-line` loading blocks (`assets/css/admin/modules/placeholder.scss`): a
 * rounded, animated bar. The legacy shine-gradient animation is replaced by the conventional
 * `tw-animate-pulse` over a semantic token surface, as the task specifies. One component per file
 * (ADR-013). No consumer is migrated here (T-025).
 *
 * Decorative: the block carries `aria-hidden="true"` so assistive tech skips it (the surrounding
 * loading region announces state). `width` and `height` are inline styles (a skeleton's dimensions
 * are inherently dynamic; inline styles also avoid a cascade clash with the scoped utilities), and
 * extra classes compose through `className`.
 */
import { forwardRef } from '@wordpress/element';
import { clsx } from './cx';

const Skeleton = forwardRef(
	(
		{ width = '100%', height = '1rem', className, style, ...props },
		ref
	) => (
		<span
			ref={ ref }
			aria-hidden="true"
			className={ clsx(
				'tw-block tw-animate-pulse tw-rounded-[var(--cmplz-radius-s)] tw-bg-[var(--cmplz-surface-sunken)]',
				className
			) }
			style={ { width, height, ...style } }
			{ ...props }
		/>
	)
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
