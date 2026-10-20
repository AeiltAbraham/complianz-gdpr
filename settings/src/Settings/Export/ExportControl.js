import {useState} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import {memo} from "@wordpress/element";
import {Button} from "../../components/ui/Button";

// Stage H.5 (H3, Tools): the Export action moved off the wp-admin `.button.button-default` onto the shared
// tertiary Button primitive (FR-020; the ResetBannerButton precedent for `button-default`). The
// `.cmplz-export-container` wrapper has no CSS rule (shared verbatim with Multisite/CopyMultisite, which
// this bundle does not touch) so it is left as-is. Zero new tokens.
function ExportControl({ field, label }) {
	const [disabled, setDisabled] = useState(false);

	const Download = () => {
		if (disabled) return;
		setDisabled(true);
		let request = new XMLHttpRequest();
		request.responseType = 'blob';
		request.open('get', field.url, true);
		request.send();
		request.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				var obj = window.URL.createObjectURL(this.response);
				var element = window.document.createElement('a');
				element.setAttribute('href',obj);
				element.setAttribute('download', 'complianz-export.json');
				window.document.body.appendChild(element);
				//onClick property
				element.click();
				setTimeout(function() {
					window.URL.revokeObjectURL(obj);
				}, 60 * 1000);
			}
		};

		request.onprogress = function(e) {
			setDisabled(true);
		};
	}

	return (
		<div className="cmplz-export-container">
				<Button variant="tertiary" onClick={() => Download()}>{__("Export","complianz-gdpr")}</Button>
		</div>
	)
}

export default memo(ExportControl)
