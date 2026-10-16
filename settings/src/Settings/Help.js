import Icon from "../utils/Icon";
import { __ } from '@wordpress/i18n';
import DOMPurify from "dompurify";
import { clsx } from "../components/ui/cx";

// Help-notice accordion (T-046, DB-07/DB-08; Stage-H section 1b). Migrated off the retired
// assets/css/admin/modules/wizard/notice.scss onto `tw-` utilities on the semantic `--cmplz-*` tokens WITH
// LITERAL FALLBACKS. This notice carries NO `data-cmplz-ui` (ADR-001 marker discipline): it renders
// DOMPurify-sanitized notice HTML whose legacy element styling a scoped base reset would strip. The look
// comes from the `tw-` utilities (1,1,0 via the `important:` config). The legacy class hooks
// (cmplz-wizard-help-notice, cmplz-help-more-info, the dynamic cmplz-<label> suffix) are kept. The callout
// uses the approved status-surface tint fills (frame.md §3 default): --cmplz-accent-subtle for the
// default/info label, --cmplz-warning-surface for `warning`, with the default tint kept as the fallback for
// unknown labels. The chevron rotates on open via --cmplz-duration/--cmplz-ease (rotate is direction-neutral,
// ADR-007). The more-info link uses --cmplz-accent-on-subtle (the T-045 AA-safe interactive-text-on-tint
// token, ~5.9:1 on --cmplz-accent-subtle): --cmplz-accent-strong (#1e73be) on the accent-subtle tint is only
// 4.33:1 (< WCAG AA 4.5), which the data-tables section's axe gate on #integrations/integrations-services
// (which renders this callout) caught; accent-on-subtle clears AA on both the accent-subtle and warning tints.
const NOTICE_SHADOW = "tw-shadow-[var(--cmplz-shadow,_0_1px_3px_0_rgba(15,23,42,0.10),_0_1px_2px_-1px_rgba(15,23,42,0.06))]";
const noticeBox = clsx(
	"tw-w-full tw-h-fit tw-rounded-[var(--cmplz-radius-s,_8px)]",
	"tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]",
	NOTICE_SHADOW
);
const DEFAULT_TINT = "tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)]";
const WARNING_TINT = "tw-bg-[var(--cmplz-warning-surface,_#fbf4da)]";
const accordionCls = clsx(
	"[&_.cmplz-icon]:tw-transition-transform",
	"[&_.cmplz-icon]:tw-duration-[var(--cmplz-duration,_200ms)] [&_.cmplz-icon]:tw-ease-[var(--cmplz-ease,_cubic-bezier(0.4,0,0.2,1))]",
	"[&[open]_.cmplz-icon]:tw-rotate-180"
);
const summaryCls = clsx(
	"tw-grid tw-grid-cols-[1fr_auto] tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]",
	"tw-cursor-pointer tw-font-semibold tw-list-none tw-text-[length:var(--cmplz-font-size,_0.875rem)]",
	"[&::-webkit-details-marker]:tw-hidden",
	"tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)]"
);
const bodyCls = "tw-px-[var(--cmplz-space-m,_16px)] tw-pb-[var(--cmplz-space-s,_12px)]";
const moreInfoCls = clsx(
	"cmplz-help-more-info",
	"tw-flex tw-mt-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)] tw-pb-[var(--cmplz-space-s,_12px)]",
	"[&_a]:tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)]"
);
const titleOnlyCls = "tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)]";

/**
 * Render a help notice in the sidebar
 */
const Help = (props) => {
	let notice = props.help;
	if ( !notice.title ){
		notice.title = notice.text;
		notice.text = false;
	}
	let openStatus = props.noticesExpanded ? 'open' : '';
	//we can use notice.linked_field to create a visual link to the field.

	let target = notice.url && notice.url.indexOf("complianz.io") !==-1 ? "_blank" : '_self';
	let tint = notice.label.toLowerCase() === 'warning' ? WARNING_TINT : DEFAULT_TINT;
	return (
		<>
			{ notice.title && notice.text &&
				<details className={clsx("cmplz-wizard-help-notice", "cmplz-" + notice.label.toLowerCase(), noticeBox, tint, accordionCls)} open={openStatus}>
					<summary className={summaryCls}>{notice.title} <Icon name='chevron-down' /></summary>
					{/*some notices contain html, like for the htaccess notices. A title is required for those options, otherwise the text becomes the title. */}
					<div className={bodyCls}
						dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.text) }}  ></div> {/* nosemgrep: react-dangerouslysetinnerhtml */}
					{notice.url && <div className={moreInfoCls}><a target={target} href={notice.url}>{__("More info", "complianz-gdpr")}</a></div>}
				</details>
			}
			{ notice.title && !notice.text &&
				<div className={clsx("cmplz-wizard-help-notice", "cmplz-" + notice.label.toLowerCase(), noticeBox, tint)}><p className={titleOnlyCls}>{notice.title}</p></div>
			}
		</>

	);

}

export default Help
