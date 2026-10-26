import { __ } from '@wordpress/i18n';
import { clsx } from "../../components/ui/cx";
import { primaryLinkButtonCls, secondaryLinkButtonCls } from "../../components/ui/downloadLink";

/**
 * FeatureCTAs — the dashboard feature-promo row (design iteration, 2026-10-26).
 *
 * Replaces the former Tips & Tricks + Other Plugins blocks with one full-width row of three
 * calls-to-action, one per feature. Self-contained and config-free: three translatable CTAs,
 * rendered as C-2 cards on the semantic `--cmplz-*` tokens WITH LITERAL FALLBACKS (ADR-013
 * complete-literal `tw-` class strings, ADR-007 logical utilities). Markerless — the app-root
 * `data-cmplz-ui` covers it, and every control is self-sufficient. Each card's action is a
 * button-styled external anchor (the dashboard link-button pattern, H.9 / downloadLink.js).
 *
 * The icon badge varies per CTA: the Premium upsell gets a FILLED accent badge so it reads as the
 * hero; the others get a subtle tinted badge. Icons are inline Lucide glyphs coloured by the badge's
 * `currentColor`. To change the promoted features, edit the CTAS array below (name, copy, link).
 */

const Crown = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);
const Shield = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
		<path d="m9 12 2 2 4-4" />
	</svg>
);
const Accessibility = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="16" cy="4" r="1" />
		<path d="m18 19 1-7-6 1" />
		<path d="m5 8 3-3 5.5 3-2.36 3.5" />
		<path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
		<path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
	</svg>
);

// Badge tint per CTA. 'accent-filled' is the hero (Premium); the others are subtle tints.
const BADGE = {
	"accent-filled": "tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)]",
	"success":       "tw-bg-[var(--cmplz-success-surface,_#e9f6ec)] tw-text-[color:var(--cmplz-success,_#1f7a34)]",
	"accent":        "tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]",
};

const CTAS = [
	{
		icon: Crown, tint: "accent-filled", primary: true,
		title: __( "Go Premium", 'complianz-gdpr' ),
		desc:  __( "Unlock geo-targeting, A/B testing and 250+ integrations for worldwide compliance.", 'complianz-gdpr' ),
		cta:   __( "Upgrade", 'complianz-gdpr' ),
		href:  "https://complianz.io/pricing/",
	},
	{
		icon: Shield, tint: "success", primary: false,
		title: __( "Secure your site", 'complianz-gdpr' ),
		desc:  __( "Harden WordPress and detect vulnerabilities with Really Simple Security.", 'complianz-gdpr' ),
		cta:   __( "Learn more", 'complianz-gdpr' ),
		href:  "https://really-simple-ssl.com/",
	},
	{
		icon: Accessibility, tint: "accent", primary: false,
		title: __( "Accessibility Widget", 'complianz-gdpr' ),
		desc:  __( "Make your website WCAG 2.2 compliant with the iubenda Accessibility Widget.", 'complianz-gdpr' ),
		cta:   __( "Discover", 'complianz-gdpr' ),
		href:  "https://www.iubenda.com/en/accessibility",
	},
];

const cardCls = clsx(
	"tw-flex tw-flex-col tw-items-start tw-gap-[var(--cmplz-space-m,_16px)]",
	"tw-p-[var(--cmplz-space-l,_24px)]",
	"tw-bg-[var(--cmplz-surface,_#ffffff)]",
	"tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"tw-rounded-[var(--cmplz-radius,_12px)]",
	"tw-shadow-[0_1px_3px_0_rgba(15,23,42,0.10),_0_1px_2px_-1px_rgba(15,23,42,0.06)]",
	"tw-transition-all tw-duration-300 tw-ease-[ease]",
	"hover:tw-shadow-[0_6px_16px_-4px_rgba(15,23,42,0.14)]",
	"hover:tw-border-[color:var(--cmplz-accent-strong,_#1e73be)]",
);
const badgeBase = "tw-flex tw-items-center tw-justify-center tw-w-[44px] tw-h-[44px] tw-shrink-0 tw-rounded-[var(--cmplz-radius-s,_8px)]";
const titleCls  = "tw-m-0 tw-text-[15px] tw-font-semibold tw-leading-[1.4] tw-text-[color:var(--cmplz-text,_#0f172a)]";
const descCls   = "tw-m-0 tw-text-[14px] tw-leading-[1.5] tw-text-[color:var(--cmplz-text-muted,_#475569)]";

const FeatureCTAs = () => {
	return (
		<div className="cmplz-feature-ctas tw-grid tw-grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] tw-gap-[var(--cmplz-space-l,_24px)] tw-w-full">
			{ CTAS.map( ( c, i ) => {
				const Icon = c.icon;
				return (
					<div className={cardCls} key={i}>
						<div className={clsx( badgeBase, BADGE[c.tint] )}><Icon /></div>
						<div className="tw-flex tw-grow tw-flex-col tw-gap-[var(--cmplz-space-2xs,_4px)]">
							<h4 className={titleCls}>{ c.title }</h4>
							<p className={descCls}>{ c.desc }</p>
						</div>
						<a href={c.href} target="_blank" rel="noopener noreferrer" className={clsx( c.primary ? primaryLinkButtonCls : secondaryLinkButtonCls, "tw-self-start" )}>
							{ c.cta }
						</a>
					</div>
				);
			} ) }
		</div>
	);
};

export default FeatureCTAs;
