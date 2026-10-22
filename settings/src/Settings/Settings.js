import {in_array} from '../utils/lib';
import SettingsGroup from './SettingsGroup';
import Help from './Help';
import {useState, useEffect} from '@wordpress/element';
import {__} from '@wordpress/i18n';
import useFields from '../Settings/Fields/FieldsData';
import useMenu from '../Menu/MenuData';
import {UseMenuData} from './DocumentsMenu/MenuData';
import UseBannerData from './CookieBannerPreview/CookieBannerData';
import useProgress from '../Dashboard/Progress/ProgressData';
import SettingsPlaceholder from '../Placeholder/SettingsPlaceholder';
import ErrorBoundary from '../utils/ErrorBoundary';
import { clsx } from '../components/ui/cx';

// Settings-screen frame (T-046, DB-07/DB-08; Stage-H section 1b). The two-column body, the sticky save/nav
// footer (scroll-progress + upsell + buttons) and the help sidebar migrated off the retired
// assets/css/admin/modules/wizard.scss + wizard/notice.scss onto `tw-` utilities on the semantic `--cmplz-*`
// tokens WITH LITERAL FALLBACKS, reusing the gate-G3-approved sticky-footer look (shell-preview.html: footer
// bar bg = the literal #f8fafc, Save = accent-strong/text-on-accent primary, Back = tertiary, scroll-progress
// track = --cmplz-border / fill = --cmplz-accent, footer-container z = --cmplz-z-sticky). The body and help
// sidebar carry no `data-cmplz-ui` of their own — they are layout containers. After the ADR-001 MARKER MOVE
// (Stage H.5 Part 2) the app-root marker covers them safely: every composite body + the Panel.js accordion
// is migrated (H1–H9), and the help sidebar's sanitized notice HTML is folded into the design system
// (Help.js, this PR). Look comes from the `tw-` utilities (1,1,0 via the `important:` config).
// Legacy class hooks are kept. Logical utilities only (ADR-007). The footer buttons drop the WP-core
// `button`/`button-primary` classes (FR-020, matching components/ui/Button) and are fully tw-styled, so the
// relocated legacy `.button{display:flex}` rule (legacy-globals) no longer reaches them (its inline-block
// !important workaround is retired). frame.md §3 defaults: the "Get Premium" upsell CTA reuses the approved
// tertiary button look; the two-column body spans 2 at ≥1080px (`md`) and FULL WIDTH (span 4, the legacy
// `.cmplz-column-2` @media(max-width:1080){span 4}) below it — Page.js's content grid stays 4-col (its own
// single-column collapse is deferred), so the body wraps to its own full-width row at narrow widths.
const bodyCls = clsx(
	"tw-col-span-4 md:tw-col-span-2",
	// last card before the sticky footer merges into it: flat bottom corners + no gap + no bottom edge, so the
	// card + the bordered footer-container below read as one card (legacy nth-last-of-type(2) corner-merge).
	"[&>div:nth-last-of-type(2)]:tw-mb-0 [&>div:nth-last-of-type(2)]:tw-rounded-b-none [&>div:nth-last-of-type(2)]:tw-border-b-0"
);
// The footer-container carries the card's side + bottom edges + the bottom radius (block-axis / logical inline
// border utilities, RTL-safe — Header.js convention), so last-card + footer render as one bordered card; the
// footer bar inside supplies the content/footer divider via its top border.
const footerContainerCls = clsx(
	"tw-sticky tw-bottom-0 tw-z-[var(--cmplz-z-sticky,_20)] tw-flex tw-flex-col tw-overflow-hidden",
	"tw-border-s tw-border-e tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"tw-rounded-b-[var(--cmplz-radius,_12px)]"
);
const scrollTrackCls = "tw-flex tw-flex-col tw-w-full tw-h-[3px] tw-overflow-hidden tw-bg-[var(--cmplz-border,_#e2e8f0)]";
const scrollFillCls = "tw-h-full tw-bg-[var(--cmplz-accent,_#009fff)]";
const footerCls = clsx(
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-m,_16px)]",
	"tw-bg-[#f8fafc] tw-border-t tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"tw-py-[var(--cmplz-space-m,_16px)] tw-px-[var(--cmplz-space-l,_24px)] empty:tw-hidden"
);
const footerButtonsCls = "tw-flex tw-items-center tw-justify-end tw-gap-[var(--cmplz-space-s,_12px)] tw-ms-auto";
const primaryBtn = clsx(
	"tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-no-underline tw-border-0",
	"tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)] tw-font-semibold",
	"tw-py-[9px] tw-px-[20px] tw-rounded-[var(--cmplz-radius-field,_6px)]",
	"tw-transition-opacity tw-duration-[var(--cmplz-duration,_200ms)] tw-ease-[var(--cmplz-ease,_cubic-bezier(0.4,0,0.2,1))]",
	// shell used filter:brightness(1.08); the build has no filter utilities configured, so a robust opacity dim.
	"hover:tw-opacity-90",
	"[&[disabled]]:tw-opacity-60 [&[disabled]]:tw-cursor-not-allowed"
);
const tertiaryBtn = clsx(
	"tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-no-underline",
	"tw-bg-transparent tw-border tw-border-solid tw-border-[color:var(--cmplz-field-border,_#94a3b8)]",
	"tw-text-[color:var(--cmplz-text,_#0f172a)]",
	"tw-py-[9px] tw-px-[16px] tw-rounded-[var(--cmplz-radius-field,_6px)]"
);
const helpSidebarCls = "tw-flex tw-flex-wrap tw-content-start tw-gap-[var(--cmplz-space-xs,_8px)]";
const helpHeaderCls = "tw-w-full tw-flex tw-p-[10px]";
const helpControlCls = "tw-ms-auto tw-cursor-pointer";

