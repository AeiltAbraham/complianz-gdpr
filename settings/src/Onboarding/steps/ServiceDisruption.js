import { __ } from '@wordpress/i18n';
import CommunicationHistory from '../components/CommunicationHistory';

/**
 * ServiceDisruption — the first onboarding step for the "current, unauthenticated" audience (showcase).
 *
 * A current user who never authenticated Complianz's third-party services sees this notice BEFORE the
 * normal verify/welcome flow: it spells out what is paused, nudges "authenticate in 3 minutes" (the
 * footer's "Authenticate now" continues into the verify step), and offers a disclosure link (shared
 * CommunicationHistory) showing how the request has been communicated over the past year. Rendered
 * inside the Radix Dialog portal (a marked `data-cmplz-ui` island), so every `var(--cmplz-*, <literal>)`
 * resolves to its token.
 */

// The third-party services that stop working until the domain is authenticated.
const AFFECTED = [
	{
		name: __( 'Cookie Scan', 'complianz-gdpr' ),
		desc: __( 'Automatic detection of cookies and third-party services on your site.', 'complianz-gdpr' ),
	},
	{
		name: __( 'Cookiedatabase.org sync', 'complianz-gdpr' ),
		desc: __( 'Accurate, up-to-date cookie descriptions in your cookie policy.', 'complianz-gdpr' ),
	},
	{
		name: __( 'Consent Banner & management', 'complianz-gdpr' ),
		desc: __( 'Your live consent banner and the consent records behind it.', 'complianz-gdpr' ),
	},
];

const PauseIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<rect x="6" y="5" width="4" height="14" rx="1" />
		<rect x="14" y="5" width="4" height="14" rx="1" />
	</svg>
);

const ClockIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7v5l3 2" />
	</svg>
);

const ServiceDisruption = () => {
	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m,_16px)]">
			<p className="tw-m-0">
				{ __( "Complianz’s third-party services haven’t been authenticated yet. Until you confirm your domain, these keep you only partially compliant — they’re currently paused:", 'complianz-gdpr' ) }
			</p>

			<ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-[var(--cmplz-space-s,_12px)] tw-p-0">
				{ AFFECTED.map( ( s, i ) => (
					<li key={i} className="tw-flex tw-items-start tw-gap-[var(--cmplz-space-s,_12px)]">
						<span className="tw-mt-[1px] tw-flex tw-h-[28px] tw-w-[28px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-warning-surface,_#fbf4da)] tw-text-[#b45309]">
							<PauseIcon />
						</span>
						<span className="tw-flex tw-flex-col">
							<span className="tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">{ s.name }</span>
							<span className="tw-text-[color:var(--cmplz-text-muted,_#475569)]">{ s.desc }</span>
						</span>
					</li>
				) ) }
			</ul>

			<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-px-[var(--cmplz-space-m,_16px)] tw-py-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]">
				<ClockIcon />
				<span className="tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">
					{ __( 'To continue with full compliance, authenticate in just 3 minutes.', 'complianz-gdpr' ) }
				</span>
			</div>

			<CommunicationHistory />
		</div>
	);
};

export default ServiceDisruption;
