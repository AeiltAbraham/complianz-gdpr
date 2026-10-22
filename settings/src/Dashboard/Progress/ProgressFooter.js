import { __ } from '@wordpress/i18n';
import Icon from "../../utils/Icon";
import useFields from "../../Settings/Fields/FieldsData";
import useProgress from "./ProgressData";
import {useEffect, useState} from "@wordpress/element";
import { primaryLinkButtonCls } from "../../components/ui/downloadLink";

const ProgressFooter = () => {
	const {fields, getFieldValue} = useFields();
	const {showCookieBanner, fetchProgressData, progressLoaded} = useProgress();
	const [cookieBlockerColor, setCookieBlockerColor] = useState(false);
	const [placeholderColor, setPlaceholderColor] = useState(false);
	const [cookieBannerColor, setCookieBannerColor] = useState(false);

	useEffect( () => {
		if ( !progressLoaded ) {
			fetchProgressData();
		}
	}, [] );

	useEffect( () => {
		let color = getFieldValue('enable_cookie_blocker') === 'yes' ? 'green' : 'grey';
		setCookieBlockerColor(color);
		color = getFieldValue('dont_use_placeholders') == 1 ? 'grey' : 'green';
		setPlaceholderColor(color);
		color =  showCookieBanner ? 'green' : 'grey';
		setCookieBannerColor(color);
	}, [fields, showCookieBanner] );

	return (
		<>
			{/* Stage H.9: the raw `button button-primary` anchor → the C-2 primary button look. It
			    NAVIGATES to the `#wizard` hash, so it MUST stay an `<a href>` (not a `<button>`); the
			    markerless Dashboard footer needs `tw-border-solid` baked into the class (T-052). */}
			<a href="#wizard" className={primaryLinkButtonCls}>{__("Continue Wizard", "complianz-gdpr")}</a>
			<div className="cmplz-legend cmplz-flex-push-right">
				<Icon name={'circle-check'} color={cookieBlockerColor} size={14} />
				<span>{__("Cookie Blocker","complianz-gdpr")}</span>
			</div>
			<div className="cmplz-legend">
				<Icon name={'circle-check'} color={placeholderColor} size={14} />
				<span>{__("Placeholders","complianz-gdpr")}</span>
			</div>
			<div className="cmplz-legend">
				<Icon name={'circle-check'} color={cookieBannerColor} size={14} />
				<span>{__("Consent Banner","complianz-gdpr")}</span>
			</div>
		</>

	);
    }

export default ProgressFooter;
