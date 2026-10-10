/**
 * Combobox — an async, searchable single-select built on Downshift's `useCombobox` hook (the ARIA
 * 1.2 combobox behaviour, keyboard interaction and labelling) and Radix Popover (positioning and
 * the scoped portal), styled with Tailwind on the semantic `--cmplz-*` tokens. Behaviour-preserving
 * replacement for the `react-select/async` picker in `Settings/DocumentControl.js` (ADR-003);
 * dropping react-select removes the last `@emotion/*` package, completing the emotion exit
 * (FR-011). One component per file; literal class maps composed with `clsx` (ADR-013).
 *
 * ADR-003 wiring — two libraries joined by hand:
 *  - Radix `Popover.Anchor` wraps the input control; there is NO trigger button.
 *  - `Popover.Root` runs with `modal={false}` and its `open` is OWNED BY DOWNSHIFT (`isOpen`); a
 *    Radix-initiated close (Escape routed through Radix, a true outside click) is forwarded to
 *    Downshift's `closeMenu` so the two never disagree.
 *  - `onOpenAutoFocus`/`onCloseAutoFocus` are prevented so focus stays in the input.
 *  - The menu is kept mounted (`forceMount` on Portal + Content) so Downshift's `getMenuProps` ref
 *    is always attached — Downshift needs the live menu element to recognise a click on a portalled
 *    option as "inside" rather than an outside blur that would close before the click lands.
 *  - `onInteractOutside` ignores events inside the anchor, which Radix would otherwise treat as an
 *    outside click, closing the menu as the user types in or clicks the control.
 *  - The listbox renders through Radix's Popover Portal into the PHP portal host
 *    (`getPortalContainer`) and carries `data-cmplz-ui` so the scoped base and tokens reach it; it
 *    is NOT an isolated zone (ADR-001).
 *
 * Props: controlled single `value` (an option object `{ value, label }`, or a one-element array for
 * the initial value per ADR-003), `onChange(option)`, async `loadOptions(search) => Promise<opts>`
 * (`opts` are `{ value, label }`), `defaultOptions` (shown before the user types), `placeholder`,
 * `label`/`aria-label` (an accessible name; rendered visually hidden), and `disabled`. It is
 * single-value and NOT clearable (no clear control, and a selection only ever changes to another
 * option). Downshift's loading and empty states are rendered in the menu. The input ref is forwarded.
 */
import {
	forwardRef,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCombobox } from 'downshift';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { clsx } from './cx';
import { getPortalContainer } from './PortalContainer';

// Complete literal class strings (ADR-013). The control reproduces the TextField look (1px field
// border, 5px radius, 5px/10px padding, 13px text, field surface) with its focus ring on
// `focus-within` because the real focus target is the inner input. Logical utilities only (ADR-007).
const controlCls = clsx(
	'tw-relative tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs)]',
	'tw-border tw-border-[color:var(--cmplz-field-border)] tw-rounded-[var(--cmplz-radius-field)]',
	'tw-py-[5px] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-leading-normal tw-text-[color:var(--cmplz-text)] tw-bg-[var(--cmplz-field-surface)]',
	'focus-within:tw-border-[color:var(--cmplz-accent-strong)] focus-within:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]'
);
const controlDisabledCls =
	'tw-cursor-not-allowed tw-bg-[#f7f7f7] tw-text-[color:#c6c6c6]';
const inputCls =
	'tw-flex-1 tw-min-w-0 tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-outline-none disabled:tw-cursor-not-allowed';
// The placeholder is rendered as real text (not the native `placeholder` attribute) so it reads like
// react-select's placeholder did, overlaying the empty input's start edge.
const placeholderCls =
	'tw-pointer-events-none tw-absolute tw-inset-y-0 tw-start-[var(--cmplz-space-xs)] tw-flex tw-items-center tw-text-[color:var(--cmplz-text-muted)]';
