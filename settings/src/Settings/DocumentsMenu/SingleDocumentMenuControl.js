import {UseMenuData} from "./MenuData";
import { __ } from '@wordpress/i18n';
import {memo} from "@wordpress/element";

// Native `<select>` styled to match the TextField primitive (ADR-013 complete-literal string on the
// semantic tokens with literal fallbacks). The border STYLE comes from base.css B1 via the app-root
// `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move, H.5 Part 2); `tw-border` only supplies
// the 1px width (Preflight off, ADR-014) — same contract as TextField.
const SELECT_CLS =
	'tw-border tw-border-[color:var(--cmplz-field-border,_#94a3b8)] ' +
	'tw-rounded-[var(--cmplz-radius-field,_6px)] tw-py-[5px] tw-px-[var(--cmplz-space-xs,_8px)] ' +
	'tw-text-[0.8125rem] tw-leading-normal ' +
	'tw-text-[color:var(--cmplz-text,_#0f172a)] tw-bg-[var(--cmplz-field-surface,_#fff)] tw-outline-none ' +
	'focus:tw-border-[color:var(--cmplz-accent-strong,_#1e73be)] focus:tw-shadow-[0_0_0_2px_var(--cmplz-accent-strong,_#1e73be)]';

const SingleDocumentMenuControl = (props) => {
	const { menu, updateMenu } = UseMenuData();
	const onChangeHandler = (e) => {
		updateMenu(props.document.page_id, e.target.value);
	}

	// Migrated off assets/css/admin/modules/wizard/documents-menu.scss `.cmplz-single-document-menu`
	// (`display:grid; grid-template-columns:1fr 1fr; margin:10px 0`) onto tw- utilities; the two-column
	// grid is kept, with C-2 vertical rhythm + a gap so the title and select line up. The base reset +
	// tokens reach it from the app-root marker (ADR-001 marker move, H.5 Part 2).
	return (
		<div className="tw-grid tw-grid-cols-2 tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-my-[var(--cmplz-space-xs,_8px)]">
			<div className="tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text,_#0f172a)]">{props.document.title}</div>
			<select value={props.document.menu_id} onChange={(e) => onChangeHandler(e)} className={SELECT_CLS}
				aria-label={props.document.title ? __("Menu for %s", "complianz-gdpr").replace("%s", props.document.title) : __("Select a menu", "complianz-gdpr")}>
				<option value={-1} key={-1}>{__("Select a menu","complianz-gdpr")}</option>
				{menu.map( (menuItem, i)=> <option key={i} value={menuItem.id}>{menuItem.label}</option> )}
			</select>
		</div>
	)

}
export default memo(SingleDocumentMenuControl)
