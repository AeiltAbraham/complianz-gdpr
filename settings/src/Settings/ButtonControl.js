import Button from "../Settings/Inputs/Button";
import * as cmplz_api from "../utils/api";
import useFields from "./Fields/FieldsData";
import useMenu from "../Menu/MenuData";
import {useState} from "@wordpress/element";

import AreYouSureModal from "./AreYouSureModal";

const ButtonControl = ({label, field, disabled}) => {
	const {fetchFieldsData, showSavedSettingsNotice} = useFields();
	const {selectedSubMenuItem } = useMenu();
	const [ isOpen, setIsOpen ] = useState( false );

	let text = field.button_text ? field.button_text : field.label;

	if ( field.action ) {
		const clickHandler = async (e) => {
			if (field.warn) {
				setIsOpen( true );
			} else {
				await executeAction();
			}
		}

		const handleConfirm = async () => {
			setIsOpen( false );
			await executeAction();
		};

		const handleCancel = () => {
			setIsOpen( false );
		};

		const executeAction = async (e) => {
			let data = {};
			await cmplz_api.doAction(field.action, data).then((response) => {
				if (response.success) {
					fetchFieldsData(selectedSubMenuItem);
					showSavedSettingsNotice(response.message);
				}
			});
		}

		return (
			<>
				<Button
					text={text}
					style={'secondary'}
						disabled={disabled}
						onClick={(e)=>clickHandler(e)}
				/>
				<AreYouSureModal
					isOpen={ isOpen }
					onConfirm={ handleConfirm }
					onCancel={ handleCancel }
				>
					{field.warn}
				</AreYouSureModal>
			</>
		)
	} else {
		return (
				<Button
					style='secondary'
					label={text}
					disabled={disabled}
					href={field.url}
				/>
		)
	}
}
export default ButtonControl
