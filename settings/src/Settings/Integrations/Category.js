import RadioGroup from "../Inputs/RadioGroup";
import { __ } from '@wordpress/i18n';
import useIntegrations from "./IntegrationsData";

const Category = (props) => {
	const { setScript, fetching } = useIntegrations();
	const script = props.script;

	const onChangeHandler = (value, property) => {
		let copyScript = {...script};
		copyScript[property] = value;
		setScript(copyScript, props.type);
	}

	const options = {
		statistics: __("Statistics","complianz-gdpr"),
		marketing: __("Marketing","complianz-gdpr"),
	}

	return (
		<>
				<label className="tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-font-medium">{__("Category", "complianz-gdpr")}</label>
				<RadioGroup
					disabled={fetching}
					label={__("Marketing", "complianz-gdpr")} id="category" value={script.category}
					onChange={(value)=>onChangeHandler(value, 'category')}
					defaultValue={"marketing"}
					options={options}
				/>

		</>
	);
}
export default Category;
