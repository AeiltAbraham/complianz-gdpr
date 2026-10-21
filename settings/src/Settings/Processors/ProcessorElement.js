import { __ } from '@wordpress/i18n';
import Icon from "../../utils/Icon";
import Panel from "./../Panel";
import useFields from "../../Settings/Fields/FieldsData";
import {memo, useEffect} from "@wordpress/element";
import useProcessingAgreementsData from "../ProcessingAgreements/ProcessingAgreementsData";
import useMenu from "../../Menu/MenuData";
import TextInput from "../Inputs/TextInput";
import SelectInput from "../Inputs/SelectInput";
import { Button } from "../../components/ui/Button";

// Shared detail-row layout (Stage H7, replacing the deleted `.cmplz-details-row*` SCSS).
const rowCls = "tw-flex tw-flex-col tw-py-[5px]";
const rowLabelCls = "tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-font-medium";

const ProcessorElement = (props) => {
	const {updateField, setChangedField, saveFields} = useFields();
	const {documentsLoaded, documents} = useProcessingAgreementsData();
	const {selectedMainMenuItem} = useMenu();
	const [name, setName] = wp.element.useState(props.processor.name ? props.processor.name : '');
	const [purpose, setPurpose] = wp.element.useState(props.processor.purpose ? props.processor.purpose : '');
	const [country, setCountry] = wp.element.useState(props.processor.country ? props.processor.country : '');
	const [data, setData] = wp.element.useState(props.processor.data ? props.processor.data : '');

	const onChangeHandler = (value, id) => {
		let processors = [...props.field.value];
		if ( !Array.isArray(processors) ) {
			processors = [];
		}

		//update processor with index props.index
		let currentProcessor = {...processors[props.index]};
		currentProcessor[id] = value;
		processors[props.index] = currentProcessor;
		updateField(props.field.id, processors);
		setChangedField(props.field.id, processors);
	}

	useEffect(() => {
		const typingTimer = setTimeout(() => {
			onChangeHandler(name, 'name');
		}, 500);

		return () => {
			clearTimeout(typingTimer);
		};
	}, [name]);
	useEffect(() => {
		const typingTimer = setTimeout(() => {
			onChangeHandler(data, 'data');
		}, 500);
		return () => {
			clearTimeout(typingTimer);
		};
	}, [data]);

	useEffect(() => {
		const typingTimer = setTimeout(() => {
			onChangeHandler(country, 'country');
		}, 500);
		return () => {
			clearTimeout(typingTimer);
		};
	}, [country]);
	useEffect(() => {
		const typingTimer = setTimeout(() => {
			onChangeHandler(purpose, 'purpose');
		}, 500);
		return () => {
			clearTimeout(typingTimer);
		};
	}, [purpose]);

	const onDeleteHandler = async (e) => {
		let processors = props.field.value;
		if ( !Array.isArray(processors) ) {
			processors = [];
		}
		let processorsCopy = [...processors];
		if ( processorsCopy.hasOwnProperty(props.index) ) {
			processorsCopy.splice(props.index, 1);
		}
		updateField(props.field.id, processorsCopy);
		setChangedField(props.field.id, processorsCopy);
		await saveFields( selectedMainMenuItem, false, false );
	}
	let processingAgreements = documentsLoaded ? [...documents] : [];
	processingAgreements.push({id:-1, title:__('A Processing Agreement outside Complianz Privacy Suite', 'complianz-gdpr'),region:'',service:'',date:''});

	const Details = (processor) => {
		return (
			<>
				<div className={rowCls}>
					<label className={rowLabelCls}>{__("Name", "complianz-gdpr")}</label>
					<TextInput onChange={ ( value ) => setName(value) } placeholder={__("Name", "complianz-gdpr")} name="name" value={name} />
				</div>
				<div className={rowCls}>
					<label className={rowLabelCls}>{__("Country", "complianz-gdpr")}</label>
					<TextInput onChange={ ( value ) => setCountry(value) } placeholder={__("Country", "complianz-gdpr")} name="country" value={country} />
				</div>
				<div className={rowCls}>
					<label className={rowLabelCls}>{__("Purpose", "complianz-gdpr")}</label>
					<TextInput onChange={ ( value ) => setPurpose(value) } placeholder={__("Purpose", "complianz-gdpr")} name="purpose" value={purpose} />
				</div>
				<div className={rowCls}>
					<label className={rowLabelCls}>{__("Data", "complianz-gdpr")}</label>
					<TextInput onChange={ ( value ) => setData(value) } placeholder={__("Data", "complianz-gdpr")} name="data" value={data} />
				</div>
				<div className={rowCls}>
					<label className={rowLabelCls}>{__("Processing Agreement", "complianz-gdpr")}</label>
					{documentsLoaded &&
						<SelectInput
							value={processor.processing_agreement}
							canBeEmpty={false}
							options={[
								{value: 0, label: __("Select an option", "complianz-gdpr")},
								...processingAgreements.map((pa) => ({value: pa.id, label: pa.title})),
							]}
							onChange={ ( value ) => onChangeHandler(value, 'processing_agreement') }
						/>
					}
					{!documentsLoaded &&
						<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-px-[var(--cmplz-space-xs,_8px)]">
							<div><Icon name = "loading" color = 'grey' /></div><div>{__("Loading...", "complianz-gdpr")}</div>
						</div>
					}
				</div>
				<div data-cmplz-ui className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-mt-[var(--cmplz-space-s,_12px)] tw-pb-[5px]">
					<Button variant="error" onClick={ ( e ) => onDeleteHandler(e) }>{__("Delete", "complianz-gdpr")}</Button>
				</div>
			</>
		);
	}

	//ensure defaults
	let processor = {...props.processor};
	if (!processor.processing_agreement) processor.processing_agreement = 0;
	return (
		<><Panel summary={name} details={Details(processor)}/></>
	);
}
export default memo(ProcessorElement);
