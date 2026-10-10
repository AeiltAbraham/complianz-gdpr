import {Fragment, memo, useEffect, useState} from 'react';
import {__} from '@wordpress/i18n';
import Icon from '../../utils/Icon';
import { clsx } from '../../components/ui/cx';

// Look-preserving rebuild of the segmented border/width editor (ADR-005: BorderInput.scss deleted,
// its look reproduced here with tw- utilities on the semantic --cmplz-* tokens; data-cmplz-ui on the
// root so the scoped base + tokens apply to this island).
//
// The four number inputs are NOT wrapped in the TextField primitive: the segmented control needs
// border-radius:0 on the middle segments and rounded-start on the first, and ADR-013's no-merge rule
// means a caller-supplied className cannot safely override TextField's own rounded-[5px] of the same
// property. So the inputs compose the same field look as TextField (border/padding/font/focus/disabled,
// matching the deleted generic `.cmplz input` + border-input rules) directly, plus the segment-only
// overrides. Logical utilities only (ADR-007): `-me-px` collapses adjacent borders (was the physical
// margin-right:-1px), `rounded-s/e-*` replace the physical corner radii. The grid template (columns,
// rows, areas) is set inline because Tailwind arbitrary values express multi-string
// `grid-template-areas` poorly; those properties are direction-neutral so ADR-007 does not apply.
const inputBase = clsx(
	'tw-w-[8ch] tw--me-px',
	'tw-border tw-border-[color:var(--cmplz-field-border)]',
	'tw-py-[5px] tw-px-[var(--cmplz-space-xs)]',
	'tw-text-[0.8125rem] tw-leading-normal',
	'tw-text-[color:var(--cmplz-text-muted)] tw-bg-[var(--cmplz-field-surface)]',
	'tw-outline-none',
	'focus:tw-border-[color:var(--cmplz-accent-strong)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong)]',
	'disabled:tw-bg-[#f7f7f7] disabled:tw-text-[color:#c6c6c6]'
);

const sideLabelCls = 'tw-m-0 tw-text-center tw-text-[0.6875rem] tw-text-[color:var(--cmplz-text-muted)]';

// The link toggle: white (or blue-faded when linked) square that caps the segmented row on its end,
// reproducing the deleted `.cmplz-border-input-link` (grid-area button, 1px field border, rounded end,
// centred icon whose path takes the muted text colour).
const linkButtonBase = clsx(
	'tw-flex tw-items-center tw-justify-center tw-leading-none',
	'tw-border tw-border-[color:var(--cmplz-field-border)]',
	'tw-rounded-s-none tw-rounded-e-[5px]',
	'[&_svg_path]:tw-fill-[var(--cmplz-text-muted)]'
);

const unitWrapCls = 'tw-flex tw-justify-center tw-content-center tw-text-center tw-text-[0.6875rem] tw-text-[color:var(--cmplz-text-muted)]';

// Bare select with a custom dropdown caret: all native chrome stripped, 11px muted text, the caret SVG
// painted via an inline background (data URI + the original physical "right" position, preserved as-is
// for look parity; inline styles are outside the ADR-007 utility check).
const unitSelectCls = clsx(
	'tw-appearance-none tw-cursor-pointer tw-align-middle',
	'tw-border-0 tw-rounded-none tw-shadow-none',
	'tw-py-0 tw-pe-[16px] tw-ps-0 tw-min-h-[0.6875rem] tw-max-w-[25rem]',
	'tw-text-[0.6875rem] tw-leading-normal tw-text-[color:var(--cmplz-text-muted)]',
	'tw-bg-no-repeat tw-bg-[length:16px_16px]'
);

const rootStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(4, min-content) 3rem',
	gridTemplateRows: 'auto auto',
	gridTemplateAreas: '"input1 input2 input3 input4 button" "label1 label2 label3 label4 ."',
	rowGap: '5px',
};

