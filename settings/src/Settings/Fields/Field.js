import {useState, useEffect, memo} from "@wordpress/element";
import useFields from '../../Settings/Fields/FieldsData';
import {__} from '@wordpress/i18n';
import Icon from "../../utils/Icon";
import LabelWrapper from "./LabelWrapper";
import DOMPurify from "dompurify";
import Placeholder from "../../Placeholder/Placeholder";
import { clsx } from "../../components/ui/cx";

// Field-row chrome (T-045, DB-07/DB-08). Migrated off assets/css/admin/modules/wizard/fields.scss
// (`.cmplz-field-wrap`, the row-direction field-type variants, `.cmplz-error-text`, `.cmplz-comment`,
// `.cmplz-highlight`) onto `tw-` utilities on the semantic `--cmplz-*` tokens with LITERAL FALLBACKS. The
// row wrapper carries no `data-cmplz-ui` of its own — it is a layout container. After the ADR-001 MARKER
// MOVE (Stage H.5 Part 2) the app-root marker covers the composite bodies it wraps (finish/plugins_overview/
// documents_menu/cookiedatabase_sync/create-documents/cookie_scan, DocumentControl's url field), which is
// now safe because all of them are migrated to the C-2 system (H1–H9). The row look comes from `tw-`
// utilities (specificity 1,1,0 via the `important:` config). The card frame (SettingsGroup) relocated its
// grid-item layout to legacy-globals.scss and the row keeps its own inline padding. Legacy class
// hooks (`cmplz-field-wrap`, `cmplz-<type>`, `cmplz-highlight`, `cmplz-error`, `cmplz-comment`) are kept.
// §4 state design: the invalid ring now lives on the TextField/Textarea primitives (`invalid` prop driven
// by the error path), not a wrapper->descendant selector; the save-highlight is a `--cmplz-success-surface`
// row flash; `cmplz-comment-<status>` maps to the four tint callouts; the required marker uses `--cmplz-danger`.

// Field types whose row lays the label and control out on one line (was the legacy
// `.cmplz-field-wrap.cmplz-checkbox/.cmplz-button/...` flex-row block).
const ROW_FLEX_TYPES = ['checkbox', 'banner-reset-button', 'copy-multisite', 'export', 'button'];

// cmplz-comment-<status> -> faded status surface callout (wizard-fields.md §4).
const COMMENT_TINT = {
	info: 'tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)]',
	success: 'tw-bg-[var(--cmplz-success-surface,_#e9f6ec)]',
	warning: 'tw-bg-[var(--cmplz-warning-surface,_#fbf4da)]',
	error: 'tw-bg-[var(--cmplz-danger-surface,_#fdebed)]',
};
const COMMENT_CALLOUT = clsx(
	'tw-not-italic tw-rounded-[var(--cmplz-radius-s,_8px)]',
	'tw-px-[var(--cmplz-space-s,_12px)] tw-py-[var(--cmplz-space-xs,_8px)]',
	'tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-text-[color:var(--cmplz-text,_#0f172a)]'
);
const COMMENT_PLAIN = 'tw-italic tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]';
// No `cmplz-error-text` hook: this migrated element is fully tw-styled, and the legacy global
// `#complianz .cmplz-error-text` rule is relocated to legacy-globals.scss for its non-migrated consumers
// (AceEditorControl, CreateProcessingAgreements) — keeping the hook here would let that rule's `p`
// sub-selector (1,1,1) override this element's danger/size/non-italic (T-045 review fix).
const ERROR_TEXT_CLS = clsx(
	'tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)]',
	'tw-text-[color:var(--cmplz-danger,_#d7263d)] tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]'
);

