import Hyperlink from "../utils/Hyperlink";
import { __ } from '@wordpress/i18n';
import useMenu from "../Menu/MenuData";
import useLicense from "./License/LicenseData";
import {useEffect,useState} from '@wordpress/element';
import useFields from './Fields/FieldsData';
import UseBannerData from "./CookieBannerPreview/CookieBannerData";
import ErrorBoundary from "../utils/ErrorBoundary";
import DOMPurify from "dompurify";
import { clsx } from "../components/ui/cx";

// Settings-screen CARD frame (T-046, DB-07/DB-08; Stage-H section 1b). Migrated off the retired
// assets/css/admin/modules/wizard.scss (`.cmplz-wizard-settings .cmplz-grid-item*` layer) + the T-045
// wizard-div `.cmplz-grid-item-content` / `.cmplz-settings-block-intro` relocations onto `tw-` utilities on
// the semantic `--cmplz-*` tokens WITH LITERAL FALLBACKS, reusing the gate-G3-approved card look
// (shell-preview.html: surface/border/radius-12/shadow; header padding space-m/space-l + border divider;
// content body). The card carries no `data-cmplz-ui` of its own — it is a layout container. After the
// ADR-001 MARKER MOVE (Stage H.5 Part 2) the app-root `#complianz-app[data-cmplz-ui]` marker covers its
// descendants, which is now SAFE: every body the card wraps (finish/plugins_overview/documents_menu/
// cookiedatabase_sync/create-documents/cookie_scan, the Panel.js accordion, the `.cmplz-locked` overlay)
// has been migrated to the C-2 system (H1–H9) and is self-sufficient, so the base reset has nothing legacy
// to strip. (The settings-block intro's DOMPurify HTML renders plain prose; the Help.js notice body — the
// one sanitized-HTML surface with embedded code/tables — is folded into the design system in this PR.)
// The card look comes from the `tw-` utilities (1,1,0 via the `important:` config), which win over the
// shared legacy-globals `:where(.cmplz) .cmplz-grid-item*` base (0,1,0) that STAYS for Dashboard/
// PagePlaceholder. The legacy class hooks (cmplz-grid-item, -header, -controls, -content, block-intro,
// cmplz-locked) are kept. Logical utilities only (ADR-007). The locked overlay is multi-consumer, so its
// legacy look is RELOCATED to legacy-globals.scss for the still-legacy bodies while SettingsGroup's own lock
// gets the approved tw- treatment here (frame.md §3 default: rgba(255,255,255,0.8) scrim literal — no new
// token, no backdrop blur; overlay card = surface + shadow + radius + space padding; z = --cmplz-z-overlay).
const CARD_SHADOW = "tw-shadow-[var(--cmplz-shadow,_0_1px_3px_0_rgba(15,23,42,0.10),_0_1px_2px_-1px_rgba(15,23,42,0.06))]";
const cardCls = clsx(
	// tw-isolate: make the card a stacking context so the lock scrim's z (--cmplz-z-overlay, below) stays
	// CONTAINED in the card and the sticky footer-container (--cmplz-z-sticky) paints above it, as legacy
	// did (footer z-12 > lock z-10). Without it the scrim z-30 would leak to the body context and cover +
	// click-block the footer (T-046 review fix).
	"tw-relative tw-isolate tw-overflow-hidden tw-mb-[var(--cmplz-space-l,_24px)]",
	"tw-bg-[var(--cmplz-surface,_#ffffff)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"tw-rounded-[var(--cmplz-radius,_12px)]",
	CARD_SHADOW
);
const headerCls = clsx(
	"tw-flex tw-items-center tw-justify-between tw-min-h-[56px]",
	"tw-py-[var(--cmplz-space-m,_16px)] tw-px-[var(--cmplz-space-l,_24px)]",
	// block-end divider via the block-axis utility (border-b* does not flip under RTL — same convention as
	// Header.js; the arbitrary `border-block-end` property is not emitted by the build's extractor). Border
	// STYLE is set explicitly (this frame is markerless, so base.css B1's `border-style:solid` does not apply).
	"tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]"
);
const controlsCls = clsx(
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]",
	"tw-text-[color:var(--cmplz-text-muted,_#475569)] tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)]"
);
// Field rows carry their own inline padding (Field.js), so the content body stays padding-inline:0 and lays
// the rows / composite bodies out as a column with a space-l gap + space-l block margins (mirrors the deleted
// T-045 override exactly, so the still-legacy composite-body spacing is unchanged).
const contentCls = "tw-flex tw-flex-col tw-gap-[var(--cmplz-space-l,_24px)] tw-my-[var(--cmplz-space-l,_24px)] tw-px-0";
const introCls = "tw-px-[var(--cmplz-space-l,_24px)]";
const lockedScrimCls = "tw-absolute tw-inset-0 tw-z-[var(--cmplz-z-overlay,_30)] tw-rounded-[var(--cmplz-radius,_12px)] tw-bg-[rgba(255,255,255,0.8)]";
const lockedOverlayCls = clsx(
	"tw-relative tw-z-[1] tw-top-[calc(100%_-_95px)]",
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]",
	"tw-bg-[var(--cmplz-surface,_#ffffff)] tw-rounded-[var(--cmplz-radius-s,_8px)]",
	"tw-py-[var(--cmplz-space-m,_16px)] tw-px-[var(--cmplz-space-l,_24px)] tw-m-[var(--cmplz-space-s,_12px)]",
	CARD_SHADOW
);
/**
 * Render a grouped block of settings
 */
