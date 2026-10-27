import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogClose,
} from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { clsx } from "../../components/ui/cx";
import { primaryLinkButtonCls, secondaryLinkButtonCls } from "../../components/ui/downloadLink";

/**
 * FeatureCTA — one dashboard feature-promo card (design iteration, 2026-10-27).
 *
 * Config-driven: GridBlock passes the block, and the card renders from `block.cta`
 * ({ icon, tint, primary, title, desc, button, href } — see settings/config/blocks.php). The card's
 * button now opens a modal (the shared Radix `Dialog`: focus-trapped, Esc-dismissable, portaled)
 * rather than linking straight out — the modal pitches the feature and carries the Go-Pro link. The
 * richer modal copy (body + benefits) lives in MODALS, keyed by block id, so the lean card config in
 * PHP stays untouched. Built on the semantic `--cmplz-*` tokens with literal fallbacks (ADR-013
 * complete-literal `tw-` classes, ADR-007 logical utilities); markerless.
 */

const Crown = (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);
const Shield = (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
		<path d="m9 12 2 2 4-4" />
	</svg>
);
const Globe = (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="10" />
		<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
		<path d="M2 12h20" />
	</svg>
);
const Check = (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M20 6 9 17l-5-5" />
	</svg>
);
const ICONS = { crown: Crown, tcf: Shield, globe: Globe };

// Small metric icons (posts / last scan / last sync) for the premium card legend.
const DocIcon = (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
		<path d="M14 2v5h5" />
		<path d="M8 13h8" />
		<path d="M8 17h5" />
	</svg>
);
const ScanIcon = (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<circle cx="11" cy="11" r="7" />
		<path d="m21 21-4.3-4.3" />
	</svg>
);
const SyncIcon = (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
		<path d="M21 3v5h-5" />
		<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
		<path d="M3 21v-5h5" />
	</svg>
);

const BADGE = {
	"accent-filled": "tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)]",
	"accent":        "tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]",
	"success":       "tw-bg-[var(--cmplz-success-surface,_#e9f6ec)] tw-text-[color:var(--cmplz-success,_#1f7a34)]",
};

// Richer modal copy per dashboard CTA block id. The card title/icon/href come from block.cta.
const MODALS = {
	"cta-premium": {
		body: __( 'Complianz Premium unlocks everything you need for complete, worldwide compliance.', 'complianz-gdpr' ),
		benefits: [
			__( 'Geo-targeting & region-specific privacy laws', 'complianz-gdpr' ),
			__( 'A/B testing & consent statistics', 'complianz-gdpr' ),
			__( '250+ integrations & premium support', 'complianz-gdpr' ),
		],
	},
	"cta-tcf": {
		body: __( 'The IAB Transparency & Consent Framework v2.4 lets you collect consent and pass it to advertising vendors programmatically.', 'complianz-gdpr' ),
		benefits: [
			__( 'A fully IAB TCF v2.4-compliant consent banner', 'complianz-gdpr' ),
			__( 'Pass consent to 1,000+ registered vendors', 'complianz-gdpr' ),
			__( 'Required by most programmatic ad networks', 'complianz-gdpr' ),
		],
	},
	"cta-geolocation": {
		body: __( "Detect each visitor's location and show the consent banner and privacy law that matches their region automatically.", 'complianz-gdpr' ),
		benefits: [
			__( 'The right privacy law per region, automatically', 'complianz-gdpr' ),
			__( 'A matching consent banner for every region', 'complianz-gdpr' ),
			__( 'GDPR, CCPA, LGPD and more, out of the box', 'complianz-gdpr' ),
		],
	},
};

const InfoIcon = (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<circle cx="12" cy="12" r="10" />
		<path d="M12 16v-4" />
		<path d="M12 8h.01" />
	</svg>
);

// Usage metrics for the premium CTA card (showcase figures), stacked label/value in a panel. The
// posts counter is 'warning'-toned to flag it is near the free limit.
const METRICS = {
	"cta-premium": [
		{ icon: DocIcon, label: __( 'Posts', 'complianz-gdpr' ), value: '43/50', tone: 'warning' },
		{ icon: ScanIcon, label: __( 'Last scan', 'complianz-gdpr' ), value: __( 'Yesterday', 'complianz-gdpr' ), tone: null },
		{ icon: SyncIcon, label: __( 'Last sync', 'complianz-gdpr' ), value: __( 'Yesterday', 'complianz-gdpr' ), tone: null },
	],
};

