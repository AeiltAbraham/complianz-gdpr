/**
 * Guided tour layer (T-013, FR-023 / DB-15), `admin` + `admin-min-wp` projects, TODAY's UI.
 *
 * Characterises the react-shepherd onboarding tour, opened by the `?tour` URL parameter (Page.js:
 * `showTour = window.location.href.indexOf('tour') !== -1` -> dynamic import of Tour/Tour.js). The
 * tour matters for the minimum-WordPress floor (DB-15, WP 5.9 / React 17): it is a dynamically
 * imported chunk that renders through react-shepherd, so driving it on 8889 exercises the React-17
 * `render` fallback (index.js) and the `react-jsx-runtime` polyfill end to end. It also runs on the
 * latest `admin` project for parity. No baseline/visual coverage here — behaviour only.
 *
 * Determinism (§8.1.2): the tour only navigates URL hashes and shows/hides its own widget; it issues
 * no `/complianz/v1/` writes, so it never mutates the shared fixture DB and cannot disturb a sibling
 * spec or the visual baseline in a combined run. Each test gets its own fresh page.
 *
 * Selector contract (§8.1.1): role / accessible name / text only — never a class. react-shepherd is a
 * retained widget rendered in a portal OUTSIDE the `#complianz` app, so queries are page-level (not
 * APP-scoped). Shepherd renders each step as `role="dialog"` whose accessible name is the step title
 * (aria-labelledby), with footer `<button>`s carrying their visible text and a cancel-icon button
 * labelled "Close Tour" (shepherd.js defaults, verified against node_modules). Step titles/texts are
 * English in BOTH projects this runs in (en_US admin, and admin-min-wp admin; Complianz ships no he_IL
 * pack and the de_DE project does not run this), so matching them by text/role is locale-safe here.
 */

const { test, expect } = require( '@playwright/test' );
const { waitForAppMounted } = require( './helpers/menu' );

// The settings page with the tour flag. Nothing in the base admin URL contains the substring "tour",
// so `?tour=1` is what flips Page.js's showTour on; a fresh document load imports the tour chunk.
const TOUR_URL = '/wp-admin/admin.php?page=complianz&tour=1';

// Step 1 (Tour/Tour.js newSteps[0]): the welcome step, with a "Configure" and a "Start tour" button.
const WELCOME_TITLE = 'Welcome to Complianz';
// Step 2 in the free edition (no premium license step spliced in): the Dashboard step. Its body text
// is unique to the tour, so it distinguishes the advanced step from the app's own Dashboard heading.
const DASHBOARD_STEP_TEXT = 'This is your Dashboard';

async function openTour( page ) {
	await page.goto( TOUR_URL );
	// The app must mount first; the tour chunk is then imported only after the fields finish loading
	// (Tour.js guards on fieldsLoaded). Waiting for the mount makes a slow cold load (the first
	// settings-page hit on a fresh wp-env is the worst case) fail with a clear message rather than as a
	// bare "dialog not found", and starts the dialog wait from a ready app.
	await waitForAppMounted( page );
	// react-shepherd is dynamically imported and the tour auto-starts — give it room, esp. on 8889.
	const welcome = page.getByRole( 'dialog', { name: WELCOME_TITLE } );
	await expect( welcome ).toBeVisible( { timeout: 60_000 } );
	return welcome;
}

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'the tour opens on its first step', async ( { page } ) => {
	const welcome = await openTour( page );
	// The welcome step shows its body copy and both of its controls (by role + text, not class).
	await expect( welcome.getByText( 'Get ready for privacy legislation', { exact: false } ) ).toBeVisible();
	await expect( welcome.getByRole( 'button', { name: 'Start tour', exact: true } ) ).toBeVisible();
	await expect( welcome.getByRole( 'button', { name: 'Configure', exact: true } ) ).toBeVisible();
} );

test( 'Start tour advances to the next step', async ( { page } ) => {
	const welcome = await openTour( page );
	await welcome.getByRole( 'button', { name: 'Start tour', exact: true } ).click();

	// The tour advances to the Dashboard step (a new dialog with its own title + body copy).
	const dashboardStep = page.getByRole( 'dialog', { name: 'Dashboard' } );
	await expect( dashboardStep ).toBeVisible( { timeout: 30_000 } );
	await expect( dashboardStep.getByText( DASHBOARD_STEP_TEXT, { exact: false } ) ).toBeVisible();
	// The welcome step is no longer shown (we really moved forward, not opened a second dialog).
	await expect( page.getByRole( 'dialog', { name: WELCOME_TITLE } ) ).toHaveCount( 0 );
} );

test( 'the tour closes via its cancel control', async ( { page } ) => {
	await openTour( page );
	// Shepherd's cancel icon is a button labelled "Close Tour" (enabled via cancelIcon in tourOptions).
	await page.getByRole( 'button', { name: 'Close Tour', exact: true } ).click();
	// The tour widget is dismissed: no shepherd dialog remains.
	await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0, { timeout: 15_000 } );
} );
