/**
 * Popover — a floating panel built on Radix Popover for all behaviour and accessibility
 * (positioning, dismiss, focus, aria) and styled with Tailwind. Look-preserving replacement for
 * the MUI Popover in `DateRange/DateRange.js` (ADR-002). One component per file; variants are
 * hand-written literal class maps composed with `clsx` (ADR-013). No consumer is migrated here
 * (T-024).
 *
 * Slots: `Popover` (root), `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`, `PopoverClose`.
 * `PopoverContent` portals into the PHP-rendered host (`PortalContainer`).
 */
import { forwardRef } from '@wordpress/element';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { clsx } from './cx';
import { getPortalContainer } from './PortalContainer';

// Inner-padding variants — complete literal Tailwind class strings (ADR-013). `none` lets a
// self-styled child (e.g. the react-date-range calendar) fill the panel, matching the current
// MUI Popover paper, which carries no padding of its own.
const paddings = {
	none: '',
	sm: 'tw-p-[var(--cmplz-space-xs)]',
	md: 'tw-p-[var(--cmplz-space-s)]',
};

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

const PopoverContent = forwardRef(
	(
		{
			className,
			padding = 'md',
			align = 'center',
			sideOffset = 4,
			children,
			...props
		},
		ref
	) => (
		<PopoverPrimitive.Portal container={ getPortalContainer() }>
			<PopoverPrimitive.Content
				ref={ ref }
				align={ align }
				sideOffset={ sideOffset }
				className={ clsx(
					'tw-z-50 tw-bg-[var(--cmplz-surface)] tw-text-[color:var(--cmplz-text)]',
					'tw-border tw-border-[color:var(--cmplz-border)] tw-rounded-[var(--cmplz-radius-field)] tw-shadow-lg',
					'focus:tw-outline-none',
					paddings[ padding ],
					className
				) }
				{ ...props }
			>
				{ children }
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	)
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverContent };
