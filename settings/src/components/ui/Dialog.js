/**
 * Dialog — a modal dialog built on Radix Dialog for all behaviour and accessibility (focus
 * trap, Escape, aria wiring, dismiss) and styled with Tailwind. Look-preserving replacement
 * for the MUI `Modal.js` dialog (ADR-002). One component per file; variants are hand-written
 * literal class maps composed with `clsx` (ADR-013). No consumer is migrated here (T-024).
 *
 * Slots: `Dialog` (root), `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`,
 * `DialogClose`. `DialogContent` portals into the PHP-rendered host (`PortalContainer`).
 */
import { forwardRef } from '@wordpress/element';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { clsx } from './cx';
import { getPortalContainer } from './PortalContainer';

// Max-width variants. Each value is a COMPLETE literal Tailwind class string (ADR-013): no
// concatenation, so the content scan and the physical-utilities check see every class. The
// legacy `.cmplz-modal` is a fixed 526px, kept as the default `md`.
const sizes = {
	sm: 'tw-max-w-md',
	md: 'tw-max-w-[526px]',
	lg: 'tw-max-w-3xl',
};

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef( ( { className, ...props }, ref ) => (
	<DialogPrimitive.Overlay
		ref={ ref }
		className={ clsx(
			'tw-fixed tw-inset-0 tw-z-40 tw-bg-[rgba(128,128,128,0.45)]',
			className
		) }
		{ ...props }
	/>
) );
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = forwardRef(
	( { className, size = 'md', children, ...props }, ref ) => (
		<DialogPrimitive.Portal container={ getPortalContainer() }>
			<DialogOverlay />
			<div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-[var(--cmplz-space-l)]">
				<DialogPrimitive.Content
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
				</DialogPrimitive.Content>
			</div>
		</DialogPrimitive.Portal>
	)
);
DialogContent.displayName = 'DialogContent';

const DialogTitle = forwardRef( ( { className, ...props }, ref ) => (
	<DialogPrimitive.Title
		ref={ ref }
		className={ clsx(
			'tw-m-0 tw-mb-[var(--cmplz-space-xs)] tw-text-xl tw-font-semibold tw-text-[color:var(--cmplz-text)]',
			className
		) }
		{ ...props }
	/>
) );
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = forwardRef( ( { className, ...props }, ref ) => (
	<DialogPrimitive.Description
		ref={ ref }
		className={ clsx(
			'tw-m-0 tw-text-[color:var(--cmplz-text-muted)]',
			className
		) }
		{ ...props }
	/>
) );
DialogDescription.displayName = 'DialogDescription';

export {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogOverlay,
	DialogContent,
	DialogTitle,
	DialogDescription,
};
