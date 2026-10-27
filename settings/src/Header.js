import { __ } from '@wordpress/i18n';
import useMenu from "./Menu/MenuData";
import {useEffect} from "@wordpress/element";
import { clsx } from "./components/ui/cx";

// Redesigned shell header (T-039, DB-07, ADR-005), rebuilt on `tw-` utilities + the semantic
// `--cmplz-*` tokens, matching docs/specs/001-settings-ui-redesign/design/shell-preview.html. The
// legacy header rules left over in assets/css/admin/layout.scss (emptied + deleted here) are
// reproduced below. The error/lock shell (Placeholder/PagePlaceholder.js) is the only other consumer
// of the `.cmplz-header-container` / `.cmplz-settings-header` / logo chrome; Bundle D B2 MIGRATED those
// into PagePlaceholder.js as `tw-` utilities (dropping the legacy class hooks) — so they no longer live
// in legacy-globals.scss either, and Header no longer shares them with any consumer.
//
// The base reset (base.css B1-B5, `[data-cmplz-ui] *`) and the tokens (tokens.css, declared on
// `:is(#complianz,#complianz-portal) :where([data-cmplz-ui])`) reach Header's elements from the app-root
// `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move landed in H.5 Part 2 — the former per-root
// `data-cmplz-ui` here is dropped). Header is a fully-migrated leaf (logo, section tabs, Documentation /
// Go-Pro links, all restyled with `tw-` utilities), so the reset only hits its own elements, which the
// utilities restore. Tokens resolve here so `var(--cmplz-*)` is used WITHOUT a literal fallback.
//
// C-3: the navigation MODEL is unchanged — same hash routing (`#<id>`), same links/handlers, same
// per-section active state (now also exposed as `aria-current="page"` for WCAG 2.2 AA). This is a
// visual restyle only; the legacy class hooks are dropped (no retained module targets them — grep
// confirmed; PagePlaceholder carries its own copy). Logical CSS only (ADR-007).
// Borders use the BLOCK-axis utilities (`border-b*`): the block-end edge does not flip under RTL
// (ADR-007 governs the INLINE axis, left/right), and it is the standard equivalent of the preview's
// `border-block-end`. Border STYLE is `solid` from base.css B1 on the app-root marker's descendants, and
// also set explicitly (`border-solid`) on the container root for self-sufficiency.
const CONTAINER = clsx(
	"tw-bg-[color:var(--cmplz-surface)]",
	"tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border)]"
);
const BAR = clsx(
	"tw-mx-auto tw-flex tw-flex-wrap tw-items-center",
	"tw-gap-[var(--cmplz-space-m)] tw-min-h-[70px] tw-px-[var(--cmplz-space-l)]",
	"tw-max-w-[clamp(300px,calc(100%_-_var(--cmplz-space-l)*2),1600px)]"
);
const LOGO = "tw-block tw-h-[26px] tw-w-auto";
const NAV_LIST = "tw-m-0 tw-p-0 tw-list-none tw-flex tw-gap-[2px]";
const NAV_LINK_BASE = clsx(
	"tw-inline-flex tw-items-center tw-h-[70px] tw-px-[var(--cmplz-space-m)] tw-no-underline",
	"tw-border-b-[3px] tw-border-solid",
	"tw-transition-colors tw-duration-[var(--cmplz-duration-slow)] tw-ease-[var(--cmplz-ease)]"
);
const NAV_LINK_ACTIVE = clsx(
	"tw-font-semibold tw-text-[color:var(--cmplz-accent-strong)]",
	"tw-border-[color:var(--cmplz-accent-strong)]"
);
const NAV_LINK_INACTIVE = clsx(
	"tw-font-medium tw-text-[color:var(--cmplz-text)] tw-border-[color:transparent]",
	"hover:tw-text-[color:var(--cmplz-accent-strong)]"
);
const RIGHT = "tw-ms-auto tw-flex tw-items-center tw-gap-[var(--cmplz-space-m)]";
const DOC_LINK = clsx(
	"tw-no-underline tw-font-medium tw-text-[color:var(--cmplz-accent-strong)]",
	"hover:tw-underline"
);
const CTA_BUTTON = clsx(
	"tw-no-underline tw-font-semibold tw-text-[#fff] tw-bg-[#111827]",
	"tw-py-[8px] tw-px-[16px] tw-rounded-[var(--cmplz-radius-field)]",
	"tw-text-[length:var(--cmplz-font-size-sm)]"
);

const Header = () => {
	const {menu, selectedMainMenuItem, fetchSelectedMainMenuItem, fetchMenuData} = useMenu();
	const plugin_url = cmplz_settings.plugin_url;
	useEffect( () => {
		fetchMenuData();
		fetchSelectedMainMenuItem();
	}, [] );
	let menuItems =Object.values(menu);
	menuItems = menuItems.filter( item => item!==null );
	return (
		<div className={CONTAINER}>
			<div className={BAR}>
				<img className={LOGO} src={plugin_url+"assets/images/cmplz-logo.svg"} alt="Complianz logo" />
				<nav aria-label={__("Sections", "complianz-gdpr")}>
					<ul className={NAV_LIST}>
						{menuItems.map((menu_item, i) => {
							const active = selectedMainMenuItem === menu_item.id;
							return (
								<li key={i}>
									<a
										className={clsx(NAV_LINK_BASE, active ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)}
										href={"#" + menu_item.id.toString()}
										aria-current={active ? "page" : undefined}
									>{menu_item.title}</a>
								</li>
							);
						})}
					</ul>
				</nav>
				<div className={RIGHT}>
					<a className={DOC_LINK} href="https://complianz.io/docs" target="_blank" rel="noopener noreferrer">{__("Documentation", "complianz-gdpr")}</a>
					<a className={DOC_LINK} href="https://www.iubenda.com/en/about-us" target="_blank" rel="noopener noreferrer">{__("About iubenda", "complianz-gdpr")}</a>
					{cmplz_settings.is_premium &&
						<a href="#tools/support"
						   className={CTA_BUTTON}
						   >{__("Support", "complianz-gdpr")}</a>
					}
					{!cmplz_settings.is_premium &&
						<a href={cmplz_settings.upgrade_link}
						   className={CTA_BUTTON}
						   target="_blank" rel="noopener noreferrer">{__("Go Pro", "complianz-gdpr")}</a>
					}
				</div>
			</div>
		</div>
	);
}
export default Header
