/**
 * Tooltip — a hover/focus tooltip built on Radix Tooltip for all behaviour and accessibility
 * (delay, dismiss, aria wiring) and styled with Tailwind. Look-preserving replacement for the
 * `react-tooltip` usage in `utils/Icon.js` (ADR-002): its dark default surface, 300px cap, small
 * padding and arrow are reproduced here. One component per file; variants are hand-written
 * literal class maps composed with `clsx` (ADR-013). No consumer is migrated here (T-024).
 *
 * Slots: `TooltipProvider` (delay/skip config), `Tooltip` (root, `delayDuration`),
 * `TooltipTrigger`, `TooltipContent`. `TooltipContent` portals into the PHP-rendered host
 * (`PortalContainer`). The dark colours match the `react-tooltip` defaults, which have no
 * semantic `--cmplz-*` token (the token layer carries no dark-tooltip surface).
 */
import { forwardRef } from '@wordpress/element';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx } from './cx';
import { getPortalContainer } from './PortalContainer';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef(
	( { className, sideOffset = 4, children, ...props }, ref ) => (
		<TooltipPrimitive.Portal container={ getPortalContainer() }>
			<TooltipPrimitive.Content
				ref={ ref }
				sideOffset={ sideOffset }
				className={ clsx(
					'tw-z-50 tw-max-w-[300px] tw-rounded-[3px] tw-bg-[#222] tw-px-4 tw-py-2',
					'tw-text-[90%] tw-text-[color:#fff] tw-opacity-90 tw-shadow-md',
					className
				) }
				{ ...props }
			>
				{ children }
				<TooltipPrimitive.Arrow className="tw-fill-[#222]" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	)
);
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
