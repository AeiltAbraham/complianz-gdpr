import { useEffect, useState } from '@wordpress/element';
import UseSyncData from './SyncData';
import Service from './Service';
import { __ } from '@wordpress/i18n';
import useFields from '../../Settings/Fields/FieldsData';
import { memo } from '@wordpress/element';
import CheckboxGroup from '../Inputs/CheckboxGroup';
import SelectInput from '../Inputs/SelectInput';
import { Button } from '../../components/ui/Button';
import { memoize } from 'lodash';
import Alert from '../../utils/Alert';
import { startWscOnboarding, getScanUpsellAlertProps } from '../../utils/wsc';

const CookieDatabaseSyncControl = () => {
	const {
		filterAndSort,
		showDeletedCookies,
		setShowDeletedCookies,
		syncDataLoaded,
		loadingSyncData,
		language,
		setLanguage,
		languages,
		fCookies,
		cookieCount,
		addCookie,
		addService,
		fServices,
		syncProgress,
		curlExists,
		hasSyncableData,
		setSyncProgress,
		restart,
		fetchSyncProgressData,
		errorMessage,
	} = UseSyncData();
	const { addHelpNotice, removeHelpNotice, getFieldValue } = useFields();
	const wscLocked = ! cmplz_settings.wsc_is_authenticated;
	const [ disabled, setDisabled ] = useState( false );
	const [ noCookieNoticeShown, setNoCookieNoticeShown ] = useState( false );
	const [ servicesAndCookies, setServicesAndCookies ] = useState( [] );

	useEffect( () => {
		if ( ! loadingSyncData && syncProgress < 100 ) {
			fetchSyncProgressData();
		}
	}, [ syncProgress ] );

	useEffect( () => {
		fetchSyncProgressData();
	}, [ language ] );

	useEffect( () => {
		const useCdbApi = getFieldValue( 'use_cdb_api' ) !== 'no';
		if ( ! useCdbApi ) {
			setDisabled( true );
			const explanation = __(
				'You have opted out of the use of the Cookiedatabase.org synchronization.',
				'complianz-gdpr'
			);
			addHelpNotice(
				'cookiedatabase_sync',
				'warning',
				explanation,
				'Cookiedatabase',
				'complianz-gdpr'
			);
		} else if ( ! curlExists ) {
			setDisabled( true );
			const explanation = __(
				'CURL is not enabled on your site, which is required for the Cookiedatabase sync to function.',
				'complianz-gdpr'
			);
			addHelpNotice(
				'cookiedatabase_sync',
				'warning',
				explanation,
				'Cookiedatabase',
				'complianz-gdpr'
			);
		} else if ( errorMessage !== '' ) {
			setDisabled( true );
			addHelpNotice(
				'cookiedatabase_sync',
				'warning',
				errorMessage,
				'Cookiedatabase',
				'complianz-gdpr'
			);
		} else if ( ! hasSyncableData ) {
			setDisabled( true );
			const explanation = __(
				'Synchronization disabled: All detected cookies and services have been synchronised.',
				'complianz-gdpr'
			);
			addHelpNotice(
				'cookiedatabase_sync',
				'warning',
				explanation,
				'Cookiedatabase',
				'complianz-gdpr'
			);
		} else if ( syncDataLoaded ) {
			setDisabled( false );
			if ( cookieCount === 0 ) {
				setNoCookieNoticeShown( true );
				const explanation = __(
					'No cookies have been found currently. Please try another site scan, or check the most common causes in the article below',
					'complianz-gdpr'
				);
				addHelpNotice(
					'cookiedatabase_sync',
					'warning',
					explanation,
					__( 'No cookies found', 'complianz-gdpr' ),
					'https://complianz.io/cookie-scan-results/'
				);
			} else if ( noCookieNoticeShown ) {
				removeHelpNotice( 'cookiedatabase_sync' );
			}
		}
	}, [
		getFieldValue( 'use_cdb_api' ),
		curlExists,
		errorMessage,
		hasSyncableData,
		servicesAndCookies,
		syncDataLoaded,
		fCookies,
	] );

	useEffect( () => {
		if ( syncProgress < 100 && syncProgress > 0 ) {
			setDisabled( true );
		} else if ( syncProgress === 100 ) {
			setDisabled( false );
		}
	}, [ syncProgress ] );

	useEffect( () => {
		filterAndSort();
	}, [ showDeletedCookies ] );

	const buildServicesCookiesArray = memoize( () => {
		const filteredCookies = [ ...fCookies ];
		const servicesMap = {};
		[ ...fServices ].forEach( function ( service ) {
			servicesMap[ service.ID ] = {
				id: service.ID,
				name: service.name,
				service,
				cookies: [],
			};
		} );

		filteredCookies.forEach( function ( cookie ) {
			const serviceID = cookie.service ? cookie.serviceID : 0;
			if ( ! servicesMap[ serviceID ] ) {
				servicesMap[ serviceID ] = {
					id: serviceID,
					name: ! cookie.service
						? __( 'Unknown Service', 'complianz-gdpr' )
						: cookie.service,
					service: fServices.filter(
						( service ) => service.ID === serviceID
					)[ 0 ],
					cookies: [],
				};
			}
			servicesMap[ serviceID ].cookies.push( cookie );
		} );

		setServicesAndCookies( Object.values( servicesMap ) );
	} );

	useEffect( () => {
		buildServicesCookiesArray();
	}, [ fServices, fCookies ] );

	const onAddServiceHandler = () => {
		addService();
	};

	const getStyles = () => {
		return Object.assign(
			{},
			{ width: ( wscLocked ? 0 : syncProgress ) + '%' }
		);
	};

	const Start = () => {
		setSyncProgress( 1 );
		restart();
	};

	const upsellProps = getScanUpsellAlertProps();

	return (
		<>
			{ wscLocked && (
				<Alert
					compact
					title={ __(
						'Cookiedatabase Sync Unavailable',
						'complianz-gdpr'
					) }
					ctaLabel={ __( 'Start', 'complianz-gdpr' ) }
					onCtaClick={ startWscOnboarding }
				/>
			) }
			{ ! wscLocked && upsellProps && <Alert { ...upsellProps } /> }
			{ /* `.cmplz-cookiedatabase-controls` is KEPT as the visual.spec mask hook (its legacy SCSS is
			     deleted; the layout is reproduced with tw- here). The Sync `ui/Button` gets base.css B1
			     (border-style) from the app-root `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker
			     move, H.5 Part 2). */ }
			<div
				className="cmplz-cookiedatabase-controls tw-flex tw-items-center tw-gap-[10px] tw-mb-[10px]"
			>
				<Button
					variant="primary"
					disabled={ disabled || loadingSyncData }
					onClick={ ( e ) => Start( e ) }
				>
					{ __( 'Sync', 'complianz-gdpr' ) }
				</Button>
				{ languages.length > 1 && (
					<SelectInput
						disabled={ loadingSyncData }
						value={ language }
						canBeEmpty={ false }
						options={ languages.map( ( l ) => ( { value: l, label: l } ) ) }
						onChange={ ( value ) => setLanguage( value ) }
					/>
				) }
				<CheckboxGroup
					id={ 'show_deleted_cookies' }
					disabled={ wscLocked }
					value={ showDeletedCookies }
					onChange={ ( value ) => setShowDeletedCookies( value ) }
					options={ {
						true: __( 'Show deleted cookies', 'complianz-gdpr' ),
					} }
				/>
			</div>
			{ /* Sync progress bar: re-themed to `--cmplz-accent` (maintainer sign-off 2026-10-21) and
			     DECOUPLED from the shared `#cmplz-scan-progress .cmplz-progress-bar` legacy rule by dropping
			     the `#cmplz-scan-progress` id wrapper — matching H2's cookie-scan bar, so the Dashboard +
			     premium sync bar stay blue with no re-baseline. The `.cmplz-progress-bar` class is KEPT only
			     so the visual.spec width mask still hides the timing-driven fill. */ }
			<div className="tw-overflow-hidden tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]">
				<div
					className="cmplz-progress-bar tw-h-[20px] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent,_#009fff)] tw-transition-[width] tw-duration-500"
					style={ getStyles() }
				></div>
			</div>
			<div className="cmplz-panel__list">
				{ servicesAndCookies.map( ( service, i ) => (
					<Service
						key={ i }
						addCookie={ addCookie }
						id={ service.id }
						cookies={ service.cookies }
						name={ service.name }
						service={ service.service }
					/>
				) ) }
			</div>
			<div className="tw-flex tw-mt-[10px] tw-mb-[10px]">
				<Button
					variant="secondary"
					disabled={ loadingSyncData }
					onClick={ ( e ) => onAddServiceHandler() }
				>
					{ __( 'Add service', 'complianz-gdpr' ) }
				</Button>
			</div>
		</>
	);
};

export default memo( CookieDatabaseSyncControl );
