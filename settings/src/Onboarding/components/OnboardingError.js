import { useNewOnboardingData } from "../NewOnboardingData"

// Onboarding fetch-error block (Stage H.8). The orphaned `.cmplz-onboarding__error` class (its
// onboarding.scss was deleted at T-057) is replaced with tw- utilities on C-2 tokens: a danger message
// plus the retry control passed as children.
const OnboardingError = ({ children }) => {
	const { fetchErrorMessage } = useNewOnboardingData();
	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs)]">
			<p className="tw-m-0 tw-text-[color:var(--cmplz-danger)]">{fetchErrorMessage}</p>
			<div>{children}</div>
		</div>
	)
}
export default OnboardingError
