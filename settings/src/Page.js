import Header from "./Header";
import getAnchor from "./utils/getAnchor";
import {useEffect,useState} from '@wordpress/element';

import useFields from "./Settings/Fields/FieldsData";
import useMenu from "./Menu/MenuData";
import Menu from "./Menu/Menu";
import PagePlaceholder from "./Placeholder/PagePlaceholder";
import MenuPlaceholder from "./Placeholder/MenuPlaceholder";
import SettingsPlaceholder from "./Placeholder/SettingsPlaceholder";
import UseSyncData from "./Settings/Cookiedatabase/SyncData";
import useProgress from "./Dashboard/Progress/ProgressData";
import PreloadFields from "./Settings/Fields/PreloadFields";
import {__, setLocaleData} from "@wordpress/i18n";
import ErrorBoundary from "./utils/ErrorBoundary";
import { clsx } from "./components/ui/cx";

// Redesigned grid FRAME (T-038, DB-07, ADR-005). The `.cmplz-content-area .cmplz-grid` container is
// restyled with `tw-` utilities (logical/block-axis only, ADR-007) matching
// docs/specs/001-settings-ui-redesign/design/shell-preview.html. The legacy `.cmplz-grid` CONTAINER
// rules and the whole `.cmplz-grid-item*` family moved out of layout.scss to legacy-globals.scss
// (imported last) so the still-legacy consumers keep them (PagePlaceholder's error/lock grid, the
// banner `.cmplz-grid` margin, and all Phase-4 screen content) — relocate, not orphan.
//
// NO `data-cmplz-ui` on this container (it would be wrong here): the grid WRAPS unmigrated Phase-4
// screen bodies, and the scoped base (base.css B1–B5, `[data-cmplz-ui] *`, specificity (1,0,0)) would
// then reach every legacy button/input/svg under it and strip its class-based styling (≤(0,N,0)) with
// no `tw-` utilities to restore it. The marker belongs on fully-migrated subtrees only (the migrated
// primitives inside keep their OWN `data-cmplz-ui`; Header/Menu get theirs in T-039/T-040); it moves to
// the app root in Phase 5 (ADR-001) once all bodies are migrated. tw- utilities still apply (scoped by
// `important: :is(#complianz,#complianz-portal)`, not the marker), so the frame gets the redesign look.
// Frame spacing references `--cmplz-space-l` with a `24px` fallback (= the token's value): no ancestor
// island defines the token for this container today, so it resolves to 24px now and auto-upgrades to the
// token when the Phase-5 marker move lands on the app root.
//
// DOM structure, the `cmplz-content-area cmplz-grid cmplz-<section>` class hooks and routing unchanged
// (C-3): the classes still drive the retained Phase-4 modules (CookieBannerPreview's
// `.cmplz-grid.cmplz-banner`, wizard/dashboard content), while the tw- utilities win on specificity
// (1,1,0 > the relocated legacy rules). Both grid tracks preserved; the preview's <1080px single-column
// collapse is deferred to Phase 4 (it needs the grid-item `grid-column` rules to migrate with it).
const CONTENT_AREA_FRAME = clsx(
	"tw-mx-auto tw-mt-[var(--cmplz-space-l,_24px)] tw-grid tw-gap-[var(--cmplz-space-l,_24px)] tw-pb-[var(--cmplz-space-l,_24px)]",
	"tw-max-w-[clamp(300px,calc(100%_-_var(--cmplz-space-l,_24px)*2),1600px)]"
);

