import useFields from '../Fields/FieldsData';
import UseBannerData from './CookieBannerData';
import {__} from '@wordpress/i18n';
import Icon from '../../utils/Icon';
import { clsx } from '../../components/ui/cx';

// Banner preview CHROME (T-050, DB-07, C-2, ADR-005/ADR-008), migrated off the legacy
// `.cmplz-cookiebanner-preview-controls` block (was relocated into legacy-globals.scss at T-046, now
// deleted) onto `tw-` utilities + the semantic `--cmplz-*` tokens with LITERAL FALLBACKS, matching
// docs/specs/001-settings-ui-redesign/design/consent-banner-preview.html (the approved segmented switcher).
// It renders inside the Menu island (`data-cmplz-ui` on the Menu root), so its former
// `data-cmplz-isolate="banner-controls"` shield (Menu.js) is removed: the `tw-` utilities (specificity
// 1,1,0 via the `important:` config) beat the base reset, so the buttons keep their look. ZERO new tokens.
//
// The two groups (A/B banners + consent types) are segmented controls: resting = surface + border; hover =
// surface-sunken; active = the accent-subtle tint + accent-on-subtle text (the section-1 AA-safe pairing) +
// semibold; loading = muted + the loading Icon. The behavior is unchanged — handleConsentTypeChange /
// handleBannerChange still gate on `cssLoading`. Legacy class hooks (`cmplz-cookiebanner-preview-controls`,
// `-buttons`) are kept as DOM hooks. Logical CSS only (ADR-007).

const CONTROLS = clsx(
	'cmplz-cookiebanner-preview-controls',
	'tw-flex tw-flex-wrap tw-mt-[var(--cmplz-space-l,_24px)]'
);
const HEADING = clsx(
	'tw-w-full tw-mt-[var(--cmplz-space-m,_16px)] tw-mb-[var(--cmplz-space-xs,_8px)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-font-bold tw-uppercase tw-tracking-[0.04em]',
	'tw-text-[color:var(--cmplz-text-muted,_#475569)]'
);
const BUTTON_GROUP = clsx(
	'cmplz-cookiebanner-preview-controls-buttons',
	'tw-w-full tw-flex tw-flex-wrap tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)]'
);
// Segmented button: structural base (no colours — the state variants own bg/text/border so there is no
// arbitrary-value conflict), then one mutually-exclusive state variant.
const SEG_BASE = clsx(
	'tw-border tw-py-[7px] tw-px-[14px] tw-rounded-[var(--cmplz-radius-field,_6px)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]',
	'tw-transition-colors tw-duration-[var(--cmplz-duration,_200ms)] tw-ease-[var(--cmplz-ease,_cubic-bezier(0.4,0,0.2,1))]'
);
const SEG_INACTIVE = clsx(
	'inactive tw-cursor-pointer',
	'tw-bg-[var(--cmplz-surface,_#ffffff)] tw-text-[color:var(--cmplz-text,_#0f172a)]',
	'tw-border-[color:var(--cmplz-border,_#e2e8f0)]',
	'hover:tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]'
);
const SEG_ACTIVE = clsx(
	'active tw-font-semibold',
	'tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)]',
	'tw-border-[color:var(--cmplz-accent-subtle,_#e3f2ff)]'
);
const SEG_LOADING = clsx(
	'loading tw-cursor-default tw-opacity-70',
	'tw-bg-[var(--cmplz-surface,_#ffffff)] tw-text-[color:var(--cmplz-text-muted,_#475569)]',
	'tw-border-[color:var(--cmplz-border,_#e2e8f0)]'
);

/**
 * Switch between banner variations
 */

const CookieBannerControls = () => {
	const {getFieldValue} = useFields();
	const {
		selectedBannerId,
		setBannerId,
		banners,
		consentType,
		consentTypes,
		setConsentType,
		cssLoading,
		bannerDataLoaded,
	} = UseBannerData();

	let options = [];
	for (var key in consentTypes) {
		if (consentTypes.hasOwnProperty(key)) {
			let item = {};
			item.label = consentTypes[key];
			item.value = key;
			options.push(item);
		}
	}
	const getConsentTypeClass = (option) => {
		if (cssLoading || !bannerDataLoaded) {
			return clsx(SEG_BASE, SEG_LOADING);
		}
		return clsx(SEG_BASE, option.value === consentType ? SEG_ACTIVE : SEG_INACTIVE);
	};

	const handleConsentTypeChange = (value) => {
		if (cssLoading) {
			return;
		}
		setConsentType(value);
	};

	const handleBannerChange = (value) => {
		if (cssLoading) {
			return;
		}
		setBannerId(value);
	};

	const ab_testing_enabled = getFieldValue('a_b_testing_buttons') == true;
	return (
		<div className={CONTROLS}>
			{ab_testing_enabled && banners.length > 1 &&
				<h6 className={HEADING}>{__('Switch between banners', 'complianz-gdpr')}</h6>}
			<div className={BUTTON_GROUP}>
				{ab_testing_enabled && banners.length > 1 && banners.map((banner, i) =>
					<button key={i} className={clsx(SEG_BASE, banner.ID === selectedBannerId
						? SEG_ACTIVE
						: SEG_INACTIVE)} onClick={() => handleBannerChange(banner.ID)}>
						{banner.title !== '' ? banner.title :  __('Banner', 'complianz-gdpr') + ' ' + (i + 1)}
					</button>,
				)}
			</div>

			{options.length > 1 &&
				<h6 className={HEADING}>{__('Edit consent types', 'complianz-gdpr')}</h6>}
				<div className={BUTTON_GROUP}>
					{options.length > 1 && options.map((option, i) =>
						<button key={i} className={getConsentTypeClass(option)}
										onClick={() => handleConsentTypeChange(option.value)}>
							{option.label}
						</button>,
					)}
					{cssLoading && <Icon name="loading"/>}
				</div>
		</div>
	);
};
export default CookieBannerControls;
