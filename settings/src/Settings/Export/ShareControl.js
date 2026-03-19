import {useState} from "@wordpress/element";
import {__} from '@wordpress/i18n';
import {memo} from "@wordpress/element";
import * as cmplz_api from "../../utils/api";
import useFields from "../Fields/FieldsData";
import useMenu from "../../Menu/MenuData";
import Icon from "../../utils/Icon";

function ShareControlComponent() {
	const {fetchFieldsData, showSavedSettingsNotice, addHelpNotice, removeHelpNotice} = useFields();
	const {selectedSubMenuItem} = useMenu();

	const [shareKey, setShareKey] = useState('');
	const [keyExpires, setKeyExpires] = useState('');
	const [generating, setGenerating] = useState(false);
	const [importing, setImporting] = useState(false);
	const [sourceUrl, setSourceUrl] = useState('');
	const [importKey, setImportKey] = useState('');
	const [copied, setCopied] = useState(false);

	const generateKey = async () => {
		setGenerating(true);
		removeHelpNotice('share_settings');
		try {
			const response = await cmplz_api.doAction('generate_share_key', {});
			if (response.success && response.key) {
				setShareKey(response.key);
				setKeyExpires(response.expires);
			} else {
				addHelpNotice('share_settings', 'warning', response.message || __("Could not generate key", "complianz-gdpr"), __("Error", "complianz-gdpr"), false);
			}
		} catch (error) {
			addHelpNotice('share_settings', 'warning', __("Could not generate key. Please try again.", "complianz-gdpr"), __("Error", "complianz-gdpr"), false);
		}
		setGenerating(false);
	};

	const copyToClipboard = () => {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(shareKey).then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}).catch(() => {
				fallbackCopy(shareKey);
			});
		} else {
			fallbackCopy(shareKey);
		}
	};

	const fallbackCopy = (text) => {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (e) {
			addHelpNotice('share_settings', 'warning', __("Could not copy to clipboard. Please select and copy the key manually.", "complianz-gdpr"), __("Copy failed", "complianz-gdpr"), false);
		}
		document.body.removeChild(textarea);
	};

	const importFromRemote = async () => {
		if (!sourceUrl || !importKey) {
			addHelpNotice('share_settings', 'warning', __("Please provide both a site URL and a share key.", "complianz-gdpr"), __("Missing fields", "complianz-gdpr"), false);
			return;
		}

		setImporting(true);
		removeHelpNotice('share_settings');
		try {
			const response = await cmplz_api.doAction('import_remote_settings', {
				url: sourceUrl,
				key: importKey,
			});
			if (response.success) {
				fetchFieldsData(selectedSubMenuItem).then(() => {
					showSavedSettingsNotice(response.message || __("Settings imported", "complianz-gdpr"));
				});
				setSourceUrl('');
				setImportKey('');
			} else {
				addHelpNotice('share_settings', 'warning', response.message || __("Import failed", "complianz-gdpr"), __("Error", "complianz-gdpr"), false);
			}
		} catch (error) {
			addHelpNotice('share_settings', 'warning', __("Import failed. Please check the URL and key and try again.", "complianz-gdpr"), __("Error", "complianz-gdpr"), false);
		}
		setImporting(false);
	};

	return (
		<div className="cmplz-share-settings">
			<div className="cmplz-share-generate">
				<p className="cmplz-share-description">
					{__("Generate a key to allow another site to import your settings. The key is valid for 24 hours.", "complianz-gdpr")}
				</p>
				<button
					className="button button-default"
					onClick={generateKey}
					disabled={generating}
				>
					{__("Generate Share Key", "complianz-gdpr")}
					{generating && <Icon name="loading" color="grey"/>}
				</button>
				{shareKey && (
					<div className="cmplz-share-key-display">
						<code className="cmplz-share-key-value">{shareKey}</code>
						<button
							className="button button-small"
							onClick={copyToClipboard}
						>
							{copied ? __("Copied!", "complianz-gdpr") : __("Copy", "complianz-gdpr")}
						</button>
						<p className="cmplz-share-key-expiry">
							{__("Expires:", "complianz-gdpr")} {keyExpires}
						</p>
					</div>
				)}
			</div>

			<hr className="cmplz-share-divider"/>

			<div className="cmplz-share-import">
				<p className="cmplz-share-description">
					{__("Import settings from another Complianz site using its URL and share key.", "complianz-gdpr")}
				</p>
				<div className="cmplz-share-import-fields">
					<label>
						{__("Site URL", "complianz-gdpr")}
						<input
							type="url"
							className="regular-text"
							value={sourceUrl}
							onChange={(e) => setSourceUrl(e.target.value)}
							placeholder="https://example.com"
						/>
					</label>
					<label>
						{__("Share Key", "complianz-gdpr")}
						<input
							type="text"
							className="regular-text"
							value={importKey}
							onChange={(e) => setImportKey(e.target.value)}
							placeholder={__("Paste the share key here", "complianz-gdpr")}
						/>
					</label>
				</div>
				<button
					className="button button-default"
					onClick={importFromRemote}
					disabled={importing || !sourceUrl || !importKey}
				>
					{__("Import from Remote Site", "complianz-gdpr")}
					{importing && <Icon name="loading" color="grey"/>}
				</button>
			</div>
		</div>
	);
}

// Named export for direct imports; default export required by dynamic component loader in Field.js.
export const ShareControl = memo(ShareControlComponent);
export default ShareControl;
