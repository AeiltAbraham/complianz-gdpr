import TaskElement from '../../Dashboard/TaskElement';
import Placeholder from '../../Placeholder/Placeholder';
import {__} from '@wordpress/i18n';
import useFields from './../Fields/FieldsData';
import useLicense from './LicenseData';
import {useEffect} from '@wordpress/element';
import {memo} from "@wordpress/element";
import useProgress from "../../Dashboard/Progress/ProgressData";
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';

const License = (props) => {
	const {fields, setChangedField, updateField} = useFields();
	const {setProgressLoaded} = useProgress();

	const {
		licenseStatus,
		licenseNotices,
		getLicenseNotices,
		noticesLoaded,
		activateLicense,
		deactivateLicense,
		processing,
	} = useLicense();
	useEffect(() => {
		if (!noticesLoaded) {
			getLicenseNotices();
		}
	}, []);

	const onChangeHandler = (fieldValue) => {
		setChangedField(field.id, fieldValue);
		updateField(field.id, fieldValue);
	};

	const toggleActivation = async () => {
		if (licenseStatus === 'valid') {
			await deactivateLicense();
		} else {
			await activateLicense(props.field.value);
		}
		//ensure a reload of the progress notices
		setProgressLoaded(false);
	};

	let field = props.field;
	/**
	 * There is no "PasswordControl" in WordPress react yet, so we create our own
	 * license field.
	 */
	let processingClass = processing ? 'cmplz-processing' : '';
	/*
	 * Migrated to the C-2 system (Stage H.8). The raw `<input>` + `button button-default` (the
	 * marker-move landmines) become the `ui/TextField` (type password) + `ui/Button` primitives. The
	 * `.cmplz-license-field` flex row is MARKED `data-cmplz-ui` — a pure-primitive row (input + button
	 * only) — so both primitives get the base reset (B1 border-style; the `--cmplz-*` tokens) regardless
	 * of the still-deferred app-root marker move. The `.cmplz-license .cmplz-license-field` (flex),
	 * `.cmplz-processing` (dim) and `.cmplz-task-element` (notice padding) rules in legacy-globals stay:
	 * `cmplz-license` is auto-applied by Field.js (`cmplz-` + field.type) and TaskElement is shared.
	 */
	return (
		<div className="components-base-control">
			<div className="cmplz-license-field" data-cmplz-ui>
				<TextField
					type="password"
					id={field.id}
					value={field.value}
					onChange={(e) => onChangeHandler(e.target.value)}
					className="tw-flex-1"
				/>
				<Button
					variant="secondary"
					disabled={processing}
					onClick={() => toggleActivation()}
					className="tw-ms-[var(--cmplz-space-xs,_8px)] tw-shrink-0"
				>
					{licenseStatus === 'valid' &&
						__('Deactivate', 'complianz-gdpr') }
					{licenseStatus !== 'valid' &&
						__('Activate', 'complianz-gdpr')}
				</Button>
			</div>
			{!noticesLoaded && <Placeholder></Placeholder>}
			{noticesLoaded && <div className={processingClass}>
				{licenseNotices.map(
					(notice, i) => <TaskElement key={i} index={i} notice={notice} highLightField=""/>)}
			</div>}
		</div>
	);
};

export default memo(License)
