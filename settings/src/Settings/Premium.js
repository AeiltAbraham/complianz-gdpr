import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogClose,
} from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { primaryLinkButtonCls } from '../components/ui/downloadLink';
import { clsx } from '../components/ui/cx';

/**
 * Premium upsell (T-045, DB-07; design iteration 2026-10-26).
 *
 * Was a small text "Upgrade" pill that linked straight to pricing. Now a prominent accent CTA that
 * opens a modal (the shared Radix `Dialog`, so it is focus-trapped, Esc-dismissable and portaled)
 * explaining what actually changes in Premium. The copy is contextual by field `id` — the `regions`
 * privacy-law question gets the geo-targeting pitch — with a generic fallback for every other premium
 * field. Markerless: the trigger sits in the un-marked LabelWrapper (the `tw-` utilities win via the
 * `important:` config, not a marker); the modal content portals into the marked PortalContainer.
 */

const Globe = ( { s = 24 } ) => (
	<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="10" />
		<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
		<path d="M2 12h20" />
	</svg>
);
const Crown = ( { s = 24 } ) => (
	<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);
const Check = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M20 6 9 17l-5-5" />
	</svg>
);

// Contextual upsell content, keyed by field id. DEFAULT_UPSELL covers every other premium field.
const UPSELLS = {
	regions: {
		Icon: Globe,
		cta: __( 'Unlock geo-targeting', 'complianz-gdpr' ),
		title: __( 'Target every region automatically', 'complianz-gdpr' ),
		body: __( "On the free plan you pick one privacy law for all visitors. With Premium, Complianz detects each visitor's location and shows the right law and banner automatically — GDPR for the EU, CCPA for California, LGPD for Brazil, and more.", 'complianz-gdpr' ),
		benefits: [
			__( 'Region-specific privacy laws, applied automatically', 'complianz-gdpr' ),
			__( 'A matching consent banner for every region', 'complianz-gdpr' ),
			__( 'A/B testing & 250+ integrations', 'complianz-gdpr' ),
		],
	},
};
const DEFAULT_UPSELL = {
	Icon: Crown,
	cta: __( 'Upgrade to Pro', 'complianz-gdpr' ),
	title: __( 'Unlock this with Premium', 'complianz-gdpr' ),
	body: __( 'This option is part of Complianz Premium. Upgrade to unlock the full feature set for complete, worldwide compliance.', 'complianz-gdpr' ),
	benefits: [
		__( 'Geo-targeting & region-specific laws', 'complianz-gdpr' ),
		__( 'A/B testing & consent statistics', 'complianz-gdpr' ),
		__( '250+ integrations & premium support', 'complianz-gdpr' ),
	],
};

const triggerCls = clsx(
	'cmplz-premium-cta tw-inline-flex tw-items-center tw-gap-[6px] tw-cursor-pointer',
	'tw-m-0 tw-rounded-[999px] tw-border-0 tw-py-[5px] tw-px-[12px]',
	'tw-bg-[var(--cmplz-accent-strong,_#1e73be)] tw-text-[color:var(--cmplz-text-on-accent,_#ffffff)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-font-semibold tw-leading-none tw-no-underline',
	'tw-transition-all tw-duration-300 tw-ease-[ease] hover:tw-bg-[#17608f]',
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]'
);
const badgeCls = 'tw-flex tw-items-center tw-justify-center tw-w-[44px] tw-h-[44px] tw-shrink-0 tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]';

const Premium = ( { premium, id } ) => {
	if ( cmplz_settings.is_premium || ! premium ) {
		return null;
	}
	const fallbackPremiumUrl = cmplz_settings.upgrade_link || 'https://complianz.io/pricing/';
	const url = premium.url && premium.url.trim() !== '' ? premium.url : fallbackPremiumUrl;
	const u = UPSELLS[ id ] || DEFAULT_UPSELL;
	const Icon = u.Icon;

	return (
		<div className="cmplz-premium tw-inline-flex">
			<Dialog>
				<DialogTrigger asChild>
					<button type="button" className={triggerCls}><Icon s={14} />{ u.cta }</button>
				</DialogTrigger>
				<DialogContent size="md">
					<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m,_16px)]">
						<div className={badgeCls}><Icon s={24} /></div>
						<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-2xs,_4px)]">
							<DialogTitle>{ u.title }</DialogTitle>
							<DialogDescription>{ u.body }</DialogDescription>
						</div>
						<ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-p-0">
							{ u.benefits.map( ( b, i ) => (
								<li key={i} className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-text,_#0f172a)]">
									<span className="tw-text-[color:var(--cmplz-success,_#1f7a34)]"><Check /></span>
									<span>{ b }</span>
								</li>
							) ) }
						</ul>
						<div className="tw-mt-[var(--cmplz-space-xs,_8px)] tw-flex tw-justify-end tw-gap-[var(--cmplz-space-s,_12px)]">
							<DialogClose asChild><Button variant="tertiary">{ __( 'Maybe later', 'complianz-gdpr' ) }</Button></DialogClose>
							<a href={url} target="_blank" rel="noopener noreferrer" className={primaryLinkButtonCls}>{ __( 'Go Pro', 'complianz-gdpr' ) }</a>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Premium;
