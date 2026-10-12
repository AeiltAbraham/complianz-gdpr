import Placeholder from "./Placeholder";
import { clsx } from "../components/ui/cx";

// Loading-skeleton frame for the settings screen (T-046, DB-07/DB-08; Stage-H section 1b). Migrated to `tw-`
// utilities on the semantic `--cmplz-*` tokens WITH LITERAL FALLBACKS so the skeleton matches the redesigned
// SettingsGroup card (no loading->loaded flash) AND so the T-045 wizard-div `.cmplz-grid-item-content` +
// `.cmplz-settings-block-intro` relocations could be deleted (SettingsPlaceholder was their only other
// consumer, grep-verified). No `data-cmplz-ui` (ADR-001 marker discipline, same as the real card); the look
// comes from the `tw-` utilities (1,1,0 via the `important:` config). Legacy class hooks are kept. Logical
// utilities only (ADR-007). Mirrors SettingsGroup's card look + the two-column span and its md: collapse; the
// empty footer stays hidden via the retained legacy `.cmplz-grid-item-footer:empty { display:none }` base.
const CARD_SHADOW = "tw-shadow-[var(--cmplz-shadow,_0_1px_3px_0_rgba(15,23,42,0.10),_0_1px_2px_-1px_rgba(15,23,42,0.06))]";
const bodyCls = "tw-col-span-4 md:tw-col-span-2";
const cardCls = clsx(
	"tw-relative tw-overflow-hidden tw-mb-[var(--cmplz-space-l,_24px)]",
	"tw-bg-[var(--cmplz-surface,_#ffffff)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"tw-rounded-[var(--cmplz-radius,_12px)]",
	CARD_SHADOW
);
const contentCls = "tw-flex tw-flex-col tw-gap-[var(--cmplz-space-l,_24px)] tw-my-[var(--cmplz-space-l,_24px)] tw-px-0";
const introCls = "tw-px-[var(--cmplz-space-l,_24px)]";

/**
 * Menu block, rendering the entire menu
 */
const SettingsPlaceholder = () => {
	return(
		<div className={clsx("cmplz-wizard-settings cmplz-column-2", bodyCls)}>
			<div className={clsx("cmplz-grid-item", cardCls)}>
				<div className={clsx("cmplz-grid-item-content", contentCls)}>
					<div className={clsx("cmplz-settings-block-intro", introCls)}><Placeholder lines="3"></Placeholder></div>
				</div>
			</div>
			<div className="cmplz-grid-item-footer"></div>
		</div>
	)
}

export default SettingsPlaceholder;
