import {useEffect} from '@wordpress/element';
import {__} from '@wordpress/i18n';
import useTheme from '../utils/theme';

const ThemeToggle = () => {
	const {preference, cycle, init} = useTheme();

	useEffect(() => {
		init();
	}, []);

	const icons = {
		light: '\u2600\uFE0F',
		dark: '\uD83C\uDF19',
		system: '\uD83D\uDCBB',
	};

	/* translators: %s: current theme mode (Light, Dark, or System) */
	const labels = {
		light: __('Light mode', 'complianz-gdpr'),
		dark: __('Dark mode', 'complianz-gdpr'),
		system: __('System mode', 'complianz-gdpr'),
	};

	return (
		<button
			className="cmplz-theme-toggle"
			onClick={cycle}
			title={labels[preference]}
			aria-label={labels[preference]}
			type="button"
		>
			<span className="cmplz-theme-toggle__icon">{icons[preference]}</span>
		</button>
	);
};

export default ThemeToggle;
