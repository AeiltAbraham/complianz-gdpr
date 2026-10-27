import { useNewOnboardingData } from "../NewOnboardingData";
import { __ } from '@wordpress/i18n';

/**
 * Plugins — the final onboarding step (showcase). The "install other plugins for free" picker has been
 * removed; instead this is the hand-off screen: confirm the auth email is on its way, point the user to
 * the Wizard for their first configuration (with a help article), and reassure them Complianz runs fully
 * automated afterwards. The footer's "Start the Wizard" closes the modal and opens the wizard.
 */

const MailIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<rect x="2" y="4" width="20" height="16" rx="2" />
		<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
	</svg>
);

// First-configuration help article (showcase placeholder — point at the real getting-started doc).
const ARTICLE_URL = 'https://complianz.io/docs';
const linkCls = 'tw-cursor-pointer tw-text-[color:var(--cmplz-accent-strong,_#1e73be)] tw-underline hover:tw-text-[#17608f]';

const Plugins = () => {
	const { enableWsc } = useNewOnboardingData();

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-m)]">
			{ enableWsc && (
				<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-bg-[var(--cmplz-accent-subtle,_#e3f2ff)] tw-px-[var(--cmplz-space-m,_16px)] tw-py-[var(--cmplz-space-s,_12px)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]">
					<MailIcon />
					<span className="tw-text-[color:var(--cmplz-text,_#0f172a)]">
						{ __( 'An email is on its way — confirm your address to start with Complianz.', 'complianz-gdpr' ) }
					</span>
				</div>
			) }
			<p className="tw-m-0">
				{ __( "You're all set! You can now exit this onboarding and start the Wizard to complete your first configuration.", 'complianz-gdpr' ) }
			</p>
			<p className="tw-m-0">
				{ __( 'Need a hand with the first steps?', 'complianz-gdpr' ) }{ ' ' }
				<a href={ ARTICLE_URL } target="_blank" rel="noopener noreferrer" className={ linkCls }>
					{ __( 'Read our setup guide', 'complianz-gdpr' ) }
				</a>.{ ' ' }
				{ __( 'After that, Complianz runs fully automated.', 'complianz-gdpr' ) }
			</p>
		</div>
	);
};

export default Plugins;
