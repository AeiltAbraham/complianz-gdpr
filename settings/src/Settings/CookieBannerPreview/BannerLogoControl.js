import SelectInput from "../Inputs/SelectInput";
import UseBannerData from "./CookieBannerData";
import useFields from "../Fields/FieldsData";
import { __ } from '@wordpress/i18n';
import {memo} from "@wordpress/element";
import DOMPurify from 'dompurify';
import { clsx } from "../../components/ui/cx";

// Banner preview CHROME (T-050, DB-07, C-2, ADR-005/ADR-008): the `.cmplz-logo-preview` dashed box migrated
// off the legacy CookieBannerPreview.scss rule (now deleted) onto `tw-` utilities + the semantic tokens with
// LITERAL FALLBACKS: the redesign look (a dashed `--cmplz-field-border` box on a field radius, per
// design/consent-banner-preview.html) applied over the box's EXISTING sizing — it sizes to the real logo
// (the complianz svg at 90px / the uploaded custom image), NOT the mock's generic 160x72 placeholder, so
// actual logos render undistorted; the clickable custom box gets an accent hover border to signal upload.
// The legacy physical `float:right` is dropped for a
// logical stacked layout (ADR-007). The e2e class hooks `.cmplz-logo-preview`/`.cmplz-clickable` and the
// `.cmplz-logo-container`/`.cmplz-complianz-logo`/`.cmplz-theme-image`/`.cmplz-custom-image` hooks are KEPT
// (isolation.spec:286,291; the logo-upload wp.media flow + the DOMPurify-sanitized logo HTML are unchanged).
const LOGO_PREVIEW_BASE = clsx(
	"cmplz-logo-preview",
	"tw-mt-[var(--cmplz-space-xs,_8px)] tw-flex tw-items-center tw-justify-center",
	"tw-border tw-border-dashed tw-border-[color:var(--cmplz-field-border,_#94a3b8)]",
	"tw-rounded-[var(--cmplz-radius-field,_6px)]"
);

const BannerLogoControl = (props) => {
	const { customizeUrl, selectedBanner, bannerDataLoaded} = UseBannerData();
	const {updateField, setChangedField} = useFields();

	const onChangeHandler = (value) => {
		updateField(props.id, value);
		setChangedField( props.id, value );
		document.querySelector('.cmplz-cookiebanner .cmplz-logo').innerHTML = selectedBanner.logo_options[value];
	}

	//document.querySelector('.cmplz-logo-preview.cmplz-theme-image a').attr('href', customizeUrl);
	let previewClass = LOGO_PREVIEW_BASE;
	if (props.value==='complianz') {
		previewClass = clsx(LOGO_PREVIEW_BASE, 'cmplz-complianz-logo', 'tw-p-[5px] [&_svg]:tw-h-[90px] [&_svg]:tw-w-[90px]');
	} else if (props.value==='site') {
		previewClass = clsx(LOGO_PREVIEW_BASE, 'cmplz-theme-image');
	}
	let frame;
	const runUploader = (event) => {
		// If the media frame already exists, reopen it.
		if (frame) {
			frame.open()
			return
		}

		// Create a new media frame
		frame = wp.media({
			title: __('Select a logo','complianz-gdpr'),
			button: {
				text: __('Set logo','complianz-gdpr'),
			},
			multiple: false, // Set to true to allow multiple files to be selected
		})

		// When an image is selected in the media frame...
		frame.on( 'select', function() {
			var length = frame.state().get("selection").length;
			var images = frame.state().get("selection").models;

			for(var iii = 0; iii < length; iii++)
			{
				var thumbnail_id = images[iii].id;
				var image = false;
				image = images[iii].attributes.sizes['cmplz_banner_image'];
				if (!image) {
					image = images[iii].attributes.sizes['medium'];
				}
				if (!image) {
					image = images[iii].attributes.sizes['thumbnail'];
				}
				if (!image) {
					image = images[iii].attributes.sizes['full'];
				}

				if ( image ) {
					var image_url = image['url'];
					updateField('logo_attachment_id', thumbnail_id);
					setChangedField('logo_attachment_id', thumbnail_id);
					let img = document.createElement("img");
					document.querySelector(".cmplz-cookiebanner .cmplz-logo").appendChild(img);
					document.querySelector('.cmplz-cookiebanner .cmplz-logo img').src = image_url;
					document.querySelector('.cmplz-custom-image img').src = image_url;
				}

			}
		});

		// Finally, open the modal on click
		frame.open()
	}
	//https://wordpress.stackexchange.com/questions/368238/how-use-wp-media-upload-liberary-in-react-components
	return (
		<div className="cmplz-logo-container">
			<SelectInput
				// disabled={ props.disabled }
				label={ props.label }
				onChange={ ( fieldValue ) => onChangeHandler(fieldValue) }
				value= { props.value }
				options={ props.options }
			/>
			{ props.value === 'complianz' &&
				<div className={previewClass}>
					<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBanner.logo_options[props.value]) }} />
				</div>
			}

			{ props.value === 'site' &&
				<div className={previewClass}>
					<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBanner.logo_options[props.value]) }} />
					{props.value==='site' && selectedBanner.logo_options[props.value].length===0 && <>
						<p>{__('No logo found. Please add a logo in the customizer.', 'complianz-gdpr')}</p>
					</>}
				</div>
			}
			{
				props.value === 'custom' &&
				<div className={clsx(LOGO_PREVIEW_BASE, 'cmplz-clickable', 'tw-cursor-pointer tw-max-w-[90px]', 'hover:tw-border-[color:var(--cmplz-accent-strong,_#1e73be)]')} onClick={() => runUploader()}>
					<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBanner.logo_options[props.value]) }} alt="Banner Logo" className="cmplz-custom-image" />
				</div>
			}

		</div>
	)
}
export default memo(BannerLogoControl)