const COMPONENT_MAP = {
	'multicheckbox': {
		componentPath: 'Settings/Inputs/CheckboxGroup',
	},
	'checkbox': {
		componentPath: 'Settings/Inputs/SwitchInput',
	},
	'radio': {
		componentPath: 'Settings/Inputs/RadioGroup',
	},
	'select': {
		componentPath: 'Settings/Inputs/SelectInput',
	},
	'placeholder_preview': {
		componentPath: 'Settings/PlaceholderPreview/PlaceholderPreview',
	},
	'text': {
		componentPath: 'Settings/Inputs/TextInput',
	},
	'password': {
		componentPath: 'Settings/Inputs/PasswordInput',
	},
	'textarea': {
		componentPath: 'Settings/Inputs/TextAreaInput',
	},
	'phone': {
		componentPath: 'Settings/Inputs/PhoneInput',
	},
	'email': {
		componentPath: 'Settings/Inputs/EmailInput',
	},
	'number': {
		componentPath: 'Settings/Inputs/NumberInput',
	},
	'url': {
		componentPath: 'Settings/Inputs/URLInput',
	},
	'text_checkbox': {
		componentPath: 'Settings/Inputs/TextSwitchInput',
	},
	'statistics': {
		componentPath: 'Statistics/Statistics',
	},
	'statistics-feedback': {
		componentPath: 'Statistics/StatisticsFeedback',
	},
	'import': {
		componentPath: 'Settings/Export/ImportControl',
	},
	'export': {
		componentPath: 'Settings/Export/ExportControl',
	},
	'integrations-services': {
		componentPath: 'Settings/Integrations/ServicesControl',
	},
	'integrations-plugins': {
		componentPath: 'Settings/Integrations/PluginsControl',
	},
	'integrations-script-center': {
		componentPath: 'Settings/Integrations/ScriptCenterControl',
	},
	'borderradius': {
		componentPath: 'Settings/Inputs/BorderInput',
		customProps: {
			units: ['px', '%', 'em', 'rem'],
		}
	},
	'borderwidth': {
		componentPath: 'Settings/Inputs/BorderInput',
	},
	'colorpicker': {
		componentPath: 'Settings/ColorPicker/ColorPickerControl',
	},
	'wcag_contrast_checker': {
		componentPath: 'Settings/WcagContrastChecker/WcagContrastChecker',
	},
	'document': {
		componentPath: 'Settings/DocumentControl',
	},
	'hidden': {
		componentPath: 'Settings/Inputs/InputHidden',
	},
	'editor': {
		componentPath: 'Settings/Editor/Editor',
	},
	'css': {
		componentPath: 'Settings/Editor/AceEditorControl',
	},
	'cookie_scan': {
		componentPath: 'Settings/CookieScan/CookieScanControl',
	},
	'finish': {
		componentPath: 'Settings/Finish/FinishControl',
	},
	'cookiedatabase_sync': {
		componentPath: 'Settings/Cookiedatabase/CookieDatabaseSyncControl',
	},
	'translation_management': {
		componentPath: 'Settings/Translations/TranslationManagementControl',
	},
	'translation_automation': {
		componentPath: 'Settings/Translations/TranslationAutomationControl',
	},
	'documents_menu': {
		componentPath: 'Settings/DocumentsMenu/DocumentsMenuControl',
	},
	'documents_menu_region_redirect': {
		componentPath: 'Settings/DocumentsMenu/DocumentsMenuControl',
	},
	'plugins_privacy_statements': {
		componentPath: 'Settings/PluginsPrivacyStatements/PluginsPrivacyStatementsControl',
	},
	'button': {
		componentPath: 'Settings/Inputs/Button',
	},
	'debug-data': {
		componentPath: 'Settings/Debug/DebugDataControl',
	},
	'banner-reset-button': {
		componentPath: 'Settings/CookieBannerPreview/ResetBannerButton',
	},
	'processing-agreements': {
		componentPath: 'Settings/ProcessingAgreements/ProcessingAgreementsControl',
	},
	'create-processing-agreements': {
		componentPath: 'Settings/ProcessingAgreements/CreateProcessingAgreements',
	},
	'data-breach-reports': {
		componentPath: 'Settings/DataBreachReports/DataBreachReportsControl',
	},
	'create-data-breach-reports': {
		componentPath: 'Settings/DataBreachReports/CreateDataBreachReport',
	},
	'proof-of-consent': {
		componentPath: 'Settings/ProofOfConsent/ProofOfConsentControl',
	},
	'records-of-consent': {
		componentPath: 'Settings/RecordsOfConsent/RecordsOfConsentControl',
	},
	'datarequests': {
		componentPath: 'Settings/DataRequests/DatarequestsControl',
	},
	'export-datarequests': {
		componentPath: 'Settings/DataRequests/ExportDatarequests',
	},
	'export-records-of-consent': {
		componentPath: 'Settings/RecordsOfConsent/ExportRecordsOfConsent',
	},
	'create-proof-of-consent': {
		componentPath: 'Settings/ProofOfConsent/CreateProofOfConsent',
	},
	'processors': {
		componentPath: 'Settings/Processors/ProcessorControl',
	},
	'thirdparties': {
		componentPath: 'Settings/ThirdParties/ThirdPartyControl',
	},
	'create-documents': {
		componentPath: 'Settings/CreateDocuments/CreateDocumentsControl',
	},
	'plugins_overview': {
		componentPath: 'Settings/PluginsOverviewControl',
	},
	'license': {
		componentPath: 'Settings/License/License',
	},
	'banner_logo': {
		componentPath: 'Settings/CookieBannerPreview/BannerLogoControl',
	},
	'support': {
		componentPath: 'Settings/Support/Support',
	},
	'security_measures': {
		componentPath: 'Settings/SecurityMeasures/SecurityMeasures',
	},
	'install-plugin': {
		componentPath: 'Settings/InstallPlugin/InstallPlugin',
	},
	'copy-multisite': {
		componentPath: 'Settings/Multisite/CopyMultisite',
	},
	'websitescan_status': {
		componentPath: 'Settings/WebSiteScan/WebSiteScanStatus',
	},
	'websitescan_actions': {
		componentPath: 'Settings/WebSiteScan/WebSiteScanActions',
	}
};

