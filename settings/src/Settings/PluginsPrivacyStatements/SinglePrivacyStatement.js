import Panel from "../Panel";
import { __ } from '@wordpress/i18n';
import Icon from "../../utils/Icon";
import {memo} from "@wordpress/element";
import useFields from "../Fields/FieldsData";
import DOMPurify from 'dompurify';

// Round grey icon button (Stage H7, replacing the deleted legacy `.cmplz-button-icon`): grey-300 fill,
// blue glyph, 50% radius, the legacy grow-on-hover (padding 10->15px, margin 5->0). Fully tw- with an
// explicit `tw-border-solid` so it survives the base reset the app-root marker now applies (ADR-001
// marker move, H.5 Part 2) — no `data-cmplz-ui` needed (the tw- bg/border win over B1/B4 at (1,1,0)).
const iconBtnCls = "tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-transparent tw-bg-[#ededed] tw-text-[#2271b1] tw-p-[10px] tw-m-[5px] tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-[ease] hover:tw-p-[15px] hover:tw-m-0";

/**
 * Render a help notice in the sidebar
 */
const SinglePrivacyStatement = (props) => {
	const {updateField, setChangedField, getFieldValue} = useFields();

	const Details = () => {

		return (
			<>
				{/* nosemgrep: react-dangerouslysetinnerhtml */}
				<div className="tw-flex tw-flex-col tw-py-[5px]" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize( props.plugin.policy_text ) } }  />
			</>
		)
	}

	const addPolicyHandler = (title, text, e) => {
		e.preventDefault();
		let newText = getFieldValue('custom_privacy_policy_text');
		newText += '<h1>'+title+'</h1>'+text;
		updateField('custom_privacy_policy_text', newText);
		setChangedField('custom_privacy_policy_text', newText);
	}

	const Icons = () => {
		return (
			<>
				<button className={iconBtnCls} onClick = { (e) => addPolicyHandler(props.plugin.plugin_name, props.plugin.policy_text, e) }>
					<Icon tooltip={__( "Add to annex of Privacy Statement", "complianz-gdpr" )} name = 'plus'  />
				</button>

				{ props.plugin.consent_api !== 'na' &&
					<>
						<button className={iconBtnCls} >
						{ !props.plugin.consent_api && <Icon tooltip={__( "Does not conform with the Consent API", "complianz-gdpr" )} name = 'circle' color="red"  />}
						{ props.plugin.consent_api && <Icon tooltip={__( "Conforms to the Consent API", "complianz-gdpr" )} name = 'circle' color="green"  /> }
						</button>
					</>
				}
			</>
		)
	}

	return (
		<>
			<Panel summary={props.plugin.plugin_name} icon={props.icon} icons={Icons()} details={Details()} />
		</>
	);

}

export default memo(SinglePrivacyStatement)
