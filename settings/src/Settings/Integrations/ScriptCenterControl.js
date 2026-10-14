import useIntegrations from "./IntegrationsData";
import useFields from "../Fields/FieldsData";
import ThirdPartyScript from "./ThirdPartyScript";
import readMore from "../../utils/readMore";
import {useState, useEffect} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import { Button } from "../../components/ui/Button";

import {memo} from "@wordpress/element";
const ScriptCenterControl = () => {
	const { scripts, addScript, saveScript, integrationsLoaded, fetchIntegrationsData} = useIntegrations();
	const [ disabled, setDisabled ] = useState( false );
	const [ disabledText, setDisabledText ] = useState( '' );
	const { getFieldValue} = useFields();

	useEffect(() => {
		if (!integrationsLoaded) fetchIntegrationsData();
		if (integrationsLoaded) {
				if ( getFieldValue( 'safe_mode' ) == 1 ) {
				setDisabledText( __( 'Safe Mode enabled. To manage integrations, disable Safe Mode under Tools - Support.', 'complianz-gdpr' ) );
				setDisabled( true );
			}
		}
	}, [integrationsLoaded])


	return (
		<>
			<p>
				{__( "The script center should be used to add and block third-party scripts and iFrames before consent is given, or when consent is revoked. For example Hotjar and embedded video’s.", 'complianz-gdpr' ) }
				{ readMore('https://complianz.io/script-center/')}
			</p>
			{ (disabled ) &&
				<div className="cmplz-settings-overlay">
					<div className="cmplz-settings-overlay-message tw-rounded-[var(--cmplz-radius-field,_6px)]">{disabledText}</div>
				</div>
			}
			<h5>{__("Add a third-party script", 'complianz-gdpr' ) }</h5>
			{!integrationsLoaded &&  <> <ThirdPartyScript type='add_script' /></>}
			{integrationsLoaded && scripts.add_script.length>0 && scripts.add_script.map((script, i) => <ThirdPartyScript type='add_script' script={script} key={i} />)}
			<div data-cmplz-ui className="tw-mt-[var(--cmplz-space-s,_12px)]"><Button variant="secondary" onClick={()=>addScript('add_script')}>{__("Add new","complianz-gdpr")}</Button></div>

			<h5>{__("Block a script, iframe or plugin", 'complianz-gdpr' ) }</h5>
			{!integrationsLoaded &&<> <ThirdPartyScript type='block_script' /></>}
			{integrationsLoaded && scripts.block_script.length>0 && scripts.block_script.map((script, i) => <ThirdPartyScript type='block_script' script={script} key={i} />)}
			<div data-cmplz-ui className="tw-mt-[var(--cmplz-space-s,_12px)]"><Button variant="secondary" onClick={()=>addScript('block_script')}>{__("Add new","complianz-gdpr")}</Button></div>

			<h5>{__("Whitelist a script, iframe or plugin\n", 'complianz-gdpr' ) }</h5>
			{!integrationsLoaded &&<> <ThirdPartyScript type='whitelist_script' /></>}
			{integrationsLoaded && scripts.whitelist_script.length>0 && scripts.whitelist_script.map((script, i) => <ThirdPartyScript type='whitelist_script' script={script} key={i} />)}
			<div data-cmplz-ui className="tw-mt-[var(--cmplz-space-s,_12px)]"><Button variant="secondary" onClick={()=>addScript('whitelist_script')}>{__("Add new","complianz-gdpr")}</Button></div>
		</>
	)
}
export default memo(ScriptCenterControl)

