/**
 * App-state layer (T-012, §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * Characterises the settings app's non-happy-path states: the locked-by-another-user placeholder, the
 * REST-error placeholder, and the save success / failure toasts. Each state is produced deterministically
 * by intercepting the app's own `/complianz/v1/` calls (never by seeding server state), so nothing here
 * mutates the shared fixture DB.
 *
 * How each state is forced:
 *   - locked: `/complianz/v1/fields/get` returns a `locked_by` user id different from the current user,
 *     which Page.js renders as the PagePlaceholder lock screen.
 *   - REST error: `/complianz/v1/fields/get` returns 500 (and its admin-ajax fallback too), which
 *     FieldsData surfaces as `error`, rendered as the PagePlaceholder error screen.
 *   - save toasts: `/complianz/v1/fields/set` is stubbed (success, or 500 + an error payload on the
 *     admin-ajax fallback), so Save announces the success or the forced error through the toast region
 *     without persisting anything.
 *
 * Selector contract (§8.1.1): role / accessible name / text / `data-testid`. No `cmplz-*`, WP-core or
 * utility class selector is used.
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted } = require( './helpers/menu' );

// A user id that is never the logged-in admin, to force the "locked by another user" branch.
const OTHER_USER = 999999;

function fieldsGetBody( overrides ) {
	return JSON.stringify( Object.assign( { request_success: true, fields: [], error: false, locked_by: 0, field_notices: [] }, overrides ) );
}

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'locked-by-another-user placeholder', async ( { page } ) => {
	const body = fieldsGetBody( { locked_by: OTHER_USER } );
	await page.route( /complianz\/v1\/fields\/get/, ( route ) => route.fulfill( { status: 200, contentType: 'application/json', body } ) );
	await page.route( /admin-ajax\.php/, ( route ) => {
		const u = route.request().url();
		if ( u.includes( 'fields' ) ) return route.fulfill( { status: 200, contentType: 'application/json', body } );
		return route.continue();
	} );

	await gotoSettings( page, '#wizard' );
	await waitForAppMounted( page );
	// The lock placeholder names the holding user id and explains the temporary lock.
	await expect( page.locator( APP ).getByText( String( OTHER_USER ), { exact: false } ) ).toBeVisible( { timeout: 30_000 } );
	await expect( page.locator( APP ).getByText( 'temporarily locked', { exact: false } ) ).toBeVisible();
} );

test( 'REST-error placeholder on a failed fields request', async ( { page } ) => {
	await page.route( /complianz\/v1\/fields\/get/, ( route ) => route.fulfill( { status: 500, contentType: 'application/json', body: '{}' } ) );
	await page.route( /admin-ajax\.php/, ( route ) => {
		const u = route.request().url();
		if ( u.includes( 'fields' ) ) return route.fulfill( { status: 500, contentType: 'application/json', body: '{}' } );
		return route.continue();
	} );

	await gotoSettings( page, '#wizard' );
	await waitForAppMounted( page );
	await expect(
		page.locator( APP ).getByText( 'A problem was detected during the loading of the settings', { exact: false } )
	).toBeVisible( { timeout: 30_000 } );
} );

test( 'save success announces a toast', async ( { page } ) => {
	await gotoSettings( page, '#settings/settings-general' );
	await waitForAppMounted( page );
	await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 30_000 } );
	// Stub the save so it succeeds without persisting.
	await page.route( /complianz\/v1\/fields\/set/, ( route ) =>
		route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true, fields: false } ) } )
	);

	await page.locator( APP ).getByRole( 'button', { name: 'Save', exact: true } ).first().click();
	await expect( page.getByText( 'Settings saved', { exact: false } ).first() ).toBeVisible( { timeout: 10_000 } );
} );

test( 'save failure announces an error toast', async ( { page } ) => {
	await gotoSettings( page, '#settings/settings-general' );
	await waitForAppMounted( page );
	await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 30_000 } );
	// REST save fails; the admin-ajax fallback returns a server-shaped error so the message is stable.
	await page.route( /complianz\/v1\/fields\/set/, ( route ) => route.fulfill( { status: 500, contentType: 'application/json', body: '{}' } ) );
	await page.route( /admin-ajax\.php/, ( route ) => {
		const body = route.request().postData() || '';
		if ( body.includes( 'fields/set' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { errors: { save: 'Forced save failure (e2e)' } } ) } );
		}
		return route.continue();
	} );

	await page.locator( APP ).getByRole( 'button', { name: 'Save', exact: true } ).first().click();
	// The failure is announced as an error toast. (Today's app also fires the toast.promise success
	// toast because the request promise resolves either way — a characterised quirk; the error toast is
	// what proves the failure was surfaced.)
	await expect( page.getByText( 'Forced save failure (e2e)', { exact: false } ).first() ).toBeVisible( { timeout: 15_000 } );
} );
