/**
 * Button-styled anchor class strings — the `ui/Button` look as a `className` for a native `<a>`.
 *
 * Some controls MUST stay real navigating anchors (a `download` link, an external upsell href, an
 * in-app `#wizard` hash link): `ui/Button` renders a `<button>` and cannot be an anchor (the T-030
 * "primitive can't be an anchor" note), and turning a navigating link into a `<button>` would lose its
 * href (Stage H.9 rule). These constants mirror `ui/Button`'s `base` + the matching variant verbatim so
 * the anchor looks identical, PLUS an explicit `tw-border-solid`: the links render in MARKERLESS chrome
 * (the document-tools export rows and the still-legacy Dashboard GridBlock), so the base-reset
 * border-style (base.css B1, Preflight-off) never reaches them — the T-052 landmine — while the literal
 * variant colours resolve via the Bundle-A `#complianz-app` token broadening.
 *
 * `secondaryLinkButtonCls` == the legacy `button button-default`/`button-secondary` look (white fill, blue
 * text/border); `primaryLinkButtonCls` == `button button-primary` (blue fill, white text). `downloadButtonCls`
 * is kept as an alias of the secondary look for its Stage-H.6 importers (the two export-download `<a>`s).
 */
import { clsx } from './cx';

// Shared, variant-independent anchor base — identical to ui/Button's `base` (minus the variant fill),
// plus `tw-border-solid` for the markerless border-style (see the file header).
const linkButtonBase = clsx(
	'tw-inline-flex tw-items-center tw-justify-center',
	'tw-m-0 tw-min-h-[30px] tw-py-0 tw-px-[10px]',
	'tw-rounded-[4px] tw-border tw-border-solid tw-text-center tw-no-underline',
	'tw-text-[0.8125rem] tw-font-normal',
	'tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-[ease]',
	'focus:tw-outline-none',
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]'
);

// secondary: white fill, blue text/border; hover greys the fill — mirrors ui/Button `secondary`.
export const secondaryLinkButtonCls = clsx(
	linkButtonBase,
	'tw-bg-[#fff] tw-text-[#2271b1] tw-border-[#2271b1]',
	'hover:tw-bg-[#f7f7f7]'
);

// primary: blue fill, white text; hover adds the focus-style ring — mirrors ui/Button `primary`.
export const primaryLinkButtonCls = clsx(
	linkButtonBase,
	'tw-bg-[#2271b1] tw-text-[#fff] tw-border-[#2271b1]',
	'hover:tw-shadow-[0_0_0_3px_rgba(34,113,177,0.3)]'
);

// Back-compat alias for the Stage-H.6 export-download anchors (ExportRecordsOfConsent / ExportDatarequests).
export const downloadButtonCls = secondaryLinkButtonCls;
