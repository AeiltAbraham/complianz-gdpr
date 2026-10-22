import { memo, useCallback, useEffect } from '@wordpress/element';
import UseWebSiteScanData from './UseWebSiteScanData';
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/Button';

// Migrated to the C-2 system (Stage H.5, Bundle H2). `websitescan_actions` is a premium-only field type (no
// free-edition field config uses it), so this screen is not reachable in the free wp-env e2e. The action bar
// is the C-2 card-footer pattern: a `--cmplz-surface-sunken` strip with a top `--cmplz-border`, full-bleed to
// the field-wrap edges as a CONSTANT `-space-l` (NOT the legacy stepped -25px — the field-wrap padding is a
// constant token, the T-054 lesson). The Buttons get the base reset (B1 border-style; the `error` variant's
// `--cmplz-danger`) from the app-root `#complianz-app[data-cmplz-ui]` marker (ADR-001 marker move, H.5
// Part 2 — the former footer `data-cmplz-ui` here is dropped); the top border is set explicitly
// (`tw-border-t-solid`). Buttons map: enable=primary / disable=secondary, activate=primary /
// reset=error (the legacy button-danger), as the legacy classes dictated.

const WebSiteScanActions = () => {
	const {
		loaded,
		wscStatus,
		tokenStatus,
		getStatus,
		startOnboarding,
		resetWsc,
		enableWsc,
		disableWsc,
	} = UseWebSiteScanData();

	// get the status before the render
	useEffect( () => {
		getStatus();
	}, [] );

	const handleActivationReset = useCallback( () => {
		if ( ! tokenStatus ) {
			return;
		}

		switch ( tokenStatus ) {
			case 'enabled':
				resetWsc();
				break;
			case 'disabled':
				startOnboarding();
				break;
			case 'pending':
				startOnboarding();
				break;
			default:
				break;
		}
	}, [ tokenStatus ] );

	const handleEnableDisable = useCallback( () => {
		if ( ! wscStatus ) {
			return;
		}

		switch ( wscStatus ) {
			case 'enabled':
				disableWsc();
				break;
			case 'disabled':
				enableWsc();
				break;
			default:
				break;
		}
	}, [ wscStatus ] );

	// handle the first button - Enable/Disable Website Scan
	const enableDisableButtonText =
		wscStatus === 'enabled'
			? __( 'Disable Website Scan', 'complianz-gdpr' )
			: __( 'Enable Website Scan', 'complianz-gdpr' );
	const enableDisableButtonVariant =
		wscStatus === 'enabled' ? 'secondary' : 'primary';
	// handle the second button - Activate (send Token) / Reset
	const activateResetButtonText =
		tokenStatus === 'enabled'
			? __( 'Reset Website Scan', 'complianz-gdpr' )
			: __( 'Activate Website Scan', 'complianz-gdpr' );
	const activateResetButtonVariant =
		tokenStatus === 'enabled' ? 'error' : 'primary';
	const activateResetButtonStatus = tokenStatus === 'pending';

	return (
		<div
			className="cmplz-wsc_actions-container tw-flex tw-justify-end tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-mx-[calc(var(--cmplz-space-l,_24px)*-1)] tw-mb-[calc(var(--cmplz-space-l,_24px)*-1)] tw-mt-[var(--cmplz-space-m,_16px)] tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-l,_24px)] tw-border-t tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)] tw-bg-[var(--cmplz-surface-sunken,_#f1f5f9)]"
		>
			{ tokenStatus !== 'disabled' && wscStatus !== 'pending' && (
				<Button
					variant={ enableDisableButtonVariant }
					onClick={ handleEnableDisable }
				>
					{ enableDisableButtonText }
				</Button>
			) }
			<Button
				variant={ activateResetButtonVariant }
				disabled={ activateResetButtonStatus }
				onClick={ handleActivationReset }
			>
				{ activateResetButtonText }
			</Button>
		</div>
	);
};

export default memo( WebSiteScanActions );
