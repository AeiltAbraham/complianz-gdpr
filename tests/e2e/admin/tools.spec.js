/**
 * Tools flow layer (T-012, §8.1.3, DB-10 baseline), `admin` project (8888, latest), TODAY's UI.
 *
 * Characterises the Tools screens in the free edition: export settings (download), import (premium-
 * locked), the debug-data view, the support form (premium-locked), and the DB-10 async contract — an
 * action that shows a loading state and then a success or a (forced) error state.
 *
 * Determinism (§8.1.2): the DB-10 success/error cases drive the Save action with
 * `/complianz/v1/fields/set` intercepted, so no save ever reaches the server — the shared fixture DB
 * is never mutated. Export is read-only. Import/support are locked (not operable) in the free edition,
 * so they cannot mutate either.
 *
 * Selector contract (§8.1.1): role / accessible name / text / `data-testid`. No `cmplz-*`, WP-core or
 * utility class selector is used to locate or assert anything.
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted } = require( './helpers/menu' );

async function gotoToolsData( page ) {
	await gotoSettings( page, '#tools/tools-data' );
	await waitForAppMounted( page );
	await page.getByTestId( 'field-export_settings' ).waitFor( { state: 'visible', timeout: 30_000 } );
}

async function gotoSupport( page ) {
	await gotoSettings( page, '#tools/support' );
	await waitForAppMounted( page );
	await page.locator( APP ).getByRole( 'heading', { name: 'Debugging', exact: true } ).waitFor( { state: 'visible', timeout: 30_000 } );
}

const saveButton = ( page ) => page.locator( APP ).getByRole( 'button', { name: 'Save', exact: true } ).first();

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'export settings triggers a settings download', async ( { page } ) => {
	await gotoToolsData( page );
	const exportBtn = page.getByTestId( 'field-export_settings' ).getByRole( 'button', { name: 'Export', exact: true } );
	await expect( exportBtn ).toBeVisible();

	const [ download ] = await Promise.all( [
		page.waitForEvent( 'download', { timeout: 30_000 } ),
		exportBtn.click(),
	] );
	expect( download.suggestedFilename() ).toContain( 'complianz' );
} );

test( 'import is premium-locked in the free edition', async ( { page } ) => {
	await gotoToolsData( page );
	const importField = page.getByTestId( 'field-import_settings' );
	await expect( importField ).toBeVisible();
	// The import field renders its premium upsell affordance and no usable control.
	await expect( importField.getByRole( 'link', { name: 'Upgrade', exact: true } ) ).toBeVisible();
} );

test( 'debug data view loads its content', async ( { page } ) => {
	await gotoSupport( page );
	// DebugDataControl fetches get_debug_data, replacing its "..." loading state with the loaded
	// content — either the script-debug summary or the "enable SCRIPT_DEBUG" hint, depending on the
	// environment. Either proves the async fetch resolved into the success state.
	await expect(
		page.locator( APP ).getByText( /Debugging enabled:|To view possible script conflicts/ ).first()
	).toBeVisible( { timeout: 30_000 } );
} );

test( 'support form is premium-locked in the free edition', async ( { page } ) => {
	await gotoSupport( page );
	const app = page.locator( APP );
	// The support form group renders locked: an "Upgrade" badge and a premium upsell link.
	await expect( app.getByText( 'Upgrade', { exact: true } ).first() ).toBeVisible();
	await expect( app.getByRole( 'link', { name: /premium/i } ).first() ).toBeVisible();
	// Its Send control is present but not usable.
	await expect( app.getByRole( 'button', { name: 'Send', exact: true } ) ).toBeDisabled();
} );

// ---------------------------------------------------------------------------------------------------
// DB-10: an async action shows a loading state, then success / forced error — via /complianz/v1/
// route interception. The Save action on the Data screen is the vehicle; the interception also makes
// it a no-op, so nothing persists.
// ---------------------------------------------------------------------------------------------------

test( 'async save: loading state then success (DB-10)', async ( { page } ) => {
	await gotoToolsData( page );
	// Delay the stubbed response so the loading ("Saving settings...") state is observable, then succeed.
	await page.route( /complianz\/v1\/fields\/set/, async ( route ) => {
		await new Promise( ( r ) => setTimeout( r, 1200 ) );
		await route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true, fields: false } ) } );
	} );

	await saveButton( page ).click();
	// Loading → success, both announced via the toast region.
	await expect( page.getByText( 'Saving settings...', { exact: false } ).first() ).toBeVisible( { timeout: 5_000 } );
	await expect( page.getByText( 'Settings saved', { exact: false } ).first() ).toBeVisible( { timeout: 10_000 } );
} );

test( 'async save: loading state then forced error (DB-10)', async ( { page } ) => {
	await gotoToolsData( page );
	// REST set fails (500); the app falls back to admin-ajax, which we answer with a server-shaped
	// error payload so the error is announced with a deterministic message.
	await page.route( /complianz\/v1\/fields\/set/, async ( route ) => {
		await new Promise( ( r ) => setTimeout( r, 1200 ) );
		await route.fulfill( { status: 500, contentType: 'application/json', body: '{}' } );
	} );
	await page.route( /admin-ajax\.php/, ( route ) => {
		const body = route.request().postData() || '';
		if ( body.includes( 'fields/set' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { errors: { save: 'Forced save failure (e2e)' } } ) } );
		}
		return route.continue();
	} );

	await saveButton( page ).click();
	// Loading → error: the pending state shows, then the forced error is announced.
	await expect( page.getByText( 'Saving settings...', { exact: false } ).first() ).toBeVisible( { timeout: 5_000 } );
	await expect( page.getByText( 'Forced save failure (e2e)', { exact: false } ).first() ).toBeVisible( { timeout: 15_000 } );
} );
