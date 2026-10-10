import * as RadioGroupRadix from '@radix-ui/react-radio-group';
import {memo} from "@wordpress/element";
import { clsx } from '../../components/ui/cx';

// Look-preserving restyle of the Radix radio group (ADR-002 behaviour kept; ADR-005 SCSS deleted).
// Complete literal class strings on the semantic `--cmplz-*` tokens (ADR-013), logical utilities
// only (ADR-007). Values mirror the deleted RadioGroup.scss: 16x16 circle, 1px field-border, the
// blue-faded hover (#E7F1F9, no token), the two-layer focus ring (surface-sunken gap +
// accent-strong), disabled grey (#ededed); the indicator is a 10px accent-strong dot; the root
// vertical stack (flex column, xs gap) that used to come from Input.scss `.cmplz-input-group`.
const itemCls = clsx(
	'tw-flex tw-content-center tw-items-center tw-justify-center',
	'tw-w-[16px] tw-h-[16px] tw-aspect-square tw-rounded-full tw-outline-none',
	'tw-border tw-border-[color:var(--cmplz-field-border)]',
	'tw-transition-colors tw-duration-200 tw-ease-in-out',
	'hover:tw-bg-[#E7F1F9]',
	'focus:tw-shadow-[0_0_0_3px_var(--cmplz-surface-sunken),0_0_0_5px_var(--cmplz-accent-strong)]',
	'disabled:tw-bg-[#ededed] disabled:tw-cursor-not-allowed'
);

const RadioGroup = ({ label, id, value, onChange, required, defaultValue, disabled, options = {} }) => {
	return (
		<RadioGroupRadix.Root
			disabled={disabled && !Array.isArray(disabled)}
			data-cmplz-ui
			className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs)]"
			value={value}
			aria-label={label}
			onValueChange={onChange}
			required={required}
			default={defaultValue}
		>
			{Object.entries(options).map(([key, optionLabel]) => (
				<div key={key} className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs)]">
					<RadioGroupRadix.Item
						className={itemCls}
						disabled={Array.isArray(disabled) && disabled.includes(key) }
						value={key}
						id={id + '_' + key}>
						<RadioGroupRadix.Indicator className="tw-block tw-w-[10px] tw-h-[10px] tw-aspect-square tw-rounded-full tw-bg-[var(--cmplz-accent-strong)]" />
					</RadioGroupRadix.Item>
					<label className="tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted)]" htmlFor={id + '_' + key}>
						{optionLabel}
					</label>
				</div>
			))}
		</RadioGroupRadix.Root>
	);
};

export default memo(RadioGroup);
