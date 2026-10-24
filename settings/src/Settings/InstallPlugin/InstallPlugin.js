import {useEffect} from "@wordpress/element";
import Icon from "../../utils/Icon";
import {__} from '@wordpress/i18n';
import useInstallPluginData from "./InstallPluginData";
import {memo} from "@wordpress/element";
import { Button } from "../../components/ui/Button";

const InstallPlugin = ( {field} ) => {
	const {statusLoaded, startPluginAction, apiRequestActive, pluginAction, rating, upgradeUrl, setStatusLoaded} = useInstallPluginData();
	const title = field.plugin_data.title;
	const summary = field.plugin_data.summary;
	const description = field.plugin_data.description;
	const image = field.plugin_data.image;
    useEffect(() => {
    	//get initial data
		if (!statusLoaded) {
			startPluginAction(field.plugin_data.slug, 'status');
		}
    }, [statusLoaded])

	useEffect(() => {
		setStatusLoaded(false);
	}, [field.plugin_data.slug])

	const onClickHandler = () => {
		startPluginAction(field.plugin_data.slug);
	}

	const wpStarRating = () => {

		// Calculate the number of each type of star needed.
		let fullStars  = Math.floor( rating );
		let halfStars  = Math.ceil( rating - fullStars );
		let emptyStars = 5 - fullStars - halfStars;
		fullStars = createArrayFromInt(fullStars);
		halfStars = createArrayFromInt(halfStars);
		emptyStars = createArrayFromInt(emptyStars);
		return (
			<div className="star-rating">
				<span className="screen-reader-text">{__('%s rating based on %d ratings', 'complianz-gdpr').replace('%s', '5').replace('%d', '84')}</span>
				{ fullStars.map((star, i) => <div key={i} className="star star-full" aria-hidden="true"></div> ) }
				{ halfStars.map((star, i) => <div key={i} className="star star-half" aria-hidden="true"></div> ) }
				{ emptyStars.map((star, i) => <div key={i} className="star star-empty" aria-hidden="true"></div> ) }
			</div>
		)
	}

	const createArrayFromInt = (n) => {
      let arr = [];
      for (let i = 1; i <= n; i++) {
        arr.push(i);
      }
      return arr;
    }

	let disabled = apiRequestActive;
	let buttonString;

	switch(pluginAction) {
      case 'upgrade-to-premium':
        buttonString = __("Upgrade","complianz-gdpr");
        break;
      case 'activate':
        buttonString = apiRequestActive ? __("Activating", "complianz-gdpr") : __("Activate","complianz-gdpr");
        break;
	  case 'download':
		buttonString = apiRequestActive ? __("Installing", "complianz-gdpr") : __("Install","complianz-gdpr");
		break;
      default:
      	disabled = true;
        buttonString = !statusLoaded ? __("Checking status","complianz-gdpr") : __("Installed","complianz-gdpr");
    }

	return (
		<div className="cmplz-suggested-plugin">
			<img className="cmplz-suggested-plugin-img" src={cmplz_settings.plugin_url+'/upgrade/img/'+image} alt={title} />
			<div className="cmplz-suggested-plugin-group">
				<div className="cmplz-suggested-plugin-group-title">{title}</div>
				<div className="cmplz-suggested-plugin-group-desc">{summary}</div>
				<div className="cmplz-suggested-plugin-group-rating">
				{wpStarRating()}
				</div>
			</div>
			<div className="cmplz-suggested-plugin-desc-long">
				{ description }
			</div>
			{ /* Migrated to the C-2 system (Stage H.8): the raw `button-secondary` / upgrade `<a>` (the
			     marker-move landmines) become the `ui/Button` secondary primitive / a secondary
			     button-styled link. The shared `.cmplz-suggested-plugin*` card chrome is KEPT (Dashboard
			     OtherPlugins.js still renders it, so its legacy-globals rules survive); only the controls
			     migrate. Markerless (still-legacy plugin card), so `tw-border-solid` pins the border-style
			     (Preflight off, B1 not in scope — T-052); the loading Icon stays markerless. */ }
			<div>
				{pluginAction!=='upgrade-to-premium' &&
					<Button variant="secondary" className="tw-border-solid" disabled={disabled} onClick={ ( e ) => onClickHandler(e) }>
						{ buttonString }
						{ apiRequestActive && <span className="tw-ms-[10px] tw-flex"><Icon name = "loading" color = 'grey' /></span> }
					</Button>
				}
				{pluginAction ==='upgrade-to-premium' &&
					<a target="_blank" rel="noopener noreferrer" href={upgradeUrl} className="tw-inline-flex tw-items-center tw-justify-center tw-min-h-[30px] tw-py-0 tw-px-[10px] tw-rounded-[4px] tw-border tw-border-solid tw-border-[#2271b1] tw-bg-[#fff] tw-text-[0.8125rem] tw-font-normal tw-text-[#2271b1] tw-no-underline tw-transition-all tw-duration-300 tw-ease-[ease] hover:tw-bg-[#f7f7f7] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-[color:var(--cmplz-accent-strong,_#1e73be)]">
						{ buttonString }
					</a>
				}
				</div>
		</div>
	)
}

export default memo(InstallPlugin)
