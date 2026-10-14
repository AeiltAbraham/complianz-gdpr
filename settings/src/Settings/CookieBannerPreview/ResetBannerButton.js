import { __ } from '@wordpress/i18n';
import useFields from "../../Settings/Fields/FieldsData";
import UseBannerData from "./CookieBannerData";
import Icon from "../../utils/Icon";
import {useState, useEffect, memo} from "@wordpress/element";
import AreYouSureModal from "../AreYouSureModal";
import { Button } from "../../components/ui/Button";

// Banner preview CHROME (T-050, ADR-005/ADR-008/FR-020): the reset action migrated off the legacy
// `.cmplz-banner-reset-button button.button.button-default` rule (CookieBannerPreview.scss, now deleted)
// onto the shared tertiary Button primitive — dropping the wp-admin `.button`/`.button-default` classes
// (FR-020). The AreYouSureModal confirm flow and the loading Icon are unchanged; `tw-gap-[10px]`
// reproduces the legacy 10px gap between the label and the spinner.

const ResetBannerButton = () => {
	const { cssLoading, selectedBanner } = UseBannerData();
	const [active, setActive] = useState(false);
	const [disabled, setDisabled] = useState(false);
	const {updateField, setChangedField, fields} = useFields();
	const [ isOpen, setIsOpen ] = useState( false );

	//set active to false when css is loaded.
	useEffect( () => {
		if ( !cssLoading ) {
			setActive(false);
		}
	}, [cssLoading] );

	//make sure the button is disabled until any data changes again.
	useEffect( () => {
		if (!active) setDisabled(false);
	},[fields]);

	const handleClick = async () => {
		setIsOpen( true );
	}

	const handleConfirm = async () => {
		setIsOpen( false );
		setDisabled(true);
		await setDefaults();
	};

	const setDefaults = () => {
		setActive(true);
		let bannerFields = selectedBanner.banner_fields;
		for ( const field of bannerFields ) {
			if ( field.hasOwnProperty('default') ) {
				if ( field.type==='hidden' ) {
					continue;
				}
				updateField(field.id, field.default);
				setChangedField(field.id, field.default);
			}
		}
	}

	return (
		<>
			<AreYouSureModal
					isOpen={ isOpen }
					onConfirm={ () => handleConfirm() }
					onCancel={() => setIsOpen(false) }
				>
					{__('Are you sure you want to reset this banner to the default settings?', 'complianz-gdpr')}
				</AreYouSureModal>
			<Button variant="tertiary"
					disabled={disabled || active}
					onClick={() => handleClick(  )}
					className="tw-gap-[10px]"
			>
				{__('Reset', 'complianz-gdpr')}
					{active && <Icon name = "loading" color = 'grey' />}
			</Button>
		</>
	);
}
export default memo(ResetBannerButton);