/**
 * Renders the selected settings
 *
 */
const Settings = () => {
	const [noticesExpanded, setNoticesExpanded] = useState(true);
	const {progressLoaded, notices, fetchProgressData} = useProgress();
	const [isExploding, setIsExploding] = useState(false);
	const {saveBanner, setBannerDataLoaded} = UseBannerData();
	const {saveDocumentsMenu} = UseMenuData();
	const [CookieBannerPreview, setCookieBannerPreview] = useState(null);
	const [ConfettiExplosion, setConfettiExplosion] = useState(null);
	const [finishDisabled, setFinishDisabled] = useState(false);
	const {
		saving,
		fieldNotices,
		fieldNoticesLoaded,
		fieldsLoaded,
		saveFields,
		changedFields,
		fields,
		fetchAllFieldsCompleted,
		nextButtonDisabled,
		isNextButtonDisabled,
	} = useFields();
	const {
		subMenuLoaded,
		saveButtonsRequired,
		subMenu,
		selectedSubMenuItem,
		selectedMainMenuItem,
		nextMenuItem,
		previousMenuItem,
	} = useMenu();

	useEffect(() => {
		if (selectedMainMenuItem === 'banner' && !CookieBannerPreview) {
			import ( './CookieBannerPreview/CookieBannerPreview').then(
				({default: CookieBannerPreview}) => {
					setCookieBannerPreview(() => CookieBannerPreview);
				});
		}
	}, [selectedMainMenuItem]);
	useEffect(() => {
		if (selectedSubMenuItem === 'finish' && !ConfettiExplosion) {
			import ( "react-confetti-explosion").then(
				({default: ConfettiExplosion}) => {
					setConfettiExplosion(() => ConfettiExplosion);
				});
		}
	}, [selectedSubMenuItem]);

	useEffect(() => {
		//banner generation does a lot of fields updates, so it's not a good idea to hit the api each time.
		if (window.location.hash==='#banner') {
			return;
		}
        fetchAllFieldsCompleted();
	}, [changedFields]);

	useEffect(() => {
		//start an interval to check the disabled state of the next button
		//in some edge cases the button is not enabled after all fields have been entered.
		let interval = false;
		if ( nextButtonDisabled ) {
			interval = setInterval(() => {
				isNextButtonDisabled(fields, selectedSubMenuItem);
			}, 3000);
		} else {
			if (interval) {
				clearInterval(interval)
			}
		}

		//clear the interval
		return () => clearInterval(interval);
	},[nextButtonDisabled]);

	const toggleNotices = () => {
		setNoticesExpanded(!noticesExpanded);
	};

	const finish = async (e) => {
		e.preventDefault();
		if (nextButtonDisabled) return;
		setFinishDisabled(true);
		setIsExploding(true);
		saveData(true, false);
		//if the user switches back from the banner preview page, we need to reload the banner data.
		setFinishDisabled(false);
		window.location.hash = finishLink;
		setTimeout(async () => {
			setIsExploding(false);
        }, 2000);
	}

	const saveData = async (finish, showNotice) => {
		const regionIndex = changedFields.findIndex(field => {
			return field.id === 'regions';
		});
		if (regionIndex !== -1) {
			//if the region field is changed, we need to update the banner
			setBannerDataLoaded(false);
		}
		if (selectedSubMenuItem === 'document-menu') {
			await saveFields(selectedSubMenuItem, showNotice, false);
			await saveDocumentsMenu(changedFields.length > 0, showNotice);
		} else if (selectedMainMenuItem === 'banner') {
			await saveBanner(fields);
		} else {
			await saveFields(selectedSubMenuItem, showNotice, finish);
			//progress data is updated during saveFields
		}
	};

	const {menu_items: menuItems} = subMenu;
	if (!subMenuLoaded || !fieldsLoaded || menuItems.length === 0) {
		return (
			<SettingsPlaceholder/>
		);
	}
	let selectedFields = fields.filter(
		field => field.menu_id === selectedSubMenuItem);
	let groups = [];
	for (const selectedField of selectedFields) {
		if (!in_array(selectedField.group_id, groups)) {
			groups.push(selectedField.group_id);
		}
	}
	let helpNotices = [];

	//add some notices conditionally for fields
	if (fieldNoticesLoaded && typeof fieldNotices !== 'undefined') {
		for (const fieldNotice of fieldNotices) {
			let noticeFields = selectedFields.filter(
				field => fieldNotice.field_id === field.id);
			if (noticeFields.length > 0) {
				helpNotices.push(fieldNotice);
			}
		}
	}

	//convert progress notices to an array useful for the help blocks
	if (progressLoaded) {
		for (const notice of notices) {
			let noticeIsLinkedToField = false;

			//notices that are linked to a field. Only in case of warnings.
			if (notice.show_with_options && notice.status === 'warning') {
				let noticeFields = selectedFields.filter(
					field => notice.show_with_options.includes(field.id));
				noticeIsLinkedToField = noticeFields.length > 0;
			}
			//notices that are linked to a menu id.
			if (noticeIsLinkedToField || notice.menu_id === selectedSubMenuItem) {
				let help = {};
				help.title = notice.title ? notice.title : false;
				help.label = notice.label;
				help.id = notice.id;
				help.text = notice.message;
				help.url = notice.url;
				help.linked_field = notice.show_with_option;
				helpNotices.push(help);
			}
		}
	}

	//help items belonging to a field
	//if field is hidden, hide the notice as well
	for (const notice of selectedFields.filter(
		field => field.help && !field.conditionallyDisabled)) {
		let help = notice.help;
		//check if the notices array already includes this help item
		//this can happen in case of dynamic fields, like details per purpose
		let existingNotices = helpNotices.filter(
			noticeItem => noticeItem.id && noticeItem.id === help.id);
		if (existingNotices.length === 0) {
			helpNotices.push(notice.help);
		}
	}
	helpNotices = helpNotices.filter(
		notice => notice.label.toLowerCase() !== 'completed');
	let cookiebannerEnabled = fields.filter(
		field => field.id === 'enable_cookie_banner' && field.value ===
			'yes').length > 0;
	let continueLink = nextButtonDisabled ? `#${selectedMainMenuItem}/${selectedSubMenuItem}` : nextMenuItem;
	let finishLink = cookiebannerEnabled ? `#banner` : `#dashboard`;
	finishLink = nextButtonDisabled ? `#${selectedMainMenuItem}/${selectedSubMenuItem}` : finishLink;
	return (
		<>
			{isExploding && ConfettiExplosion && <div className="cmplz-confetti tw-absolute tw-start-1/2"><ConfettiExplosion zIndex={999999}/></div>}
			<div className={clsx("cmplz-wizard-settings cmplz-column-2", bodyCls)}>
				{groups.map((group, i) =>
					<ErrorBoundary key={"groups-"+i} fallback={"Could not load: Banner preview"}>
						<SettingsGroup key={i} index={i} group={group} fields={selectedFields}/>
					</ErrorBoundary>)
				}
				<div className={clsx("cmplz-grid-item-footer-container", footerContainerCls)}>
					<ScrollProgress/>
					<div className={clsx("cmplz-grid-item-footer", footerCls)}>
						{selectedMainMenuItem !== 'wizard' &&
							<div className="cmplz-grid-item-footer-upsell-bar">
								{ !cmplz_settings.is_premium &&
									<a className={tertiaryBtn}
										 href="https://complianz.io/pricing/"
										 target="_blank" rel="noopener noreferrer">{__(
										'Get Premium', 'complianz-gdpr')}</a>}
							</div>}
						<div className={clsx('cmplz-grid-item-footer-buttons', footerButtonsCls)}>
							{/*This will be shown only if current step is not the first one*/}
							{previousMenuItem !== '#' &&
								<a className={tertiaryBtn} href={previousMenuItem} onClick={() => {
									window.scrollTo({
										top: 0,
										behavior: 'smooth',
									});
								}}>
									{__('Previous', 'complianz-gdpr')}
								</a>
							}
							{saveButtonsRequired() &&
								<button
									className={tertiaryBtn}
									onClick={(e) => saveData(false, true)}>
									{__('Save', 'complianz-gdpr')}
								</button>
							}
							{/*This will be shown only if current step is not the last one*/}
							{selectedSubMenuItem !== menuItems[menuItems.length - 1].id &&
								<>
									{saveButtonsRequired() &&
										<a disabled={nextButtonDisabled}
											 className={primaryBtn} href={continueLink}
											 onClick={(e) => {
												 saveData(false, false)
												 // smooth scroll to top
												 window.scrollTo({
													 top: 0,
													 behavior: 'smooth',
												 });
											 }}>
											{__('Save and Continue', 'complianz-gdpr')}
										</a>
									}
									{!saveButtonsRequired() &&
										<a className={primaryBtn} href={continueLink}
											 onClick={(e) => saveData(false, false)}>
											{__('Continue', 'complianz-gdpr')}
										</a>
									}
								</>
							}

							{selectedMainMenuItem === 'wizard' && selectedSubMenuItem ===
								menuItems[menuItems.length - 1].id &&
								<a disabled={nextButtonDisabled || saving || finishDisabled }
									 className={primaryBtn} href="#"
									 onClick={(e) => finish(e)}>
									{__('Finish', 'complianz-gdpr')}
								</a>
							}
						</div>
					</div>
				</div>
			</div>
			<div className={clsx("cmplz-wizard-help", helpSidebarCls)}>
				<div className={clsx("cmplz-help-header", helpHeaderCls)}>
					<h3 className="cmplz-h4">
						{__('Notifications', 'complianz-gdpr')}
					</h3>
					<div className={clsx("cmplz-help-control", helpControlCls)} onClick={() => toggleNotices()}>
						{!noticesExpanded && __('Expand all', 'complianz-gdpr')}
						{noticesExpanded && __('Collapse all', 'complianz-gdpr')}
					</div>
				</div>
				{helpNotices.map(
					(field, i) => <ErrorBoundary key={"field-"+i} fallback={"Could not load: Help notices"}><Help key={i} noticesExpanded={noticesExpanded} help={field} fieldId={field.id}/></ErrorBoundary>)}
			</div>
			{selectedMainMenuItem === 'banner' && CookieBannerPreview &&
				<ErrorBoundary fallback={"Could not load: Banner preview"}><CookieBannerPreview/></ErrorBoundary>}
		</>
	);

};
export default Settings;

export const ScrollProgress = () => {
	// calculate the scroll progress
	const [scrollProgress, setScrollProgress] = useState(0);
	useEffect(() => {
		window.addEventListener('scroll', () => {
			let scrollableHeight = document.documentElement.scrollHeight -
				document.documentElement.clientHeight;
			let scrollProgressPercentage = Math.round(
				(window.scrollY / scrollableHeight) * 100);
			// start at 5% and end at 100%
			scrollProgressPercentage = Math.max(5, scrollProgressPercentage);
			setScrollProgress(scrollProgressPercentage);
		});
	}, []);

	// if you can't scroll return null
	if (document.documentElement.scrollHeight <=
		document.documentElement.clientHeight) {
		return null;
	}
	return (
		// add width to span (inline width beats tw-; kept, per ADR gotcha)
		<span className={clsx('cmplz-grid-item-footer-scroll-progress-container', scrollTrackCls)}>
			<span className={clsx('cmplz-grid-item-footer-scroll-progress', scrollFillCls)}
						style={{width: scrollProgress + '%'}}>{scrollProgress}%</span>
		</span>
	);
};
