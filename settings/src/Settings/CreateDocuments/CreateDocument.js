import {UseDocumentsData} from "./DocumentsData";
import Icon from "../../utils/Icon";
import {TextField} from "../../components/ui/TextField";
import useFields from "../Fields/FieldsData";
import { __ } from '@wordpress/i18n';

/**
 * Render a help notice in the sidebar
 */
const CreateDocument = (props) => {
	const {saving, updateDocument } = UseDocumentsData();
	const {showSavedSettingsNotice} = useFields();

	const onChangeHandler = (e, id) => {
		updateDocument(id, e.target.value);
	}
	const onClickhandler = (e, shortcode) => {
		let success;
		e.target.classList.add('cmplz-click-animation');
		let temp = document.createElement("input");
		document.getElementsByTagName("body")[0].appendChild(temp);
		temp.value = shortcode;
		temp.select();
		try {
			success = document.execCommand("copy");
		} catch (e) {
			success = false;
		}
		temp.parentElement.removeChild(temp);
		if (success) {
			showSavedSettingsNotice(__("Copied shortcode", "complianz-gdpr"));
		}
	}
	let isCreated = !!props.page.page_id;
	// C-2 migration (Stage H.6): the legacy `.cmplz-create-document` flex row + raw `<input>` are
	// reproduced with tw- utilities + the ui/TextField primitive, so the body-specific
	// `.cmplz-create-document` legacy-globals rule is retired. Markerless, so TextField gets an explicit
	// `tw-border-solid` for the base-reset border-style (B1) under Preflight-off (T-052); the field tokens
	// resolve via the Bundle-A #complianz-app broadening. The 10px icon|input|shortcode spacing is one gap.
	return (
		<div className="cmplz-create-document tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-py-[10px]">
			{ isCreated && <Icon name='success' color='green'/>}
			{ !isCreated && <Icon name='times'/>}
			<TextField
				className="tw-border-solid tw-w-1/2 tw-min-w-[200px]"
				disabled={saving}
				onChange={ ( e ) =>  onChangeHandler(e, props.page.page_id) }
				type="text"
				value={props.page.title}
				aria-label={__("Page title","complianz-gdpr")}
			/>
			<div className="cmplz-shortcode-container tw-cursor-pointer" onClick={ ( e ) =>  onClickhandler(e, props.page.shortcode) }><Icon  name='shortcode'/></div>
		</div>
	);

}

export default CreateDocument