const Page = () => {
	const {progressLoaded, fetchProgressData} = useProgress();
	const {error, fields, changedFields, fetchFieldsData, updateFieldsData, fieldsLoaded, lockedByUser} = useFields();
	const {fetchMenuData, selectedMainMenuItem, selectedSubMenuItem } = useMenu();
	const {loading, syncProgress, fetchSyncProgressData} = UseSyncData();
	const [Settings, setSettings] = useState(null);
	const [DashboardPage, setDashboardPage] = useState(null);
	const [Menu, setMenu] = useState(null);
	const [Tour, setTour] = useState(null);
	const [CookieScanControl, setCookieScanControl] = useState(null);
	const [ToastContainer, setToastContainer] = useState(null);
	const [NewOnboarding, setNewOnboarding] = useState(null);

	//load the chunk translations passed to us from the cmplz_settings object
	//only works in build mode, not in dev mode.
	useEffect(() => {
		cmplz_settings.json_translations.forEach( (translationsString) => {
			let translations = JSON.parse(translationsString);
			let localeData = translations.locale_data[ 'complianz-gdpr' ] || translations.locale_data.messages;
			localeData[""].domain = 'complianz-gdpr';
			setLocaleData( localeData, 'complianz-gdpr' );
		});
	},[]);

	let showTour = window.location.href.indexOf('tour') !==-1;
	useEffect ( () => {
		if (showTour && !Tour){
			import ("./Tour/Tour").then(({ default: Tour }) => {
				setTour(() => Tour);
			});
		}
	}, [showTour]);

	let showNewOnboarding = window.location.href.indexOf('websitescan') !== -1;
	useEffect ( () => {
		if (showNewOnboarding && !NewOnboarding){
			import ("./Onboarding/NewOnboarding").then(({ default: NewOnboarding }) => {
				setNewOnboarding(() => NewOnboarding);
			});
		}
	}, [showNewOnboarding]);

	useEffect( () => {
		if (selectedMainMenuItem !== 'dashboard' && !Settings && !Menu){
			import ("./Settings/Settings").then(({ default: Settings }) => {
				setSettings(() => Settings);
			});
			import ("./Menu/Menu").then(({ default: Menu }) => {
				setMenu(() => Menu);
			});
		}
		if (selectedMainMenuItem === 'dashboard' && !DashboardPage){
			import ( "./Dashboard/DashboardPage").then(({ default: DashboardPage }) => {
				setDashboardPage(() => DashboardPage);
			});
		}

	}, [selectedMainMenuItem]);

	useEffect( () => {
		if (!CookieScanControl) {
			import (  "./Settings/CookieScan/CookieScanControl").then(({default: CookieScanControl}) => {
				setCookieScanControl(() => CookieScanControl);
			});
		}
	}, []);

	// async load react-toastify
	useEffect(() => {
		import('react-toastify').then((module) => {
			const ToastContainer = module.ToastContainer;
			setToastContainer(() => ToastContainer);
		});
	}, []);

	useEffect(() => {
		window.addEventListener('hashchange', () => {
			fetchMenuData(fields);
		});
		if (fieldsLoaded) {
			fetchMenuData(fields);
		}
	}, [fields]);

	useEffect( () => {
		let subMenuItem = getAnchor('menu');
		updateFieldsData(subMenuItem);
	}, [changedFields, selectedSubMenuItem] );

	useEffect( () => {
		const run = async () => {
			let subMenuItem = getAnchor('menu');
			await fetchFieldsData(subMenuItem);
			if (!progressLoaded) {
				await fetchProgressData()
			}
			if (!loading && syncProgress<100 && cmplz_settings.wsc_is_authenticated){
				fetchSyncProgressData();
			}
		}
		run();
	}, [] );

	if (error) {
		return (
			<PagePlaceholder error={error}></PagePlaceholder>
		)
	}
	if ( parseInt(lockedByUser) !== parseInt(cmplz_settings.user_id) ) {
		return (
			<PagePlaceholder lockedByUser={lockedByUser}></PagePlaceholder>
		)
	}

	return (
		<div className="cmplz-wrapper">
			<>
				<Header/>
				{ showTour && Tour && <Tour />}
				{ showNewOnboarding && NewOnboarding && <NewOnboarding/>}

				<div
					className={clsx(
						"cmplz-content-area cmplz-grid cmplz-" + selectedMainMenuItem,
						CONTENT_AREA_FRAME,
						selectedMainMenuItem === 'dashboard'
							? "tw-grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]"
							: "tw-grid-cols-[28ch_1fr_1fr_1fr]",
						// Banner save-clearance (T-050, ADR-008): replaces the legacy
						// `.cmplz-grid.cmplz-banner { margin-bottom: 200px }` (CookieBannerPreview.scss, now
						// deleted) so the Save button clears a bottom-positioned preview banner. Block-axis
						// margin, RTL-safe.
						selectedMainMenuItem === 'banner' && "tw-mb-[200px]"
					)}
				>
					{ selectedMainMenuItem !== 'dashboard' &&
						<>
							{Menu && <Menu/>}
							{!Menu && <MenuPlaceholder />}
							{Settings && <ErrorBoundary fallback={"Could not load:"+' Settings page'}><Settings /></ErrorBoundary>}
							{!Settings && <SettingsPlaceholder />}
						</>
					}
					{ selectedMainMenuItem === 'dashboard' && DashboardPage &&
						<DashboardPage/>
					}
				</div>
				{ToastContainer && (
					<div data-cmplz-isolate="toastify">
						<ToastContainer
						position="bottom-right"
						autoClose={2000}
						limit={3}
						hideProgressBar
						newestOnTop
						closeOnClick
						pauseOnFocusLoss
						pauseOnHover
						theme="light"
					/>
					</div>
				)}
			</>
			{/*{we want to run the scan also on the background }*/}
			{selectedSubMenuItem!=='cookie-scan' && CookieScanControl && <CookieScanControl/> }
			{ selectedMainMenuItem === 'dashboard' &&
				<PreloadFields/>
			}
		</div>
	);
}
export default Page
