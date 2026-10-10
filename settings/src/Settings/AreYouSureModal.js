import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogDescription,
} from '../components/ui/AlertDialog';
import { Button } from '../components/ui/Button';

// Look-preserving migration of the legacy MUI confirm modal onto the AlertDialog primitive
// (ADR-002, T-024): `role="alertdialog"`, focus trap, focus-on-open and focus return are handled by
// Radix. Public props are unchanged (`isOpen`, `onCancel`, `onConfirm`, `children`) so callers stay
// untouched (FR-019). The model stays parent-controlled exactly as it was with MUI: the caller owns
// `isOpen`. T-026 wires this component back in as the vehicle for the four former
// `__experimentalConfirmDialog` usages (Inputs/Button.js, ButtonControl.js, ResetBannerButton.js,
// CopyMultisite.js), so it is now live.
//
// Callback wiring (no double-fire, focus correct): the Cancel button is an `AlertDialogCancel`. That
// is load-bearing — Radix AlertDialog's `onOpenAutoFocus` focuses its internal `cancelRef`, and that
// ref is populated ONLY by an `AlertDialogCancel`; with it, focus actually enters the dialog on open
// and the focus trap is seeded (a plain Cancel button would leave focus on the background trigger and
// the trap unseeded). The Cancel button wraps the Button primitive with `asChild`, so Radix's Slot
// clones it and threads `cancelRef` down to the primitive's forwarded native-button ref — the focus
// seed survives the Button-primitive swap. The Cancel click and the Escape key both arrive as
// `onOpenChange(false)` and route to `onCancel`. Confirm is a plain Button that calls `onConfirm`
// only; the parent then flips `isOpen` to false, and a controlled-prop close does NOT re-fire
// `onOpenChange`, so `onCancel` never double-fires on Confirm.
//
// Focus RETURN on close (DB-09): Radix's modal content restores focus to its `AlertDialogTrigger` on
// close, but this dialog is parent-controlled with NO trigger element (the opener is the caller's own
// button), so Radix's `triggerRef` is null and the default close would drop focus to `<body>` — a
// DB-09 regression the old MUI/WP confirm handled itself. We reproduce the correct behaviour: capture
// the element that opened the dialog at the open transition (synchronously in render, BEFORE Radix's
// focus effects run — child layout/passive effects fire before this parent's, so an effect would read
// the already-moved focus), then restore it in `onCloseAutoFocus`.
//
// Robustness (verify-then-suppress): we call `opener.focus()` FIRST and only `preventDefault()` when
// it actually landed (`document.activeElement === opener`). `preventDefault()` suppresses BOTH Radix's
// own null-`triggerRef` focus AND FocusScope's previous-element fallback, so suppressing when our focus
// did NOT take (a `disabled`/unfocusable opener — e.g. ResetBannerButton disables its button on
// confirm in the same commit the dialog unmounts — where `focus()` is a silent no-op) would strand
// focus on `<body>`. By not preventing default in that case we fall through to Radix's own close
// handling. We also skip capture when the active element is `<body>`/absent (e.g. engines that do not
// focus a `<button>` on mouse-down), so we never "restore" to the body.
//
// Outside/overlay click does NOT dismiss: Radix AlertDialog blocks it by design for destructive
// confirms (ARIA-recommended) — a deliberate change from the old MUI backdrop-dismiss; use Cancel or
// Escape.
//
// Footer/content styling (the "needs css" that kept this component disabled): the legacy
// `.cmplz-modal .cmplz-modal-*` and `.cmplz-button` rules are descendant-scoped under `.cmplz-modal`,
// which no longer wraps this dialog now that it renders in the portal host, so they do not apply.
// The footer is now a logical flex row (no physical margins, ADR-007) and both buttons use the Button
// primitive (T-025) with its `secondary`/`error` variants — so the confirm/cancel look is drawn from
// the primitive + semantic `--cmplz-*` tokens, independent of the retired legacy modal CSS.
const AreYouSureModal = ( { isOpen, onCancel, onConfirm, children } ) => {
	// The element that had focus when the dialog opened — captured at the open transition so it can be
	// refocused on close (see the focus-RETURN note above).
	const openerRef = useRef( null );
	const wasOpenRef = useRef( false );
	if ( isOpen && ! wasOpenRef.current && typeof document !== 'undefined' ) {
		const active = document.activeElement;
		openerRef.current = active && active !== document.body ? active : null;
	}
	wasOpenRef.current = isOpen;

	return (
		<AlertDialog
			open={ isOpen }
			onOpenChange={ ( open ) => {
				// Escape, and the Cancel button's controlled close, both act as cancel.
				if ( ! open ) {
					onCancel();
				}
			} }
		>
			<AlertDialogContent
				onCloseAutoFocus={ ( event ) => {
					const opener = openerRef.current;
					if (
						opener &&
						opener.isConnected &&
						typeof opener.focus === 'function'
					) {
						opener.focus();
						// Only suppress Radix's own close-focus if ours actually landed; a
						// disabled/unfocusable opener no-ops, so fall through rather than
						// stranding focus on <body> (see the focus-RETURN note above).
						if ( document.activeElement === opener ) {
							event.preventDefault();
						}
					}
				} }
			>
				<AlertDialogTitle>
					{ __( 'Are you sure?', 'complianz-gdpr' ) }
				</AlertDialogTitle>
				<AlertDialogDescription asChild>
					<div>{ children }</div>
				</AlertDialogDescription>
				<div className="tw-mt-[var(--cmplz-space-m)] tw-flex tw-justify-end tw-gap-[var(--cmplz-space-xs)]">
					<AlertDialogCancel asChild>
						<Button variant="secondary">
							{ __( 'Cancel', 'complianz-gdpr' ) }
						</Button>
					</AlertDialogCancel>
					<Button variant="error" onClick={ onConfirm }>
						{ __( 'Confirm', 'complianz-gdpr' ) }
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default AreYouSureModal;
