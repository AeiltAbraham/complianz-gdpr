import {useEffect, memo} from "@wordpress/element";
import {__} from '@wordpress/i18n';
import {UseTranslationsData} from "./useTranslationsData";
import { Button } from "../../components/ui/Button";

// Migrated off Translations.scss (ADR-005, Stage H.5) onto `tw-` utilities on the semantic C-2 tokens
// with literal fallbacks (markerless chrome). The automation status sits in the C-2 card; "Enabled"
// keeps the AA-passing success green, "Disabled" uses the muted text colour (a neutral state, not an
// error). Zero new tokens.
const WRAP = 'tw-my-[var(--cmplz-space-l,_24px)]';
const CARD = 'tw-bg-[var(--cmplz-surface,_#ffffff)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-p-[var(--cmplz-space-l,_24px)] tw-mb-[var(--cmplz-space-l,_24px)]';
const CARD_TITLE = 'tw-mt-0 tw-text-[color:var(--cmplz-text,_#0f172a)]';
const ERROR_CALLOUT = 'tw-text-[color:var(--cmplz-danger,_#d7263d)] tw-bg-[var(--cmplz-danger-surface,_#fdebed)] tw-border tw-border-solid tw-border-[color:var(--cmplz-danger,_#d7263d)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-p-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-s,_12px)]';
const STATUS_ENABLED = 'tw-text-[color:var(--cmplz-success,_#1f7a34)] tw-font-medium';
const STATUS_DISABLED = 'tw-text-[color:var(--cmplz-text-muted,_#475569)] tw-font-medium';

const TranslationAutomationControl = (props) => {
	const {
		cronStatus,
		translationDataLoading,
		error,
		fetchCronStatus,
		clearError
	} = UseTranslationsData();

	useEffect(() => {
		fetchCronStatus();
	}, []);

	const handleRetry = () => {
		clearError();
		fetchCronStatus();
	};

	if (translationDataLoading) {
		return (
			<div className={WRAP}>
				<p>{__('Loading automation status...', 'complianz-gdpr')}</p>
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

	if (!cronStatus) {
		return (
			<div className={WRAP}>
				<p>{__('No automation status available', 'complianz-gdpr')}</p>
			</div>
		);
	}

	return (
		<div className={WRAP}>
			<div className={CARD}>
				<h4 className={CARD_TITLE}>{__('Translation Automation Status', 'complianz-gdpr')}</h4>

				<div>
					<p>
						<strong>{__('Status:', 'complianz-gdpr')}</strong>
						{cronStatus.is_enabled ? (
							<span className={STATUS_ENABLED}>✓ {__('Enabled', 'complianz-gdpr')}</span>
						) : (
							<span className={STATUS_DISABLED}>✗ {__('Disabled', 'complianz-gdpr')}</span>
						)}
					</p>

					{cronStatus.is_enabled && (
						<>
							<p>
								<strong>{__('Interval:', 'complianz-gdpr')}</strong> {cronStatus.interval_display}
							</p>
							<p>
								<strong>{__('Next Run:', 'complianz-gdpr')}</strong> {cronStatus.next_run_formatted}
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default memo(TranslationAutomationControl);
