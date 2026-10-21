import {__} from "@wordpress/i18n";
import Hyperlink from "./Hyperlink";

const Error = (props) => {
	if (props.error) {
		console.log("errors detected during the loading of the settings page");
		console.log(props.error);
	}
	let description = false;
	let url = 'https://complianz.io/support';

	let generic_rest_blocked_message = __("Please check if security settings on the server or a plugin is blocking the requests from Complianz.", "complianz-gdpr");
	let message = false;
	if (props.error) {
		message = props.error.message;
		if ( typeof message !== 'string'  ) {
			message = JSON.stringify(message);
		}
		if ( props.error.code==='rest_no_route') {
			description = __("The Complianz Rest API is disabled.", "complianz-gdpr")+" "+generic_rest_blocked_message
		} else if ( props.error.data.status === '404') {
			description = __("The Complianz Rest API returned a not found.", "complianz-gdpr")+" "+generic_rest_blocked_message;
		} else if ( props.error.data.status === '403') {
			description = __("The Complianz Rest API returned a 403 forbidden error.", "complianz-gdpr")+" "+generic_rest_blocked_message;
		}
		if (message.length>100){
			message = message.substring(0, 100)+ '...';
		}

	}

	// Migrated to the C-2 system (Stage H.8). The `.rsssl-rest-error-message` panel (which carried no
	// SCSS rule in the source tree) becomes a C-2 danger callout, and the "More information" CTA (the
	// raw `button button-default` the Hyperlink rendered — a marker-move landmine) becomes a secondary
	// button-styled link. This UI only renders when the REST load fails, so it is markerless: every
	// colour/space is a token-with-literal-fallback (fallback == token value) and `tw-border-solid`
	// pins the CTA/panel border-style (Preflight off, B1 not in scope — T-052).
	return (
		<>
			{props.error && <div className="rsssl-rest-error-message tw-rounded-[var(--cmplz-radius,_12px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-danger,_#d7263d)] tw-bg-[var(--cmplz-danger-surface,_#fdebed)] tw-p-[var(--cmplz-space-l,_24px)] tw-text-[color:var(--cmplz-text,_#0f172a)]">
				<h3 className="tw-mt-0">{__("A problem was detected during the loading of the settings", "complianz-gdpr")}</h3>
				{description &&
					<p>{description}</p>
				}

				<div>
					<p>{__("The request returned the following errors:", "complianz-gdpr")}</p>
					<ul>
						{props.error.code && <li>{__("Response code:", "complianz-gdpr")}&nbsp;{props.error.code}</li>}
						{props.error.data.status && <li>{__("Status code:", "complianz-gdpr")}&nbsp;{props.error.data.status}</li>}
						{message && <li>{__("Server response:", "complianz-gdpr")}&nbsp;{message}</li>}
					</ul>
				</div>
				<Hyperlink
					className="tw-inline-flex tw-items-center tw-justify-center tw-mt-[var(--cmplz-space-s,_12px)] tw-min-h-[30px] tw-py-0 tw-px-[10px] tw-rounded-[4px] tw-border tw-border-solid tw-border-[#2271b1] tw-bg-[#fff] tw-text-[0.8125rem] tw-font-normal tw-text-[#2271b1] tw-no-underline tw-transition-all tw-duration-300 tw-ease-[ease] hover:tw-bg-[#f7f7f7] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]"
					target="_blank"
					rel="noopener noreferrer"
					text={__("More information","complianz-gdpr")}
					url={url}
				/>
			</div>}
		</>
	)
}
export default Error
