import { useNewOnboardingData } from "../NewOnboardingData";

// Onboarding close (×) control (Stage H.8). Restyled to a tw- ghost icon button on C-2 tokens; the svg
// fills with currentColor (text-muted) instead of the hardcoded #000. Keeps `closeModal(true)` so the ×
// persists the dismissal flag (the legacy behaviour the dialogs spec asserts), and its accessible name.
export const OnboardingModalClose = () => {

	const { closeModal } = useNewOnboardingData();

	return (
		<button
			type="button"
			className="tw-inline-flex tw-shrink-0 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-[var(--cmplz-space-2xs)] tw-text-[color:var(--cmplz-text-muted)] hover:tw-text-[color:var(--cmplz-text)]"
			aria-label="Close"
			onClick={() => closeModal(true)}
		>
			<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height="18" >
				<path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z" />
			</svg>
		</button>
	)
}
