import Error from "../utils/Error";
import { Skeleton } from "../components/ui/Skeleton";
import { clsx } from "../components/ui/cx";

// Loading placeholder (T-041, DB-07/DB-16, ADR-005), rebuilt on the T-025 `Skeleton` primitive, replacing
// the legacy `.cmplz-placeholder-line` shine rows (deleted from assets/css/admin/modules/placeholder.scss).
// The rows render inside their OWN `data-cmplz-ui` island so the primitive's token refs
// (`--cmplz-radius-s`, `--cmplz-surface-sunken`) resolve (tokens.css, declared on
// `:is(#complianz,#complianz-portal) :where([data-cmplz-ui])`) — the island is a FULLY-migrated subtree
// (only Skeletons), so the scoped base reset (base.css B1-B5, `[data-cmplz-ui] *`) has nothing legacy to
// strip (learnings 2026-10-11: mark only fully-migrated subtrees).
//
// The `<Error>` branch (shown by OtherPlugins/ProgressBlock on a load failure) was migrated to the C-2
// system at Stage H.8 (tw- danger callout + a secondary button-styled link, each with `tw-border-solid`);
// it stays OUTSIDE this island, UNMARKED, carrying its own border-style so the reset is not needed
// (FR-019 — behavior preserved). The outer `.cmplz-placeholder` hook is KEPT because
// retained modules still target it as a descendant (other-plugins.scss makes it transparent; progress.scss
// adds block padding); dropping it would orphan those overrides. Logical CSS only (ADR-007).
const ROWS = "tw-flex tw-flex-col tw-gap-[var(--cmplz-space-s)] tw-py-[var(--cmplz-space-xs)]";

// Deterministic, organic-looking row widths (the legacy rule used SCSS random(); a fixed cycle keeps the
// skeleton stable for screenshots), cycled by row index.
const ROW_WIDTHS = [ '70%', '100%', '85%', '60%', '90%', '75%', '100%', '65%', '80%' ];

const Placeholder = (props) => {
	let lines = parseInt( props.lines, 10 );
	if ( ! lines || lines < 1 ) lines = 4;
	return (
		<div className={ clsx( "cmplz-placeholder" ) }>
			{ props.error && <Error error={ props.error } /> }
			<div className={ ROWS } data-cmplz-ui="" aria-busy="true">
				{ Array.from( { length: lines } ).map( ( item, i ) => (
					<Skeleton key={ i } width={ ROW_WIDTHS[ i % ROW_WIDTHS.length ] } height="1rem" />
				) ) }
			</div>
		</div>
	);
}

export default Placeholder;
