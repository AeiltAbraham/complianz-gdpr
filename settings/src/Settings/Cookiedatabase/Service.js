import Cookie from './Cookie';
import Panel from '../Panel';
import UseSyncData from './SyncData';
import { __ } from '@wordpress/i18n';
import Icon from '../../utils/Icon';
import useFields from '../../Settings/Fields/FieldsData';
import CheckboxGroup from '../Inputs/CheckboxGroup';
import SelectInput from '../Inputs/SelectInput';
import TextInput from '../Inputs/TextInput';
import { Button } from '../../components/ui/Button';
import { memo, useEffect, useState } from '@wordpress/element';

// Shared detail-row layout (Stage H7, replacing the deleted `.cmplz-details-row*` SCSS).
const rowCls = 'tw-flex tw-flex-col tw-py-[5px]';
const rowLabelCls = 'tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-font-medium';

const ServiceDetails = ( service ) => {
	const { getFieldValue, showSavedSettingsNotice } = useFields();
	const [ serviceName, setServiceName ] = useState( '' );
	const [ privacyStatementUrl, setPrivacyStatementUrl ] = useState( '' );
	const {
		language,
		saving,
		deleteService,
		serviceTypeOptions,
		updateService,
		saveService,
	} = UseSyncData();
	const useCdbApi = getFieldValue( 'use_cdb_api' ) === 'yes';
	const [ serviceTypesByLanguage, setServiceTypesByLanguage ] = useState(
		[]
	);

	useEffect( () => {
		let serviceTypesByLanguage =
			serviceTypeOptions && serviceTypeOptions.hasOwnProperty( language )
				? serviceTypeOptions[ language ]
				: [];
		serviceTypesByLanguage = serviceTypesByLanguage.map(
			( serviceType ) => {
				return { label: serviceType.label, value: serviceType.label };
			}
		);
		setServiceTypesByLanguage( serviceTypesByLanguage );
	}, [ language, serviceTypeOptions ] );

	const onSaveHandler = async ( id ) => {
		await saveService( id );
		showSavedSettingsNotice( __( 'Saved service', 'complianz-gdpr' ) );
	};

	const onDeleteHandler = async ( id ) => {
		await deleteService( id );
	};

	const onChangeHandler = ( value, id, type ) => {
		updateService( id, type, value );
	};
	const onCheckboxChangeHandler = ( checked, id, type ) => {
		updateService( id, type, checked );
	};

	useEffect( () => {
		if ( service && service.name ) {
			setServiceName( service.name );
		}
	}, [ service ] );

	useEffect( () => {
		if ( ! service ) {
			return;
		}

		if ( service.name === serviceName ) {
			return;
		}
		if ( serviceName.length < 2 ) {
			return;
		}
		const typingTimerServiceName = setTimeout( () => {
			onChangeHandler( serviceName, service.ID, 'name' );
		}, 500 );

		return () => {
			clearTimeout( typingTimerServiceName );
		};
	}, [ serviceName ] );

	useEffect( () => {
		if ( service && service.privacyStatementURL ) {
			setPrivacyStatementUrl( service.privacyStatementURL );
		}
	}, [ service ] );

	useEffect( () => {
		if ( ! service ) {
			return;
		}
		if ( service.privacyStatementURL === privacyStatementUrl ) {
			return;
		}
		if ( privacyStatementUrl.length === 0 ) {
			return;
		}
		const typingTimerPrivacyStatementUrl = setTimeout( () => {
			onChangeHandler(
				privacyStatementUrl,
				service.ID,
				'privacyStatementURL'
			);
		}, 400 );

		return () => {
			clearTimeout( typingTimerPrivacyStatementUrl );
		};
	}, [ privacyStatementUrl ] );

	if ( ! service ) {
		return null;
	}
	//allow for both '0'/'1' and false/true.
	const sync = useCdbApi ? service.sync == 1 : false;
	let disabled = sync;
	if ( saving ) {
		disabled = true;
	}

	let cdbLink = false;
	if ( service.slug.length > 0 ) {
		cdbLink = 'https://cookiedatabase.org/service/' + service.slug;
	}
	return (
		<>
			<div className={ rowCls }>
				<CheckboxGroup
					id={ service.ID + 'sharesData' }
					disabled={ disabled }
					value={ service.sharesData == 1 }
					onChange={ ( value ) =>
						onCheckboxChangeHandler(
							value,
							service.ID,
							'sharesData'
						)
					}
					options={ {
						true: __(
							'Data is shared with this service',
							'complianz-gdpr'
						),
					} }
				/>
			</div>
			<div className={ rowCls }>
				<CheckboxGroup
					id={ service.ID + 'sync' }
					disabled={ ! useCdbApi }
					value={ sync }
					onChange={ ( value ) =>
						onCheckboxChangeHandler( value, service.ID, 'sync' )
					}
					options={ {
						true: __(
							'Sync service with cookiedatabase.org',
							'complianz-gdpr'
						),
					} }
				/>
			</div>
			<div className={ rowCls }>
				<label className={ rowLabelCls }>{ __( 'Name', 'complianz-gdpr' ) }</label>
				<TextInput
					disabled={ disabled }
					onChange={ ( value ) => setServiceName( value ) }
					placeholder={ __( 'Name', 'complianz-gdpr' ) }
					id={ service.ID + '_name' }
					name="name"
					value={ serviceName }
				/>
			</div>

			<div className={ rowCls }>
				<label className={ rowLabelCls }>{ __( 'Service Types', 'complianz-gdpr' ) }</label>
				<SelectInput
					disabled={ disabled }
					value={ service.serviceType }
					options={ serviceTypesByLanguage }
					onChange={ ( value ) =>
						onChangeHandler( value, service.ID, 'serviceType' )
					}
				/>
			</div>
			<div className={ rowCls }>
				<label className={ rowLabelCls }>
					{ __( 'Privacy Statement URL', 'complianz-gdpr' ) }
				</label>
				<TextInput
					disabled={ disabled }
					onChange={ ( value ) => setPrivacyStatementUrl( value ) }
					id={ service.ID + '_privacyStatementURL' }
					name="privacyStatementURL"
					value={ privacyStatementUrl }
				/>
			</div>
			{ cdbLink && (
				<div className={ rowCls }>
					<a
						className="tw-mt-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]"
						href={ cdbLink }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __(
							'View service on cookiedatabase.org',
							'complianz-gdpr'
						) }
					</a>
				</div>
			) }
			<div
				className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-mt-[var(--cmplz-space-s,_12px)] tw-pb-[5px]"
			>
				<Button
					variant="secondary"
					disabled={ saving }
					onClick={ ( e ) => onSaveHandler( service.ID ) }
				>
					{ __( 'Save', 'complianz-gdpr' ) }
				</Button>
				<Button
					variant="error"
					onClick={ ( e ) => onDeleteHandler( service.ID ) }
				>
					{ __( 'Delete Service', 'complianz-gdpr' ) }
				</Button>
			</div>
		</>
	);
};

