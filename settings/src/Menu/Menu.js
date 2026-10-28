import MenuItem from './MenuItem';
import { __ } from '@wordpress/i18n';
import useMenu from "./MenuData";
import CookieBannerControls from "../Settings/CookieBannerPreview/CookieBannerControls";
import MenuPlaceholder from "../Placeholder/MenuPlaceholder";
import { clsx } from "../components/ui/cx";
// SHOWCASE-ONLY (design-dashboard-ctas): shared customer-state preview.
import { getCustomerState } from "../preview/customerState";

// The premium crown used elsewhere (Settings/Premium.js, Dashboard/FeatureCTAs, Onboarding/PremiumLicense) —
// lucide "crown", stroke/currentColor so it takes the parent text colour. Defined locally per the project's
// existing convention (each consumer declares its own).
const Crown = ( { s = 14 } ) => (
	<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--cmplz-premium-gold, #d4a017)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);

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
// SHOWCASE-ONLY (design-dashboard-ctas): a subtle premium upsell under the banner sub-menu for a previewed
// NEW / current-unauthenticated customer, pairing with the locked look sections above (MenuItem.js). Muted
// sunken card, crown glyph, one quiet accent link — understated. Inert without a state override. Remove with preview/.
const UPSELL_CARD = clsx(
	"cmplz-premium-menu-item",
	"tw-mt-[var(--cmplz-space-s)] tw-flex tw-flex-col tw-gap-[var(--cmplz-space-2xs)]",
	"tw-rounded-[var(--cmplz-radius-s)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]",
	"tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-p-[var(--cmplz-space-s)]"
);
const UPSELL_HEAD = clsx(
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs)]",
	"[&_svg]:tw-h-[14px] [&_svg]:tw-w-[14px]",
	"tw-font-semibold tw-text-[length:var(--cmplz-font-size-sm)] tw-text-[color:var(--cmplz-text,_#0f172a)]"
);
const UPSELL_TEXT = "tw-m-0 tw-text-[length:var(--cmplz-font-size-xs)] tw-text-[color:var(--cmplz-text-muted,_#475569)]";
const UPSELL_LINK = clsx(
	"tw-no-underline tw-font-semibold tw-text-[length:var(--cmplz-font-size-sm)]",
	"tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)]"
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
					{ selectedMainMenuItem === 'banner' && ( getCustomerState() === 'new' || getCustomerState() === 'unauthenticated' ) &&
						<div className={UPSELL_CARD}>
							<span className={UPSELL_HEAD}>
								<span className="tw-flex tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]"><Crown s={14} /></span>
								{__('Premium design', 'complianz-gdpr')}
							</span>
							<p className={UPSELL_TEXT}>
								{__('Unlock the full appearance, colors and text controls with a Premium license.', 'complianz-gdpr')}
							</p>
							<a href="https://complianz.io/pricing/" target="_blank" rel="noopener noreferrer" className={UPSELL_LINK}>
								{__('Upgrade to Premium', 'complianz-gdpr')} →
							</a>
						</div>
					}
					{selectedMainMenuItem==='banner' &&
						<CookieBannerControls />
					}
				</div>
		</div>
	)
}
export default Menu;
