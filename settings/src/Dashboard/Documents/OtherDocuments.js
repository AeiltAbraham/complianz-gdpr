import { __ } from '@wordpress/i18n';
import {
	useState, useEffect
} from '@wordpress/element';
import useDocuments from "./DocumentsData";
import useFields from "../../Settings/Fields/FieldsData";
import SingleDocument from "./SingleDocument";

const OtherDocuments = () => {
	const {getFieldValue, fields} = useFields();
	const [recordsOfConsentEnabled, setRecordsOfConsentEnabled] = useState(false);
	useEffect (() => {
		setRecordsOfConsentEnabled(getFieldValue('records_of_consent'));
	},[fields]);

	const { processingAgreementOptions, dataBreachOptions, proofOfConsentOptions } = useDocuments();
	return (
		<>
			<h3 className="cmplz-h4 tw-mt-[var(--cmplz-space-l,_24px)] tw-mb-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-l,_24px)]">{__("Other documents", "complianz-gdpr")}</h3>
			<SingleDocument type="processing-agreements" link="#tools/processing-agreements" name={__("Processing Agreement","complianz-gdpr")} options={processingAgreementOptions}/>
			<SingleDocument type="data-breaches" link="#tools/data-breach-reports" name={__("Data Breach","complianz-gdpr")} options={dataBreachOptions}/>
			<SingleDocument type="proof-of-consent" link={recordsOfConsentEnabled ? "#tools/records-of-consent" : "#tools/proof-of-consent"} name={__("Proof of Consent","complianz-gdpr")} options={proofOfConsentOptions}/>
		</>
	)
}
export default OtherDocuments;
