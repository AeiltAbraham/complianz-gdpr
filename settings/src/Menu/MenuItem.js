import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import useMenu from './MenuData';
import useFields from '../Settings/Fields/FieldsData';
import Icon from '../utils/Icon';
import {UseDocumentsData} from "../Settings/CreateDocuments/DocumentsData";
import { clsx } from "../components/ui/cx";
// SHOWCASE-ONLY (design-dashboard-ctas): shared customer-state preview.
import { getCustomerState } from "../preview/customerState";

// The premium crown used elsewhere (Settings/Premium.js, Dashboard/FeatureCTAs, Onboarding/PremiumLicense) —
// lucide "crown", stroke/currentColor so it takes the parent text colour. Defined locally per the project's
// existing convention (each consumer declares its own).
const Crown = ( { s = 12 } ) => (
	<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);

// Redesigned sidebar menu item (T-040, DB-07, C-3, ADR-005), rebuilt on `tw-` utilities + the semantic
// `--cmplz-*` tokens, matching docs/specs/001-settings-ui-redesign/design/shell-preview.html (the
// per-section sub-menu with its step icons). The active rules in assets/css/admin/modules/wizard/menu.scss
// (the shell's only SCSS consumer — grep-verified) are reproduced here and the file is deleted.
//
// The marker (`data-cmplz-ui`) sits on the Menu ROOT (Menu.js); every item below is a migrated leaf
// styled with `tw-` utilities, which beat base.css B1-B5 ((1,1,0) via the `important: :is(#complianz,
// #complianz-portal)` config > the reset's (1,0,0)). The one exception is the step `<Icon>`: its SVG
// carries only a `height` presentation attribute (no width), so base B5 (`height:auto`) would balloon it
// (learnings 2026-10-11). `[&_svg]:` arbitrary variants pin an explicit 13px box that beats B5.
//
// C-3 — the navigation MODEL is unchanged: same hash routing and anchor formats (`getMenuAttributes`
// still emits `#<main>/<id>`), the same `selectedSubMenuItem`/active test (`isSelectedMenuItem`), the
// same `aria-current="step"` progress hook (wizard.spec reads it), the step-icon progress logic
// (`getIconProps`), and the legacy class hooks (`cmplz-wizard-menu-item`, `cmplz-main`/`cmplz-sub`,
// `cmplz-active`, `cmplz-featured`, `cmplz-premium`, `cmplz-submenu-items`, `cmplz-menu-item-featured-pill`)
// are all kept. Restyle only. Logical CSS only (ADR-007: `ps`/`pe`/`ms` on the inline axis; `py`/`my`/`mt`
// are block-axis and RTL-safe). The active main-item wash uses --cmplz-accent-subtle (T-045; replaced the
// hardcoded #e9f5ff when the token landed).
const ITEM_BASE = clsx(
	"cmplz-wizard-menu-item",
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs)] tw-no-underline",
	"tw-rounded-[var(--cmplz-radius-s)]",
	"tw-transition-colors tw-duration-[var(--cmplz-duration)] tw-ease-[var(--cmplz-ease)]"
);
const MAIN_BASE = clsx(
	"cmplz-main",
	"tw-px-[var(--cmplz-space-s)] tw-py-[var(--cmplz-space-xs)]",
	"tw-text-[length:var(--cmplz-font-size)] tw-font-bold"
);
const MAIN_INACTIVE = "tw-text-[color:var(--cmplz-text)]";
const MAIN_ACTIVE = clsx(
	"cmplz-active",
	"tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-shadow-[var(--cmplz-shadow-sm)]"
);
const SUB_BASE = clsx(
	"cmplz-sub",
	"tw-py-[6px] tw-ps-[var(--cmplz-space-m)] tw-pe-[var(--cmplz-space-s)]",
	"tw-text-[length:var(--cmplz-font-size-sm)]",
	"[&_svg]:tw-h-[13px] [&_svg]:tw-w-[13px] [&_svg]:tw-shrink-0"
);
const SUB_INACTIVE = "tw-text-[color:var(--cmplz-text-muted)]";
const SUB_ACTIVE = clsx(
	"cmplz-active",
	// SC-05 (REL-1): --cmplz-accent-strong (#1e73be) on the light menu surface is ~4.48:1 (below AA for
	// this 13px semibold text). --cmplz-accent-on-subtle (#17608f, the interactive-text-on-light-tint
	// token, matching MAIN_ACTIVE) clears AA (~6:1). Existing token, no new token.
	"tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)] tw-font-semibold"
);
const ITEM_HOVER = "hover:tw-bg-[color:var(--cmplz-surface)]";
const SUBMENU_ITEMS = clsx(
	"cmplz-submenu-items",
	"tw-flex tw-flex-col tw-gap-[1px] tw-my-[var(--cmplz-space-xs)]"
);
const FEATURED_PILL = clsx(
	"cmplz-menu-item-featured-pill",
	"tw-ms-auto tw-bg-[color:var(--cmplz-success)] tw-text-[color:var(--cmplz-text-on-accent)]",
	"tw-py-[1px] tw-px-[8px] tw-rounded-[999px] tw-text-[length:var(--cmplz-font-size-xs)] tw-font-bold"
);
// SHOWCASE-ONLY (design-dashboard-ctas): for a previewed NEW / current-unauthenticated customer, the Consent
// Banner's look sections read as premium-locked in the sub-menu — dimmed, non-navigable, with a crown (paired
// with the Menu.js upsell). Inert without a customer-state override, so the real menu is untouched. Remove with preview/.
const BANNER_LOCKED_IDS = [ 'appearance', 'colors', 'banner-texts' ];

