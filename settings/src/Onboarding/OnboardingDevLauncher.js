import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * OnboardingDevLauncher — SHOWCASE-ONLY floating control (design-dashboard-ctas branch).
 *
 * Lets us preview the website-scan onboarding modal as each audience without touching the database:
 * every button force-opens the modal in that variant via the `?cmplz_onboarding=<variant>` URL
 * override read in NewOnboarding.js (a VISUAL override — the real WSC auth/dismissed flags are left
 * untouched). Rendered unconditionally by Page.js inside the `#complianz-app[data-cmplz-ui]` island,
 * so the scoped base reset + C-2 tokens reach its tw- utilities and a `position:fixed` box still
 * inherits them (fixed positioning does not change DOM ancestry).
 *
 * NOT for production — delete this file, its Page.js render, and the `cmplz_onboarding` override in
 * NewOnboarding.js / NewOnboardingData.js before any release build.
 */

const VARIANTS = [
	{
		key: 'new',
		label: __( 'New user', 'complianz-gdpr' ),
		hint: __( 'Fresh install · full first-run flow', 'complianz-gdpr' ),
	},
	{
		key: 'current',
		label: __( 'Current user', 'complianz-gdpr' ),
		hint: __( 'Returning · domain authenticated', 'complianz-gdpr' ),
	},
	{
		key: 'unauthenticated',
		label: __( 'Current · unauthenticated', 'complianz-gdpr' ),
		hint: __( 'Returning · domain not verified', 'complianz-gdpr' ),
	},
];

const STORAGE_KEY = 'cmplz_onboarding_launcher_collapsed';

// `tw-pointer-events-auto` keeps the launcher clickable even while the onboarding modal is open:
// Radix's modal Dialog sets `pointer-events:none` on <body> (inherited by the launcher), and the
// content branch re-enables its own — so without this, clicking a variant to switch does nothing.
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

const Caret = ( { open } ) => (
	<svg
		width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
		strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
		className={ open ? '' : 'tw--rotate-90' }
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const OnboardingDevLauncher = () => {
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

	// The currently-previewed variant (if any), so the matching button reads as active.
	let activeVariant = null;
	try {
		activeVariant = new URLSearchParams( window.location.search ).get( 'cmplz_onboarding' );
	} catch ( e ) {
		activeVariant = null;
	}

	const launch = ( key ) => {
		const url = new URL( window.location.href );
		url.searchParams.set( 'page', 'complianz' );
		url.searchParams.set( 'websitescan', '' );
		url.searchParams.set( 'cmplz_onboarding', key );
		// Full navigation so the app remounts and the modal opens cleanly in the chosen variant.
		window.location.assign( url.href );
	};

	return (
		<div className={ CARD } data-cmplz-ui>
			<button type="button" className={ HEADER } onClick={ toggle } aria-expanded={ open }>
				<span className="tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
					{ __( 'Onboarding preview', 'complianz-gdpr' ) }
				</span>
				<span className="tw-ms-auto tw-text-[color:var(--cmplz-text-muted,_#475569)]">
					<Caret open={ open } />
				</span>
			</button>
			{ open && (
				<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-p-[var(--cmplz-space-s,_12px)]">
					{ VARIANTS.map( ( v ) => (
						<button
							key={ v.key }
							type="button"
							className={ BTN_BASE + ' ' + ( activeVariant === v.key ? BTN_ACTIVE : BTN_IDLE ) }
							onClick={ () => launch( v.key ) }
						>
							<span className="tw-text-[0.8125rem] tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">
								{ v.label }
							</span>
							<span className="tw-text-[0.6875rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
								{ v.hint }
							</span>
						</button>
					) ) }
				</div>
			) }
		</div>
	);
};

export default OnboardingDevLauncher;
