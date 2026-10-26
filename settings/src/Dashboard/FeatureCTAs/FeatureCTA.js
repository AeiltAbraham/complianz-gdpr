import { clsx } from "../../components/ui/cx";
import { primaryLinkButtonCls, secondaryLinkButtonCls } from "../../components/ui/downloadLink";

/**
 * FeatureCTA — one dashboard feature-promo card (design iteration, 2026-10-26).
 *
 * Config-driven: GridBlock passes the block, and the card renders from `block.cta`
 * ({ icon, tint, primary, title, desc, button, href } — see settings/config/blocks.php).
 * Renders only the card INNARDS; the card chrome (surface/border/shadow/padding) comes from
 * GridBlock's `variant: 'default'`. Built on the semantic `--cmplz-*` tokens with literal
 * fallbacks (ADR-013 complete-literal `tw-` classes, ADR-007 logical utilities); markerless.
 * The action is a button-styled external anchor (the dashboard link-button pattern).
 */

const ICONS = {
	crown: (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
			<path d="M5 21h14" />
		</svg>
	),
	tcf: (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	),
	globe: (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
			<path d="M2 12h20" />
		</svg>
	),
};

const BADGE = {
	"accent-filled": "tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)]",
	"accent":        "tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]",
	"success":       "tw-bg-[var(--cmplz-success-surface,_#e9f6ec)] tw-text-[color:var(--cmplz-success,_#1f7a34)]",
};

const badgeBase = "tw-flex tw-items-center tw-justify-center tw-w-[44px] tw-h-[44px] tw-shrink-0 tw-rounded-[var(--cmplz-radius-s,_8px)]";
const titleCls  = "tw-m-0 tw-text-[15px] tw-font-semibold tw-leading-[1.4] tw-text-[color:var(--cmplz-text,_#0f172a)]";
const descCls   = "tw-m-0 tw-text-[14px] tw-leading-[1.5] tw-text-[color:var(--cmplz-text-muted,_#475569)]";

const FeatureCTA = ( { block } ) => {
	const c = ( block && block.cta ) || {};
	return (
		<div className="tw-flex tw-h-full tw-flex-col tw-items-start tw-gap-[var(--cmplz-space-m,_16px)]">
			<div className={clsx( badgeBase, BADGE[c.tint] || BADGE.accent )}>{ ICONS[c.icon] || ICONS.crown }</div>
			<div className="tw-flex tw-grow tw-flex-col tw-gap-[var(--cmplz-space-2xs,_4px)]">
				<h4 className={titleCls}>{ c.title }</h4>
				<p className={descCls}>{ c.desc }</p>
			</div>
			<a href={c.href} target="_blank" rel="noopener noreferrer" className={clsx( c.primary ? primaryLinkButtonCls : secondaryLinkButtonCls, "tw-self-start" )}>
				{ c.button }
			</a>
		</div>
	);
};

export default FeatureCTA;