const chevronCls =
	'tw-pointer-events-none tw-shrink-0 tw-text-[color:var(--cmplz-text-muted)]';
const menuCls = clsx(
	'tw-z-50 tw-min-w-[var(--radix-popover-trigger-width)]',
	'tw-bg-[var(--cmplz-surface)] tw-text-[color:var(--cmplz-text)]',
	'tw-border tw-border-[color:var(--cmplz-border)] tw-rounded-[var(--cmplz-radius-field)] tw-shadow-lg',
	'tw-max-h-[300px] tw-overflow-y-auto',
	'focus:tw-outline-none',
	'data-[state=closed]:tw-hidden'
);
const listCls = 'tw-m-0 tw-list-none tw-p-[4px]';
const optionCls =
	'tw-cursor-pointer tw-rounded-[var(--cmplz-radius-s)] tw-px-[var(--cmplz-space-xs)] tw-py-[5px]';
const optionHighlightedCls = 'tw-bg-[var(--cmplz-surface-sunken)]';
const optionSelectedCls = 'tw-font-semibold';
const messageCls =
	'tw-px-[var(--cmplz-space-xs)] tw-py-[5px] tw-text-[color:var(--cmplz-text-muted)]';

// Accept the initial value as an option object or a one-element array (ADR-003), always normalising
// to a single option or `null` (never `undefined`, so Downshift stays controlled).
const toOption = ( value ) => {
	if ( ! value ) {
		return null;
	}
	if ( Array.isArray( value ) ) {
		return value.length ? value[ 0 ] : null;
	}
	return value;
};

const itemToString = ( item ) => ( item ? item.label : '' );

