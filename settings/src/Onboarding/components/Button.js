import { useNewOnboardingData, steps } from "../NewOnboardingData";
import { memo, useEffect, useState } from "@wordpress/element";
import Icon from "../../utils/Icon";
import { Button } from "../../components/ui/Button";
import { clsx } from "../../components/ui/cx";

// Onboarding footer button (Stage H.8). The raw `button button-default`/`button-primary` become the
// `ui/Button` primitive (prev → secondary, next → primary); it renders inside the Radix Dialog portal
// (a marked `data-cmplz-ui` island), so the base reset supplies the border-style. The next button keeps
// its loading spinner, now INSIDE the blue primary button (white on blue, visible — the legacy white
// spinner sat on a grey footer that no longer exists). On <576px both the wrapper and button go
// full-width (legacy column layout). Step/label/disabled logic is unchanged.
const OnboardingButton = ({ type, ...otherProps }) => {
	const {
		goToNextStep,
		goToPrevStep,
		nextStepDisabled,
		prevStepDisabled,
		enablePluginInstallation,
		isInstalling,
		isLoading,
		currentStep
	} = useNewOnboardingData();

	// Derive the prev label directly so it tracks the current step (the button stays mounted across
	// steps, so a one-time useState would pin it to the first step's label — wrong once a step is
	// inserted ahead of the flow, e.g. the unauthenticated service-disruption notice).
	const prevButtonLabel = steps[currentStep].prevButton;
	const [nextButtonLabel, setNextButtonLabel] = useState(steps[currentStep].nextButton);
	const [buttonDisabledStatus, setButtonDisabledStatus] = useState(false);

	useEffect(() => {
		if (currentStep === 'plugins') {
			if (isInstalling) {
				setNextButtonLabel(steps[currentStep].nextButtonThird); // installing ...
			} else if (enablePluginInstallation) {
				setNextButtonLabel(steps[currentStep].nextButtonSecondary); // install
			} else {
				setNextButtonLabel(steps[currentStep].nextButton); // Continue
			}
		} else {
			setNextButtonLabel(steps[currentStep].nextButton);
		}
	}, [currentStep, enablePluginInstallation, isInstalling]);

	// disable button on step processing or when input fields are not valid
	useEffect(() => {
		setButtonDisabledStatus(
			isLoading ||
			isInstalling ||
			prevStepDisabled ||
			nextStepDisabled
		);
	}, [
		isLoading,
		isInstalling,
		prevStepDisabled,
		nextStepDisabled
	]);


	const handleClick = () => {
		if (type === 'next') {
			goToNextStep();
		} else if (type === 'prev') {
			goToPrevStep();
		}
	}

	return (
		<div className={clsx('tw-flex tw-items-center', type === 'next' && 'tw-ms-auto', 'max-[576px]:tw-w-full')}>
			<Button
				variant={type === 'prev' ? 'secondary' : 'primary'}
				onClick={handleClick}
				disabled={buttonDisabledStatus}
				className="tw-gap-[var(--cmplz-space-xs)] tw-px-[var(--cmplz-space-l)] max-[576px]:tw-w-full"
				{...otherProps}
			>
				{(isInstalling || isLoading) && type === 'next' && <Icon name="loading" color="white" size={14} />}
				{type === 'next' ? nextButtonLabel : prevButtonLabel}
			</Button>
		</div>
	)
}

export default memo(OnboardingButton)
