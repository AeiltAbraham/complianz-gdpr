import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useNewOnboardingData } from "../NewOnboardingData";
import OnboardingInput from '../components/Input';
import useFields from '../../Settings/Fields/FieldsData';
import Placeholder from '../../Placeholder/Placeholder';

// Per-audience intro copy — the seam for designing each onboarding apart (showcase). `needsEmail`
// decides whether the email/verify input shows: new + unauthenticated users still have to verify the
// domain, a current (authenticated) user does not. The variant is set from the ?cmplz_onboarding
// override (OnboardingDevLauncher) and otherwise defaults to the real first-run 'new'.
const VARIANT_INTRO = {
	new: {
		needsEmail: true,
		paragraphs: [
			__( "In the latest release of Complianz, we introduce our newest Website Scan. This scan will not only retrieve services and cookies but also help you configure our plugin and keep you up-to-date if changes are made that might need legal changes.", "complianz-gdpr" ),
			__( "To use our newest Website Scan we need to verify your website and confirm your access by email. Register below and get the latest from Complianz!", "complianz-gdpr" ),
		],
	},
	unauthenticated: {
		needsEmail: true,
		paragraphs: [
			__( "Your Complianz setup is ready — but your domain isn’t verified yet, so the Website Scan and automatic cookie descriptions are paused.", "complianz-gdpr" ),
			__( "Confirm your access by email to switch the scan back on and keep your cookie policy up to date automatically.", "complianz-gdpr" ),
		],
	},
	// The authenticated "current" audience no longer reaches this step — it gets the single BannerUpdate
	// notice instead — so only 'new' and 'unauthenticated' intros live here.
};

const Welcome = () => {
	const {
		variant,
		wscEmail,
		setWscEmail,
		emailError,
		setEmailError,
		setNextStepDisabled,
		setEnableWsc,
		isValidEmail,
		isContentLoading,
		setIsContentLoading,
	} = useNewOnboardingData();

	const intro = VARIANT_INTRO[ variant ] || VARIANT_INTRO.new;

	const { fields, fieldsLoaded } = useFields();

	useEffect(() => {
		try {
			setIsContentLoading(true);
			if (fields) {
				const { default: defaultEmail } = fields.find((f) => f.id === "cmplz_wsc_email");
				setWscEmail(defaultEmail);
			} else {
				console.log('Fields not loaded');
			}
		} catch (error) {
			console.log(error);
		} finally {
			setIsContentLoading(false);
		}

	}, [fields, fieldsLoaded]);


	const handleEmailChange = (e) => {
		const email = e.target.value;
		setWscEmail(email);
		const isValid = isValidEmail(email);
		setEmailError(isValid ? '' : __('Please enter a valid email address.', 'complianz-gdpr'));
		setNextStepDisabled(!isValid);
		// if email.length !== 0 && isValid
		setEnableWsc(email.length !== 0 ? isValid : false);
	};

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m)]">
			{
				isContentLoading ? <Placeholder /> : <>
					{ intro.paragraphs.map( ( text, i ) => <p key={i}>{ text }</p> ) }
					{ intro.needsEmail && (
						<OnboardingInput
							type="email"
							value={wscEmail}
							onChange={handleEmailChange}
							placeholder={__("Your email address", "complianz-gdpr")}
							error={emailError}
						/>
					) }
				</>
			}
		</div>
	)
}

export default Welcome;
