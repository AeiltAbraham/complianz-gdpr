/**
 * SHOWCASE-ONLY customer-state preview (design-dashboard-ctas branch).
 *
 * A single shared "which customer am I" state — 'new' | 'current' | 'unauthenticated' — that the floating
 * CustomerPreviewLauncher sets and any page reads to differentiate its content (the onboarding modal, the
 * Consent Banner notice, …). It is a VISUAL override only: the real WSC auth/dismissed flags are left
 * untouched. The state lives in the `cmplz_customer` URL param (shareable, survives in-app hash nav) with a
 * localStorage fallback so it also survives a fresh load.
 *
 * NOT for production — delete this file and its readers before any release build.
 */

const KEY = 'cmplz_preview_customer';
export const CUSTOMER_STATES = [ 'new', 'current', 'unauthenticated' ];

// The active preview state, or null when none is set (pages then fall back to their real-state default).
export function getCustomerState() {
	try {
		const fromUrl = new URLSearchParams( window.location.search ).get( 'cmplz_customer' );
		if ( CUSTOMER_STATES.includes( fromUrl ) ) {
			return fromUrl;
		}
	} catch ( e ) {
		// ignore — malformed URL
	}
	try {
		const stored = window.localStorage.getItem( KEY );
		if ( CUSTOMER_STATES.includes( stored ) ) {
			return stored;
		}
	} catch ( e ) {
		// ignore — storage blocked
	}
	return null;
}

// Persist the state and reload the current page (section hash preserved) so every page reflects it. Clears
// the onboarding-modal params so switching state on a normal page does not also pop the onboarding.
export function setCustomerState( state ) {
	try {
		window.localStorage.setItem( KEY, state );
	} catch ( e ) {
		// ignore — storage blocked
	}
	const url = new URL( window.location.href );
	url.searchParams.set( 'cmplz_customer', state );
	url.searchParams.delete( 'websitescan' );
	window.location.assign( url.href );
}
