import {memo, useState} from "@wordpress/element";
import * as cmplz_api from '../../utils/api';
import useFields from '../Fields/FieldsData';
import useMenu from '../../Menu/MenuData';
import AreYouSureModal from "../AreYouSureModal";
import {UseCookieScanData} from "../CookieScan/CookieScanData";
import useProgress from "../../Dashboard/Progress/ProgressData";
import { Button as UIButton } from "../../components/ui/Button";

// Look-preserving migration of the Button field onto the Button primitive (T-025/T-030, ADR-002/005).
// The `action` type renders the primitive <button> with `data-cmplz-ui` on it, so the semantic
// --cmplz-* tokens and the scoped base reach it as its own island, alongside the unchanged
// AreYouSureModal confirm flow (T-026). The field's `style` prop maps 1:1 to the primitive's
// `variant` (primary/secondary/tertiary/error == the deleted legacy `.button--*` set). Props and
// behaviour are unchanged (FR-019): the field's own `type` prop ('action'|'link') is a behaviour
// selector, not an HTML button type, so it is never forwarded to the primitive (the primitive keeps
// its default HTML type `button`).
//
// The `link` type still renders an <a> — the primitive is a <button> and cannot be an anchor — and
// keeps the legacy `button cmplz-button button--*` classes, still styled by the surviving
// legacy-globals.scss (deleted only in Phase 5, ADR-005), so the link look is unchanged. No consumer
// passes type='link' today, but the contract is preserved.
const Button = ({
	type = 'action',
	style = 'tertiary',
	label,
	onClick,
	href = '',
	target = '',
	disabled,
	action,
	field,
	children
}) =>
{
	if ( !label && !children ) return null;
	const buttonLabel = field && field.button_text ? field.button_text : label;
	const content = buttonLabel ? buttonLabel : children;
	const {fetchFieldsData, showSavedSettingsNotice} = useFields();
	const {setInitialLoadCompleted, setProgress} = UseCookieScanData();
	const {setProgressLoaded} = useProgress();

	const {selectedSubMenuItem } = useMenu();
	const [ isOpen, setIsOpen ] = useState( false );

	const clickHandler = async (e) => {
		if (type === 'action' && onClick) {
			onClick(e);
			return;
		}
		if (type === 'action' && action) {
			if (field && field.warn) {
				setIsOpen( true );
			} else {
				await executeAction();
			}
			return;
		}
		window.location.href=field.url;
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
				//some custom actions
				if (response.id === 'reset_settings') {
					setInitialLoadCompleted(false);
					setProgress(0);
					setProgressLoaded(false);

				}
				showSavedSettingsNotice(response.message);
			}
		});
	}
	const warningText = field && field.warn ? field.warn : '';
	if ( type === 'action' ) {
		return (
			<>
				<AreYouSureModal
					isOpen={ isOpen }
					onConfirm={ handleConfirm }
					onCancel={ handleCancel }
				>
					{warningText}
				</AreYouSureModal>

				<UIButton
					data-cmplz-ui
					variant={style}
					onClick={clickHandler}
					disabled={disabled}
				>
					{content}
				</UIButton>
			</>


		)
	}
	if (type === 'link') {
		return (
			<a
				className={`button cmplz-button button--${style} button-${type}`}
				href={href}
				target={target}
				>
				{content}
			</a>
		)
	}
}

export default memo(Button);
