import * as Checkbox from '@radix-ui/react-checkbox';
import { __ } from '@wordpress/i18n';
import Icon from '../../utils/Icon';
import {useEffect, useState, memo} from "@wordpress/element";
import Button from "../Inputs/Button";
import { clsx } from '../../components/ui/cx';

// Look-preserving restyle of the Radix checkbox group (ADR-002 behaviour kept; ADR-005 SCSS
// deleted). Complete literal class strings on the semantic `--cmplz-*` tokens (ADR-013), logical
// utilities only (ADR-007). Values mirror the deleted CheckboxGroup.scss: 16x16 box, 3px radius,
// 1px field-border outline, blue-faded hover (#E7F1F9, no token), the two-layer focus ring
// (surface-sunken gap + accent-strong), disabled grey (#ededed), 13px muted labels.
const checkboxCls = clsx(
	'tw-flex tw-content-center tw-items-center tw-justify-center',
	'tw-w-[16px] tw-h-[16px] tw-aspect-square tw-mt-[2px] tw-rounded-[3px]',
	'tw-outline tw-outline-1 tw-outline-[color:var(--cmplz-field-border)]',
	'tw-transition-colors tw-duration-200 tw-ease-in-out',
	'hover:tw-bg-[#E7F1F9]',
	'focus:tw-shadow-[0_0_0_3px_var(--cmplz-surface-sunken),0_0_0_5px_var(--cmplz-accent-strong)]',
	'disabled:tw-bg-[#ededed] disabled:tw-cursor-not-allowed'
);
const labelBase = 'tw-m-0 tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted)]';

const CheckboxGroup = ({ indeterminate, label, value, id, onChange, required, disabled, options = {} }) => {
	const [isBoolean, setIsBoolean] = useState(false);
	const [loadMoreExpanded, setLoadMoreExpanded] = useState(false);

	let valueValidated = value;
	if ( !Array.isArray(valueValidated) ){
		valueValidated = valueValidated === '' ? [] : [valueValidated];
	}

	useEffect (() => {
		let isBool = (Object.keys(options).length === 1) && Object.keys(options)[0] === 'true';
		setIsBoolean(isBool);
	},[]);

	if (indeterminate){
		value = true;
	}

	const selected = valueValidated;
	const loadMoreCount = 10;

	// check if there are more options than the loadmore count
	let loadMoreEnabled = false;

	if (Object.keys(options).length > loadMoreCount) {
		loadMoreEnabled = true;
	}

	const handleCheckboxChange = (e, option) => {
		if (isBoolean) {
			onChange(!value);
		} else {
			const newSelected = selected.includes(""+option) || selected.includes(parseInt(option))
				? selected.filter((item) => item !== ""+option && item !== parseInt(option) )
				: [...selected, option];
			onChange(newSelected);
		}
	};

	const isEnabled = (id) => {
		// if there is only one option, we use the value as a boolean
		//selected can both be array of strings or integers.
		return isBoolean ? value : selected.includes(""+id) || selected.includes(parseInt(id));
	};

	const loadMoreHandler = () => {
		setLoadMoreExpanded(!loadMoreExpanded);
	};
	let allDisabled = disabled && !Array.isArray(disabled);

	if (Object.keys(options).length===0){
		return (
			<>{__("No options found", "complianz-gdpr")}</>
		)
	}

	return (
		<div data-cmplz-ui className="cmplz-checkbox-group tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs)]">
			{Object.entries(options).map(([key, optionLabel], i) => {
				const optionDisabled = allDisabled || (Array.isArray(disabled) && disabled.includes(key));
				return (
					<div
						key={key}
						className={clsx(
							'tw-flex tw-items-start tw-gap-[var(--cmplz-space-xs)]',
							!loadMoreExpanded && i > loadMoreCount - 1 && 'tw-hidden'
						)}
					>
						<Checkbox.Root
							className={checkboxCls}
							id={id + '_' + key}
							checked={isEnabled(key)}
							aria-label={label}
							disabled={optionDisabled}
							required={required}
							onCheckedChange={(e) => handleCheckboxChange(e, key)}
						>
							<Checkbox.Indicator className="tw-flex tw-items-center tw-justify-center">
								<span className="tw-mt-[5px] tw-flex">
									<Icon name={indeterminate ? 'indeterminate' : 'check'} size={14} color={'dark-blue'} />
								</span>
							</Checkbox.Indicator>
						</Checkbox.Root>
						<label
							className={clsx(labelBase, optionDisabled && 'tw-cursor-not-allowed')}
							htmlFor={id + '_' + key}
						>
							{optionLabel}
						</label>
					</div>
				);
			})}
			{/* Wrapper keeps the toggle compact + leading-aligned (reproduces the deleted
			    `.cmplz-checkbox-group .cmplz-button { margin-right:auto; margin-left:0 }`): the
			    flex-col root stretches children by default, and Inputs/Button takes no className. */}
			{!loadMoreExpanded && loadMoreEnabled && (
				<div className="tw-self-start">
					<Button onClick={()=>loadMoreHandler()}>
						{__('Show more', 'complianz-gdpr')}
					</Button>
				</div>
			)}
			{loadMoreExpanded && loadMoreEnabled && (
				<div className="tw-self-start">
					<Button onClick={() => loadMoreHandler()}>
						{__('Show less', 'complianz-gdpr')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default memo(CheckboxGroup);
