import {useEffect} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import {memo} from "@wordpress/element";

import useSecurityMeasuresData from "./useSecurityMeasuresData";
import useInstallPluginData from "../InstallPlugin/InstallPluginData";
const SecurityMeasures = () => {
	const { measuresDataLoaded, measures, has_7, getMeasuresData } = useSecurityMeasuresData();
	const {statusLoaded, startPluginAction, pluginAction} = useInstallPluginData();
	const slug = 'really-simple-ssl';


	//on update of plugin status
	useEffect ( () => {
		if (pluginAction==='status') {
			return;
		}
		getMeasuresData();
	},[pluginAction]);

	let status = statusLoaded ? pluginAction : 'loading';
	if ( statusLoaded && status!=='installed' && status!=='upgrade-to-premium') {
		let notice  = status === 'activate' ? __("Please activate Really Simple Security to unlock this feature.", "complianz-gdpr") : __("Please install Really Simple Security to unlock this feature.", "complianz-gdpr");
		if (status === 'loading' ) {
			notice = '...';
		}
		return (
			<div className="cmplz-locked">
				<div className="cmplz-locked-overlay">
					<span className="cmplz-task-status cmplz-open">{__("Not installed", "complianz-gdpr")}</span>
					<span>
					{notice}
				</span>
				</div>
			</div>
		)
	}

	const measuresList = {
		vulnerability_detection : __("Vulnerability Detection",'complianz-gdpr'),
		recommended_headers : __("HTTP Strict Transport Security and related security headers",'complianz-gdpr'),
		ssl : __("TLS / SSL",'complianz-gdpr'),
		hardening : __("Recommended site hardening features",'complianz-gdpr'),
	};

	const Measure = ({measure}) => {
		//get properties of the measure. Disabled measures read muted (AA-safe slate, not the
		//near-invisible legacy grey-400 #c6c6c6) to keep the enabled/disabled distinction legible.
		const enabledClass = measure.enabled
			? 'cmplz-measure-enabled'
			: 'cmplz-measure-disabled tw-text-[color:var(--cmplz-text-muted,_#475569)]';
		return (
			<ul className="cmplz-measure tw-list-disc tw-ms-[30px] tw-mt-[var(--cmplz-space-xs,_8px)]">
				<li className={"cmplz-measure-description "+enabledClass}>{measuresList[measure.id]}</li>
			</ul>
		)
	}

	return (
		<div className="cmplz-measures-container tw-p-[var(--cmplz-space-s,_12px)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-rounded-[var(--cmplz-radius-s,_8px)]">
			{measuresDataLoaded && has_7 && measures.length>0 && <>
				<p>{__("We are committed to the security of personal data. We take appropriate security measures to limit abuse of and unauthorized access to personal data. This ensures that only the necessary persons have access to your data, that access to the data is protected, and that our security measures are regularly reviewed.",'complianz-gdpr')}</p>
				<p>{__("The security measures we use consist of, but are not limited to:",'complianz-gdpr')}</p>
				{measures.map((measure, index) => <Measure key={index} measure={measure}/>)}
			</>}
			{measuresDataLoaded && measures.length===0 && has_7 && __("No security measures enabled in Really Simple Security",'complianz-gdpr')}
			{measuresDataLoaded && !has_7 && __("Please upgrade Really Simple Security to the latest version to unlock this feature.",'complianz-gdpr')}
			{!measuresDataLoaded && <>...</>}
		</div>
	)
}
export default memo(SecurityMeasures)

