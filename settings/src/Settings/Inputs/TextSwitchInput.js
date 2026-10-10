import TextInput from './TextInput';
import SwitchInput from './SwitchInput';
import {__} from '@wordpress/i18n';
import {memo, useEffect, useState} from 'react';

// Look-preserving restyle of the text + switch composite (ADR-005 SCSS deleted). The two controls
// keep their own primitives and markers; only this wrapper's grid is restyled, mirroring the deleted
// TextSwitchInput.scss (`display:grid; grid-template-columns:1fr auto; gap:xs; align-content:center`)
// with logical utilities on the semantic token (ADR-007/ADR-013).
const TextSwitchInput = ({
	label,
	value,
	onChange,
	placeholder = ''
}) => {
	const [textDisabled, setTextDisabled] = useState(false);

	useEffect(() => {
		if (value['show']) {
			setTextDisabled(false);
		} else {
			setTextDisabled(true);
		}
	}, [value]);

	const onTextChange = (text) => {
		let newValue = {...value};
		newValue['text'] = text;
		onChange(newValue);
	}

	const onSwitchHandler = (switched) => {
		let newValue = {...value};
		newValue['show'] = switched;
		onChange(newValue);
	}

	return (
		<div data-cmplz-ui className="tw-grid tw-grid-cols-[1fr_auto] tw-content-center tw-gap-[var(--cmplz-space-xs)]">
			<TextInput
				value={value['text']}
				onChange={onTextChange}
				placeholder={placeholder}
				disabled={textDisabled}
				/>
			<SwitchInput
				label={__('Show', 'complianz-gdpr')}
				value={value['show']}
				onChange={onSwitchHandler}
				/>
		</div>
	);
}

export default memo(TextSwitchInput);
