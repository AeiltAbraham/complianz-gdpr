import { useEffect } from '@wordpress/element';
import { useNewOnboardingData } from "../NewOnboardingData";
import { __ } from '@wordpress/i18n';
import CheckBox from '../components/CheckBox';

const MailIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<rect x="2" y="4" width="20" height="16" rx="2" />
		<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
	</svg>
);

const Plugins = () => {
	const { plugins, fetchPlugins, setPlugins, setEnablePluginInstallation, setIsContentLoading, enableWsc } = useNewOnboardingData();

	useEffect(() => {
		const loadPlugins = async () => {
			try {
				setIsContentLoading(true);
				await fetchPlugins();
			} catch (error) {
				console.log(error);

			} finally {
				setIsContentLoading(false);
			}
		}
		loadPlugins();
	}, [fetchPlugins]);

	const handleChange = (plugin, isChecked) => {
		// checkbox change update checked and toProcess
		const updatedPlugins = plugins.map(p =>
			p.slug === plugin.slug ? {
				...p,
				checked: isChecked,
				toProcess: isChecked,
			} : p
		);
		setPlugins(updatedPlugins);

		const someToProcess = updatedPlugins.some(p => p.toProcess); // bool
		setEnablePluginInstallation(someToProcess);
	};

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
			<p>{__("You want more Really Simple Plugins? Select below plugins you'd like to install for free! It only takes 10 seconds..", "complianz-gdpr")}</p>
			{plugins && plugins.map((plugin, i) => <CheckBox key={plugin.slug} plugin={plugin} handleChange={handleChange} />)}
		</div>
	);
};

export default Plugins;

