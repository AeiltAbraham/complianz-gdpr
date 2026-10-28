import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getCustomerState, setCustomerState } from './customerState';

/**
 * CustomerPreviewLauncher — SHOWCASE-ONLY floating control (design-dashboard-ctas branch).
 *
 * A "which customer am I" switcher: pick New / Current / Unauthenticated and the CURRENT page re-renders
 * in that state (the Consent Banner notice, the onboarding audience, future pages …) via the shared
 * customer-preview override — a VISUAL override only, the real WSC flags are untouched. "Open onboarding"
 * pops the onboarding modal in the selected state. Rendered unconditionally by Page.js inside the
 * `#complianz-app[data-cmplz-ui]` island, so the scoped base reset + C-2 tokens reach its tw- utilities.
 *
 * NOT for production — delete this file, its Page.js render, and the preview/ helpers before any release.
 */

const STATES = [
	{ key: 'new', label: __( 'New customer', 'complianz-gdpr' ), hint: __( 'Fresh install · not configured', 'complianz-gdpr' ) },
	{ key: 'current', label: __( 'Current customer', 'complianz-gdpr' ), hint: __( 'Returning · domain authenticated', 'complianz-gdpr' ) },
	{ key: 'unauthenticated', label: __( 'Current · unauthenticated', 'complianz-gdpr' ), hint: __( 'Returning · domain not verified', 'complianz-gdpr' ) },
];

const STORAGE_KEY = 'cmplz_customer_launcher_collapsed';

// `tw-pointer-events-auto` keeps the launcher clickable even while the onboarding modal is open: Radix's
// modal Dialog sets `pointer-events:none` on <body> (inherited here), and only its own branch re-enables it.
const CARD =
	'tw-pointer-events-auto tw-fixed tw-bottom-[20px] tw-right-[20px] tw-z-[100000] tw-w-[256px] tw-overflow-hidden ' +
	'tw-rounded-[var(--cmplz-radius,_12px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] ' +
	'tw-bg-[var(--cmplz-surface,_#ffffff)] tw-shadow-[0_8px_24px_rgba(15,23,42,0.16)]';

const HEADER =
	'tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-border-0 tw-border-b tw-border-solid ' +
	'tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-m-0 tw-px-[var(--cmplz-space-m,_16px)] tw-py-[var(--cmplz-space-s,_12px)] tw-text-left';

const BTN_BASE =
	'tw-flex tw-w-full tw-cursor-pointer tw-flex-col tw-gap-[2px] tw-m-0 tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid ' +
	'tw-px-[var(--cmplz-space-s,_12px)] tw-py-[var(--cmplz-space-xs,_8px)] tw-text-left tw-transition-colors tw-duration-150 ' +
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]';
const BTN_IDLE =
	'tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface,_#ffffff)] hover:tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]';
const BTN_ACTIVE =
	'tw-border-[color:var(--cmplz-accent-strong,_#1e73be)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)]';

const OPEN_ONBOARDING =
	'tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-gap-[6px] tw-m-0 tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border-0 ' +
	'tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-px-[var(--cmplz-space-s,_12px)] tw-py-[var(--cmplz-space-xs,_8px)] ' +
	'tw-text-[0.8125rem] tw-font-semibold tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)] hover:tw-bg-[#17608f]';

const Caret = ( { open } ) => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={ open ? '' : 'tw--rotate-90' }>
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const CustomerPreviewLauncher = () => {
	const [ open, setOpen ] = useState( () => {
		try {
			return window.localStorage.getItem( STORAGE_KEY ) !== '1';
		} catch ( e ) {
			return true;
		}
	} );

	const toggle = () => setOpen( ( prev ) => {
		const next = ! prev;
		try {
			window.localStorage.setItem( STORAGE_KEY, next ? '0' : '1' );
		} catch ( e ) {
			// ignore — per-viewer convenience only
		}
		return next;
	} );

	const active = getCustomerState();

	// Open the onboarding modal in the current state: add `websitescan` (Page.js mounts the modal on it),
	// keep the state param so the modal reads the right audience.
	const openOnboarding = () => {
		const url = new URL( window.location.href );
		url.searchParams.set( 'websitescan', '' );
		if ( active ) {
			url.searchParams.set( 'cmplz_customer', active );
		}
		window.location.assign( url.href );
	};

	return (
		<div className={ CARD } data-cmplz-ui>
			<button type="button" className={ HEADER } onClick={ toggle } aria-expanded={ open }>
				<span className="tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
					{ __( 'Customer preview', 'complianz-gdpr' ) }
				</span>
				<span className="tw-ms-auto tw-text-[color:var(--cmplz-text-muted,_#475569)]">
					<Caret open={ open } />
				</span>
			</button>
			{ open && (
				<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-p-[var(--cmplz-space-s,_12px)]">
					{ STATES.map( ( s ) => (
						<button
							key={ s.key }
							type="button"
							className={ BTN_BASE + ' ' + ( active === s.key ? BTN_ACTIVE : BTN_IDLE ) }
							onClick={ () => setCustomerState( s.key ) }
						>
							<span className="tw-text-[0.8125rem] tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">
								{ s.label }
							</span>
							<span className="tw-text-[0.6875rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
								{ s.hint }
							</span>
						</button>
					) ) }
					<button type="button" className={ OPEN_ONBOARDING } onClick={ openOnboarding }>
						{ __( 'Open onboarding ▸', 'complianz-gdpr' ) }
					</button>
				</div>
			) }
		</div>
	);
};

export default CustomerPreviewLauncher;
