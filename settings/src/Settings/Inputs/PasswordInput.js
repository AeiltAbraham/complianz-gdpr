import {memo, useEffect, useState} from 'react';
import Icon from "../../utils/Icon";
import { TextField } from '../../components/ui/TextField';
const PasswordInput = ({
					   value,
					   onChange,
					   required,
					   disabled,
					   id,
					   name,
					   placeholder
				   }) => {
	const inputId = id || name;
	const [inputValue, setInputValue] = useState('');
	const [inputType, setInputType] = useState('password');
	const [icon, setIcon] = useState('eye');

	//ensure that the initial value is set
	useEffect(() => {
		setInputValue(value || '');
	},[value]);

	//because an update on the entire Fields array is costly, we only update after the user has stopped typing
	useEffect(() => {
		if (value=== inputValue) {
			return;
		}
		// skip first render
		const typingTimer = setTimeout(() => {
			onChange(inputValue);
		}, 400);

		return () => {
			clearTimeout(typingTimer);
		};
	}, [inputValue]);

	const handleChange = ( value ) => {
		setInputValue(value);
	};

	const toggleVisible = () => {
		if (inputType === 'password') {
			setInputType('text');
			setIcon('eye-slash');
		} else {
			setInputType('password');
			setIcon('eye');
		}
	}

	return (
		<div data-cmplz-ui className="cmplz-input-group tw-relative">
			<TextField
				type={inputType}
				id={inputId}
				name={name}
				value={inputValue}
				onChange={(event) => handleChange(event.target.value)}
				required={required}
				disabled={disabled}
				placeholder={placeholder}
			/>
			<div
				className="tw-absolute tw-end-[15px] tw-top-[8px] tw-cursor-pointer"
				onClick={() => toggleVisible()}
			>
				<Icon name={icon} color={'grey'} size={16} />
			</div>
		</div>
	);
};

export default memo(PasswordInput);