const cardCls = clsx(
	"tw-flex tw-h-full tw-flex-col tw-items-start tw-gap-[var(--cmplz-space-m,_16px)]",
);
const badgeBase = "tw-flex tw-items-center tw-justify-center tw-w-[44px] tw-h-[44px] tw-shrink-0 tw-rounded-[var(--cmplz-radius-s,_8px)]";
const titleCls  = "tw-m-0 tw-text-[15px] tw-font-semibold tw-leading-[1.4] tw-text-[color:var(--cmplz-text,_#0f172a)]";
const descCls   = "tw-m-0 tw-text-[14px] tw-leading-[1.5] tw-text-[color:var(--cmplz-text-muted,_#475569)]";

const FeatureCTA = ( { block } ) => {
	const c = ( block && block.cta ) || {};
	const m = ( block && MODALS[ block.id ] ) || {};
	const metrics = ( block && METRICS[ block.id ] ) || null;
	const icon = ICONS[c.icon] || Crown;
	const badge = clsx( badgeBase, BADGE[c.tint] || BADGE.accent );

	return (
		<Dialog>
			<div className={cardCls}>
				<div className={badge}>{ icon }</div>
				<div className="tw-flex tw-w-full tw-grow tw-flex-col tw-gap-[var(--cmplz-space-2xs,_4px)]">
					<h4 className={titleCls}>{ c.title }</h4>
					<p className={descCls}>{ c.desc }</p>
					{ metrics && (
						<div className="tw-mt-[var(--cmplz-space-s,_12px)] tw-flex tw-flex-col tw-gap-[var(--cmplz-space-s,_12px)]">
							{ /* Usage panel — metrics stacked, label on the left, value on the right. */ }
							<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-p-[var(--cmplz-space-m,_16px)]">
								{ metrics.map( ( mt, i ) => (
									<div key={i} className="tw-flex tw-items-center tw-justify-between tw-gap-[var(--cmplz-space-m,_16px)] tw-text-[13px]">
										<span className="tw-flex tw-items-center tw-gap-[8px] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
											<span className={ mt.tone === 'warning' ? 'tw-shrink-0 tw-text-[#b45309]' : 'tw-shrink-0 tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]' }>{ mt.icon }</span>
											{ mt.label }
										</span>
										<span className={ mt.tone === 'warning' ? 'tw-font-semibold tw-text-[#b45309]' : 'tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]' }>{ mt.value }</span>
									</div>
								) ) }
							</div>
							{ /* Separate free-plan CTA notice. */ }
							<div className="tw-flex tw-items-start tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-px-[var(--cmplz-space-m,_16px)] tw-py-[var(--cmplz-space-s,_12px)] tw-text-[13px]">
								<span className="tw-mt-[1px] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]">{ InfoIcon }</span>
								<span className="tw-text-[color:var(--cmplz-text,_#0f172a)]">
									<strong>{ __( "You're on the Free plan.", 'complianz-gdpr' ) }</strong>{ ' ' }
									{ __( 'Services are limited above 50 posts — upgrade to keep them running.', 'complianz-gdpr' ) }
								</span>
							</div>
						</div>
					) }
				</div>
				<DialogTrigger asChild>
					<button type="button" className={clsx( c.primary ? primaryLinkButtonCls : secondaryLinkButtonCls, "tw-cursor-pointer tw-self-start" )}>
						{ c.button }
					</button>
				</DialogTrigger>
			</div>
			<DialogContent size="md">
				<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m,_16px)]">
					<div className={badge}>{ icon }</div>
					<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-2xs,_4px)]">
						<DialogTitle>{ c.title }</DialogTitle>
						<DialogDescription>{ m.body || c.desc }</DialogDescription>
					</div>
					{ m.benefits && (
						<ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-p-0">
							{ m.benefits.map( ( b, i ) => (
								<li key={i} className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-text,_#0f172a)]">
									<span className="tw-text-[color:var(--cmplz-success,_#1f7a34)]">{ Check }</span>
									<span>{ b }</span>
								</li>
							) ) }
						</ul>
					) }
					<div className="tw-mt-[var(--cmplz-space-xs,_8px)] tw-flex tw-justify-end tw-gap-[var(--cmplz-space-s,_12px)]">
						<DialogClose asChild><Button variant="tertiary">{ __( 'Maybe later', 'complianz-gdpr' ) }</Button></DialogClose>
						<a href={c.href} target="_blank" rel="noopener noreferrer" className={primaryLinkButtonCls}>{ __( 'Go Pro', 'complianz-gdpr' ) }</a>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FeatureCTA;
