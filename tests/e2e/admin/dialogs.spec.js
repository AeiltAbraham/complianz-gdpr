/**
 * Dialog behaviour layer (T-012, DB-09, §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * DB-09 characterises how dialogs behave: keyboard + mouse, focus kept inside while open, Escape
 * closes, focus returns to whatever opened them. These are the contracts the Phase-2 primitive
 * migration (ADR-002) must preserve: T-024 re-homes `Modal.js`/`AreYouSureModal.js` on the
 * Dialog/AlertDialog primitives and T-026 replaces the four `__experimentalConfirmDialog` usages with
 * `AlertDialog` — and both require "the dialogs spec passes unchanged" (tasks.md T-024/T-026). So this
 * file is written to the dialog's ROLE, accessible NAME and KEYBOARD behaviour, never to MUI/WP-core
 * markup, so it survives the swap of the underlying primitive.
 *
 * What is actually mounted:
 *   - The live confirm/"are you sure" dialog, reachable via Tools > Data > Reset (the `reset_settings`
 *     field's `warn`). Before T-026 it was WordPress `__experimentalConfirmDialog` (ARIA `role="dialog"`);
 *     as of T-026 it is `AreYouSureModal` on the Radix `AlertDialog` primitive (ARIA `role="alertdialog"`),
 *     both with focus trap + Escape + focus-return. The specs locate it by a `dialog`-or-`alertdialog`
 *     union (Playwright's role match is exact), so they hold across that swap unchanged — DB-09 subject.
 *   - The onboarding modal (Onboarding/NewOnboarding.js), shown when the URL carries `websitescan`.
 *     It is a plain (non-ARIA) modal with a labelled Close control and step navigation; it is NOT part
 *     of the Phase-2 Radix migration, so it is characterised for open / step / close as it behaves
 *     today (it has no focus trap or Escape handler, so those are not asserted for it).
 *
 * Determinism (§8.1.2): the confirm action is Reset-all-data — destructive. Its test intercepts the
 * `reset_settings` REST call and fulfils a benign success, so the confirm path never reaches the
 * server and the shared fixture DB is never mutated.
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted, settingsUrl } = require( './helpers/menu' );

// The Tools > Data "Reset" button is an action with a `warn`, so it opens the confirm dialog.
async function openConfirmDialog( page ) {
	await gotoSettings( page, '#tools/tools-data' );
	await waitForAppMounted( page );
	const trigger = page.getByTestId( 'field-reset_settings' ).getByRole( 'button', { name: 'Reset', exact: true } );
	await expect( trigger ).toBeVisible();
	await trigger.click();
	// Union locator: WordPress `__experimentalConfirmDialog` renders `role="dialog"`; the ADR-002
	// AlertDialog migration (T-026) renders `role="alertdialog"`. Playwright's role match is exact (no
	// ARIA superclass expansion), so match EITHER to survive the mixed-migration window unchanged.
	const dialog = page.getByRole( 'dialog' ).or( page.getByRole( 'alertdialog' ) );
	await expect( dialog ).toBeVisible();
	return { trigger, dialog };
}

// Confirm/accept button: "OK" today, "Confirm" after the AlertDialog migration — match either so the
// spec survives T-024/T-026 unchanged. Cancel is stable across both.
const confirmButton = ( dialog ) => dialog.getByRole( 'button', { name: /^(ok|confirm|yes)$/i } );
const cancelButton = ( dialog ) => dialog.getByRole( 'button', { name: 'Cancel', exact: true } );

async function triggerIsFocused( page ) {
	return page.evaluate( () => ( document.activeElement && document.activeElement.textContent || '' ).trim() );
}

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'confirm dialog opens with its message and confirm/cancel controls', async ( { page } ) => {
	const { dialog } = await openConfirmDialog( page );
	// It carries the action's warning text and both controls.
	await expect( dialog.getByText( 'Are you sure? This will remove all Complianz data.', { exact: false } ) ).toBeVisible();
	await expect( confirmButton( dialog ) ).toBeVisible();
	await expect( cancelButton( dialog ) ).toBeVisible();
	// Focus is moved into the dialog while it is open (focus trap).
	const focusInDialog = await page.evaluate( () => {
		const d = document.querySelector( '[role=dialog],[role=alertdialog]' );
		return !! d && d.contains( document.activeElement );
	} );
	expect( focusInDialog ).toBe( true );
} );

test( 'Cancel closes the dialog and returns focus to the trigger', async ( { page } ) => {
	const { dialog } = await openConfirmDialog( page );
	await cancelButton( dialog ).click();
	await expect( page.getByRole( 'dialog' ).or( page.getByRole( 'alertdialog' ) ) ).toHaveCount( 0 );
	expect( await triggerIsFocused( page ) ).toBe( 'Reset' );
} );

test( 'Escape closes the dialog and returns focus to the trigger', async ( { page } ) => {
	const { dialog } = await openConfirmDialog( page );
	await page.keyboard.press( 'Escape' );
	await expect( page.getByRole( 'dialog' ).or( page.getByRole( 'alertdialog' ) ) ).toHaveCount( 0 );
	expect( await triggerIsFocused( page ) ).toBe( 'Reset' );
} );

test( 'Confirm runs the action and closes the dialog', async ( { page } ) => {
	// Intercept the destructive reset so the confirm path never mutates the shared DB. A different id
	// avoids the client-side reset_settings special-casing; the UI just refetches and shows a notice.
	await page.route( /do_action\/reset_settings/, ( route ) =>
		route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true, success: true, id: 'e2e_noop', message: 'Stubbed (e2e)' } ) } )
	);
	await page.route( /admin-ajax\.php/, ( route ) => {
		const body = route.request().postData() || '';
		if ( body.includes( 'reset_settings' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true, success: true, id: 'e2e_noop', message: 'Stubbed (e2e)' } ) } );
		}
		return route.continue();
	} );

	const { dialog } = await openConfirmDialog( page );
	await confirmButton( dialog ).click();
	// Confirming dismisses the dialog (the action then runs against the stub).
	await expect( page.getByRole( 'dialog' ).or( page.getByRole( 'alertdialog' ) ) ).toHaveCount( 0 );
} );

// --------------------------------------------------------------------------------------------------
// Onboarding modal (characterised as it behaves today; not part of the Phase-2 Radix migration).
// --------------------------------------------------------------------------------------------------

// Closing the onboarding persists an "onboarding dismissed" flag (NewOnboardingData.skipStep ->
// doAction('dismiss_wsc_onboarding')); stub it so the close path never mutates the shared DB.
async function stubOnboardingDismiss( page ) {
	await page.route( /do_action\/dismiss_wsc_onboarding/, ( route ) =>
		route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true } ) } )
	);
	await page.route( /admin-ajax\.php/, ( route ) => {
		const body = route.request().postData() || '';
		if ( body.includes( 'dismiss_wsc_onboarding' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true } ) } );
		}
		return route.continue();
	} );
}

async function openOnboarding( page ) {
	await stubOnboardingDismiss( page );
	// The modal mounts whenever the URL carries `websitescan` (Page.js) and the website-scan client
	// credentials are absent (the free seed), which they are.
	await page.goto( settingsUrl( '#dashboard' ).replace( '?page=complianz', '?page=complianz&websitescan=1' ) );
	await waitForAppMounted( page );
	await expect( page.getByText( 'Welcome to Complianz', { exact: false } ).first() ).toBeVisible( { timeout: 30_000 } );
}

test( 'onboarding modal opens and advances a step', async ( { page } ) => {
	await openOnboarding( page );
	// Open state exposes a labelled Close control and the step navigation.
	await expect( page.getByRole( 'button', { name: 'Close', exact: true } ) ).toBeVisible();
	// Advancing: "Continue" moves to the next step (its title changes).
	await page.getByRole( 'button', { name: 'Continue', exact: true } ).click();
	await expect( page.getByText( 'Terms and Conditions', { exact: false } ).first() ).toBeVisible( { timeout: 10_000 } );
} );

test( 'onboarding modal closes via its Close control', async ( { page } ) => {
	await openOnboarding( page );
	await page.getByRole( 'button', { name: 'Close', exact: true } ).click();
	// The modal is dismissed: its content is gone.
	await expect( page.getByText( 'Welcome to Complianz', { exact: false } ) ).toHaveCount( 0, { timeout: 10_000 } );
} );
