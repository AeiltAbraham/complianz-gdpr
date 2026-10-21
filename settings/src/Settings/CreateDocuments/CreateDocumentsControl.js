import { __ } from '@wordpress/i18n';
import {UseDocumentsData} from "./DocumentsData";
import CreateDocument from "./CreateDocument";
import {useEffect} from "@wordpress/element";
import useFields from "../../Settings/Fields/FieldsData";
import Placeholder from '../../Placeholder/Placeholder';
import Icon from "../../utils/Icon";
import {Button} from "../../components/ui/Button";
import {memo, useState} from "@wordpress/element";

/**
 * Render a help notice in the sidebar
 */
const CreateDocumentsControl = () => {
	const {saveDocuments, saving, documentsChanged, documentsDataLoaded, hasMissingPages, fetchDocumentsData, requiredPages } = UseDocumentsData();
	const {fieldsLoaded, changedFields, addHelpNotice, removeHelpNotice, showSavedSettingsNotice, setDocumentSettingsChanged} = useFields();
	const [hasNoDocumentsNotice, setHasNoDocumentsNotice] = useState(false);

	useEffect (  () => {
		if ( !fieldsLoaded ) return;
		//we want to update on load. When the user changes a field, we want to update after save, then the count is zero again.
		if ( changedFields.length>0 ){
			return;
		}
		fetchDocumentsData();
	}, [ fieldsLoaded, changedFields ])

	useEffect (  () => {
		if (!documentsDataLoaded) return;

		if ( requiredPages.length === 0) {
			let explanation = __("You haven't selected any legal documents to create.", "complianz-gdpr") + " " + __("You can continue to the next step.", "complianz-gdpr");
			addHelpNotice('create-documents', 'warning', explanation, __('No required documents', 'complianz-gdpr'));
			setHasNoDocumentsNotice(true);
		} else {
			if (hasNoDocumentsNotice) {
				removeHelpNotice('create-documents');
			}
		}
	}, [ requiredPages, documentsDataLoaded ])

	const onButtonClickHandler = async () => {
		saveDocuments().then(()=> {
			setDocumentSettingsChanged(true);
			showSavedSettingsNotice(__("Documents updated!", "complianz-gdpr"));
		});
	}
	let intro;
	if ( hasMissingPages ){
		intro = __("The pages marked with X should be added to your website. You can create these pages with a shortcode, a Gutenberg block or use the below \"Create missing pages\" button.","complianz-gdpr");
	} else {
		intro = __("All necessary pages have been created already. You can update the page titles here if you want, then click the \"Update pages\" button.","complianz-gdpr");
	}

	if (!documentsDataLoaded) {
		return (
			<Placeholder lines="3"></Placeholder>
		)
	}
	let disabled = !hasMissingPages && !documentsChanged;
	return (
		<>
			{documentsDataLoaded && intro}
			{documentsDataLoaded && requiredPages.map((page, i) => <CreateDocument page={page} key={i} />)}
			{requiredPages.length>0 &&
				<div>
					{ /* C-2 migration (Stage H.6): legacy `button button-default` -> secondary Button.
					   Markerless row, so `tw-border-solid` supplies the base-reset border-style (B1) that a
					   data-cmplz-ui ancestor would otherwise give under Preflight-off (T-052); the variant
					   colours + the icon gap resolve via the Bundle-A #complianz-app token broadening. */ }
					<Button
						variant="secondary"
						className="tw-border-solid tw-gap-[var(--cmplz-space-xs,_8px)]"
						disabled={disabled}
						onClick={()=> onButtonClickHandler()}
					>
						{hasMissingPages ? __("Create missing pages","complianz-gdpr") : __("Update","complianz-gdpr")}
						{saving && <Icon name = "loading" color = 'grey' />}
					</Button>
				</div>
			}
		</>

	);

}

export default memo(CreateDocumentsControl)
