import { TextField } from "../../components/ui/TextField";

// Onboarding input (Stage H.8). The email variant becomes the `ui/TextField` primitive (full-width,
// `invalid` ring driven by the error); the error hint is a tw- danger caption. Rendered inside the
// Radix Dialog portal island, so tokens/base reset apply. The checkbox variant is a plain native
// checkbox (the fancy legacy checkmark moved to the dedicated CheckBox component).
const OnboardingInput = ({ type, className = '', error = '', description = '', ...otherProps }) => {

	if (!type) return;

	if (type === 'email') return (
		<div className="tw-mb-[var(--cmplz-space-m)]">
			<TextField
				type="email"
				invalid={!!error}
				className={`tw-w-full ${className}`}
				{...otherProps}
			/>
			{description && <span className="tw-mt-[var(--cmplz-space-2xs)] tw-block tw-text-[0.75rem] tw-text-[color:var(--cmplz-text-muted)]">{description}</span>}
			{error && <span className="tw-mt-[var(--cmplz-space-2xs)] tw-block tw-text-[0.75rem] tw-text-[color:var(--cmplz-danger)]">{error}</span>}
		</div>
	)

	if (type === 'checkbox') return (
		<div className="tw-flex tw-items-center">
			<input className={`tw-h-4 tw-w-4 tw-accent-[var(--cmplz-accent-strong)] ${className}`} type="checkbox" {...otherProps} />
		</div>
	)

	return null;
}
export default OnboardingInput;
