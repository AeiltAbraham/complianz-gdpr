/**
 * Resolves the overlay portal host.
 *
 * The host `#complianz-portal-root[data-cmplz-ui]` is rendered by PHP before any script runs
 * (T-021, ADR-014), so it is read synchronously here. There is deliberately NO `document.body`
 * fallback — the ADR-014 body-end runtime fallback is a later task.
 *
 * Overlay primitives pass the returned element to Radix's `container` prop on their `*.Portal`,
 * so overlay content mounts into the scoped host. Because that host carries `data-cmplz-ui`, the
 * scoped base and the semantic `--cmplz-*` tokens reach the portalled content.
 *
 * @return {HTMLElement|null} The portal host element, or null if it is not in the document.
 */
export function getPortalContainer() {
	return document.getElementById( 'complianz-portal-root' );
}
