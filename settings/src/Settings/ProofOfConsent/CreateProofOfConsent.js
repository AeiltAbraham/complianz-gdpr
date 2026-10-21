import { __ } from '@wordpress/i18n';
import useProofOfConsentData from "./useProofOfConsentData";
import Icon from "../../utils/Icon";
import {Button} from "../../components/ui/Button";
import {memo} from "@wordpress/element";
const CreateProofOfConsent = ({label, field}) => {
	const { generateProofOfConsent, generating} = useProofOfConsentData();

	return (
		<div className={'cmplz-field-button'}>
			{__("Create Proof of Consent","complianz-gdpr")}
			<Button
				variant="secondary"
				className="tw-border-solid tw-gap-[var(--cmplz-space-xs,_8px)]"
				disabled={generating}
				onClick={()=>generateProofOfConsent()}
			>
				{__("Generate","complianz-gdpr")}
				{generating && <Icon name = "loading" color = 'grey' />}
			</Button>
		</div>
	)
}
export default memo(CreateProofOfConsent);
