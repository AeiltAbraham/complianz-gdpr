import { __ } from '@wordpress/i18n';
import { clsx } from '../../components/ui/cx';

// Premium Support upsell (Tools > Support). Replaces the generic transparent locked-scrim + CTA overlay that
// SettingsGroup draws over premium groups with a clear upsell: crown, heading, the value hook, benefits and
// one unambiguous CTA. It renders DIRECTLY inside the Support settings card (no second bordered/tinted box —
// the group card IS the upsell), with only the content padding the card body expects. Built on the C-2 design
// system (semantic --cmplz-* tokens with literal fallbacks). Shown to free users in place of the (unusable)
// support form; premium users with an invalid license keep the original check-license scrim (see SettingsGroup).

// The premium crown + check used elsewhere (Settings/Premium.js, Dashboard/FeatureCTAs) — lucide, stroke/
// currentColor so they take the parent text colour. Defined locally per the project's existing convention.
const Crown = ( { s = 22 } ) => (
	<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--cmplz-premium-gold, #d4a017)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);
const Check = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M20 6 9 17l-5-5" />
	</svg>
);

const BENEFITS = [
	__( 'Priority support, direct from the Complianz team', 'complianz-gdpr' ),
	__( 'Faster response times when you need help most', 'complianz-gdpr' ),
	__( 'Hands-on help with setup, integrations and region-specific compliance', 'complianz-gdpr' ),
];

// No card chrome of its own (no border/tint/radius/own margin) — the surrounding Support settings card is the
// block. Just the body's inline padding + a column layout.
const blockCls = clsx(
	'cmplz-premium-support tw-flex tw-flex-col tw-items-start tw-gap-[var(--cmplz-space-s,_12px)]',
	'tw-px-[var(--cmplz-space-l,_24px)]'
);
// The Support card header carries the upsell's identity (crown + "Premium Support") via the exported heading
// below, so the body needs no badge/heading of its own — it opens straight on the value hook.
const headingInlineCls = clsx(
	'tw-inline-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)]',
	'[&_svg]:tw-shrink-0 [&_svg]:tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]'
);
const textCls = 'tw-m-0 tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-text-[color:var(--cmplz-text-muted,_#475569)]';
const listCls = 'tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)]';
const liCls = clsx(
	'tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-text-[color:var(--cmplz-text,_#0f172a)]',
	'[&_svg]:tw-shrink-0 [&_svg]:tw-text-[color:var(--cmplz-success,_#1f7a34)]'
);
const ctaCls = clsx(
	'cmplz-premium-support-cta tw-inline-flex tw-items-center tw-gap-[6px] tw-cursor-pointer tw-no-underline',
	'tw-mt-[var(--cmplz-space-xs,_8px)] tw-rounded-[var(--cmplz-radius-field,_6px)] tw-border-0',
	'tw-py-[10px] tw-px-[20px] tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-font-semibold tw-leading-none',
	'tw-transition-colors tw-duration-[var(--cmplz-duration,_200ms)] hover:tw-bg-[#17608f]',
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]'
);
const altCls = clsx(
	'tw-m-0 tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)] tw-text-[color:var(--cmplz-text-muted,_#475569)]',
	'[&_a]:tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)]'
);

// The Support settings-card header, replacing the plain "Support" title: the CTA's crown + "Premium Support".
export const PremiumSupportHeading = () => (
	<span className={ headingInlineCls }>
		<Crown s={ 18 } />{ __( 'Premium Support', 'complianz-gdpr' ) }
	</span>
);

const PremiumSupportBlock = ( { upgradeUrl = 'https://complianz.io/pricing/' } ) => (
	<div className={ blockCls }>
		<p className={ textCls }>
			{ __( 'Get priority support from the Complianz team with a Premium license — the fastest way to a reliable answer.', 'complianz-gdpr' ) }
		</p>
		<ul className={ listCls }>
			{ BENEFITS.map( ( benefit, i ) => (
				<li key={ i } className={ liCls }><Check />{ benefit }</li>
			) ) }
		</ul>
		<a className={ ctaCls } href={ upgradeUrl } target="_blank" rel="noopener noreferrer">
			<Crown s={ 16 } />{ __( 'Get Premium', 'complianz-gdpr' ) }
		</a>
		<p className={ altCls }>
			{ __( 'Just need a quick answer? Use our', 'complianz-gdpr' ) }{ ' ' }
			<a href="https://complianz.io/support" target="_blank" rel="noopener noreferrer">
				{ __( 'free online support form', 'complianz-gdpr' ) }
			</a>.
		</p>
	</div>
);

export default PremiumSupportBlock;
