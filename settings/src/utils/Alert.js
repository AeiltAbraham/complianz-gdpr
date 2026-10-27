import Icon from './Icon';
import useFields from '../Settings/Fields/FieldsData';
import { clsx } from '../components/ui/cx';

/**
 * Generic alert/notice block component.
 *
 * Migrated to the C-2 system (Stage H.8). The legacy `.cmplz-wscscan-alert*` chrome (relocated to
 * legacy-globals.scss at H.5 from suggested-plugins.scss) is retired here — Alert was its only consumer
 * — and the block is rebuilt as the approved C-2 warning callout: a warning-tinted card
 * (`--cmplz-warning-surface` on a `--cmplz-warning` border), the same pattern WebSiteScanStatus uses
 * (WSC_ALERT_CLS). It carries no marker of its own (rendered in the CookieScan / Integrations /
 * CookieDatabaseSync bodies), so every colour/space is a `var(--cmplz-*, <literal>)` whose fallback
 * equals the token value; after the ADR-001 marker move (H.5 Part 2) the app-root marker resolves these
 * to the token (the fallback is a no-op). The border-style is pinned with `tw-border-solid` for
 * self-sufficiency (Preflight is off; the T-052 landmine), and the CTA button/anchor each carry
 * `tw-border-solid` too.
 *
 * Props:
 *   title      {string}   - Bold heading text
 *   subtitle   {string}   - Short sub-heading below title (optional)
 *   body       {string}   - Longer description text (optional)
 *   icon       {string}   - Icon name (default 'warning')
 *   iconColor  {string}   - Icon color token (default 'orange')
 *   ctaLabel   {string}   - CTA button/link label (optional)
 *   ctaUrl     {string}   - External URL → renders <a>; omit for button CTA
 *   ctaFieldId {string}   - utm_content value for getReferralUrl (optional)
 *   onCtaClick {Function} - Click handler → renders <button>; ignored when ctaUrl set
 * @param root0
 * @param root0.title
 * @param root0.subtitle
 * @param root0.body
 * @param root0.icon
 * @param root0.iconColor
 * @param root0.ctaLabel
 * @param root0.ctaUrl
 * @param root0.ctaFieldId
 * @param root0.onCtaClick
 */

// The callout card — C-2 card chrome (surface + slate border + soft shadow + radius), matching the
// dashboard CTA cards and the upgrade modal. The status colour lives in the icon badge, not the box
// (design iteration 2026-10-27, "Option B" — replacing the former warning-tinted Bootstrap-style alert).
const SHADOW = 'tw-shadow-[0_1px_3px_0_rgba(15,23,42,0.10)]';
const CARD_CLS =
	'tw-flex tw-flex-wrap tw-items-center tw-gap-[var(--cmplz-space-l,_24px)] tw-rounded-[var(--cmplz-radius,_12px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface,_#ffffff)] ' + SHADOW + ' tw-p-[var(--cmplz-space-l,_24px)]';

// Compact variant — tighter gap/padding + radius-s. Used for terse alerts (title + inline reason + CTA).
const CARD_COMPACT_CLS =
	'tw-flex tw-flex-wrap tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface,_#ffffff)] ' + SHADOW + ' tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)]';

// Icon badge — a small tinted square carrying the status colour (the only colour on the card). The tint
// follows iconColor (warning by default); the glyph uses a readable shade on that tint.
const BADGE_TINT = {
	blue: 'tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)]',
	'dark-blue': 'tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)]',
	green: 'tw-bg-[var(--cmplz-success-surface,_#e9f6ec)]',
};
const BADGE_BASE = 'tw-flex tw-items-center tw-justify-center tw-shrink-0 tw-rounded-[var(--cmplz-radius-s,_8px)]';

// CTA button/anchor — the secondary-button look (white fill, accent-strong text/border) as a complete
// literal class string (ADR-013), with `tw-border-solid` so it renders bordered in this markerless
// subtree. Reused for the onCtaClick <button> and the ctaUrl <a> so both read identically.
const CTA_CLS =
	'tw-inline-flex tw-items-center tw-justify-center tw-m-0 tw-min-h-[30px] tw-py-0 tw-px-[10px] tw-rounded-[4px] tw-border tw-border-solid tw-border-[#2271b1] tw-bg-[#fff] tw-text-[0.8125rem] tw-font-normal tw-text-[#2271b1] tw-no-underline tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-[ease] hover:tw-bg-[#f7f7f7] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]';

const Alert = ( {
	title,
	subtitle,
	body,
	icon = 'warning',
	iconColor = 'orange',
	ctaLabel,
	ctaUrl,
	ctaFieldId = '',
	onCtaClick,
	compact = false,
} ) => {
	const resolvedUrl = ctaUrl
		? useFields.getState().getReferralUrl( 'warnings', ctaFieldId, ctaUrl )
		: null;

	return (
		<div className={ compact ? CARD_COMPACT_CLS : CARD_CLS }>
			<span className={ clsx( BADGE_BASE, compact ? 'tw-w-[32px] tw-h-[32px]' : 'tw-w-[44px] tw-h-[44px]', BADGE_TINT[ iconColor ] || 'tw-bg-[var(--cmplz-warning-surface,_#fbf4da)]' ) }>
				<Icon name={ icon } color={ ( iconColor === 'orange' || iconColor === 'yellow' ) ? 'orange-strong' : iconColor } size={ compact ? 20 : 24 } />
			</span>
			<div className={ compact ? 'tw-flex tw-flex-wrap tw-items-baseline tw-gap-[8px] tw-me-auto' : 'tw-flex tw-flex-col' }>
				<div className="tw-text-[0.875rem] tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">
					{ title }
				</div>
				{ subtitle && (
					<div className={ compact ? 'tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]' : 'tw-my-[var(--cmplz-space-2xs,_4px)] tw-whitespace-nowrap tw-text-[0.75rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]' }>
						{ subtitle }
					</div>
				) }
			</div>
			{ ! compact && body && (
				<div className="tw-flex-1 tw-me-auto tw-min-w-[25ch] tw-text-[0.75rem] tw-leading-[1.6] tw-text-[color:var(--cmplz-text,_#0f172a)]">
					{ body }
				</div>
			) }
			{ ( resolvedUrl || onCtaClick ) && ctaLabel && (
				<div>
					{ resolvedUrl ? (
						<a
							href={ resolvedUrl }
							target="_blank"
							rel="noopener noreferrer"
							className={ CTA_CLS }
						>
							{ ctaLabel }
						</a>
					) : (
						<button
							type="button"
							onClick={ onCtaClick }
							className={ CTA_CLS }
						>
							{ ctaLabel }
						</button>
					) }
				</div>
			) }
		</div>
	);
};

export default Alert;