const SettingsGroup = (props) => {
	const { highLightField, getFieldValue} = useFields();
	const {licenseStatus} = useLicense();
	const { bannerDataLoaded} = UseBannerData();
	let upgrade='https://complianz.io/pricing/';
	const {subMenu, getMenuRegions, selectedSubMenuItem, selectedMainMenuItem} = useMenu();

	let regions = getMenuRegions();
	//get selected regions from the regions field
	let selectedRegions = getFieldValue('regions');
	if (!Array.isArray(selectedRegions)) selectedRegions = [selectedRegions];
	//filter out regions from 'regions' that do not exist in selectedRegions
	regions = regions.filter(region => selectedRegions.includes(region));

	const [Field, setField] = useState(null);
	useEffect( () => {
		import("./Fields/Field").then(({ default: Field }) => {
			setField(() => Field);
		});
	}, []);

	let selectedFields = [];
	//get all fields with group_id props.group_id
	for (const selectedField of props.fields){
		if (selectedField.group_id === props.group ){
			selectedFields.push(selectedField);
		}
	}

	let activeGroup;
	//first, set the selected menu item as active group, so we have a default in case there are no groups
	for (const item of subMenu.menu_items){
		if (item.id === selectedSubMenuItem ) {
			activeGroup = item;
		} else if (item.menu_items) {
			activeGroup = item.menu_items.filter(menuItem => menuItem.id === selectedSubMenuItem)[0];
		}
		if ( activeGroup ) {
			break;
		}
	}

	//now check if we have actual groups
	for (const item of subMenu.menu_items){
		if (item.id === selectedSubMenuItem && item.hasOwnProperty('groups')) {
			let currentGroup = item.groups.filter(group => group.id === props.group);
			if (currentGroup.length>0) {
				activeGroup = currentGroup[0];
			}
		}
	}

	if ( !activeGroup ) {
		return null;
	}
	let msg = activeGroup.premium_text ? activeGroup.premium_text : __("Learn more about %sPremium%s", "complianz-gdpr");
	if ( cmplz_settings.is_premium ) {
		if ( licenseStatus === 'empty' || licenseStatus === 'deactivated' ) {
			msg = cmplz_settings.messageInactive;
		} else {
			msg = cmplz_settings.messageInvalid;
		}
	}

	//if free, all premium items are disabled
	let disabled = false;
	if ( activeGroup.premium ) {
		disabled = !cmplz_settings.is_premium;
	}
	//if this is the premium plugin, it's only disabled if the license is not valid.
	if (cmplz_settings.is_premium) {
		disabled = licenseStatus !== 'valid' && activeGroup.id !== 'license';
	}
	//if a feature can only be used on networkwide or single site setups, pass that info here.
	upgrade = activeGroup.upgrade ? activeGroup.upgrade : upgrade;
	let helplinkText = activeGroup.helpLink_text ? activeGroup.helpLink_text : __("Instructions","complianz-gdpr");
	let disabledClass = disabled ? 'cmplz-disabled' : '';

	//if all fields are conditionally disabled, hide the entire group
	if ( selectedFields.filter((field)=> ( field.conditionallyDisabled && field.conditionallyDisabled===true ) || (field.visible && field.visible===false) ).length===selectedFields.length ) {
		return null;
	}

	// The first premium field on a WIZARD page shows the full upsell callout; the rest get a subtle crown.
	// Outside the wizard (Settings, Tools, …) there is no callout — every premium field gets the crown only.
	const firstPremiumId = ( cmplz_settings.is_premium || selectedMainMenuItem !== 'wizard' ) ? null : ( selectedFields.find( ( f ) => f.premium ) || {} ).id;

	return (
		<div className={clsx("cmplz-grid-item", "cmplz-"+activeGroup.id, disabledClass, cardCls)} key={activeGroup.id}>
			{activeGroup.title && <div className={clsx("cmplz-grid-item-header", headerCls)}>
				<h3 className="cmplz-h4">{activeGroup.title}</h3>
				{regions.length>0 && <div className={clsx("cmplz-grid-item-controls", controlsCls)}>
					{regions.map((region, i) =>
						<div key={i}><img className="cmplz-settings-region tw-w-[25px]" src={cmplz_settings.plugin_url+'/assets/images/'+region+'.svg'}  alt="region"/></div>
					)}
				</div>}

				{regions.length===0 && activeGroup.helpLink && <div className={clsx("cmplz-grid-item-controls", controlsCls)}>
					<Hyperlink
						target="_blank"
						rel="noopener noreferrer"
						className="cmplz-helplink tw-text-[color:var(--cmplz-text,_#0f172a)]"
						text={helplinkText}
						url={activeGroup.helpLink}
					/>
				</div>}
			</div>}
			<div className={clsx("cmplz-grid-item-content", contentCls)}>
				{activeGroup.intro &&
					<div className={clsx("cmplz-settings-block-intro", introCls)} dangerouslySetInnerHTML={{__html: DOMPurify.sanitize( activeGroup.intro ) } }></div>} {/* nosemgrep: react-dangerouslysetinnerhtml */}
				{Field && selectedFields.map((field, i) =>
					<ErrorBoundary key={"field-"+field.id} fallback={"Could not load field "+field.id}><Field key={field.id} field={field} highLightField={highLightField} firstPremiumId={firstPremiumId} /></ErrorBoundary>)
				}
			</div>
			{ disabled && <div className={clsx("cmplz-locked", lockedScrimCls)}>
				<div className={clsx("cmplz-locked-overlay", lockedOverlayCls)}>
					<span className="cmplz-task-status cmplz-premium">{__("Upgrade","complianz-gdpr")}</span>
					<span>
						{ cmplz_settings.is_premium && <span>{msg}&nbsp;<a className="cmplz-locked-link" href={cmplz_settings.license_url}>{__("Check license", "complianz-gdpr")}</a></span>}
						{ !cmplz_settings.is_premium &&
							<Hyperlink
								target="_blank"
								rel="noopener noreferrer"
								text={msg}
								url={upgrade}
							/>
						}
					</span>
				</div>
			</div>}
			{ subMenu.id==='banner' && !bannerDataLoaded && <div className={clsx("cmplz-locked", lockedScrimCls)}>
				<div className={clsx("cmplz-locked-overlay", lockedOverlayCls)}></div>
			</div>}
		</div>
	)
}

export default SettingsGroup