const ChevronDown = ( { className } ) => (
	<svg
		className={ className }
		width="16"
		height="16"
		viewBox="0 0 20 20"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const Combobox = forwardRef(
	(
		{
			value,
			onChange,
			loadOptions,
			defaultOptions = [],
			placeholder = '',
			label,
			'aria-label': ariaLabel,
			disabled = false,
			className,
		},
		ref
	) => {
		const selectedItem = toOption( value );
		const [ items, setItems ] = useState( () => defaultOptions || [] );
		const [ loading, setLoading ] = useState( false );
		const controlRef = useRef( null );
		const requestIdRef = useRef( 0 );
		// Tracks the current input text for the defaultOptions sync below without re-subscribing it.
		const inputValueRef = useRef( selectedItem ? selectedItem.label : '' );

		// Run one async search; a monotonic request id drops stale responses so only the latest
		// settles into the menu. One request per keystroke preserves react-select's timing (the
		// 1000 ms wait lives in the caller's `loadOptions`); this adds no debounce (ADR-003).
		const runSearch = useCallback(
			( search ) => {
				const requestId = ++requestIdRef.current;
				setLoading( true );
				Promise.resolve( loadOptions( search ) )
					.then( ( opts ) => {
						if ( requestId !== requestIdRef.current ) {
							return;
						}
						setItems( Array.isArray( opts ) ? opts : [] );
						setLoading( false );
					} )
					.catch( () => {
						if ( requestId !== requestIdRef.current ) {
							return;
						}
						setItems( [] );
						setLoading( false );
					} );
			},
			[ loadOptions ]
		);

		const {
			isOpen,
			inputValue,
			highlightedIndex,
			getLabelProps,
			getInputProps,
			getMenuProps,
			getItemProps,
			closeMenu,
		} = useCombobox( {
			items,
			selectedItem,
			initialInputValue: selectedItem ? selectedItem.label : '',
			itemToString,
			// Identify options by VALUE, not object reference (Downshift's default). The caller
			// re-derives the selected option on every search (a fresh, value-equal object — the
			// page list always re-includes the saved page), and with reference identity Downshift
			// would treat each as a new selection and reset the input text to the saved label,
			// wiping the user's in-progress query. Value identity keeps an unchanged selection stable.
			itemToKey: ( item ) => ( item ? item.value : null ),
			onSelectedItemChange: ( { selectedItem: next } ) => {
				// Not clearable: only forward a real selection (never a null), matching react-select,
				// whose consumer reads `element.value`.
				if ( onChange && next ) {
					onChange( next );
				}
			},
			onInputValueChange: ( { inputValue: next, type } ) => {
				inputValueRef.current = next || '';
				if ( type !== useCombobox.stateChangeTypes.InputChange ) {
					return;
				}
				if ( ! next ) {
					// Empty input reverts to the default options (react-select/async behaviour with a
					// default array); cancel any in-flight search.
					requestIdRef.current++;
					setLoading( false );
					setItems( defaultOptions || [] );
					return;
				}
				runSearch( next );
			},
		} );

		// Before the first search, mirror a changing `defaultOptions` into the menu — the caller fills
		// it from the async page list after the initial load.
		useEffect( () => {
			if ( ! inputValueRef.current ) {
				setItems( defaultOptions || [] );
			}
		}, [ defaultOptions ] );

		const inputProps = getInputProps( {
			disabled,
			ref: ( node ) => {
				if ( typeof ref === 'function' ) {
					ref( node );
				} else if ( ref ) {
					ref.current = node;
				}
			},
		} );

		return (
			<PopoverPrimitive.Root
				open={ isOpen && ! disabled }
				modal={ false }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						closeMenu();
					}
				} }
			>
				{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Downshift's getLabelProps() spreads htmlFor + id, associating this label with the combobox input at runtime (static analysis cannot see the spread). */ }
				<label { ...getLabelProps() } className="tw-sr-only">
					{ label || ariaLabel || placeholder }
				</label>
				<PopoverPrimitive.Anchor asChild>
					<div
						ref={ controlRef }
						className={ clsx(
							controlCls,
							disabled && controlDisabledCls,
							className
						) }
					>
						<input { ...inputProps } className={ inputCls } />
						{ ! inputValue && (
							<span className={ placeholderCls }>
								{ placeholder }
							</span>
						) }
						<ChevronDown className={ chevronCls } />
					</div>
				</PopoverPrimitive.Anchor>
				<PopoverPrimitive.Portal
					forceMount
					container={ getPortalContainer() }
				>
					<PopoverPrimitive.Content
						forceMount
						data-cmplz-ui=""
						align="start"
						sideOffset={ 4 }
						onOpenAutoFocus={ ( event ) => event.preventDefault() }
						onCloseAutoFocus={ ( event ) => event.preventDefault() }
						onInteractOutside={ ( event ) => {
							const target =
								event.detail &&
								event.detail.originalEvent &&
								event.detail.originalEvent.target;
							if (
								controlRef.current &&
								target &&
								controlRef.current.contains( target )
							) {
								event.preventDefault();
							}
						} }
						className={ menuCls }
					>
						<ul { ...getMenuProps() } className={ listCls }>
							{ loading && (
								<li className={ messageCls }>
									{ __( 'Loading…', 'complianz-gdpr' ) }
								</li>
							) }
							{ ! loading && items.length === 0 && (
								<li className={ messageCls }>
									{ __( 'No options', 'complianz-gdpr' ) }
								</li>
							) }
							{ ! loading &&
								items.map( ( item, index ) => (
									<li
										key={ `${ item.value }-${ index }` }
										{ ...getItemProps( { item, index } ) }
										className={ clsx(
											optionCls,
											highlightedIndex === index &&
												optionHighlightedCls,
											selectedItem &&
												selectedItem.value ===
													item.value &&
												optionSelectedCls
										) }
									>
										{ item.label }
									</li>
								) ) }
						</ul>
					</PopoverPrimitive.Content>
				</PopoverPrimitive.Portal>
			</PopoverPrimitive.Root>
		);
	}
);
Combobox.displayName = 'Combobox';

export { Combobox };
