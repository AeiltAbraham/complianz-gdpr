import Icon from "../../utils/Icon";
import { useNewOnboardingData } from "../NewOnboardingData";
// status: not-installed / activated / installed

const statuses = {
	'not-installed': {
		label: 'Check to Install!',
		iconColor: 'blue',
		iconName: 'info',
		checked: false,
	},
	'installed': {
		label: 'Check to Activate!',
		iconColor: 'orange',
		iconName: 'info',
		checked: false,
	},
	'activated': {
		label: 'Installed!',
		iconColor: 'green',
		iconName: 'circle-check',
		checked: true,
	},
	'processing': {
		label: 'Processing ...',
		iconColor: 'grey',
		iconName: 'loading',
		checked: true,
	}
}

// Onboarding plugin checkbox (Stage H.8). The fancy legacy custom checkmark (hidden input + styled
// span) becomes a clean accessible native checkbox (accent-strong) + label + the status Icon, on C-2
// tokens. Rendered inside the Radix Dialog portal island. Checked/disabled/onChange logic unchanged.
const CheckBox = ({ plugin, className = '', handleChange, ...otherProps }) => {

	const { isInstalling } = useNewOnboardingData();

	const handleCheckboxChange = (e) => {
		handleChange(plugin, e.target.checked);
	};

	return (
		<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs)]">
			<label className="tw-flex tw-flex-1 tw-items-center tw-gap-[var(--cmplz-space-xs)] tw-cursor-pointer tw-text-[0.75rem]">
				<input
					className={`tw-h-4 tw-w-4 tw-shrink-0 tw-accent-[var(--cmplz-accent-strong)] ${className}`}
					checked={plugin.checked}
					disabled={isInstalling ? true : statuses[plugin.status].checked}
					onChange={handleCheckboxChange}
					type="checkbox"
					{...otherProps}
				/>
				<span>{plugin.description}</span>
			</label>
			{plugin.status &&
				<span className="tw-ms-auto tw-flex tw-shrink-0">
					<Icon
						name={statuses[plugin.status]?.iconName}
						color={statuses[plugin.status]?.iconColor}
						size={14}
						tooltip={statuses[plugin.status]?.label}
					/>
				</span>
			}
		</div>
	)
}

export default CheckBox
