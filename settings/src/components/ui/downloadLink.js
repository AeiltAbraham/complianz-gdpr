/**
 * downloadButtonCls — the secondary-Button look as a className string for a native `<a download>`.
 *
 * The document-tools export bodies (Stage H.6) offer their finished CSV/PDF as a real
 * `<a download href>` so the browser performs the download navigation; ui/Button renders a
 * `<button>` and cannot be an anchor (the T-030 "primitive can't be an anchor" note). This mirrors
 * ui/Button's `base` + `secondary` variant verbatim (white fill, blue text/border, grey hover) so the
 * two look identical, plus an explicit `tw-border-solid`: the links render in MARKERLESS chrome, so the
 * base-reset border-style (base.css B1, Preflight-off) never reaches them — the T-052 landmine — and the
 * variant colours resolve via the Bundle-A `#complianz-app` token broadening. One exported constant.
 */
import { clsx } from './cx';

export const downloadButtonCls = clsx(
	'tw-inline-flex tw-items-center tw-justify-center',
	'tw-m-0 tw-min-h-[30px] tw-py-0 tw-px-[10px]',
	'tw-rounded-[4px] tw-border tw-border-solid tw-text-center tw-no-underline',
	'tw-text-[0.8125rem] tw-font-normal',
	'tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-[ease]',
	'tw-bg-[#fff] tw-text-[#2271b1] tw-border-[#2271b1]',
	'hover:tw-bg-[#f7f7f7]',
	'focus:tw-outline-none',
	'focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]'
);
