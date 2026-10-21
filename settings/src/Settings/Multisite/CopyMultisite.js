import UseCopyMultisiteData from "./UseCopyMultisiteData";
import {memo, useEffect, useState} from "@wordpress/element";;
import Icon from "../../utils/Icon";
import { __ } from '@wordpress/i18n';

import AreYouSureModal from "../AreYouSureModal";
import useFields from "../Fields/FieldsData";
import { Button } from "../../components/ui/Button";
const CopyMultisite = () => {
	const { progress, active, start, next, total, copySites } = UseCopyMultisiteData();
	const [ isOpen, setIsOpen ] = useState( false );
	const {addHelpNotice, removeHelpNotice} = useFields();

	const handleConfirm = async () => {
		setIsOpen( false );
		await copySites(true);
	}

	const handleCancel = () => {
		setIsOpen( false );
	}

	const doCopySiteBatch = async () => {
		await copySites(false);
	}

	useEffect (() => {
		if (progress < 100) {
			if (active ) {
				doCopySiteBatch();
				addHelpNotice('copy-multisite', 'warning', __( "Complianz is currently copying settings of site %1$s to %2$s of %3$s sites.","complianz-gdpr").replace('%1$s', start).replace('%2$s', next).replace('%3$s', total), __("Copying settings...","complianz-gdpr"),false);
			}

		} else {
			removeHelpNotice('copy-multisite');
		}
	},[progress] );
	return (
		<>
			<div className="cmplz-export-container">
				<AreYouSureModal
					isOpen={ isOpen }
					onConfirm={ handleConfirm }
					onCancel={ handleCancel }
				>
					{__( 'Are you sure? This will overwrite the settings in all your subsites with the Complianz settings of this site.', 'complianz-gdpr' )}
				</AreYouSureModal>
				{ /* Migrated to the C-2 system (Stage H.8): raw `button button-default` → `ui/Button`
				     secondary. Markerless (the still-legacy multisite copy screen), so `tw-border-solid`
				     pins the border-style (Preflight off — T-052); the loading Icon stays markerless. */ }
				<Button variant="secondary" className="tw-border-solid" onClick={() => setIsOpen( true )}>{__("Start","complianz-gdpr")}
					{ active && <>&nbsp;{progress}%<Icon name = "loading" color = 'grey' /></>}
				</Button>
			</div>
		</>
	)
}
export default memo(CopyMultisite)