const Service = ( props ) => {
	const { adding } = UseSyncData();

	const onAddCookieHandler = ( serviceID, serviceName ) => {
		props.addCookie( serviceID, serviceName );
	};
	const serviceIsSaved =
		props.service &&
		props.service.ID > 0 &&
		props.service.hasOwnProperty( 'name' );
	const isUnknownService = ! props.service || props.service.ID <= 0;
	const serviceName =
		props.service && props.service.name
			? props.service.name
			: __( 'New Service', 'complianz-gdpr' );
	const Details = () => {
		return (
			<>
				<div>{ ServiceDetails( props.service ) }</div>
				{ props.cookies && props.cookies.length > 0 && (
					<div className="cmplz-panel__cookie_list">
						{ props.cookies.map( ( cookie, i ) => (
							<Cookie key={ i } cookie={ cookie } />
						) ) }
					</div>
				) }
				{ ! isUnknownService && (
					<div className="tw-mt-[var(--cmplz-space-s,_12px)]">
						<div className="tw-flex">
							<Button
								variant="secondary"
								disabled={ adding || ! serviceIsSaved }
								onClick={ ( e ) =>
									onAddCookieHandler(
										props.service.ID,
										serviceName
									)
								}
							>
								{ __(
									'Add cookie to %s',
									'complianz-gdpr'
								).replace( '%s', serviceName ) }
								{ adding && <Icon name="loading" color="grey" /> }
							</Button>
						</div>
						{ ! serviceIsSaved && (
							<div className="cmplz-comment tw-italic">
								{ __(
									'Save service to be able to add cookies',
									'complianz-gdpr'
								) }
							</div>
						) }
					</div>
				) }
			</>
		);
	};

	const Icons = () => {
		if ( ! props.service ) {
			return <></>;
		}

		return (
			<>
				{ props.service.complete && (
					<Icon
						tooltip={ __(
							'The data for this service is complete',
							'complianz-gdpr'
						) }
						name="success"
						color="green"
					/>
				) }
				{ ! props.service.complete && (
					<Icon
						tooltip={ __(
							'This service has missing fields',
							'complianz-gdpr'
						) }
						name="times"
						color="red"
					/>
				) }
				{ props.service.synced && (
					<Icon
						tooltip={ __(
							'This service has been synchronized with cookiedatabase.org',
							'complianz-gdpr'
						) }
						name="rotate"
						color="green"
					/>
				) }
				{ ! props.service.synced && (
					<Icon
						tooltip={ __(
							'This service is not synchronized with cookiedatabase.org',
							'complianz-gdpr'
						) }
						name="rotate-error"
						color="red"
					/>
				) }
			</>
		);
	};

	return (
		<>
			<Panel
				id={ props.id }
				summary={ props.name }
				icons={ Icons() }
				details={ Details() }
			/>
		</>
	);
};

export default memo( Service );
