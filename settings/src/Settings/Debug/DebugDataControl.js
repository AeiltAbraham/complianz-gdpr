import {useEffect} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import {memo} from "@wordpress/element";

import useDebugData from "./useDebugData";

// Stage H.5 (H3, Tools): the debug-data panel migrated off debug.scss onto the C-2 design system — the
// legacy flat grey box (grey-300 #ededed) becomes a sunken surface with the 4px-grid padding and the small
// radius. Zero new tokens. The body renders markerless (a `debug-data` field type in the markerless
// settings frame), so the tokens carry literal fallbacks; no `tw-border` (markerless border-style would be
// `none` under Preflight-off — the sunken fill alone separates the panel).
const PANEL = 'tw-p-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]';
const DebugDataControl = () => {

	const { debugDataLoaded, scriptDebugEnabled, debugData, getDebugData } = useDebugData();

	useEffect ( () => {
		if (!debugDataLoaded) {
			getDebugData();
		}
	},[]);

	return (
		<div className={PANEL}>
			{debugDataLoaded && !scriptDebugEnabled && __("To view possible script conflicts on your site, set the SCRIPT_DEBUG constant in your wp-config.php, or install the plugin WP Debugging","complianz-gdpr")}
			{debugDataLoaded && scriptDebugEnabled && <>
				{__("Debugging enabled:","complianz-gdpr")}&nbsp;
				{debugData}
				{debugData.length===0 && __("No script errors detected","complianz-gdpr")}
			</>}
			{!debugDataLoaded && <>...</>}
		</div>
	)
}
export default memo(DebugDataControl)
