import {memo} from "@wordpress/element";
import FieldTooltip from "./FieldTooltip";
import Premium from "../Premium";
import {__} from '@wordpress/i18n';
import { clsx } from "../../components/ui/cx";

// Field-row label chrome (T-045, DB-07/DB-08). Migrated off assets/css/admin/modules/wizard/fields.scss
// (`.cmplz-label-container`, `.cmplz-required`, the `.cmplz-parent` size step) onto `tw-` utilities on the
// semantic `--cmplz-*` tokens, referenced with a LITERAL FALLBACK (`var(--token, literal)`) because this
// container carries NO `data-cmplz-ui` — it still wraps the partially-migrated FieldTooltip `<Icon>`, so a
// marker would push the scoped base reset onto that icon (marker discipline, learnings 2026-10-11). The
// `tw-` utilities get their look from the `important:` config (specificity 1,1,0 > legacy), not the marker.
// The legacy class hooks (`cmplz-label-container`, `cmplz-parent`, `cmplz-required`) are kept as behaviour-
// free hooks. Logical utilities only (ADR-007). The required marker changes from the legacy muted grey to
// `--cmplz-danger` (approved design, wizard-fields.md §4); its `(required)` text is unchanged.
const containerCls = clsx(
	"cmplz-label-container",
	"tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)]",
	"tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]"
);
const sizeCls = {
	parent: "tw-text-[length:var(--cmplz-font-size-lg,_1rem)]",
	field: "tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]",
};
const requiredCls = clsx(
	"cmplz-required",
	"tw-font-normal tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)]",
	"tw-text-[color:var(--cmplz-danger,_#d7263d)]"
);

const LabelWrapper = ({id, label, tooltip, premium, required, type, isParentLabel }) => {
	if (!label || label.length===0) return null;

	return (
		<div className={clsx(containerCls, isParentLabel ? clsx("cmplz-parent", sizeCls.parent) : sizeCls.field)}>
			<label htmlFor={id}>{label}
				{required && type!=='radio' && type!=='document' && <span className={requiredCls}> (
					{__('required', 'complianz-gdpr')}
					)</span>}
			</label>
			<FieldTooltip tooltip={tooltip}/>
			<Premium premium={premium} id={id}/>
		</div>
	);
};
export default memo(LabelWrapper);
