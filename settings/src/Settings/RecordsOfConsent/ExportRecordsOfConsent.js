import { __ } from '@wordpress/i18n';
import {useState, useEffect} from "@wordpress/element";
import useRecordsOfConsentData from "./useRecordsOfConsentData";
import Icon from "../../utils/Icon";
import {Button} from "../../components/ui/Button";
import {downloadButtonCls} from "../../components/ui/downloadLink";
import useDate from "../../DateRange/useDateStore";
import {memo} from "@wordpress/element";
const ExportRecordsOfConsent = () => {
	const { noData, startExport, exportLink, fetchExportRecordsOfConsentProgress, generating, progress} = useRecordsOfConsentData();
	const [DateRange, setDateRange] = useState(null);
	const {startDate, endDate} = useDate();
	useEffect( () => {
		import('../../DateRange/DateRange').then(({ default: DateRange }) => {
			setDateRange(() => DateRange);
		});
	}, []);

	//check if there's an export running
	useEffect ( () => {
		fetchExportRecordsOfConsentProgress(true);
	},[]);

	useEffect( () => {
		//startDate, endDate
		if (progress<100 && generating ) {
			fetchExportRecordsOfConsentProgress(false, startDate, endDate);
		}
	}, [progress]);

	return (
		<>
			<div className={'cmplz-field-button cmplz-table-header'}>
				<div className="cmplz-table-header-controls">
					{DateRange && <DateRange />}
					<Button
						variant="secondary"
						className="tw-border-solid tw-gap-[var(--cmplz-space-xs,_8px)]"
						disabled={generating}
						onClick={()=>startExport()}
					>
						{__("Export to CSV","complianz-gdpr")}
						{generating && <><Icon name = "loading" color = 'grey' />&nbsp;{progress}%</>}
					</Button>
				</div>
			</div>
			{ progress>=100 && (exportLink!=='' || noData ) &&
				<div className="cmplz-selected-document">
					{!noData && __("Your Records Of Consent Export has been completed.","complianz-gdpr")}
					{noData && __("Your selection does not contain any data.","complianz-gdpr")}
					<div className="cmplz-selected-document-controls">
						{!noData && <a className={downloadButtonCls} download href={exportLink}>{__("Download","complianz-gdpr")}</a>}
					</div>
				</div>
			}

		</>
	)
}
export default memo(ExportRecordsOfConsent);
