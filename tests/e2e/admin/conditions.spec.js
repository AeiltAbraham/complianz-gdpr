/**
 * `react_conditions` layer (T-011, §8.1.1 / §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * A controlling field's value shows or hides its dependant field. Complianz declares these pairs in
 * `settings/config/` as a field's `react_conditions` and evaluates them CLIENT-SIDE
 * (settings/src/utils/updateFieldsListWithConditions.js -> validateConditions): a field whose
 * conditions are not met is `conditionallyDisabled` and `Settings/Fields/Field.js` renders nothing
 * for it. So the contract under test is purely visual presence/absence, driven by the real control.
 *
 * All pairs below are reachable and free in the seeded fixture (General Settings), and every toggle
 * is done through the rendered control WITHOUT saving — the app re-evaluates conditions in the store
 * on each change, and the unsaved change is discarded on the next navigation. The shared fixture DB
 * (one worker, §8.1.2) is therefore never mutated by this spec, so it cannot disturb the visual
 * baseline (T-010) or any sibling spec in the same run.
 *
 * Selector contract (§8.1.1): role / accessible name / `data-testid` only. Each field wrapper carries
 * `data-testid="field-<id>"` (added in Field.js by this task — an attribute-only, behaviour-free hook)
 * so a dependant can be located by id regardless of its control's accessible name; the controls inside
 * are driven by their ARIA role (`switch`, `radio`). No `cmplz-*` / WP-core / utility class appears.
 *
 * The pairs are read from the config, not invented:
 *   - `send_notifications_email` (checkbox) -> `notifications_email_address` (email)        [settings-general]
 *   - `set_cookies_on_root`      (checkbox) -> `cookie_domain`               (text)         [settings-general]
 *   - `uses_thirdparty_services` (radio)    -> `thirdparty_services_on_site` (multicheckbox) [services]
 */

const { test, expect } = require( '@playwright/test' );
const { gotoSettings, waitForAppMounted } = require( './helpers/menu' );

// Navigate to a settings sub-screen (fresh document load) and wait until its fields have rendered.
async function gotoFieldsPage( page, hash ) {
	await gotoSettings( page, hash );
	await waitForAppMounted( page );
	await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 30_000 } );
}

const field = ( page, id ) => page.getByTestId( 'field-' + id );

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'checkbox controller shows/hides its dependent field (send_notifications_email -> notifications_email_address)', async ( { page } ) => {
	await gotoFieldsPage( page, '#settings/settings-general' );

	const controller = field( page, 'send_notifications_email' ).getByRole( 'switch' );
	await expect( controller ).toBeVisible();

	// Seed default is off -> the email dependant is hidden (Field renders nothing for it).
	await expect( field( page, 'notifications_email_address' ) ).toHaveCount( 0 );

	// Turn the controller on -> the dependant appears.
	await controller.click();
	await expect( field( page, 'notifications_email_address' ) ).toBeVisible();
	await expect( field( page, 'notifications_email_address' ).getByRole( 'textbox' ) ).toBeVisible();

	// Turn it back off -> the dependant disappears again. (No save: the DB is untouched.)
	await controller.click();
	await expect( field( page, 'notifications_email_address' ) ).toHaveCount( 0 );
} );

test( 'checkbox controller shows/hides its dependent field (set_cookies_on_root -> cookie_domain)', async ( { page } ) => {
	await gotoFieldsPage( page, '#settings/settings-general' );

	const controller = field( page, 'set_cookies_on_root' ).getByRole( 'switch' );
	await expect( controller ).toBeVisible();

	// Seed default is off -> the domain text dependant is hidden.
	await expect( field( page, 'cookie_domain' ) ).toHaveCount( 0 );

	await controller.click();
	await expect( field( page, 'cookie_domain' ) ).toBeVisible();
	await expect( field( page, 'cookie_domain' ).getByRole( 'textbox' ) ).toBeVisible();

	await controller.click();
	await expect( field( page, 'cookie_domain' ) ).toHaveCount( 0 );
} );

test( 'radio controller shows/hides its dependent field (uses_thirdparty_services -> thirdparty_services_on_site)', async ( { page } ) => {
	await gotoFieldsPage( page, '#wizard/services' );

	const controllerGroup = field( page, 'uses_thirdparty_services' );
	await expect( controllerGroup ).toBeVisible();

	// Drive both directions explicitly so the assertion holds whatever the controller's current value is.
	// 'No' -> the dependant (thirdparty_services_on_site, condition uses_thirdparty_services === 'yes') is
	// hidden.
	await controllerGroup.getByRole( 'radio', { name: 'No', exact: true } ).click();
	await expect( field( page, 'thirdparty_services_on_site' ) ).toHaveCount( 0 );

	// 'Yes' -> the dependant multicheckbox appears.
	await controllerGroup.getByRole( 'radio', { name: 'Yes', exact: true } ).click();
	await expect( field( page, 'thirdparty_services_on_site' ) ).toBeVisible();

	// Back to 'No' -> it disappears again. (No save: the stored value is never changed.)
	await controllerGroup.getByRole( 'radio', { name: 'No', exact: true } ).click();
	await expect( field( page, 'thirdparty_services_on_site' ) ).toHaveCount( 0 );
} );
