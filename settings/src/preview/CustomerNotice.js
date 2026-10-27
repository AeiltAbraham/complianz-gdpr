import { __ } from '@wordpress/i18n';
import { clsx } from '../components/ui/cx';
import { getCustomerState } from './customerState';

/**
 * CustomerNotice — SHOWCASE scaffold. A single per-customer notice shown at the top of a page (currently
 * the Consent Banner) so the three customer states read differently, mirroring the onboarding. The copy
 * here is deliberately minimal placeholder text — design each state's real content later. The state comes
 * from the shared customer-preview override, falling back to the real WSC auth flag so the page still
 * shows a sensible default with no override active.
 */

const base =
	'tw-flex tw-items-start tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid tw-p-[var(--cmplz-space-m,_16px)] tw-mb-[var(--cmplz-space-m,_16px)] tw-text-[14px]';

const NOTICES = {
	new: {
		cls: 'tw-border-[color:var(--cmplz-accent-subtle,_#e3f2ff)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-text,_#0f172a)]',
		badge: 'tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)]',
		label: __( 'New customer', 'complianz-gdpr' ),
		text: __( 'Set up your consent banner in the Wizard — after that it stays up to date automatically. (placeholder)', 'complianz-gdpr' ),
	},
	current: {
		cls: 'tw-border-[color:var(--cmplz-success-surface,_#e9f6ec)] tw-bg-[var(--cmplz-success-surface,_#e9f6ec)] tw-text-[color:var(--cmplz-text,_#0f172a)]',
		badge: 'tw-text-[color:var(--cmplz-success,_#1f7a34)]',
		label: __( 'Current customer', 'complianz-gdpr' ),
		text: __( 'Your consent banner is live and managed automatically. (placeholder)', 'complianz-gdpr' ),
	},
	unauthenticated: {
		cls: 'tw-border-[color:var(--cmplz-warning-surface,_#fbf4da)] tw-bg-[var(--cmplz-warning-surface,_#fbf4da)] tw-text-[color:var(--cmplz-text,_#0f172a)]',
		badge: 'tw-text-[#b45309]',
		label: __( 'Unauthenticated', 'complianz-gdpr' ),
		text: __( 'This is a local banner. Authenticate your domain to unlock the automated, always-up-to-date banner. (placeholder)', 'complianz-gdpr' ),
	},
};

const CustomerNotice = () => {
	const state =
		getCustomerState() ||
		( window.cmplz_settings && window.cmplz_settings.wsc_is_authenticated ? 'current' : 'unauthenticated' );
	const n = NOTICES[ state ];
	if ( ! n ) {
		return null;
	}

	return (
		<div className={ clsx( base, n.cls ) }>
			<span className={ clsx( 'tw-shrink-0 tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.06em]', n.badge ) }>
				{ n.label }
			</span>
			<span>{ n.text }</span>
		</div>
	);
};

export default CustomerNotice;
