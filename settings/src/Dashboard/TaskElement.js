import { __ } from '@wordpress/i18n';
import Icon from '../utils/Icon'
import {dispatch,} from '@wordpress/data';
import * as cmplz_api from "../utils/api";
import sleeper from "../utils/sleeper";
import useFields from "../Settings/Fields/FieldsData";
import useProgress from "./Progress/ProgressData";
import useMenu from "../Menu/MenuData";
import DOMPurify from 'dompurify';
import { Button } from "../components/ui/Button";
import { secondaryLinkButtonCls } from "../components/ui/downloadLink";

const TaskElement = ({notice, index}) => {
	const {dismissNotice, fetchProgressData} = useProgress();
	const {getField, setHighLightField, fetchFieldsData} = useFields();
	const {setSelectedSubMenuItem} = useMenu();

	const handleClick = async () => {
		setHighLightField(notice.highlight_field_id);
		let highlightField = getField(notice.highlight_field_id);
		await setSelectedSubMenuItem(highlightField.menu_id);
	}

	const handleClearCache = async (cache_id) => {
		let data = {};
		data.cache_id = cache_id;
		cmplz_api.doAction('clear_cache', data).then( async (response) => {
			const notice = dispatch('core/notices').createNotice(
				'success',
				__('Re-started test', 'complianz-gdpr'),
				{
					__unstableHTML: true,
					id: 'cmplz_clear_cache',
					type: 'snackbar',
					isDismissible: true,
				}
			).then(sleeper(3000)).then((response) => {
				dispatch('core/notices').removeNotice('rsssl_clear_cache');
			});
			await fetchFieldsData();
			await fetchProgressData();
		});
	}

	let premium = notice.icon==='premium';
	//treat links to complianz.io and internal links different.
	let urlIsExternal = notice.url && notice.url.indexOf('complianz.io') !== -1;
	let statusNice =  notice.status.charAt(0).toUpperCase() +  notice.status.slice(1);
	return(
		<div key={index} className="cmplz-task-element tw-flex tw-items-start tw-gap-[var(--cmplz-space-s,_12px)] tw-py-[var(--cmplz-space-s,_12px)] tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] [&:last-child]:tw-border-b-0" data-testid={'cmplz-task-' + notice.id}>
			<span className={'cmplz-task-status cmplz-' + notice.status}>{ statusNice }</span>
			<p className="cmplz-task-message tw-flex-1 tw-m-0"
		    	dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.message) }}></p>{/* nosemgrep: react-dangerouslysetinnerhtml */}
			{urlIsExternal && notice.url && <a target="_blank" href={notice.url} rel="noopener noreferrer">{__("More info", "complianz-gdpr")}</a> }
			{/* Stage H.9: the raw `button button-secondary` task controls → the C-2 secondary button look
			    (the dead `cmplz-task-enable` styling hook — no CSS rule, no JS/PHP binding, inline onClick —
			    is dropped). The two `<span onClick>` become real `<button>`s via `ui/Button` (keyboard/role
			    a11y); the `<a href>` NAVIGATES (internal URL) so it stays an anchor. Markerless Dashboard task
			    list, so `tw-border-solid` / the link class pins the border-style (Preflight off, B1 — T-052). */}
			{notice.clear_cache_id && <Button variant="secondary" className="tw-border-solid" onClick={ () => handleClearCache(notice.clear_cache_id ) }>{__("Re-check", "complianz-gdpr")}</Button> }
			{!premium && !urlIsExternal && notice.url && <a className={secondaryLinkButtonCls} href={notice.url}>{__("View", "complianz-gdpr")}</a> }
			{!premium && notice.highlight_field_id && <Button variant="secondary" className="tw-border-solid" onClick={() => handleClick()}>{__("View", "complianz-gdpr")}</Button> }
			{notice.plus_one && <span className='cmplz-plusone tw-inline-block tw-min-w-[15px] tw-h-[18px] tw-rounded-full tw-bg-[#d63638] tw-px-[5px] tw-py-[2px] tw-text-center tw-leading-none tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)] tw-text-[color:#ffffff]'>1</span>}
			{notice.dismissible && notice.status!=='completed' &&
				<div className="cmplz-task-dismiss tw-flex tw-items-center hover:tw-opacity-70">
					<button type='button' aria-label={__('Dismiss', 'complianz-gdpr')} className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-[4px] tw-leading-none" onClick={(e) => dismissNotice(notice.id) }>
						<Icon name='times' size={12} />
					</button>
				</div>
			}
		</div>
	);
}

export default TaskElement;
