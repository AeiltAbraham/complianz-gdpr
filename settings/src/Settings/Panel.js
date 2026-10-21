import Icon from "../utils/Icon";
import { useState } from "@wordpress/element";
import { clsx } from "../components/ui/cx";

/**
 * Panel — the shared accordion (native `<details>`/`<summary>`) used by Cookiedatabase, Integrations,
 * Processors, ThirdParties, PluginsPrivacyStatements, PluginsOverview and CookieScan.
 *
 * Stage H7 (maintainer sign-off 2026-10-21): MODERNIZED to a C-2 card (white `--cmplz-surface` surface,
 * slate `--cmplz-border`, token radius) — NOT the legacy look-preserving grey accordion. The summary
 * grid + chevron + open/close rotation are kept. Self-sufficient: the chrome lives here as tw- utilities
 * (scoped by the `important:#complianz` config, so it applies with or without the marker), dropping the
 * legacy `.cmplz-panel__list__item*` SCSS hooks, so the component survives Bundle D's deletion of
 * legacy-globals. `tw-border-solid` is explicit so the border never depends on base.css B1 once the
 * marker move lands (the T-052 landmine). The item root is deliberately NOT marked `data-cmplz-ui`: it
 * wraps arbitrary `props.details` body content that may still be legacy in other bundles (T-038).
 *
 * `tone` (default | nested | deleted) is a complete-literal class map (ADR-013, no tailwind-merge) so the
 * surface colour never collides: `Cookie` passes `nested`/`deleted` to reproduce the legacy white /
 * faded-red cookie rows; everyone else gets the default C-2 surface card. The margin part rides the item
 * wrapper, the surface colour the `<details>` card.
 */
const toneSurface = {
	default: 'tw-bg-[var(--cmplz-surface,_#fff)]',
	nested: 'tw-bg-[#fff]',
	// Deleted cookie rows: the C-2 faded-red status surface (replaces the legacy faded-red #fbebed tint).
	deleted: 'tw-bg-[var(--cmplz-danger-surface,_#fdebed)]',
};
const toneMargin = {
	default: '',
	nested: 'tw-my-[10px]',
	deleted: 'tw-my-[10px]',
};

const Panel = ( props ) => {
	const [ isOpen, setIsOpen ] = useState( false );

	const handleOpen = ( e ) => {
		e.preventDefault();
		setIsOpen( ! isOpen );
	};

	const toneKey = toneSurface[ props.tone ] ? props.tone : 'default';

	return (
		<div
			className={ clsx( 'cmplz-panel__list__item tw-w-full', toneMargin[ toneKey ] ) }
			style={ props.style ? props.style : {} }
		>
			<details
				open={ isOpen }
				className={ clsx(
					'tw-overflow-hidden tw-rounded-[var(--cmplz-radius,_12px)]',
					'tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]',
					toneSurface[ toneKey ]
				) }
			>
				<summary
					onClick={ ( e ) => handleOpen( e ) }
					className={ clsx(
						'tw-grid tw-grid-cols-[auto_1fr_auto_auto_auto] tw-items-center',
						'tw-gap-[var(--cmplz-space-s,_12px)] tw-min-h-[40px] tw-cursor-pointer',
						'tw-py-[var(--cmplz-space-xs,_8px)] tw-px-[var(--cmplz-space-s,_12px)]',
						'tw-list-none marker:tw-hidden [&::-webkit-details-marker]:tw-hidden',
						isOpen &&
							'tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]'
					) }
				>
					{ props.icon && <Icon name={ props.icon } /> }
					<h5 className="tw-m-0 tw-inline-block tw-font-medium tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]">
						{ props.summary }
					</h5>
					<div className="tw-text-[color:var(--cmplz-text-muted)] tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)]">
						{ props.comment }
					</div>
					<div className="[grid-column:-2] tw-relative tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)]">
						{ props.icons }
					</div>
					<span
						className={ clsx(
							'[grid-column:-1] tw-flex tw-transition-transform tw-duration-[250ms] tw-ease-in-out',
							isOpen && 'tw-rotate-180'
						) }
					>
						<Icon name={ 'chevron-down' } size={ 18 } />
					</span>
				</summary>
				<div className="tw-py-[var(--cmplz-space-xs,_8px)] tw-px-[var(--cmplz-space-s,_12px)]">
					{ isOpen && props.details }
				</div>
			</details>
		</div>
	);
};

export default Panel;
