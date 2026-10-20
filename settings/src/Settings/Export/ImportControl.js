import {Button} from "../../components/ui/Button";
import {useState, useEffect, useRef} from "@wordpress/element";
import useFields from "../../Settings/Fields/FieldsData";
import Icon from "../../utils/Icon";
import { __ } from '@wordpress/i18n';
import {upload} from "../../utils/upload";
import {memo} from "@wordpress/element";
import useMenu from "../../Menu/MenuData";

function ImportControl() {
	const {removeHelpNotice, addHelpNotice, fetchFieldsData, showSavedSettingsNotice} = useFields();
	const {selectedSubMenuItem } = useMenu();

	const fileInputRef = useRef(null);
	const [file, setFile] = useState(false)
	const [disabled, setDisabled] = useState(true);
	const [uploading, setUploading] = useState(false);
	useEffect(() => {
		if (!file ) return;
		if (file.type!=='application/json') {
			setDisabled(true);
			addHelpNotice('import_settings', 'warning', __("You can only upload .json files","complianz-gdpr"), __("Incorrect extension","complianz-gdpr"),false);
		} else {
			setDisabled(false);
			removeHelpNotice('import_settings');
		}

	}, [file])

	const onClickHandler = (e) => {
		setDisabled(true);
		setUploading(true);

		upload('import_settings', file).then((response) => {
			if (response.data.success) {
				fetchFieldsData(selectedSubMenuItem).then(() => {
					showSavedSettingsNotice(__("Settings imported", "complianz-gdpr"));
				});
			} else {
				addHelpNotice('import_settings', 'warning', __("You can only upload .json files","complianz-gdpr"), __("Incorrect extension","complianz-gdpr"),false);
			}
			setUploading(false);
			setFile(false);
			return true;
		}).catch((error) => {
			console.error(error);
		});
	}

	// Stage H.5 (H3, Tools): the import form migrated off Import.scss onto tw- utilities + the Button
	// primitive. The row flexes the file name and the two actions to the end (logical `ms-auto`, RTL-safe —
	// the legacy `margin-left:auto`), gap on the 4px grid. The Import action moves off the wp-admin
	// `.button.button-default` onto the shared tertiary Button (FR-020; the ResetBannerButton precedent for
	// `button-default`). Zero new tokens; markerless, Button carries its own literal fallbacks.
	return (
		<div className="tw-flex">
			<div className="tw-ms-auto tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)]">
			{file && file.name}
			<Button
				variant="secondary"
				className="tw-gap-[var(--cmplz-space-xs,_8px)]"
				onClick={ () => fileInputRef.current && fileInputRef.current.click() }
			>
				<Icon name="upload" color='black' />
				{__("Select file","complianz-gdpr")}
			</Button>
			{/* Visually hidden native input: keeps the file picker, accept filter and change
			    handling; the Button above is the labelled, operable trigger. */}
			<input
				ref={fileInputRef}
				type="file"
				accept=""
				className="tw-sr-only"
				tabIndex={-1}
				aria-label={__("Select file","complianz-gdpr")}
				onChange={ ( event ) => setFile(event.currentTarget.files[0]) }
			/>
			<Button variant="tertiary" disabled={disabled} className="tw-gap-[var(--cmplz-space-xs,_8px)]" onClick={(e) => onClickHandler(e)}>
				{__("Import","complianz-gdpr")}
				{uploading && <Icon name = "loading" color = 'grey' />}
			</Button>
			</div>
		</div>
	)
}

export default memo(ImportControl)
