import Panel from "./../Panel";
import useFields from "../../Settings/Fields/FieldsData";
import {memo, useEffect} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import useMenu from "../../Menu/MenuData";
import TextInput from "../Inputs/TextInput";
import { Button } from "../../components/ui/Button";

// Shared detail-row layout (Stage H7, replacing the deleted `.cmplz-details-row*` SCSS).
const rowCls = "tw-flex tw-flex-col tw-py-[5px]";
const rowLabelCls = "tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-font-medium";

const ThirdPartyElement = (props) => {
	const {updateField, setChangedField} = useFields();
	const {selectedMainMenuItem} = useMenu();
	const [name, setName] = wp.element.useState(props.thirdParty.name ? props.thirdParty.name : '');
	const [purpose, setPurpose] = wp.element.useState(props.thirdParty.purpose ? props.thirdParty.purpose : '');
	const [country, setCountry] = wp.element.useState(props.thirdParty.country ? props.thirdParty.country : '');
	const [data, setData] = wp.element.useState(props.thirdParty.data ? props.thirdParty.data : '');

	const onChangeHandler = (value, id) => {
		let thirdParties = [...props.field.value];
		if ( !Array.isArray(thirdParties) ) {
			thirdParties = [];
		}

		//update thirdParty with index props.index
		let currentThirdParty = {...thirdParties[props.index]};
		currentThirdParty[id] = value;
		thirdParties[props.index] = currentThirdParty;
		updateField(props.field.id, thirdParties);
		setChangedField(props.field.id, thirdParties);
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
		let thirdParties = props.field.value;
		if ( !Array.isArray(thirdParties) ) {
			thirdParties = [];
		}

		//remove thirdParty by props.index
		let thirdPartiesCopy = [...thirdParties];

		if ( thirdPartiesCopy.hasOwnProperty(props.index) ) {
			thirdPartiesCopy.splice(props.index, 1);
		}
		updateField(props.field.id, thirdPartiesCopy);
		setChangedField(props.field.id, thirdPartiesCopy);

		await saveFields( selectedMainMenuItem, false, false );
	}

	const Details = () => {
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
				<div data-cmplz-ui className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-mt-[var(--cmplz-space-s,_12px)] tw-pb-[5px]">
					<Button variant="error" onClick={ ( e ) => onDeleteHandler(e) }>{__("Delete", "complianz-gdpr")}</Button>
				</div>
			</>
		);
	}

	return (
		<><Panel summary={name} details={Details()}/></>
	);
}
export default memo(ThirdPartyElement);
