import { __ } from '@wordpress/i18n';
import {
    useEffect,
} from '@wordpress/element';
import { clsx } from "../../components/ui/cx";
import useProgress from "./ProgressData";

// Task filter (All / Remaining) migrated off assets/css/admin/modules/progress.scss onto tw- pills on the
// semantic tokens WITH LITERAL FALLBACKS (design/dashboard-preview.html, T-048). The links keep their
// accessible names + the cmplz-task-switcher/cmplz-active-filter hooks; the active pill is derived from
// the live filter state rather than the legacy container-class cascade.
const PILL_BASE = "tw-inline-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)] tw-cursor-pointer tw-no-underline tw-rounded-full tw-border tw-border-solid tw-px-[10px] tw-py-[var(--cmplz-space-2xs,_4px)] tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)]";
const PILL_ON = "tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-border-[color:var(--cmplz-accent-subtle,_#e3f2ff)] tw-text-[color:var(--cmplz-accent-on-subtle,_#17608f)] tw-font-semibold";
const PILL_OFF = "tw-bg-[var(--cmplz-surface,_#ffffff)] tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-text-[color:var(--cmplz-text-muted,_#475569)]";
const pill = (active) => clsx(PILL_BASE, active ? PILL_ON : PILL_OFF);

const ProgressHeader = () => {
    const {setFilter, filter, fetchFilter, notices, progressLoaded} = useProgress();

    useEffect( () => {
        fetchFilter();
    }, [] );

    let all_task_count = 0;
    let open_task_count = 0;
    all_task_count = progressLoaded ? notices.length : 0;
    let openNotices = notices.filter(function (notice) {
        return notice.status!=='completed';
    });
    open_task_count = openNotices.length;
    return (
		<>
			<h3 className="cmplz-grid-title cmplz-h4 tw-m-0">{ __( "Progress", 'complianz-gdpr' ) }</h3>
			<div className="cmplz-grid-item-controls">
				<div className={clsx("cmplz-task-switcher-container cmplz-active-filter-"+filter, "tw-inline-flex tw-gap-[var(--cmplz-space-2xs,_4px)]")}>
				<a href="#" className={clsx("cmplz-task-switcher cmplz-all-tasks", pill(filter==='all'))} onClick={() => setFilter('all')} data-filter="all">
					{ __( "All tasks", "complianz-gdpr" ) }
				<span className="rsssl_task_count">({all_task_count})</span>
				</a>
					<a href="#" className={clsx("cmplz-task-switcher cmplz-remaining-tasks", pill(filter==='remaining'))} onClick={() => setFilter('remaining')} data-filter="remaining">
                    	{ __( "Remaining tasks", "complianz-gdpr" )}
						<span className="rsssl_task_count">({open_task_count})</span>
					</a>
				</div>
			</div>
		</>

    );

}
export default ProgressHeader;
