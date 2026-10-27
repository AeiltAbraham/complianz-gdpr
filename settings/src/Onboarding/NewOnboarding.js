import { useEffect, useRef, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import useFields from "../Settings/Fields/FieldsData";
import { useNewOnboardingData, steps } from "./NewOnboardingData"
import { OnboardingModalClose } from "./components/Close"
import OnboardingButton from './components/Button';
import ServiceDisruption from './steps/ServiceDisruption';
import BannerUpdate from './steps/BannerUpdate';
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
import { secondaryLinkButtonCls } from "../components/ui/downloadLink";

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
		setVariant,
		setCurrentStep,
	} = useNewOnboardingData();

	const {
		fieldsLoaded,
		getFieldValue,
	} = useFields();

	const [showModal, setShowModal] = useState(false);
	// Guards the one-time audience/starting-step init so the effect re-running never resets navigation.
	const didInit = useRef(false);

	// This useEffect checks if the wscClientId and wscClientSecret exist.
	// If they don't exist, it shows the modal. Otherwise, it closes/reset the modal.
	useEffect(() => {
		if (!fieldsLoaded) return;

		const wscClientId = getFieldValue('cmplz_wsc_client_id');
		const wscClientSecret = getFieldValue('cmplz_wsc_client_secret');

		// If the url contains cmplz_force_signup, it will force the modal to show.
		const isForcedModal = window.location.href.indexOf('cmplz_force_signup') !== -1;

		// Showcase dev override (design-dashboard-ctas): ?cmplz_onboarding=new|current|unauthenticated
		// force-opens the modal in that audience variant regardless of the real auth/dismissed state —
		// a VISUAL override only, the database flags are left untouched. Driven by OnboardingDevLauncher.
		// The unauthenticated audience gets an extra service-disruption step before the normal flow.
		const variantParam = new URLSearchParams(window.location.search).get('cmplz_onboarding');

		// init() sets the audience + starting step exactly once, so a later effect re-run (e.g. a field
		// refresh) can keep syncing showModal without rewinding the user to the first step.
		const init = (variant) => {
			if (didInit.current) return;
			didInit.current = true;
			setVariant(variant);
			if (variant === 'unauthenticated') {
				setCurrentStep('serviceDisruption');
			} else if (variant === 'current') {
				// Authenticated users skip the full flow — a single what's-new/limits notice.
				setCurrentStep('bannerUpdate');
			}
		};

		if (['new', 'current', 'unauthenticated'].includes(variantParam)) {
			init(variantParam);
			setShowModal(true);
			return;
		}

		if (!wscClientId || !wscClientSecret) {
			// Real first-run / not-yet-authenticated state.
			init('new');
			setShowModal(true);
		} else if (isForcedModal) {
			init('current');
			setShowModal(true);
		} else {
			// closeModal change the state and remove websitescan from url
			closeModal();
		}
	}, [fieldsLoaded, closeModal, getFieldValue, setShowModal, setVariant, setCurrentStep]);

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
					{currentStep === 'serviceDisruption' && <ServiceDisruption />}
					{currentStep === 'bannerUpdate' && <BannerUpdate />}
					{currentStep === 'welcome' && <Welcome />}
					{currentStep === 'terms' && <Terms />}
					{currentStep === 'newsletter' && <Newsletter />}
					{currentStep === 'plugins' && <Plugins />}
					{currentStep === 'thankYou' && <ThankYou />}
				</div>

				<div className="tw-flex tw-items-center tw-justify-between tw-gap-[var(--cmplz-space-m)] tw-border-t tw-border-solid tw-border-[color:var(--cmplz-border)] tw-pt-[var(--cmplz-space-m)] max-[576px]:tw-flex-col-reverse">
					{currentStep !== 'thankYou' && currentStep !== 'bannerUpdate' && <OnboardingButton type="prev" />}
					{currentStep === 'bannerUpdate' && (
						<a
							href="https://complianz.io/docs"
							target="_blank"
							rel="noopener noreferrer"
							className={secondaryLinkButtonCls + ' max-[576px]:tw-w-full max-[576px]:tw-justify-center'}
						>
							{__('Why did your banner change?', 'complianz-gdpr')}
						</a>
					)}
					<OnboardingButton type="next" />
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default NewOnboarding;
