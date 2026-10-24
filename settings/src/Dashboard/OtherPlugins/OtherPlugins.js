import { useEffect} from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import Placeholder from '../../Placeholder/Placeholder';
import useOtherPlugins  from "./OtherPluginsData";
import { Button } from "../../components/ui/Button";
import { secondaryLinkButtonCls } from "../../components/ui/downloadLink";
const OtherPlugins = () => {
    const {dataLoaded, pluginData, pluginActions, fetchOtherPluginsData, error} = useOtherPlugins();
    useEffect(() => {
        if (!dataLoaded) {
            fetchOtherPluginsData();
        }
    }, [] )

    const otherPluginElement = (plugin, i) => {
        return (
            <div key={i}  className={"cmplz-suggested-plugin cmplz-"+plugin.slug}>
                <img className="cmplz-suggested-plugin-img" src={cmplz_settings.plugin_url+'/upgrade/img/'+plugin.image} alt={plugin.title} />
                <div className="cmplz-suggested-plugin-group">
                    <div className="cmplz-suggested-plugin-group-title">{plugin.title}</div>
                    <div className="cmplz-suggested-plugin-group-desc">{plugin.summary}</div>
                </div>
                <div className="cmplz-suggested-plugin-desc-long">
                    {plugin.description}
                </div>
                <div>
                    {/* Migrated to the C-2 system (Stage H.9): the raw `button-secondary` install/activate
                        `<button>` and the upgrade `<a>` (marker-move landmines — the base reset would strip
                        their wp-admin border/background) become the `ui/Button` secondary primitive and a
                        secondary button-styled link. The shared `.cmplz-suggested-plugin*` card chrome is KEPT
                        (InstallPlugin.js renders it too). Markerless, so `tw-border-solid` pins the border-style
                        (Preflight off, base.css B1 not in scope — T-052); mirrors InstallPlugin.js. */}
                    <div className="cmplz-other-plugin-status">
                        {plugin.pluginAction==='upgrade-to-premium' && <a className={secondaryLinkButtonCls} target="_blank" href={plugin.upgrade_url} rel="noopener noreferrer">{__("Upgrade", "complianz-gdpr")}</a>}
                        {plugin.pluginAction!=='upgrade-to-premium' && plugin.pluginAction!=='installed' &&
                            <Button variant="secondary" className="tw-border-solid" onClick={ (e) => pluginActions(plugin.slug, plugin.pluginAction, e) }>{plugin.pluginActionNice}</Button>}
                        {plugin.pluginAction==='installed' && __("Installed", "complianz-gdpr")}
                    </div>
                </div>
            </div>
        )
    }

    if ( !dataLoaded || error) {
        return (<Placeholder lines="3" error={error}></Placeholder>)
    }

    return (
           <div className="cmplz-other-plugins-container">
               { pluginData.map((plugin, i) => otherPluginElement(plugin, i)) }
           </div>
    )
}

export default OtherPlugins;
