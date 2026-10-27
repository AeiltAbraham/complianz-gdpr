import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { TextField } from '../../components/ui/TextField';
import { secondaryLinkButtonCls } from '../../components/ui/downloadLink';

/**
 * PremiumLicense — the premium shortcut on the new-user Welcome step (showcase). A user who already
 * owns a license can paste it to automatically download and activate Premium; everyone else gets a
 * "Buy a premium license" CTA. The key field is visual only here (the real download/activate is a
 * premium backend action). Rendered inside the Radix Dialog portal island, so tokens/base reset apply.
 */

const Crown = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cmplz-premium-gold, #d4a017)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw-shrink-0">
		<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
		<path d="M5 21h14" />
	</svg>
);

const PremiumLicense = () => {
	const [ license, setLicense ] = useState( '' );
	const upgradeUrl =
		( window.cmplz_settings && window.cmplz_settings.upgrade_link ) || 'https://complianz.io/pricing/';

	return (
		<div className="tw-flex tw-flex-col tw-gap-[var(--cmplz-space-s,_12px)] tw-rounded-[var(--cmplz-radius-s,_8px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)] tw-p-[var(--cmplz-space-m,_16px)]">
			<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-text-[color:var(--cmplz-accent-strong,_#1e73be)]">
				<Crown />
				<span className="tw-font-semibold tw-text-[color:var(--cmplz-text,_#0f172a)]">
					{ __( 'Have a premium license?', 'complianz-gdpr' ) }
				</span>
			</div>
			<p className="tw-m-0 tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
				{ __( 'Enter your license key and we’ll automatically download and activate the Premium version.', 'complianz-gdpr' ) }
			</p>
			<TextField
				type="text"
				value={ license }
				onChange={ ( e ) => setLicense( e.target.value ) }
				placeholder={ __( 'Premium license key', 'complianz-gdpr' ) }
				className="tw-w-full"
			/>
			<div className="tw-flex tw-flex-wrap tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-text-[0.8125rem] tw-text-[color:var(--cmplz-text-muted,_#475569)]">
				<span>{ __( 'Don’t have one yet?', 'complianz-gdpr' ) }</span>
				<a href={ upgradeUrl } target="_blank" rel="noopener noreferrer" className={ secondaryLinkButtonCls }>
					{ __( 'Buy a premium license', 'complianz-gdpr' ) }
				</a>
			</div>
		</div>
	);
};

export default PremiumLicense;
