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
	// Bundle D B2: the legacy `.cmplz-license .cmplz-processing` dim (opacity 0.3) migrates to a tw- utility.
	let processingClass = processing ? 'tw-opacity-30' : '';
	/*
	 * Migrated to the C-2 system (Stage H.8). The raw `<input>` + `button button-default` (the
	 * marker-move landmines) become the `ui/TextField` (type password) + `ui/Button` primitives. Both
	 * primitives get the base reset (B1 border-style; the `--cmplz-*` tokens) from the app-root
	 * `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move, H.5 Part 2 — the former per-row
	 * `data-cmplz-ui` here is dropped). Bundle D B2 re-homes the legacy `.cmplz-license` tail out of
	 * legacy-globals.scss: the `.cmplz-license-field` flex + `.cmplz-processing` dim become tw- utilities
	 * here, while the shared-child TaskElement notice padding stays a `.cmplz-license`-scoped rule in
	 * components.css (so Dashboard TaskElement — not under `.cmplz-license` — is unaffected). `cmplz-license`
	 * is auto-applied by Field.js (`cmplz-` + field.type).
	 */
	return (
		<div className="components-base-control">
			<div className="cmplz-license-field tw-flex">
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
