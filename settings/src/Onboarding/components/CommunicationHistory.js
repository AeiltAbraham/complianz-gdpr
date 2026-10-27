import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * CommunicationHistory — a disclosure link that reveals how an authentication/compliance request has
 * been surfaced to the user over the past year. Shared by the onboarding notice steps
 * (ServiceDisruption, BannerUpdate) so the two read consistently. Illustrative showcase content —
 * swap HISTORY for the real channels/cadence when available.
 */

const HISTORY = [
	{ label: __( 'Website Scan warnings in the wizard', 'complianz-gdpr' ), when: __( 'Ongoing', 'complianz-gdpr' ) },
	{ label: __( 'Dashboard reminder notices', 'complianz-gdpr' ), when: __( 'Monthly', 'complianz-gdpr' ) },
	{ label: __( 'Authentication reminder emails', 'complianz-gdpr' ), when: __( 'Last 12 months', 'complianz-gdpr' ) },
	{ label: __( 'Release 7.0 upgrade notice', 'complianz-gdpr' ), when: __( '1 year ago', 'complianz-gdpr' ) },
];

const HistoryIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M3 3v5h5" />
		<path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
		<path d="M12 7v5l4 2" />
	</svg>
);

const CommunicationHistory = () => {
	const [ open, setOpen ] = useState( false );

	return (
		<>
			<button
				type="button"
				onClick={ () => setOpen( ( v ) => ! v ) }
				aria-expanded={ open }
				className="tw-inline-flex tw-items-center tw-gap-[6px] tw-self-start tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-[color:var(--cmplz-accent-strong,_#1e73be)] tw-underline hover:tw-text-[#17608f]"
			>
				<HistoryIcon />
				{ open
					? __( 'Hide how we’ve kept you informed', 'complianz-gdpr' )
					: __( 'See how we’ve kept you informed this past year', 'complianz-gdpr' ) }
			</button>

			{ open && (
				<div className="tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-p-[var(--cmplz-space-m,_16px)]">
				<p className="tw-mt-0 tw-mb-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
						{ __( 'Over the past year we’ve asked you to authenticate through:', 'complianz-gdpr' ) }
					</p>
					<ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-p-0">
						{ HISTORY.map( ( h, i ) => (
							<li key={i} className="tw-flex tw-items-baseline tw-justify-between tw-gap-[var(--cmplz-space-s,_12px)]">
								<span className="tw-flex tw-items-center tw-gap-[8px] tw-text-[color:var(--cmplz-text,_#0f172a)]">
									<span className="tw-h-[6px] tw-w-[6px] tw-shrink-0 tw-rounded-full tw-bg-[var(--cmplz-accent-strong,_#1e73be)]" />
									{ h.label }
								</span>
								<span className="tw-shrink-0 tw-text-[color:var(--cmplz-text-muted,_#475569)]">{ h.when }</span>
							</li>
						) ) }
					</ul>
				</div>
			) }
		</>
	);
};

export default CommunicationHistory;
