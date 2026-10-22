import {useEffect, memo} from "@wordpress/element";
import {__} from '@wordpress/i18n';
import useFields from "../Fields/FieldsData";
import {UseTranslationsData} from "./useTranslationsData";
import { Button } from "../../components/ui/Button";

// Migrated off Translations.scss (ADR-005, Stage H.5) onto `tw-` utilities on the semantic C-2 tokens
// with literal fallbacks; after the ADR-001 marker move (H.5 Part 2) the app-root marker resolves the
// tokens (the fallbacks are a no-op). Cards = the C-2 surface/border/radius; the status table drops the wp-admin `wp-list-table`
// classes (FR-020) for a token-styled table. Status text keeps the AA-passing green/red; the former
// low-contrast yellow warning text (constitution §5) becomes the default readable text colour, the
// status still carried by its ⚠/⏳ glyph. Zero new tokens.
const WRAP = 'tw-my-[var(--cmplz-space-l,_24px)]';
const CARD = 'tw-bg-[var(--cmplz-surface,_#ffffff)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-p-[var(--cmplz-space-l,_24px)] tw-mb-[var(--cmplz-space-l,_24px)]';
const CARD_TITLE = 'tw-mt-0 tw-text-[color:var(--cmplz-text,_#0f172a)]';
const TABLE = 'tw-mt-[var(--cmplz-space-l,_24px)] tw-w-full tw-border-collapse';
const CELL = 'tw-p-[var(--cmplz-space-s,_12px)] tw-text-start tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]';
const TH = CELL + ' tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-font-semibold';
const ERROR_CALLOUT = 'tw-text-[color:var(--cmplz-danger,_#d7263d)] tw-bg-[var(--cmplz-danger-surface,_#fdebed)] tw-border tw-border-solid tw-border-[color:var(--cmplz-danger,_#d7263d)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-p-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-s,_12px)]';

// Status text: success/error pass WCAG AA on white; warning uses the readable text colour (the glyph
// carries the "attention" meaning) rather than the sub-AA yellow.
const STATUS_CLS = {
	ok: 'tw-text-[color:var(--cmplz-success,_#1f7a34)] tw-font-medium',
	warning: 'tw-text-[color:var(--cmplz-text,_#0f172a)] tw-font-medium',
	error: 'tw-text-[color:var(--cmplz-danger,_#d7263d)] tw-font-medium',
};

const TranslationManagementControl = () => {
	const { showSavedSettingsNotice} = useFields();
	const {
		translationStatus,
		translationDataLoading,
		saving,
		error,
		fetchTranslationStatus,
		fetchTranslations,
		clearError
	} = UseTranslationsData();

	useEffect(() => {
		fetchTranslationStatus();
	}, []);

	const handleRetry = () => {
		clearError();
		fetchTranslationStatus();
	};

	// Helper function to get status display info
	const getStatusDisplay = (fileInfo) => {
		const statusConfig = {
			'no_translation_needed': {
				icon: '✓',
				text: __('No translation needed', 'complianz-gdpr'),
				className: STATUS_CLS.ok,
			},
			'available': {
				icon: '✓',
				text: __('Available', 'complianz-gdpr'),
				className: STATUS_CLS.ok,
			},
			'not_fetched': {
				icon: '⏳',
				text: __('Not fetched', 'complianz-gdpr'),
				className: STATUS_CLS.warning,
			},
			'not_supported': {
				icon: '✗',
				text: __('Not supported', 'complianz-gdpr'),
				className: STATUS_CLS.error,
			},
			'version_mismatch': {
				icon: '⚠',
				text: __('Version mismatch', 'complianz-gdpr'),
				className: STATUS_CLS.warning,
			},
			'invalid_format': {
				icon: '✗',
				text: __('Invalid format', 'complianz-gdpr'),
				className: STATUS_CLS.error,
			},
			'error': {
				icon: '✗',
				text: __('Error', 'complianz-gdpr'),
				className: STATUS_CLS.error,
			}
		};

		return statusConfig[fileInfo.status] || statusConfig['unknown'];
	};

	if (translationDataLoading) {
		return (
			<div className={WRAP}>
				<p>{__('Loading translation status...', 'complianz-gdpr')}</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className={WRAP}>
				<p className={ERROR_CALLOUT}>{error}</p>
				<div>
					<Button variant="secondary" onClick={handleRetry}>
						{__('Retry', 'complianz-gdpr')}
					</Button>
				</div>
			</div>
		);
	}

	if (!translationStatus) {
		return (
			<div className={WRAP}>
				<p>{__('No status information available', 'complianz-gdpr')}</p>
			</div>
		);
	}

	return (
		<div className={WRAP}>
			{/* Language Files Status Table */}
			{translationStatus.language_files && Object.keys(translationStatus.language_files).length > 0 && (
				<div className={CARD}>
					<h4 className={CARD_TITLE}>{__('Language Files Status', 'complianz-gdpr')}</h4>
					<p>{__('If the translations have been recently fetched or updated, you may want to reload the page or clear the cache to see the latest changes.', 'complianz-gdpr')}</p>
					<table className={TABLE}>
						<thead>
							<tr>
								<th className={TH}>{__('Language', 'complianz-gdpr')}</th>
								<th className={TH}>{__('Status', 'complianz-gdpr')}</th>
								<th className={TH}>{__('Last Updated', 'complianz-gdpr')}</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(translationStatus.language_files).map(([lang, fileInfo]) => {
								const statusDisplay = getStatusDisplay(fileInfo);
								return (
									<tr key={lang}>
										<td className={CELL}><strong>{lang}</strong></td>
										<td className={CELL}>
											<span className={statusDisplay.className}>
												{statusDisplay.icon} {statusDisplay.text}
											</span>
										</td>
										<td className={CELL}>
											{fileInfo.last_updated ? (
												new Date(fileInfo.last_updated * 1000).toLocaleString()
											) : (
												__('N/A', 'complianz-gdpr')
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Check Now Button */}
			<div className="tw-mb-[var(--cmplz-space-l,_24px)] tw-text-center">
				<Button
					variant="primary"
					onClick={async () => {
						const result = await fetchTranslations();
						if (result.success) {
							showSavedSettingsNotice(result.message);
						}
					}}
					disabled={saving}
				>
					{saving ? __('Checking...', 'complianz-gdpr') : __('Check Now', 'complianz-gdpr')}
				</Button>
			</div>
		</div>
	);
};

export default memo(TranslationManagementControl);
