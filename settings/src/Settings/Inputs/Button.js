import {memo, useState} from "@wordpress/element";
import * as cmplz_api from '../../utils/api';
import useFields from '../Fields/FieldsData';
import useMenu from '../../Menu/MenuData';
import AreYouSureModal from "../AreYouSureModal";
import {UseCookieScanData} from "../CookieScan/CookieScanData";
import useProgress from "../../Dashboard/Progress/ProgressData";
import { Button as UIButton } from "../../components/ui/Button";

// Look-preserving migration of the Button field onto the Button primitive (T-025/T-030, ADR-002/005).
// The `action` type renders the primitive <button>; the semantic --cmplz-* tokens and the scoped base
// reach it from the app-root `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move, H.5 Part 2 —
// the former per-element `data-cmplz-ui` here is dropped), alongside the unchanged
// AreYouSureModal confirm flow (T-026). The field's `style` prop maps 1:1 to the primitive's
// `variant` (primary/secondary/tertiary/error == the deleted legacy `.button--*` set). Props and
// behaviour are unchanged (FR-019): the field's own `type` prop ('action') is a behaviour selector,
// not an HTML button type, so it is never forwarded to the primitive (the primitive keeps its default
// HTML type `button`). An action button that navigates does so via `field.url` in clickHandler, not a
// separate anchor render.
//
// REMOVED at the ADR-001 marker move (Stage H.5 Part 2, 2026-10-22): a dead `type === 'link'` branch
// that rendered a raw `<a class="button cmplz-button button--*">` leaning on the unscoped legacy-globals
// `a.button` (0,1,1). Field.js never passes a `type` prop to this component (only `action` via
// customProps — Field.js:245-254), so `type` always defaulted to 'action' and the anchor was
// unreachable. It was also a latent landmine: once the base reset reaches the whole app (this move),
// B1's `border-width:0` at (1,0,0) would defeat `a.button` and the anchor would render borderless. The
// live link-button affordance is the H.9 `secondaryLinkButtonCls` anchor (components/ui/Button links),
// not this field. Deleted so it cannot be re-armed.
const Button = ({
	type = 'action',
	style = 'tertiary',
	label,
	onClick,
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
					variant={style}
					onClick={clickHandler}
					disabled={disabled}
				>
					{content}
				</UIButton>
			</>


		)
	}
}

export default memo(Button);
