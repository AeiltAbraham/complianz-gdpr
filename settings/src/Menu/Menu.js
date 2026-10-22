import MenuItem from './MenuItem';
import { __ } from '@wordpress/i18n';
import useMenu from "./MenuData";
import CookieBannerControls from "../Settings/CookieBannerPreview/CookieBannerControls";
import MenuPlaceholder from "../Placeholder/MenuPlaceholder";
import { clsx } from "../components/ui/cx";

// Redesigned sidebar menu frame (T-040, DB-07, C-3, ADR-005), rebuilt on `tw-` utilities + the semantic
// `--cmplz-*` tokens, matching docs/specs/001-settings-ui-redesign/design/shell-preview.html. The active
// rules of assets/css/admin/modules/wizard/menu.scss (the shell's only SCSS consumer — grep-verified) are
// reproduced here and in MenuItem.js; the file is deleted and its @import dropped from admin.scss.
//
// The tokens (tokens.css, declared on `:is(#complianz,#complianz-portal) :where([data-cmplz-ui])`) resolve
// and the base reset reaches the migrated menu items from the app-root `#complianz-app[data-cmplz-ui]`
// marker (ADR-001 marker move landed in H.5 Part 2 — the former per-root `data-cmplz-ui` here is dropped);
// all the items' looks are restored by `tw-` utilities (Header/T-039 pattern). `<CookieBannerControls>`
// (shown only on the banner section) is now migrated to `tw-` utilities too (T-050), so its former
// `data-cmplz-isolate="banner-controls"` shield is REMOVED: the segmented switcher buttons get their look
// from `tw-` utilities (specificity 1,1,0 via the `important:` config), which beat the base reset.
//
// C-3: the navigation MODEL is unchanged — same structure, same per-section sub-menu, same hash routing;
// only the look changes. The legacy class hooks (`cmplz-wizard-menu`, `-header`, `-items`,
// `cmplz-premium-menu-item`) are kept. Logical CSS only (ADR-007). `#e9f5ff`/`#111827` are the preview's
// `--accent-wash` tint and the black CTA (neither has a token).
const MENU_ROOT = clsx(
	"cmplz-wizard-menu",
	"tw-flex tw-flex-col tw-gap-[2px] tw-h-fit tw-bg-transparent tw-p-[var(--cmplz-space-s)]"
);
const MENU_HEADER = clsx(
	"cmplz-wizard-menu-header",
	"tw-px-[var(--cmplz-space-s)] tw-py-[var(--cmplz-space-xs)]"
);
const MENU_TITLE = "tw-m-0 tw-text-[length:var(--cmplz-font-size-lg)]";
const MENU_ITEMS = clsx(
	"cmplz-wizard-menu-items",
	"tw-flex tw-flex-col tw-gap-[2px]"
);
const PREMIUM_ITEM = clsx(
	"cmplz-premium-menu-item",
	"tw-mt-[var(--cmplz-space-s)] tw-flex tw-bg-[#e9f5ff] tw-rounded-[var(--cmplz-radius-s)] tw-p-[var(--cmplz-space-s)]"
);
const PREMIUM_BUTTON = clsx(
	"tw-w-full tw-text-center tw-no-underline tw-font-semibold tw-text-[#fff] tw-bg-[#111827]",
	"tw-py-[8px] tw-px-[16px] tw-rounded-[var(--cmplz-radius-field)] tw-text-[length:var(--cmplz-font-size-sm)]"
);

/**
 * Menu block, rendering the entire menu
 */
 const Menu = () => {
	const {subMenu, hasPremiumItems, subMenuLoaded, selectedMainMenuItem} = useMenu();
	if ( !subMenuLoaded ) {
		return(
			<MenuPlaceholder />
		)
	}
	return (
		<div className={MENU_ROOT}>
			<div className={MENU_HEADER}>
				<h1 className={clsx("cmplz-h4", MENU_TITLE)}>{subMenu.title}</h1>
			</div>
				<div className={MENU_ITEMS}>
					{subMenu.menu_items.map((menuItem, i) => {
						return <MenuItem key={menuItem.id} index={i + 1} menuItem={menuItem} isMain={true} />;
					})
					}
					{ hasPremiumItems && cmplz_settings.is_premium &&
						<div className={PREMIUM_ITEM}><a target="_blank" rel="noopener noreferrer" href={cmplz_settings.upgrade_link} className={PREMIUM_BUTTON}>{__('Go Pro', 'complianz-gdpr')}</a></div>
					}
					{selectedMainMenuItem==='banner' &&
						<CookieBannerControls />
					}
				</div>
		</div>
	)
}
export default Menu;
