import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useNewOnboardingData } from "../NewOnboardingData";
import DOMPurify from "dompurify";
import OnboardingInput from '../components/Input';
import Placeholder from '../../Placeholder/Placeholder';
import OnboardingError from "../components/OnboardingError";
import { Button } from "../../components/ui/Button";

// Scroll box for the injected newsletter document (Stage H.8) — see Terms.js for the rationale.
const TERMS_SCROLL_CLS =
	'tw-mb-4 tw-max-h-[160px] tw-overflow-y-auto tw-rounded-[var(--cmplz-radius-s)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border)] tw-bg-[var(--cmplz-surface-sunken)] tw-p-[var(--cmplz-space-s)] max-[576px]:tw-max-h-[40vh]';

const Newsletter = () => {
	const {
		wscEmail,
		newsletterEmail,
		setNewsletterEmail,
		emailError,
		setEmailError,
		enableWsc,
		isValidEmail,
		setNextStepDisabled,
		newsletterTerms,
		isContentLoading,
		setIsContentLoading,
		fetchError,
		fetchDoc
	} = useNewOnboardingData();

	useEffect(() => {
		setNewsletterEmail(wscEmail)
	}, [wscEmail]);

	useEffect(() => {
		const loadTerms = async () => {
			try {
				setIsContentLoading(true);
				await fetchDoc();
			} catch (error) {
				console.log(error);

			} finally {
				setIsContentLoading(false);
			}
		}
		loadTerms();
	}, [fetchDoc]);

	const sanitized = DOMPurify.sanitize(newsletterTerms, { ADD_ATTR: ['target'] });

	const handleEmailChange = (e) => {
		const email = e.target.value;
		setNewsletterEmail(email);
		const isValid = isValidEmail(email);
		setEmailError(isValid ? '' : __('Please enter a valid email address.', 'complianz-gdpr'));
		setNextStepDisabled(!isValid);
	};

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m)]">
			{isContentLoading ? <Placeholder /> :
				<>
					<p>{__("We want you to get the most out of Complianz. So over the next week we'll be sending eight tips and tricks to your inbox - be sure to keep a lookout.", "complianz-gdpr")}</p>
					{fetchError &&
						<OnboardingError>
							<Button variant="secondary" onClick={fetchDoc}>{__('Try again!', 'complianz-gdpr')}</Button>
						</OnboardingError>
					}
					{sanitized &&
						<>
							<div className={TERMS_SCROLL_CLS} dangerouslySetInnerHTML={{ __html: sanitized }}></div>
							{!enableWsc &&
								<OnboardingInput
									type="email"
									onChange={handleEmailChange}
									value={newsletterEmail}
									placeholder={__("Your email address", "complianz-gdpr")}
									error={emailError}
								/>
							}
						</>
					}
				</>
			}
		</div>
	);
};

export default Newsletter;
