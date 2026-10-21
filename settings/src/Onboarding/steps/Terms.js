import { useEffect } from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import { useNewOnboardingData } from "../NewOnboardingData";
import DOMPurify from "dompurify";
import Placeholder from "../../Placeholder/Placeholder";
import OnboardingError from "../components/OnboardingError";
import { Button } from "../../components/ui/Button";

// Scroll box for the injected legal document (Stage H.8): the legacy `.wrap-terms` chrome as tw- on
// C-2 tokens. The injected HTML keeps the shared legacy `.cmplz` heading/paragraph base (the portal
// sits under `#complianz.cmplz`), so no custom document typography is needed.
const TERMS_SCROLL_CLS =
	'tw-mb-4 tw-max-h-[160px] tw-overflow-y-auto tw-rounded-[var(--cmplz-radius-s)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border)] tw-bg-[var(--cmplz-surface-sunken)] tw-p-[var(--cmplz-space-s)] max-[576px]:tw-max-h-[40vh]';

const Terms = () => {
	const {
		wscTerms,
		isContentLoading,
		setIsContentLoading,
		fetchError,
		fetchDoc
	} = useNewOnboardingData();

	useEffect(() => {
		const loadingTerms = async () => {
			try {
				setIsContentLoading(true);
				await fetchDoc();
			} catch (error) {
				console.log(error);
			} finally {
				setIsContentLoading(false);
			}
		}
		loadingTerms();
	}, [fetchDoc]);

	const sanitized = DOMPurify.sanitize(wscTerms, { ADD_ATTR: ['target'] });

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m)]">
			{isContentLoading ?
				<Placeholder />
				:
				<>
					<p>{__("Great! You're a few minutes away from getting started with the Website Scan. You just need to look over the Terms and Conditions. If you agree, please continue.", "complianz-gdpr")}</p>
					{fetchError &&
						<OnboardingError>
							<Button variant="secondary" onClick={fetchDoc}>{__('Try again!', 'complianz-gdpr')}</Button>
						</OnboardingError>
					}
					{sanitized && <div className={TERMS_SCROLL_CLS} dangerouslySetInnerHTML={{ __html: sanitized }}></div>}
				</>
			}
		</div>
	);
};

export default Terms;
