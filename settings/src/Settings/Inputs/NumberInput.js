import {memo, useEffect, useState} from "@wordpress/element";
import { TextField } from '../../components/ui/TextField';

const NumberInput = ({
	value,
	onChange,
	required,
	disabled,
	id,
	name,
}) => {
	const inputId = id || name;
	const [inputValue, setInputValue] = useState('');

	//ensure that the initial value is set
	useEffect(() => {
		if (!value) value=0;
		setInputValue(value);
	},[]);

	//because an update on the entire Fields array is costly, we only update after the user has stopped typing
	useEffect(() => {
		// skip first render
		if (value=== inputValue) {
			return;
		}
		const typingTimer = setTimeout(() => {
			onChange(inputValue);
		}, 500);

		return () => {
			clearTimeout(typingTimer);
		};
	}, [inputValue]);

	const handleChange = ( value ) => {
		setInputValue(value);
	};

	return (
		<div data-cmplz-ui className="cmplz-input-group cmplz-text-input-group">
			<TextField
				type='number'
				id={inputId}
				name={name}
				value={inputValue}
				onChange={(event) => handleChange(event.target.value)}
				required={required}
				disabled={disabled}
			/>
		</div>
	);
};

export default memo(NumberInput);
