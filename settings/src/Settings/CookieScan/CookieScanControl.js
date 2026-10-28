import { useEffect, useState, memo } from '@wordpress/element';
import * as cmplz_api from '../../utils/api';
import { UseCookieScanData } from './CookieScanData';
import { __ } from '@wordpress/i18n';
import Panel from '../Panel';
import useMenu from '../../Menu/MenuData';
import useFields from '../Fields/FieldsData';
import Details from './Details';
import useProgress from '../../Dashboard/Progress/ProgressData';
import Icon from '../../utils/Icon';
import Alert from '../../utils/Alert';
import { startWscOnboarding, getScanUpsellAlertProps } from '../../utils/wsc';
import { Button } from '../../components/ui/Button';

const CookieScanControl = () => {
	const {
		initialLoadCompleted,
		loading,
		nextPage,
		progress,
		setProgress,
		cookies,
		fetchProgress,
		lastLoadedIframe,
		setLastLoadedIframe,
	} = UseCookieScanData();
	const [ iframeLoading, setIframeLoading ] = useState( false );
	const { addHelpNotice, fieldsLoaded } = useFields();
	const { selectedSubMenuItem } = useMenu();
	const { setProgressLoaded } = useProgress();
	const wscLocked = ! window.cmplz_settings.wsc_is_authenticated;

	useEffect( () => {
		if ( lastLoadedIframe === nextPage ) {
			return;
		}
		if ( iframeLoading ) {
			return;
		}
		setIframeLoading( true );
		loadIframe();
	}, [ nextPage, lastLoadedIframe, iframeLoading ] );

	useEffect( () => {
		if ( wscLocked ) {
			return;
		}
		if ( ! iframeLoading && ! loading && progress < 100 ) {
			fetchProgress();
		}
	}, [ iframeLoading, loading, progress, wscLocked ] );

	useEffect( () => {
		if ( ! fieldsLoaded ) {
			return;
		}
		if ( window.canRunAds === undefined ) {
			addHelpNotice(
				'cookie_scan',
				'warning',
				__(
					'You are using an ad blocker. This will prevent most cookies from being placed. Please run the scan without an adblocker enabled.',
					'complianz-gdpr'
				),
				__( 'Ad Blocker detected.', 'complianz-gdpr' ),
				null
			);
		}
		if ( doNotTrack() ) {
			addHelpNotice(
				'cookie_scan',
				'warning',
				__(
					'Your browser has the Do Not Track or Global Privacy Control setting enabled.',
					'complianz-gdpr'
				) +
					'&nbsp;' +
					__(
						'This will prevent most cookies from being placed.',
						'complianz-gdpr'
					) +
					'&nbsp;' +
					__(
						'Please run the scan with these browser options disabled.',
						'complianz-gdpr'
					),
				__( 'DNT or GPC enabled.', 'complianz-gdpr' ),
				null
			);
		}
	}, [ fieldsLoaded ] );

	const doNotTrack = () => {
		const dnt = 'doNotTrack' in navigator && navigator.doNotTrack === '1';
		const gpc =
			'globalPrivacyControl' in navigator &&
			navigator.globalPrivacyControl;
		return gpc || dnt;
	};

	const loadIframe = () => {
		if ( ! nextPage ) {
			setIframeLoading( false );
			return;
		}
		// Get a handle to the iframe element
		let iframe = document.getElementById( 'cmplz_cookie_scan_frame' );
		if ( ! iframe ) {
			iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'id', 'cmplz_cookie_scan_frame' );
			iframe.classList.add( 'hidden' );
		}
		iframe.setAttribute( 'src', nextPage );
		// Check if loading is complete
		iframe.onload = function () {
			setTimeout( () => {
				setIframeLoading( false );
				setLastLoadedIframe( nextPage );
			}, 200 );
		};
		document.body.appendChild( iframe );
	};

	const getStyles = () => {
		return Object.assign( {}, { width: progress + '%' } );
	};

	const Start = async () => {
		const data = {};
		data.scan_action = 'restart';
		// Reset the scan server-side BEFORE any progress fetch: setting progress
		// first would let the progress effect fire a fetch that races the reset
		// and can report the stale pre-reset state (100 → polling stops), while
		// a second explicit fetch here would run a parallel PHP worker.
		await cmplz_api.doAction( 'scan', data );
		// The progress effect reacts to progress < 100 and owns the fetch chain.
		setProgress( 1 );
	};

	const clearCookies = async () => {
		const data = {};
		data.scan_action = 'reset';
		await cmplz_api.doAction( 'scan', data );
		//ensure a reload of the progress notices
		setProgressLoaded( false );
		setProgress( 1 );
	};

	//this item can be loaded on other pages, but should then not show anything.
	if ( selectedSubMenuItem !== 'cookie-scan' ) {
		return null;
	}

	const cookieCount = cookies ? cookies.length : 0;
	let description = '';
	if ( cookieCount === 0 ) {
		description = __(
			'No cookies found on your domain yet.',
			'complianz-gdpr'
		);
	} else if ( cookieCount === 1 ) {
		description = __(
			'The scan found 1 cookie on your domain.',
			'complianz-gdpr'
		);
	} else {
		// translators: %s is the number of cookies found by the scan.
		description = __(
			'The scan found %s cookies on your domain.',
			'complianz-gdpr'
		).replace( '%s', cookieCount );
	}

	if ( progress >= 100 ) {
		if ( cookieCount > 0 ) {
			description +=
				' ' +
				__(
					'Continue the wizard to categorize cookies and configure consent.',
					'complianz-gdpr'
				);
		}
	} else {
		description +=
			' ' +
			// translators: %s is the scan progress percentage.
			__( 'Scanning, %s complete.', 'complianz-gdpr' ).replace(
				'%s',
				Math.round( progress ) + '%'
			);
	}

	if ( ! initialLoadCompleted ) {
		description = <Icon name="loading" color="grey" />;
	}

	const scanProgress = progress < 100 && progress > 0;
	const scanDisabled = wscLocked ? true : scanProgress;

	const upsellProps = getScanUpsellAlertProps();

	return (
		<>
			{ wscLocked && (
				<Alert
					compact
					title={ __( 'Cookie Scan Unavailable', 'complianz-gdpr' ) }
					subtitle={ __(
						'Authenticate your domain to run the Website Scan.',
						'complianz-gdpr'
					) }
					ctaLabel={ __( 'Start', 'complianz-gdpr' ) }
					onCtaClick={ startWscOnboarding }
				/>
			) }
			{ ! wscLocked && upsellProps && <Alert { ...upsellProps } /> }

			{ /* The Buttons get the base reset (B1 border-style; the `error` variant's `--cmplz-danger`)
			     from the app-root `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move, H.5 Part 2);
			     `.cmplz-table-header` is the shared, relocated `display:flex` hook (legacy-globals). */ }
			<div
				className="cmplz-table-header tw-gap-[var(--cmplz-space-xs,_8px)]"
			>
				<Button
					variant="primary"
					disabled={ scanDisabled }
					onClick={ ( e ) => Start( e ) }
				>
					{ __( 'Scan', 'complianz-gdpr' ) }
				</Button>
				<Button
					variant="error"
					disabled={ scanDisabled }
					onClick={ ( e ) => clearCookies( e ) }
				>
					{ __( 'Clear Cookies', 'complianz-gdpr' ) }
				</Button>
			</div>
			{ /* Scan progress bar (maintainer sign-off C, 2026-10-20): re-themed to `--cmplz-accent`. Fully
			     migrated to tw- (surface-sunken track + accent fill, matching the Dashboard ProgressBlock
			     treatment) and DECOUPLED from the shared `#cmplz-scan-progress .cmplz-progress-bar` legacy rule
			     (relocated unchanged, now serving only the still-legacy CookieDatabaseSync sync bar) — so the
			     Dashboard stays blue with no re-baseline. The `.cmplz-progress-bar` class is KEPT only so the
			     visual.spec mask still hides the timing-driven width. */ }
			<div className="tw-mt-[var(--cmplz-space-s,_12px)] tw-overflow-hidden tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]">
				<div
					className="cmplz-progress-bar tw-h-[20px] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent,_#009fff)] tw-transition-[width] tw-duration-500"
					style={ getStyles() }
				></div>
			</div>
			{ ! wscLocked && (
				<div className="cmplz-panel__list">
					<Panel
						summary={ description }
						details={ Details( initialLoadCompleted, cookies ) }
					/>
				</div>
			) }
		</>
	);
};

export default memo( CookieScanControl );
