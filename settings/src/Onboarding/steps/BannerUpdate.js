import { __ } from '@wordpress/i18n';
import { useNewOnboardingData } from '../NewOnboardingData';
import CommunicationHistory from '../components/CommunicationHistory';
import { primaryLinkButtonCls } from '../../components/ui/downloadLink';

/**
 * BannerUpdate — the single onboarding step for the "current, authenticated" audience (showcase).
 *
 * Authenticated users already went through onboarding, so instead of the full flow they get one
 * what's-new notice: the refreshed cookie banner, the new authentication requirement, and a prominent
 * free-tier post-limit warning with an upgrade CTA. A shared CommunicationHistory disclosure shows how
 * this has been communicated over the past year, and the footer's "Understood" button closes the modal.
 * Rendered inside the Radix Dialog portal (a marked `data-cmplz-ui` island), so the `var(--cmplz-*)`
 * tokens resolve.
 */

// Showcase figures for the free-tier post-limit warning (easy to tweak per situation).
const POST_LIMIT = 50;
const POST_COUNT = 248;
const DAYS_LEFT = 14;

const WarnIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
		<path d="M12 9v4" />
		<path d="M12 17h.01" />
	</svg>
);

const linkCls =
	'tw-cursor-pointer tw-text-[color:var(--cmplz-accent-strong,_#1e73be)] tw-underline hover:tw-text-[#17608f]';

const BannerUpdate = () => {
	const { closeModal } = useNewOnboardingData();
	const upgradeUrl =
		( window.cmplz_settings && window.cmplz_settings.upgrade_link ) || 'https://complianz.io/pricing/';

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m,_16px)]">
			<p className="tw-m-0">
				{ __( 'We’ve been working hard to improve performance, security and consent metrics.', 'complianz-gdpr' ) }{ ' ' }
				<a href="#banner" onClick={ () => closeModal() } className={ linkCls }>
					{ __( 'Check your banner', 'complianz-gdpr' ) }
				</a>.
			</p>

			<p className="tw-m-0">
				{ __( 'Authentication is now required for the banner, Website Scan and syncing with the cookie database.', 'complianz-gdpr' ) }
			</p>

			<div className="tw-flex tw-items-start tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-warning-surface,_#fbf4da)] tw-p-[var(--cmplz-space-m,_16px)]">
				<span className="tw-mt-[1px] tw-text-[#b45309]"><WarnIcon /></span>
				<div className="tw-flex tw-flex-col tw-items-start tw-gap-[var(--cmplz-space-s,_12px)]">
					<span className="tw-text-[color:var(--cmplz-text,_#0f172a)]">
						{ __( 'The free version limits authenticated services to', 'complianz-gdpr' ) }{ ' ' }
						<strong>{ POST_LIMIT } { __( 'posts', 'complianz-gdpr' ) }</strong>.{ ' ' }
						{ __( 'You have', 'complianz-gdpr' ) }{ ' ' }
						<strong>{ POST_COUNT } { __( 'posts', 'complianz-gdpr' ) }</strong>,{ ' ' }
						{ __( 'so your services will be', 'complianz-gdpr' ) }{ ' ' }
						<strong>{ __( 'limited in', 'complianz-gdpr' ) } { DAYS_LEFT } { __( 'days', 'complianz-gdpr' ) }</strong>{ ' ' }
						{ __( 'without a premium license.', 'complianz-gdpr' ) }
					</span>
					<div className="tw-flex tw-flex-wrap tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
						<a href={ upgradeUrl } target="_blank" rel="noopener noreferrer" className={ primaryLinkButtonCls }>
							{ __( 'Upgrade to Premium', 'complianz-gdpr' ) }
						</a>
						<span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-[var(--cmplz-success,_#1f7a34)] tw-px-[10px] tw-py-[3px] tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.04em] tw-text-[#ffffff]">
							{ __( '50% off', 'complianz-gdpr' ) }
						</span>
					</div>
				</div>
			</div>

			<CommunicationHistory />
		</div>
	);
};

export default BannerUpdate;