const Field = ({field, highLightField, isCustomField, customChangeHandler}) => {
	const {updateField, getFieldValue, setChangedField} = useFields();
	const [Component, setComponent] = useState(null);
	const [error, setError] = useState(null);
	let ExtendedComponentMap = {...COMPONENT_MAP};
	// add customProps to button component extendedComponentMap
	if (field.type === 'button') {
		ExtendedComponentMap = {
			...COMPONENT_MAP,
			'button': {
				...COMPONENT_MAP.button,
				customProps: {
					action: field.action
				}
			}
		}
	}
	const ComponentInfo = ExtendedComponentMap[field.type];
	useEffect(() => {
		if (COMPONENT_MAP[field.type]) {
			import(`../../${COMPONENT_MAP[field.type].componentPath}`).then(
				(component) => {
					if (component.default) {
						setComponent(component.default);
					}
				}
			).catch((error) => {
				console.error(`Error loading component of type ${field.type}: ${error}`);
			});
		}
	}, [field.type]);

	const onChangeHandler = (fieldValue) => {
		if (error) setError(null);
		if ( field.required && ((Array.isArray(fieldValue) && fieldValue.every(item => item === '')) || fieldValue === '') ) {
			onError('required');
		}
		if ( isCustomField ){
			customChangeHandler(field.id, fieldValue);
		} else {
			updateField(field.id, fieldValue);
			setChangedField(field.id, fieldValue);
		}
	};

	const onError = (error) => {
		const availableErrors = {
			'required': __('This field is required', 'complianz-gdpr'),
			'invalid_url': __('Please enter a valid URL', 'complianz-gdpr'),
			'invalid_email': __('Please enter a valid email address', 'complianz-gdpr'),
			'invalid_number': __('Please enter a valid number', 'complianz-gdpr'),
			'invalid_phone': __('Please enter a valid phone number', 'complianz-gdpr'),
		}
		if (availableErrors[error]) {
			setError(availableErrors[error]);
		} else {
			setError(null);
		}
	}

	if ( !field.conditionallyDisabled && ComponentInfo) {
		const isRowFlex = ROW_FLEX_TYPES.includes(field.type);
		const isHighlighted = highLightField === field.id;
		const fieldClass = clsx(
			'cmplz-field-wrap',
			'cmplz-' + field.type,
			isRowFlex
				? 'tw-flex tw-flex-row tw-items-center tw-justify-between tw-flex-wrap tw-gap-[var(--cmplz-space-s,_12px)]'
				: 'tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)]',
			'tw-px-[var(--cmplz-space-l,_24px)]',
			'[&>.cmplz-field-wrap]:tw-ps-0',
			// Save-highlight: the transient one-shot flash + persistent green inline-start marker live in
			// page.css (`#complianz .cmplz-highlight`, literals — the row is outside the token islands), so
			// the row flashes and fades out as before instead of a static permanent fill (T-045 review fix).
			isHighlighted && 'cmplz-highlight',
			error && 'cmplz-error'
		);

		const {customProps} = ComponentInfo;
		const commentStatusClass = field.comment_status ? 'cmplz-comment-' + field.comment_status : '';
		const commentTint = COMMENT_TINT[field.comment_status];
		const commentClass = clsx(
			'cmplz-comment',
			commentStatusClass,
			commentTint ? clsx(COMMENT_CALLOUT, commentTint) : COMMENT_PLAIN,
			field.type === 'checkbox' && 'tw-w-full'
		);
		let label = field.label;
		if ( label ) {
			//allow for dynamic content in labels, like in the compile_statistics field, where the tool is replaced in the label.
			const pattern = /{cmplz_dynamic_content=(.*?)}/;
			const match = label.match(pattern);
			if ( match && match.length > 1) {
				const fieldName = match[1];
				let dynamicContent = getFieldValue(fieldName);
				//split string on - into array, make each word uppercase, and join again, with a space in between
				dynamicContent = dynamicContent.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

				label = label.replace('{cmplz_dynamic_content=' + fieldName + '}', dynamicContent);
			}
		}
		return (
			<div className={fieldClass} data-testid={'field-' + field.id}>
				{ field.parent_label &&
					<LabelWrapper
						id={field.id}
						label={field.parent_label}
						tooltip={field.tooltip}
						premium={field.premium}
						required={field.required}
						type={field.type}
						isParentLabel={true}
					/>
				}

				{ field.type !== 'hidden' &&
					<LabelWrapper
						id={field.id}
						label={label}
						tooltip={field.tooltip}
						premium={field.premium}
						required={field.required}
						type={field.type}
						isParentLabel={false}
					/>
				}
				{Component && (
					<Component
						id={field.id}
						label={label}
						value={field.value}
						onChange={onChangeHandler}
						required={field.required}
						defaultValue={field.default}
						disabled={field.disabled}
						options={field.options}
						fields={field.fields}
						field={field}
						placeholder={field.placeholder}
						onError={onError}
						error={!!error}
						{...customProps}
					/>
				)}
				{ ! Component && (
						<Placeholder lines="1"></Placeholder>
				)}
				{field.comment && (
					<>
						{/* nosemgrep: react-dangerouslysetinnerhtml */}
						<div
							className={commentClass}
							dangerouslySetInnerHTML={ { __html: DOMPurify.sanitize(field.comment) } } >
						</div>
					</>
				)}
				{error && (
					<div className={clsx(ERROR_TEXT_CLS, isRowFlex && 'tw-w-full')}>
						<Icon name={'error'} size={13} color={'red'}/>
						<p className="tw-m-0">{error}</p>
					</div>

				)}
			</div>
		);
	}
	return null;
};
export default memo(Field);
