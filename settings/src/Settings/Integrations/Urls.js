import { __ } from '@wordpress/i18n';
import readMore from "../../utils/readMore";
import TextInput from "../Inputs/TextInput";
import Icon from "../../utils/Icon";
import { Button } from "../../components/ui/Button";
import useIntegrations from "./IntegrationsData";
import {useEffect, useState} from "react";

const Urls = (props) => {
	const { setScript, fetching } = useIntegrations();
	const [hasEmptyUrl, setHasEmptyUrl] = useState(false);
	const script = props.script;
	const type = props.type;

	useEffect(() => {
		//check if one of the URLS is empty. if so, setHasEmptyUrl to true
		let urls = script.hasOwnProperty('urls') ? Object.values(script.urls) : [''];
		if (urls.includes('')) {
			setHasEmptyUrl(true);
		} else {
			setHasEmptyUrl(false);
		}

	}, [script]);

	const onChangeUrlHandler = (index, url) => {
		let copyScript = {...script};
		let urls = {...copyScript.urls};
		urls[index] = url;
		copyScript.urls = urls;
		setScript(copyScript, props.type);
	}


	const addUrl = () => {
		let copyScript = {...script};
		let urls = copyScript.hasOwnProperty('urls') ? {...copyScript.urls} : [''];
		let curLength = Object.keys(urls).length;

		urls[curLength+1] = '';
		copyScript.urls = urls;
		setScript(copyScript, props.type);
	}



	const deleteUrl = (key) => {
		let copyScript = {...script};
		let urls = {...copyScript.urls};
		//delete index 'key' from copyScript.urls
		delete urls[key];
		copyScript.urls = urls;
		setScript(copyScript, props.type);
	}
	let urls = script.hasOwnProperty('urls') ? Object.entries(script.urls) : [''];
	return (
		<div className="tw-flex tw-flex-col tw-py-[5px]">
			<label className="tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-font-medium">
				{type==='block_script' && __("URLs that should be blocked before consent.", "complianz-gdpr")}
				{type==='whitelist_script' &&
					<>{__("URLs that should be whitelisted.", "complianz-gdpr")}
						{readMore("https://complianz.io/whitelisting-inline-script/") }
					</>
				}
			</label>
			{ urls.map( ([index, url], i)=>
				<div key={i} className="cmplz-scriptcenter-url tw-flex tw-items-center tw-pb-[10px] [&_.cmplz-input-group]:tw-grow [&_.cmplz-input-group]:tw-me-[10px]">
					<TextInput
						disabled={fetching}
						value={url ? url : ''}
						onChange={(value)=>onChangeUrlHandler(index, value)}
						id={i+"_url"}
						name={"url"}
					/>
					{i===0 && !hasEmptyUrl && <Button variant="secondary" onClick={() => addUrl() }><Icon name="plus" size={14}/></Button>}
					{i!==0 && <Button variant="secondary" onClick={() => deleteUrl(index) }><Icon name="minus" size={14}/></Button>}
				</div>
			)}
		</div>
	);
}
export default Urls;