const useMenuItem = (menuItem, isMain) => {
	const {hasMissingPages, fetchDocumentsData, documentsDataLoaded, documentsDataLoading} = UseDocumentsData();

	const {
		selectedSubMenuItem,
		selectedMainMenuItem,
	} = useMenu();
	const {
		fieldsLoaded,
		fields,
		notCompletedRequiredFields,
		fetchAllFieldsCompleted
	} = useFields();
	const [completed, setCompleted] = useState(false);

	useEffect (  () => {
		if (selectedSubMenuItem ==='create-documents' && !documentsDataLoaded && !documentsDataLoading) {
			fetchDocumentsData();
		}
	}, [menuItem.id])

	useEffect(() => {
		if ( fieldsLoaded && !isMain ) {
			if (menuItem.id ==='create-documents') {
				setCompleted(!hasMissingPages);
			} else {
				const notCompletedFieldsOnPage = notCompletedRequiredFields.filter(
					(field) => field.menu_id === menuItem.id
				);
				setCompleted(notCompletedFieldsOnPage.length === 0);
			}
		}
	}, [notCompletedRequiredFields, hasMissingPages, documentsDataLoaded, selectedSubMenuItem]);

	useEffect(() => {
		fetchAllFieldsCompleted();
	},[fields]);

	return {
		completed,
		selectedSubMenuItem,
		selectedMainMenuItem,
	};
};

const MenuItem = ({ index, menuItem, isMain }) => {
	const {
		completed,
		selectedSubMenuItem,
		selectedMainMenuItem,
	} = useMenuItem(menuItem, isMain);
	const menuIsSelected = isSelectedMenuItem(selectedSubMenuItem, menuItem);
	const { icon, iconColor } = getIconProps(menuIsSelected, completed);

	const attributes = getMenuAttributes(
		menuItem,
		selectedMainMenuItem,
		selectedSubMenuItem,
	);
	// SHOWCASE-ONLY: a previewed NEW or CURRENT-UNAUTHENTICATED customer sees the banner look sections as
	// premium-locked — dimmed, non-navigable (href + submenu dropped) and flagged with a crown. Inert
	// without a state override.
	const customerState = getCustomerState();
	const locked = isMain
		&& selectedMainMenuItem === 'banner'
		&& ( customerState === 'new' || customerState === 'unauthenticated' )
		&& BANNER_LOCKED_IDS.includes(menuItem.id);
	if (locked) {
		delete attributes.href;
		attributes['aria-disabled'] = true;
		attributes.tabIndex = -1;
	}
	const menuClass = getMenuClass(menuItem, isMain, menuIsSelected, attributes.href, locked);

	if (menuItem.visible
		//&& menuHasFields
		) {
		return (
			<>
				<a {...attributes} aria-current={menuItem.id === selectedSubMenuItem ? 'step' : undefined} className={menuClass}>
					{!isMain && <Icon name={icon} size={13} color={iconColor} />}
					{menuItem.title}
					{menuItem.featured && (
						<span className={FEATURED_PILL}>
              {__('New', 'complianz-gdpr')}
            </span>
					)}
					{locked && (
						<span className="tw-ms-auto tw-flex tw-text-[color:var(--cmplz-accent-strong,_#1e73be)] [&_svg]:tw-h-[12px] [&_svg]:tw-w-[12px]">
							<Crown s={12} />
						</span>
					)}
				</a>
				{menuItem.menu_items && menuIsSelected && !locked && (
					<div className={SUBMENU_ITEMS}>
						{menuItem.menu_items.map(
							(subMenuItem, i) =>
								subMenuItem.visible && (
									<MenuItem key={subMenuItem.id} menuItem={subMenuItem} />
								),
						)}
					</div>
				)}
			</>
		);
	} else {
		return null;
	}
};

