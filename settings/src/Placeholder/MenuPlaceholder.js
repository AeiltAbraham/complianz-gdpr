import { Skeleton } from "../components/ui/Skeleton";
import { clsx } from "../components/ui/cx";

// Menu loading placeholder (T-041, DB-07, C-3, ADR-005), rebuilt on the Skeleton primitive to mirror the
// redesigned Menu.js frame (settings/src/Menu/Menu.js): a transparent flex column with a title row and the
// per-section item rows. It is a pure leaf (only Skeletons), so `data-cmplz-ui` sits on its own root (the
// Menu.js / Header.js pattern) — the base reset (base.css B1-B5) reaches only the self-styled Skeletons,
// nothing legacy to strip (learnings 2026-10-11). The tokens resolve directly on the marked root. The
// legacy `.cmplz-wizard-menu` hook has no CSS left (wizard/menu.scss was deleted at T-040) but is kept to
// match Menu.js's root. Logical CSS only (ADR-007).
const ROOT = clsx(
	"cmplz-wizard-menu",
	"tw-flex tw-flex-col tw-gap-[2px] tw-h-fit tw-bg-transparent tw-p-[var(--cmplz-space-s)]"
);
const HEADER = "tw-px-[var(--cmplz-space-s)] tw-py-[var(--cmplz-space-xs)]";
const ITEMS = "tw-flex tw-flex-col tw-gap-[2px]";
const ITEM = "tw-px-[var(--cmplz-space-s)] tw-py-[var(--cmplz-space-xs)]";

/**
 * Menu block loading state, rendering the menu skeleton
 */
const MenuPlaceholder = () => {
	return (
		<div className={ ROOT } data-cmplz-ui="" aria-busy="true">
			<div className={ HEADER }>
				<Skeleton width="60%" height="1rem" />
			</div>
			<div className={ ITEMS }>
				{ Array.from( { length: 6 } ).map( ( item, i ) => (
					<div className={ ITEM } key={ i }>
						<Skeleton width="100%" height="1.25rem" />
					</div>
				) ) }
			</div>
		</div>
	)
}

export default MenuPlaceholder;
