/**
 * AlertDialog — a confirmation dialog built on Radix Alert Dialog for all behaviour and
 * accessibility (focus trap, Escape, `role="alertdialog"`, required-action semantics) and styled
 * with Tailwind. Look-preserving replacement for the `AreYouSureModal.js` confirm dialog
 * (ADR-002). One component per file; variants are hand-written literal class maps composed with
 * `clsx` (ADR-013). No consumer is migrated here (T-024/T-026).
 *
 * Slots: `AlertDialog` (root), `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`,
 * `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`. `AlertDialogContent`
 * portals into the PHP-rendered host (`PortalContainer`).
 */
import { forwardRef } from '@wordpress/element';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { clsx } from './cx';
import { getPortalContainer } from './PortalContainer';

// Max-width variants — complete literal Tailwind class strings (ADR-013). The legacy confirm
// modal matches `.cmplz-modal` at a fixed 526px, kept as the default `md`.
const sizes = {
	sm: 'tw-max-w-md',
	md: 'tw-max-w-[526px]',
	lg: 'tw-max-w-3xl',
};

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogAction = AlertDialogPrimitive.Action;
const AlertDialogCancel = AlertDialogPrimitive.Cancel;

const AlertDialogOverlay = forwardRef( ( { className, ...props }, ref ) => (
	<AlertDialogPrimitive.Overlay
		ref={ ref }
		className={ clsx(
			'tw-fixed tw-inset-0 tw-z-40 tw-bg-[rgba(128,128,128,0.45)]',
			className
		) }
		{ ...props }
	/>
) );
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

const AlertDialogContent = forwardRef(
	( { className, size = 'md', children, ...props }, ref ) => (
		<AlertDialogPrimitive.Portal container={ getPortalContainer() }>
			<AlertDialogOverlay />
			<div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-[var(--cmplz-space-l)]">
				<AlertDialogPrimitive.Content
					ref={ ref }
					className={ clsx(
						'tw-relative tw-w-full tw-bg-[var(--cmplz-surface)] tw-text-[color:var(--cmplz-text)]',
						'tw-rounded-[var(--cmplz-radius)] tw-p-[var(--cmplz-space-m)] tw-shadow-2xl',
						'focus:tw-outline-none',
						sizes[ size ],
						className
					) }
					{ ...props }
				>
					{ children }
				</AlertDialogPrimitive.Content>
			</div>
		</AlertDialogPrimitive.Portal>
	)
);
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogTitle = forwardRef( ( { className, ...props }, ref ) => (
	<AlertDialogPrimitive.Title
		ref={ ref }
		className={ clsx(
			'tw-m-0 tw-mb-[var(--cmplz-space-xs)] tw-text-xl tw-font-semibold tw-text-[color:var(--cmplz-text)]',
			className
		) }
		{ ...props }
	/>
) );
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = forwardRef( ( { className, ...props }, ref ) => (
	<AlertDialogPrimitive.Description
		ref={ ref }
		className={ clsx(
			'tw-m-0 tw-text-[color:var(--cmplz-text-muted)]',
			className
		) }
		{ ...props }
	/>
) );
AlertDialogDescription.displayName = 'AlertDialogDescription';

export {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogOverlay,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogDescription,
};
