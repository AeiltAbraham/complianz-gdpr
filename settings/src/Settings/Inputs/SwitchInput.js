import {memo} from "@wordpress/element";
import * as Switch from '@radix-ui/react-switch';
import useFields from "../Fields/FieldsData";
import { clsx } from '../../components/ui/cx';

// Look-preserving restyle of the Radix switch (ADR-002 behaviour kept; ADR-005 SCSS deleted).
// Complete literal class strings on the semantic `--cmplz-*` tokens (ADR-013), logical utilities
// only (ADR-007). Values mirror the deleted SwitchInput.scss. The `tiny` variant reproduces
// `.cmplz-switch-root.cmplz-switch-input-tiny`; callers still pass the legacy class name through
// `className` (ServicesControl/PluginsControl/ThirdPartyScript), so it is read as the size flag —
// props unchanged (FR-019). The thumb translate is the one documented `rtl:` escape hatch (ADR-007)
// since a logical property cannot express the horizontal slide; the RTL variants reproduce the flip
// rtlcss used to generate for the legacy stylesheet.
const rootBase = clsx(
	'tw-relative tw-rounded-full tw-border tw-border-[#a4b1d2] tw-bg-[#E7F1F9]',
	'disabled:tw-opacity-50 disabled:tw-cursor-not-allowed',
	'data-[state=checked]:tw-bg-[var(--cmplz-accent-strong)]'
);
const rootSize = {
	default: 'tw-w-[42px] tw-h-[25px] tw-m-[5px] focus:tw-shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--cmplz-accent-strong)]',
	tiny: 'tw-w-[35px] tw-h-[20px] tw-m-[3px] focus:tw-shadow-[0_0_0_1px_#fff,0_0_0_2px_var(--cmplz-accent-strong)]',
};
const thumbBase = clsx(
	'tw-block tw-rounded-full tw-bg-[#fff]',
	'tw-transition-transform tw-duration-100 tw-will-change-transform'
);
const thumbSize = {
	default: clsx(
		'tw-w-[21px] tw-h-[21px] tw-shadow-[0_2px_2px_var(--cmplz-accent-strong)]',
		'tw-translate-x-[2px] rtl:tw-translate-x-[-2px]',
		'data-[state=checked]:tw-translate-x-[19px] rtl:data-[state=checked]:tw-translate-x-[-19px]'
	),
	tiny: clsx(
		'tw-w-[15px] tw-h-[15px] tw-shadow-[0_1px_1px_var(--cmplz-accent-strong)]',
		'tw-translate-x-[2px] tw-translate-y-[-1px] rtl:tw-translate-x-[-2px]',
		'data-[state=checked]:tw-translate-x-[16px] rtl:data-[state=checked]:tw-translate-x-[-16px]'
	),
};

const SwitchInput = ({
	value,
	onChange,
	required,
	disabled,
	className,
	label,
	id,
}) => {
	const {getField} = useFields();

	let val = value;
	//if value is "0" or "1", convert to boolean
	//cookiebanner values can be "0" or "1", because of the way they're loaded,
	// but the switch needs a boolean
	if ( value === '0' || value === '1') {
		val = value === '1';
	}
	const onChangeHandler = (value) => {
		//if this is a banner setting, prevent a 'false' value, because it would trigger a default to be set on the false value
		//non banner checkbox fields are handles with the never_saved property.
		let field = getField(id);
		if ( field.data_target==='banner' ) {
			value = value ? '1' : '0';
		}
		onChange(value)
	}

	const size = typeof className === 'string' && className.includes('cmplz-switch-input-tiny') ? 'tiny' : 'default';

	return (
		<div data-cmplz-ui className="tw-flex tw-items-center">
			<Switch.Root
				className={clsx(rootBase, rootSize[size])}
				checked={val}
				onCheckedChange={onChangeHandler}
				disabled={disabled}
				required={required}
			>
				<Switch.Thumb className={clsx(thumbBase, thumbSize[size])}/>
			</Switch.Root>
			{/*{label && <label className="cmplz-switch-label">{label}</label>}*/}
		</div>
	);
};

export default memo(SwitchInput);
