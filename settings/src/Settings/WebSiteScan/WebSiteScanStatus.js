import UseWebSiteScanData from './UseWebSiteScanData';
import { useEffect, useState, memo } from '@wordpress/element';
import Icon from '../../utils/Icon';
import { __ } from '@wordpress/i18n';

// Migrated to the C-2 system (Stage H.5, Bundle H2). `websitescan_status` is a premium-only field type (no
// free-edition field config uses it), so these screens are not reachable in the free wp-env e2e — the markup
// follows the same markerless token-with-literal-fallback discipline as the other migrated bodies.
// The status rows are a simple icon + label flex; the pending/homepage notices use the C-2 warning callout
// (--cmplz-warning-surface tint, the Field COMMENT_CALLOUT pattern), with links at --cmplz-accent-on-subtle
// for AA on the tint (the T-045 on-tint-interactive-text lesson). `tw-border-solid` is explicit (markerless,
// B1 not in scope — T-052).
const WSC_ALERT_CLS =
	'tw-w-full tw-mt-[var(--cmplz-space-m,_16px)] tw-rounded-[var(--cmplz-radius,_12px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-warning,_#eab308)] tw-bg-[var(--cmplz-warning-surface,_#fbf4da)] tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)]';
const WSC_ALERT_LINK_CLS =
	'tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)] tw-underline';

const statuses = {
	enabled: {
		label: __( 'Enabled', 'complianz-gdpr' ),
		color: 'green',
	},
	disabled: {
		label: __( 'Disabled', 'complianz-gdpr' ),
		color: 'grey',
	},
	pending: {
		label: __( 'Pending', 'complianz-gdpr' ),
		color: 'orange',
	},
	error: {
		label: __( 'Error', 'complianz-gdpr' ),
		color: 'red',
	},
};

// Token state isn't user-toggled — it exists/works or it doesn't. Use active/inactive
// (semantic for a credential) instead of enabled/disabled (which belongs to user choices).
const tokenStatuses = {
	enabled: {
		label: __( 'Active', 'complianz-gdpr' ),
		color: 'green',
	},
	disabled: {
		label: __( 'Inactive', 'complianz-gdpr' ),
		color: 'grey',
	},
	pending: {
		label: __( 'Pending', 'complianz-gdpr' ),
		color: 'orange',
	},
	error: {
		label: __( 'Error', 'complianz-gdpr' ),
		color: 'red',
	},
};

const WebSiteScanStatus = () => {
	const {
		tokenStatus,
		wscStatus,
		wscSignupDate,
		batchStats,
		requestActivationEmail,
	} = UseWebSiteScanData();
	const isPremium = !! cmplz_settings.is_premium;
	const [ canRequestAgain, setCanRequestAgain ] = useState( false );

	useEffect( () => {
		if ( ! wscSignupDate ) {
			setCanRequestAgain( false );
			return;
		}

		// check if the user can request the activation email again after 1 hour
		const currentTime = Math.floor( Date.now() / 1000 );
		const oneHourInSeconds = 60 * 60;
		const timeDifference = currentTime - wscSignupDate;

		// update the state after 1 hour
		setCanRequestAgain( timeDifference >= oneHourInSeconds );
	}, [ wscSignupDate, tokenStatus ] );

	const handleRequestActivationEmail = ( e ) => {
		e.preventDefault();
		requestActivationEmail();
	};

	return (
		<div className="cmplz-wsc-status-container tw-flex tw-flex-col tw-gap-[var(--cmplz-space-s,_12px)]">
			{ tokenStatus && (
				<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
					<Icon
						name={ 'circle-check' }
						color={ tokenStatuses[ tokenStatus ]?.color }
						size={ 16 }
					/>
					<span>
						{ __( 'Token Status:', 'complianz-gdpr' ) }
						<strong className="tw-ms-[var(--cmplz-space-2xs,_4px)]">
							{ tokenStatuses[ tokenStatus ]?.label }
						</strong>
					</span>
				</div>
			) }

			{ wscStatus && (
				<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
					<Icon
						name={ 'circle-check' }
						color={ statuses[ wscStatus ]?.color }
						size={ 16 }
					/>
					<span>
						{ __( 'Website Scan:', 'complianz-gdpr' ) }
						<strong className="tw-ms-[var(--cmplz-space-2xs,_4px)]">
							{ statuses[ wscStatus ]?.label }
						</strong>
					</span>
				</div>
			) }
			{ wscStatus && wscStatus === 'enabled' && ! isPremium && (
				<div className={ WSC_ALERT_CLS }>
					<span className="tw-font-bold">
						{ __(
							'Website Scan only scans your homepage.',
							'complianz-gdpr'
						) }
					</span>{ ' ' }
					<a
						href={ cmplz_settings.upgrade_link }
						target="_blank"
						rel="noopener noreferrer"
						className={ WSC_ALERT_LINK_CLS }
					>
						{ __(
							'Upgrade to scan all pages individually.',
							'complianz-gdpr'
						) }
					</a>
				</div>
			) }

			{ wscStatus &&
				wscStatus === 'enabled' &&
				isPremium &&
				batchStats &&
				batchStats.enabled && (
					<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
						<Icon
							name={ 'circle-check' }
							color={ 'green' }
							size={ 16 }
						/>
						<span>
							{ __(
								'Website Scan — Background scanning:',
								'complianz-gdpr'
							) }
							<strong className="tw-ms-[var(--cmplz-space-2xs,_4px)]">
								{ batchStats.done }
							</strong>
							{ __( 'scanned', 'complianz-gdpr' ) }
							{ batchStats.inflight > 0 && (
								<>
									{ ' ' }
									· <strong>{ batchStats.inflight }</strong>
									{ __( 'in progress', 'complianz-gdpr' ) }
								</>
							) }
							{ batchStats.queue > 0 && (
								<>
									{ ' ' }
									· <strong>{ batchStats.queue }</strong>
									{ __( 'queued', 'complianz-gdpr' ) }
								</>
							) }
						</span>
					</div>
				) }

			{ wscStatus &&
				wscStatus === 'enabled' &&
				isPremium &&
				batchStats &&
				! batchStats.enabled && (
					<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
						<Icon name={ 'info' } color={ 'orange' } size={ 16 } />
						<span>
							{ __(
								'Website Scan — Background scanning:',
								'complianz-gdpr'
							) }
							<strong className="tw-ms-[var(--cmplz-space-2xs,_4px)]">
								{ __( 'Disabled', 'complianz-gdpr' ) }
							</strong>
						</span>
					</div>
				) }

			{ wscStatus &&
				wscStatus === 'pending' &&
				( canRequestAgain ? (
					<div className={ WSC_ALERT_CLS }>
						<span className="tw-font-bold">
							{ __(
								"Didn't receive the activation email?",
								'complianz-gdpr'
							) }
						</span>{ ' ' }
						<a
							href="#"
							onClick={ handleRequestActivationEmail }
							className={ WSC_ALERT_LINK_CLS }
						>
							{ __( 'Request again!', 'complianz-gdpr' ) }
						</a>
					</div>
				) : (
					<div className={ WSC_ALERT_CLS }>
						<p className="tw-m-0 tw-font-bold">
							{ __(
								'Check your email to activate the Website Scan!',
								'complianz-gdpr'
							) }
						</p>
						<p className="tw-mt-[var(--cmplz-space-2xs,_4px)] tw-mb-0">
							{ __(
								"Didn't receive the activation email? Please wait 1 hour before requesting again.",
								'complianz-gdpr'
							) }
						</p>
					</div>
				) ) }
		</div>
	);
};
export default memo( WebSiteScanStatus );