const unitSelectStyle = {
	// eslint-disable-next-line -- physical "right" kept verbatim from the deleted SCSS for look parity.
	background: '#fff url(data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%206l5%205%205-5%202%201-7%207-7-7%202-1z%22%20fill%3D%22%23555%22%2F%3E%3C%2Fsvg%3E) no-repeat right 0px top 55%',
	// Must set size HERE (after the shorthand, which resets background-size to auto): the inline
	// `background` wins over the tw-bg-[length] class (Tailwind's `important` is a selector boost, not
	// !important), so without this the 20x20 caret SVG paints full-size instead of 16x16. Matches the
	// deleted BorderInput.scss, which had `background-size: 16px 16px` as a longhand after the shorthand.
	backgroundSize: '16px 16px',
};

const BorderInput = ({ label, id, value, onChange, required, defaultValue, disabled, options = {}, units = ['px'] }) => {
	const defaultUnit = defaultValue.type || value.type || units[0];
	const [unit, setUnit] = useState(defaultUnit);
	const [link, setLink] = useState(false);

	// make an array of the sides with key and label
	const sides = {
		top: __('Top', 'complianz-gdpr'),
		right: __('Right', 'complianz-gdpr'),
		bottom: __('Bottom', 'complianz-gdpr'),
		left: __('Left', 'complianz-gdpr'),
	};

	useEffect(() => {
		// set link based on if all values are equal
		if (value['top'] === value['right'] && value['top'] === value['bottom'] && value['top'] === value['left']) {
			setLink(true);
		}
	}, []);

	useEffect(() => {
		if (!link) return;
		handleChange( value['top'], 'top');
	}, [link]);

	const handleChange = (changedValue, key) => {
		let valueCopy = {...value};
		if (link) {
			valueCopy = updateAllValues(changedValue);
		} else {
			valueCopy[key] = changedValue;
		}
		onChange(valueCopy);
	}

	const updateAllValues = (newValue) => {
		let valueCopy = {...value};
		valueCopy['top'] = newValue;
		valueCopy['right'] = newValue;
		valueCopy['bottom'] = newValue;
		valueCopy['left'] = newValue;
		return valueCopy;
	}

	const handleUnitChange = (newUnit) => {
		setUnit(newUnit);
		let valueCopy = {...value};
		valueCopy.type = newUnit;
		onChange(valueCopy);
	}

	return (
		<div data-cmplz-ui style={rootStyle}>
			{
				Object.keys(sides).map((key, i) => {
					const side = sides[key];
					const sideValue = value.hasOwnProperty(key) ? value[key] : defaultValue[key];
					return (
						<Fragment key={key}>
							<input
								className={clsx(inputBase, i === 0 ? 'tw-rounded-s-[5px] tw-rounded-e-none' : 'tw-rounded-none')}
								style={{ gridArea: 'input' + (i + 1) }}
								type="number"
								onChange={(e) => handleChange(e.target.value, key)}
								value={sideValue}
							/>
							<p className={sideLabelCls} style={{ gridArea: 'label' + (i + 1) }}>{side}</p>
						</Fragment>
					)
				})
			}
			{link && <button type="button" className={clsx(linkButtonBase, 'tw-bg-[#E7F1F9]')} style={{ gridArea: 'button' }} onClick={() => setLink(!link)}>
				<Icon name={'linked'} size={16} tooltip={__('Unlink values', 'complianz-gdpr')} />
			</button> }
			{!link && <button type="button" className={clsx(linkButtonBase, 'tw-bg-[var(--cmplz-field-surface)]')} style={{ gridArea: 'button' }} onClick={() => setLink(!link)}>
				<Icon name={'unlinked'} size={16} tooltip={__('Link values together', 'complianz-gdpr')} />
			</button> }
			{units.length > 1 && (
				<div className={unitWrapCls}>
					<select className={unitSelectCls} style={unitSelectStyle} value={unit} onChange={(e) => handleUnitChange(e.target.value)}>
						{units.map((unitItem, i) => {
							return <option key={i} value={unitItem}>{unitItem}</option>
						}
						)}
					</select>
				</div>
			)}
			{units.length === 1 && (
				<div className={unitWrapCls}>{unit}</div>
			)}
		</div>
	)
}
export default memo(BorderInput);
