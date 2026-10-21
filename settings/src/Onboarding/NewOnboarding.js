import { useEffect, useState } from "@wordpress/element";
import useFields from "../Settings/Fields/FieldsData";
import { useNewOnboardingData, steps } from "./NewOnboardingData"
import { OnboardingModalClose } from "./components/Close"
import OnboardingButton from './components/Button';
import Welcome from './steps/Welcome';
import Terms from './steps/Terms';
import Newsletter from './steps/Newsletter';
import Plugins from './steps/Plugins';
import ThankYou from './steps/ThankYou';
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "../components/ui/Dialog";

/**
 * NewOnboarding — the website-scan onboarding/signup modal, lazy-loaded by Page.js when the URL
 * carries `websitescan`. Migrated to the C-2 system (Stage H.8).
 *
 * Maintainer sign-off (2026-10-21): rebuilt on the `ui/Dialog` (Radix) primitive — an a11y
 * improvement. This gives it a real focus trap, `role="dialog"`/`aria-modal`, and Escape-to-dismiss
 * (the legacy `.cmplz-modal` divs had none), and portals the content into `#complianz-portal-root`
 * (an already-marked `data-cmplz-ui` island) so the base reset reaches its migrated primitives with
 * no app-root marker needed. `onInteractOutside` is prevented so a stray click never discards
 * onboarding progress (the sign-off's "no accidental loss"); Escape and the × both dismiss (via
 * `closeModal(true)`, which persists the dismissal flag), matching the legacy × behaviour. The
 * co-located `NewOnboarding.scss` + the legacy `.cmplz-modal*` chrome (in legacy-globals) are retired;
 * all layout/typography moves to tw- utilities + C-2 tokens, which resolve on the portal island.
 * `size="lg"` (max-w-3xl = 768px) reproduces the legacy websitescan clamp cap.
 */
const NewOnboarding = () => {

	const {
		isModalOpen,
		currentStep,
		closeModal,
		isContentLoading,
	} = useNewOnboardingData();

	const {
		fieldsLoaded,
		getFieldValue,
	} = useFields();

	const [showModal, setShowModal] = useState(false);

	// This useEffect checks if the wscClientId and wscClientSecret exist.
	// If they don't exist, it shows the modal. Otherwise, it closes/reset the modal.
	useEffect(() => {
		if (!fieldsLoaded) return;

		const wscClientId = getFieldValue('cmplz_wsc_client_id');
		const wscClientSecret = getFieldValue('cmplz_wsc_client_secret');

		// If the url contains cmplz_force_signup, it will force the modal to show.
		const isForcedModal = window.location.href.indexOf('cmplz_force_signup') !== -1;

		if (!wscClientId || !wscClientSecret) {
			setShowModal(true);
		} else if (isForcedModal) {
			setShowModal(true);
		} else {
			// closeModal change the state and remove websitescan from url
			closeModal();
		}
	}, [fieldsLoaded, closeModal, getFieldValue, setShowModal]);

	if (!isModalOpen || !showModal) return null;

	const { title } = steps[currentStep];

	return (
		<Dialog open onOpenChange={(open) => { if (!open) closeModal(true); }}>
			<DialogContent
				size="lg"
				onInteractOutside={(e) => e.preventDefault()}
				aria-describedby={undefined}
				className="tw-flex tw-max-h-[85vh] tw-flex-col tw-gap-[var(--cmplz-space-m)] tw-overflow-y-auto"
			>
				<div className="tw-flex tw-items-start tw-gap-[var(--cmplz-space-m)]">
					{ /* The title is a static per-step config string, always available, so render it
					     directly — never a block-level <Placeholder> inside the Radix Title <h2> (invalid
					     HTML + empty accessible name during load). The step BODY keeps its own loader. */ }
					<DialogTitle className="tw-flex-1 tw-mb-0">
						{title}
					</DialogTitle>
					<OnboardingModalClose />
				</div>

				<div className="tw-relative tw-text-[0.8125rem]">
					{currentStep === 'welcome' && <Welcome />}
					{currentStep === 'terms' && <Terms />}
					{currentStep === 'newsletter' && <Newsletter />}
					{currentStep === 'plugins' && <Plugins />}
					{currentStep === 'thankYou' && <ThankYou />}
				</div>

				<div className="tw-flex tw-items-center tw-justify-between tw-gap-[var(--cmplz-space-m)] tw-border-t tw-border-solid tw-border-[color:var(--cmplz-border)] tw-pt-[var(--cmplz-space-m)] max-[576px]:tw-flex-col-reverse">
					{currentStep !== 'thankYou' && <OnboardingButton type="prev" />}
					<OnboardingButton type="next" />
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default NewOnboarding;
