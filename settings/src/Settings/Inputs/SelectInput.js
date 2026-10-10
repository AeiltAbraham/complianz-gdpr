import {memo} from "@wordpress/element";
import * as Select from '@radix-ui/react-select';
import Icon from '../../utils/Icon';
import { __ } from '@wordpress/i18n';
import { clsx } from '../../components/ui/cx';
import { getPortalContainer } from '../../components/ui/PortalContainer';

// Look-preserving restyle of the Radix select (ADR-002 behaviour kept; ADR-005 SCSS deleted; DB-09
// keyboard/type-ahead/selection preserved). The dropdown Content now renders through a Radix Portal
// into `#complianz-portal-root[data-cmplz-ui]` (ADR-001/ADR-014), so the scoped base and the
// semantic `--cmplz-*` tokens reach it. Complete literal class strings on those tokens (ADR-013),
// logical utilities only (ADR-007). Values mirror the deleted SelectInput.scss: field-surface
// trigger with a 1px field border and 5px radius, 5px/10px padding, 13px muted text, blue-faded
// hover (#E7F1F9, no token), a 2px accent-strong focus ring; the content drops the top corners
// (`rounded-b`) and top border to sit flush under the trigger.
const triggerCls = clsx(
	'tw-inline-flex tw-items-center tw-justify-between tw-gap-[5px]',
	'tw-py-[5px] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-leading-normal tw-text-[color:var(--cmplz-text-muted)]',
	'tw-bg-[var(--cmplz-field-surface)] tw-rounded-[var(--cmplz-radius-field)]',
	'tw-border tw-border-[color:var(--cmplz-field-border)] tw-outline-none',
	'hover:enabled:tw-bg-[#E7F1F9]',
	'focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]',
	'data-[placeholder]:tw-text-[color:#c6c6c6]',
	'disabled:tw-bg-[#f7f7f7] disabled:tw-text-[color:#c6c6c6]'
);
const contentCls = clsx(
	'tw-w-[var(--radix-select-trigger-width)]',
	'tw-max-h-[calc(var(--radix-select-content-available-height)_-_32px_-_var(--cmplz-space-s))]',
	'tw-overflow-hidden tw-bg-[var(--cmplz-surface)]',
	'tw-rounded-b-[var(--cmplz-radius-field)]',
	'tw-border tw-border-t-0 tw-border-[color:var(--cmplz-field-border)]',
	'tw-shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]',
	'tw-z-[14]'
);
const itemCls = clsx(
	'tw-relative tw-flex tw-items-center tw-select-none tw-outline-none',
	'tw-leading-none tw-py-[var(--cmplz-space-xs)] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted)]',
	'data-[disabled]:tw-bg-[#ededed] data-[disabled]:tw-text-[color:#737373]',
	'data-[disabled]:tw-pointer-events-none data-[disabled]:tw-cursor-not-allowed',
	'data-[highlighted]:tw-bg-[#E7F1F9] data-[highlighted]:tw-text-[color:var(--cmplz-text)]'
);
const scrollBtnCls = 'tw-flex tw-items-center tw-justify-center tw-h-[25px] tw-bg-white tw-cursor-default';

const SelectInput = ({
	value = false,
	onChange,
	required,
	defaultValue,
	disabled,
	options = {},
	canBeEmpty = true,
	label,
}) => {
	// convert options to object if array
	if (Array.isArray(options)) {
		let newOptions = {};
		options.map((option) => {
			newOptions[option.value] = option.label;
		});
		options = newOptions;
	}
	// add empty option
	if ( canBeEmpty ) {
		//only add this if no value is selected yet.
		let valueIsEmpty = value === '' || value === false || value === 0;

		if (valueIsEmpty) {
			value = '0';
			options = {
				0: __('Select an option', 'complianz-gdpr'),
				...options,
			};
		}
	} else {
		// set first option as default
		if (!value) {
			value = Object.keys(options)[0];
		}
	}
	return (
		<div data-cmplz-ui className="cmplz-select-group tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs)]" key={label}>
			<Select.Root
				//ref={innerRef}
				value={value}
				defaultValue={defaultValue}
				onValueChange={onChange}
				required={required}
				disabled={disabled && !Array.isArray(disabled)}
			>
				<Select.Trigger className={triggerCls}>
					<Select.Value/>
					<span className="tw-mt-[2px] tw-mb-[-2px] tw-flex">
						<Icon name={'chevron-down'}/>
					</span>
				</Select.Trigger>
				<Select.Portal container={getPortalContainer()}>
					<Select.Content
						data-cmplz-ui
						className={contentCls}
						position="popper"
					>
						<Select.ScrollUpButton className={scrollBtnCls}>
							<Icon name={'chevron-up'}/>
						</Select.ScrollUpButton>
						<Select.Viewport>
							<Select.Group>
								{Object.entries(options).map(([optionValue, optionText]) => (
									<Select.Item
										disabled={Array.isArray(disabled) && disabled.includes(optionValue) }
										className={itemCls}
										key={optionValue}
										value={optionValue}>
										<Select.ItemText>{optionText}</Select.ItemText>
									</Select.Item>
								))}
							</Select.Group>
						</Select.Viewport>
						<Select.ScrollDownButton className={scrollBtnCls}>
							<Icon name={'chevron-down'}/>
						</Select.ScrollDownButton>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>
	);
};

export default memo(SelectInput);
