import {
    useEffect
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import TaskElement from "./../TaskElement";
import Placeholder from '../../Placeholder/Placeholder';
import useProgress from "./ProgressData";
import useFields from "../../Settings/Fields/FieldsData";

const ProgressBlock = () => {
    const {percentageCompleted, filter, notices, progressLoaded, fetchProgressData, error} = useProgress();
	const {fetchAllFieldsCompleted, allRequiredFieldsCompleted, fields} = useFields();

    useEffect( () => {
		const run = async () => {
			if ( !progressLoaded ) {
				await fetchProgressData();
			}
			fetchAllFieldsCompleted();

		}
		run();
    }, [filter, fields] );

    const getStyles = () => {
        return Object.assign(
            {},
            {width: percentageCompleted+"%"},
        );
    }

    let progressBarColor = '';
    if ( percentageCompleted<80 ) {
        progressBarColor += 'cmplz-orange';
    }
    if ( !progressLoaded || error ) {
        return (
            <Placeholder lines='9' error={error}></Placeholder>
        );
    }

    let noticesOutput = notices;
    if ( filter==='remaining' ) {
        noticesOutput = noticesOutput.filter(function (notice) {
            return notice.status!=='completed';
        });
    }

	if ( !allRequiredFieldsCompleted && noticesOutput.filter(notice => notice.id==='all_fields_completed').length===0 ) {
		let notice = {
			id: 'all_fields_completed',
			status: 'urgent',
			message: __( 'Not all fields have been entered, or you have not clicked the "finish" button yet.', 'complianz-gdpr' ),
		}
		noticesOutput.push(notice);
	}
	if (allRequiredFieldsCompleted) {
		noticesOutput = noticesOutput.filter(notice => notice.id!=='all_fields_completed');
	}

	//sorting by status
	noticesOutput.sort(function(a, b) {
		if (a.status === b.status) {
			return 0;
		}
		else {
			return (a.status < b.status) ? 1 : -1;
		}
	});
	let openNotices = noticesOutput.filter(notice => notice.status==='open' || notice.status==='urgent');
    // Progress block body (T-048). Migrated off assets/css/admin/modules/progress.scss onto tw- utilities
    // on the semantic tokens WITH LITERAL FALLBACKS, matching design/dashboard-preview.html. Markerless
    // (GridBlock wraps unmigrated bodies). The <80% warning tint keeps the legacy .cmplz-orange hook + logic.
    // The progress-track reuses --cmplz-surface-sunken (ADR-015 / dashboard.md §3: zero new tokens).
    const barColorCls = percentageCompleted < 80
        ? 'tw-bg-[var(--cmplz-warning,_#eab308)]'
        : 'tw-bg-[var(--cmplz-success,_#1f7a34)]';
    return (
        <div className="cmplz-progress-block tw-flex tw-flex-col">
            <div className="cmplz-progress-bar tw-mb-[var(--cmplz-space-m,_16px)]">
                <div className="cmplz-progress tw-h-[10px] tw-overflow-hidden tw-rounded-full tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]">
                    <div className={'cmplz-bar ' + progressBarColor + ' tw-h-full tw-rounded-full ' + barColorCls} style={getStyles()}></div>
                </div>
            </div>

            <div className="cmplz-progress-text tw-flex tw-items-center tw-gap-[var(--cmplz-space-m,_16px)] tw-mb-[var(--cmplz-space-m,_16px)]">
                <h1 className="cmplz-progress-percentage tw-m-0 tw-text-[2rem] tw-font-extrabold tw-leading-none">
                    {percentageCompleted}%
                </h1>
                <h5 className="cmplz-progress-text-span tw-m-0 tw-font-medium tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
                    {percentageCompleted < 100 && __( 'Consent Management is activated on your site.',  'complianz-gdpr' )+' ' }
                    {percentageCompleted< 100 && openNotices.length===1 && __( 'You still have 1 task open.', 'complianz-gdpr' )}
                    {percentageCompleted < 100 && openNotices.length>1 && __( 'You still have %s tasks open.','complianz-gdpr' ).replace('%s', openNotices.length) }
					{percentageCompleted===100  && __( 'Well done! Your website is ready for your selected regions.', 'complianz-gdpr' )}

                </h5>
            </div>

            <div className="cmplz-scroll-container tw-h-[230px] tw-overflow-y-auto">
                {noticesOutput.map((notice, i) => <TaskElement key={i} index={i} notice={notice}/>)}
            </div>
        </div>
    );

}
export default ProgressBlock;