/**
 * Utility function to check if selected menu item is a child of the current menu item
 * @param menuItem
 * @param selectedSubMenuItem
 * @returns {boolean}
 */
const isSelectedMenuItemChild = (menuItem, selectedSubMenuItem) => {
	if (Array.isArray(menuItem.menu_items)) {
		return menuItem.menu_items.filter((item) => item.id === selectedSubMenuItem).length > 0;
	}
	return false;
};

/**
 * Utility function to check if selected menu item is the current menu item or a child of the current menu item
 * @param selectedSubMenuItem
 * @param menuItem
 * @returns {boolean}
 */
const isSelectedMenuItem = (selectedSubMenuItem, menuItem) => {
	if (selectedSubMenuItem === menuItem.id) {
		return true;
	}
	if (menuItem.menu_items) {
		for (const item of menuItem.menu_items) {
			if (item.id === selectedSubMenuItem) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Utility function to get the menu item class: the `tw-` utility set for the item's variant
 * (main/sub × active/inactive, plus a hover tint only when the item is a real link) composed with
 * the preserved legacy class hooks (C-3). `cmplz-active`/`cmplz-main`/`cmplz-sub` are carried by the
 * variant constants; `cmplz-featured`/`cmplz-premium` are appended as behaviour-free DOM hooks.
 * @param menuItem
 * @param isMain
 * @param menuIsSelected
 * @param href the resolved link target (undefined when the item is the selected parent — no link)
 * @returns {string}
 */
const getMenuClass = (menuItem, isMain, menuIsSelected, href, locked) => {
	return clsx(
		ITEM_BASE,
		isMain ? MAIN_BASE : SUB_BASE,
		isMain
			? (menuIsSelected ? MAIN_ACTIVE : MAIN_INACTIVE)
			: (menuIsSelected ? SUB_ACTIVE : SUB_INACTIVE),
		!locked && href && ITEM_HOVER,
		// SHOWCASE: the disabled/locked look — dim + not-allowed, no hover affordance (see getMenuClass caller).
		locked && 'tw-opacity-60 tw-cursor-not-allowed cmplz-premium',
		menuItem.featured && 'cmplz-featured',
		menuItem.premium && !cmplz_settings.is_premium && 'cmplz-premium'
	);
};

/**
 * Utility function to get the icon props
 * @param menuIsSelected
 * @param completed
 * @returns {{icon: string, iconColor: string}}
 */
const getIconProps = (menuIsSelected, completed) => {
	let icon = 'circle';
	let iconColor = 'grey';

	if (completed) {
		icon = 'circle-check';
		iconColor = 'green';
	}

	if (menuIsSelected) {
		icon = 'bullet';
		iconColor = 'dark-blue';
	}

	if (menuIsSelected && completed) {
		icon = 'circle-check';
		iconColor = 'dark-blue';
	}

	return { icon, iconColor };
};

/**
 * Utility function to get the attributes for the menu item
 * @param menuItem
 * @param selectedMainMenuItem
 * @param selectedSubMenuItem
 * @returns {{}}
 */
const getMenuAttributes = (menuItem, selectedMainMenuItem, selectedSubMenuItem) => {
	const attributes = {};
	const selectedMenuItemIsChildOfThisItem = isSelectedMenuItemChild(
		menuItem,
		selectedSubMenuItem,
	);

	if (!menuItem.menu_items || !selectedMenuItemIsChildOfThisItem) {
		attributes.href = '#' + selectedMainMenuItem + '/' + menuItem.id;
	}

	return attributes;
};

export default MenuItem;
