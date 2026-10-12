import { __ } from '@wordpress/i18n';

// Premium upsell label (T-045, DB-07). Migrated off assets/css/admin/modules/wizard/premium-fields.scss
// (`.cmplz-label-container .cmplz-premium a`) onto `tw-` utilities on the semantic `--cmplz-*` tokens with
// LITERAL FALLBACKS — this sits inside the un-marked LabelWrapper container, so no `data-cmplz-ui` here
// (marker discipline); the `tw-` utilities win via the `important:` config, not the marker. The legacy
// `cmplz-premium` class hook is kept. The pill is restyled to the approved design (wizard-fields.md §4):
// the `--cmplz-accent-subtle` tint with `--cmplz-accent-on-subtle` text (a darker blue than
// `--cmplz-accent-strong` so the ~11px pill clears WCAG AA on the tint — T-045 review fix), replacing #ecf4ed/#333.
/**
 * Render a premium tag
 */
const upsellCls =
	"tw-no-underline tw-font-semibold tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)] " +
	"tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] " +
	"tw-rounded-[999px] tw-py-[2px] tw-px-[10px]";

const Premium = ({premium, id}) => {

	if ( cmplz_settings.is_premium || !premium ) {
		 return null
	}

	const fallbackPremiumUrl = cmplz_settings.upgrade_link || 'https://complianz.io/pricing/';
	const url = premium.url && premium.url.trim() !== '' ? premium.url : fallbackPremiumUrl;

	return (
			<div className="cmplz-premium tw-inline-flex">
				<a target="_blank" rel="noopener noreferrer" href={url} className={upsellCls}>{__("Upgrade", "complianz-gdpr")}</a>
			</div>
	);

}

export default Premium
