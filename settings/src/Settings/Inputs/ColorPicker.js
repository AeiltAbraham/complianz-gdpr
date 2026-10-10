import { ChromePicker } from 'react-color';
import {memo, useState} from "@wordpress/element";

// react-color is a RETAINED, self-styled third-party widget (ADR-001 §4.1 zone table, row
// `color-picker`): it is NOT restyled. It is wrapped in a `data-cmplz-isolate="color-picker"` zone so
// the scoped base and the semantic --cmplz-* tokens never reach it (base.css B1-B5 skip every
// [data-cmplz-isolate] subtree), leaving react-color exactly as upstream renders it.
const ColorPicker = ({colorValue, onChangeComplete}) => {
	const [color, setColor] = useState(colorValue);

	const onChange = (color) => {
		setColor(color.hex);
	}
	return (
		<div data-cmplz-isolate="color-picker">
			<ChromePicker
				color={color}
				onChange={onChange}
				onChangeComplete={onChangeComplete}
				disableAlpha={true}
			/>
		</div>
	)
}
export default memo(ColorPicker)
