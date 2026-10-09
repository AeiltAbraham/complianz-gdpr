import { Dialog, DialogContent, DialogTitle } from './components/ui/Dialog';

// Look-preserving migration of the legacy MUI `Dialog`/`DialogTitle` onto the Dialog primitive
// (ADR-002, T-024). Public props are unchanged (`isOpen`, `title`, `onClose`, `children`) so every
// caller stays untouched (FR-019). The primitive reproduces the `.cmplz-modal` look through semantic
// tokens — 526px max width (`md`), the 12px `--cmplz-radius` corner, the grey 0.45 overlay and the
// title — so the legacy `cmplz-modal` class and its hard-coded radius are no longer needed.
const Modal = ( { isOpen, title, onClose, children } ) => {
	return (
		<Dialog
			open={ isOpen }
			onOpenChange={ ( open ) => {
				// Radix fires this for Escape and overlay dismiss, matching the MUI `onClose`.
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<DialogContent>
				<DialogTitle>{ title }</DialogTitle>
				{ children }
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
