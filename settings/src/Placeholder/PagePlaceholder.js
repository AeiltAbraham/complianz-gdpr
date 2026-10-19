import Error from '../utils/Error';
import Placeholder from './Placeholder';
import {__} from "@wordpress/i18n";
import {useEffect, useState} from "@wordpress/element";;

// Full-page error / lock placeholder (T-041, DB-07/DB-16, ADR-005). Page.js returns this instead of the
// app shell when the settings fail to load (`error`) or the wizard is locked by another user
// (`lockedByUser`). FR-019: BOTH behavioral states are preserved EXACTLY — the <Error> branch (the message
// + "More information" link) and the three lock messages render and behave identically to before.
//
// MARKER DISCIPLINE (learnings 2026-10-11, the T-038 landmine): the header, the grid container and the
// error/lock message are LEGACY chrome — the header rules relocated to legacy-globals.scss (T-039), the
// `.cmplz-grid`/`.cmplz-grid-item*` grid relocated there (T-038), and <Error>'s `button button-default`
// link styled by wp-admin. NONE of them carries `data-cmplz-ui`: the scoped base reset (base.css B1-B5,
// (1,0,0)) would strip their class-based styling with nothing to restore. The LOADING decoration in the
// empty grid cells is composed from <Placeholder> (the Skeleton primitive), which self-marks its OWN
// `data-cmplz-ui` island — so the skeletons get the redesign look while the surrounding chrome stays
// legacy. The legacy shimmer rule (`.cmplz-page-placeholder .cmplz-grid-item:after`) is deleted from
// placeholder.scss, reproduced by the Skeleton pulse; the `cmplz-page-placeholder` hook is dropped with it.
const PagePlaceholder = (props) => {
    let plugin_url = cmplz_settings.plugin_url;
	const [ToastContainer, setToastContainer] = useState(null);
	// Loading iff neither a terminal error nor a foreign lock — gates every loading skeleton so the
	// error/lock states never show misleading aria-busy "loading" decoration.
	const isLoading = !props.error && !(props.lockedByUser > 0);

	useEffect(() => {
		import('react-toastify').then((module) => {
			const ToastContainer = module.ToastContainer;
			setToastContainer(() => ToastContainer);
		});
	}, []);
    return (
        <>
          <div className="cmplz-header-container">

            <div className="cmplz-settings-header">
              <img className="cmplz-header-logo"
                   src={plugin_url + 'assets/images/cmplz-logo.svg'}
                   alt="Complianz logo"/>
            </div>
          </div>
          <div className="cmplz-content-area cmplz-grid cmplz-dashboard">
            <div className="cmplz-grid-item  cmplz-column-2 cmplz-row-2 ">
				{props.error && <Error error={props.error} /> }
				{props.lockedByUser>0 && <>
					<p>{__("The wizard is currently in use by user with ID: ","complianz-gdpr") + props.lockedByUser }</p>
					<p>{__("To prevent conflicts during saving the wizard is temporarily locked.","complianz-gdpr") }</p>
					<p>{__("The lock will automatically clear after two minutes.","complianz-gdpr") }</p>
				</>}
				{/* Pure initial-load (Page.js mounts this with lockedByUser=0 before the fetch resolves):
				    neither error nor a foreign lock, so fill the first cell with the loading skeleton too. */}
				{isLoading && <Placeholder lines="8" />}
			</div>
            {/* The loading-skeleton cells only render while actually loading — during a terminal error
                or a foreign lock, show just the message (cell 1) rather than aria-busy "loading" decoys. */}
            {isLoading && <>
              <div className="cmplz-grid-item cmplz-row-2"><Placeholder lines="8" /></div>
              <div className="cmplz-grid-item cmplz-row-2"><Placeholder lines="8" /></div>
              <div className="cmplz-grid-item  cmplz-column-2"><Placeholder lines="4" /></div>
            </>}
          </div>
				{ToastContainer && (
					<div data-cmplz-isolate="toastify">
						<ToastContainer
						position="bottom-right"
						autoClose={2000}
						limit={3}
						hideProgressBar
						newestOnTop
						closeOnClick
						pauseOnFocusLoss
						pauseOnHover
						theme="light"
					/>
					</div>
				)}
        </>
    );
}

export default PagePlaceholder;
