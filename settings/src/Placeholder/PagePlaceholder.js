import Error from '../utils/Error';
import Placeholder from './Placeholder';
import {__} from "@wordpress/i18n";
import {useEffect, useState} from "@wordpress/element";;

// Full-page error / lock placeholder (T-041, DB-07/DB-16, ADR-005). Page.js returns this instead of the
// app shell when the settings fail to load (`error`) or the wizard is locked by another user
// (`lockedByUser`). FR-019: BOTH behavioral states are preserved EXACTLY — the <Error> branch (the message
// + "More information" link) and the three lock messages render and behave identically to before.
//
// MARKERS: the header and grid container are layout chrome (header rules in legacy-globals.scss, T-039;
// the `.cmplz-grid`/`.cmplz-grid-item*` grid relocated there, T-038); <Error> is migrated to the C-2 system
// (Stage H.8: tw- danger callout + a secondary button-styled link, each self-sufficient with
// `tw-border-solid`). After the ADR-001 MARKER MOVE (Stage H.5 Part 2) the app-root marker covers all of
// this; the layout chrome has no raw borders/backgrounds the base reset would harm (box-sizing/B5 on the
// logo img are benign), and the lock message is plain `<p>` text. The LOADING decoration in the empty grid
// cells is composed from <Placeholder> (the Skeleton primitive). The legacy shimmer rule
// (`.cmplz-page-placeholder .cmplz-grid-item:after`) is deleted from
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
          {/* Header chrome migrated from legacy-globals.scss (Bundle D B2): the `.cmplz-header-container`
              / `.cmplz-settings-header` / logo rules are reproduced as tw- + token-with-literal-fallback
              and the legacy class hooks dropped (PagePlaceholder is the sole live consumer; Header.js
              reproduces its own). Logical utilities; max-width uses the legacy grid clamp (grid-gap=20px). */}
          <div className="tw-bg-[var(--cmplz-surface,_#ffffff)]">

            <div className="tw-max-w-[clamp(300px,_calc(100%_-_40px),_1600px)] tw-mx-auto tw-flex tw-flex-wrap tw-justify-between tw-min-h-[70px]">
              <img className="tw-my-auto tw-h-[26px]"
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
