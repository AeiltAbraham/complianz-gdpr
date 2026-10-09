import { __ } from '@wordpress/i18n';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogDescription,
} from '../components/ui/AlertDialog';

// Look-preserving migration of the legacy MUI confirm modal onto the AlertDialog primitive
// (ADR-002, T-024): `role="alertdialog"`, focus trap, focus-on-open and focus return are handled by
// Radix. Public props are unchanged (`isOpen`, `onCancel`, `onConfirm`, `children`) so callers stay
// untouched (FR-019). The model stays parent-controlled exactly as it was with MUI: the caller owns
// `isOpen`.
//
// Callback wiring (no double-fire, focus correct): the Cancel button is an `AlertDialogCancel`. That
// is load-bearing — Radix AlertDialog's `onOpenAutoFocus` focuses its internal `cancelRef`, and that
// ref is populated ONLY by an `AlertDialogCancel`; with it, focus actually enters the dialog on open
// and the focus trap is seeded (a plain Cancel button would leave focus on the background trigger and
// the trap unseeded). The Cancel click and the Escape key both arrive as `onOpenChange(false)` and
// route to `onCancel`. Confirm is a plain button that calls `onConfirm` only; the parent then flips
// `isOpen` to false, and a controlled-prop close does NOT re-fire `onOpenChange`, so `onCancel` never
// double-fires on Confirm.
//
// Outside/overlay click does NOT dismiss: Radix AlertDialog blocks it by design for destructive
// confirms (ARIA-recommended) — a deliberate change from the old MUI backdrop-dismiss; use Cancel or
// Escape.
//
// The two footer buttons KEEP their legacy `cmplz-button` classes — the Button-primitive migration is
// T-025/T-030, not this task. NOTE for the re-enable work (AreYouSureModal is commented out in
// Inputs/Button.js until its CSS is ready): the legacy `.cmplz-modal .cmplz-modal-*` rules are
// descendant-scoped under `.cmplz-modal`, which no longer wraps this dialog now that it renders in the
// portal host, so the footer/content styling must be reworked onto the primitive (semantic tokens)
// when it is wired back in.
const AreYouSureModal = ( { isOpen, onCancel, onConfirm, children } ) => {
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
			<AlertDialogContent>
				<AlertDialogTitle>
					{ __( 'Are you sure?', 'complianz-gdpr' ) }
				</AlertDialogTitle>
				<AlertDialogDescription asChild>
					<div className="cmplz-modal-content">{ children }</div>
				</AlertDialogDescription>
				<div className="cmplz-modal-footer">
					<AlertDialogCancel asChild>
						<button className="cmplz-button cmplz-button--secondary">
							{ __( 'Cancel', 'complianz-gdpr' ) }
						</button>
					</AlertDialogCancel>
					<button
						className="cmplz-button cmplz-button--error"
						onClick={ onConfirm }
					>
						{ __( 'Confirm', 'complianz-gdpr' ) }
					</button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default AreYouSureModal;
