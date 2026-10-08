/**
 * Page-rules layer (T-012, DB-04, §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * DB-04: other plugins' admin notices stay hidden on Complianz screens while really-simple-plugins
 * notices show, and the app's edges sit where they do today. The characterization uses the test
 * mu-plugin's two notices (tests/e2e/mu-plugins/cmplz-e2e-stubs.php): a plain third-party notice
 * (outside the `really-simple-plugins` container, so the page rule hides it) and a Complianz-style
 * notice carrying the `really-simple-plugins` class, scoped to Complianz screens, which the rule
 * keeps visible. The mu-plugin notice is used instead of Complianz's incidental live review notice
 * because the latter does not appear on a freshly reset database — the state CI runs against.
 *
 * Determinism (§8.1.2): read-only. No navigation here mutates the shared fixture DB.
 *
 * Selector contract (§8.1.1): notices are matched by their visible TEXT, never by class. The app edge
 * offset is read from the computed style of `#complianz` — the PHP app mount / kept scope anchor
 * (ADR-001) — which is the exact element DB-04 is about (its negative margin pulls the app to the
 * admin edge). No `cmplz-*`, WP-core or utility class selector is used to locate anything.
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted, settingsUrl } = require( './helpers/menu' );

const THIRD_PARTY_TEXT = 'Example third-party plugin notice';
// The mu-plugin prints a Complianz-style notice carrying the `really-simple-plugins` class on
// Complianz screens only (the class the page rule keeps visible). Deterministic on a fresh DB,
// unlike Complianz's incidental live review notice, which is absent on a reset database.
const CMPLZ_STYLE_NOTICE_TEXT = 'Example Complianz-style notice';

// Complianz admin screens the rule must apply on (by their preserved deep-link hash, the C-3 contract).
const COMPLIANZ_SCREENS = [ '#dashboard', '#wizard', '#settings/settings-general', '#tools/tools-data' ];

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'third-party notices are hidden on every Complianz screen while a really-simple-plugins notice shows', async ( { page } ) => {
	for ( const hash of COMPLIANZ_SCREENS ) {
		await gotoSettings( page, hash );
		await waitForAppMounted( page );
		// The third-party notice (no really-simple-plugins class) is present in the DOM but visually
		// suppressed on Complianz screens.
		await expect(
			page.getByText( THIRD_PARTY_TEXT, { exact: false } ),
			`third-party notice should be hidden on ${ hash }`
		).toBeHidden();
		// The Complianz-style notice (really-simple-plugins class) IS shown on every Complianz screen —
		// the rule is selective, not a blanket "hide all notices".
		await expect(
			page.getByText( CMPLZ_STYLE_NOTICE_TEXT, { exact: false } ).first(),
			`really-simple-plugins notice should be visible on ${ hash }`
		).toBeVisible( { timeout: 30_000 } );
	}
} );

test( 'the same third-party notice is visible on a non-Complianz admin screen', async ( { page } ) => {
	// The hiding is scoped to Complianz screens (its stylesheet loads only there); elsewhere the notice
	// shows normally — proof the rule is page-scoped.
	await page.goto( '/wp-admin/index.php' );
	await expect( page.getByText( THIRD_PARTY_TEXT, { exact: false } ).first() ).toBeVisible( { timeout: 30_000 } );
} );

test( 'the app edge offset matches today at desktop and tablet widths', async ( { page } ) => {
	const marginLeftOf = () => page.evaluate( () => getComputedStyle( document.querySelector( '#complianz' ) ).marginLeft );

	await page.setViewportSize( { width: 1440, height: 900 } );
	await gotoSettings( page, '#dashboard' );
	await waitForAppMounted( page );
	// Desktop: the app is pulled to the admin content edge by a -20px left margin.
	expect( await marginLeftOf() ).toBe( '-20px' );

	await page.setViewportSize( { width: 768, height: 1024 } );
	await page.goto( settingsUrl( '#dashboard' ) );
	await waitForAppMounted( page );
	// Tablet (<=768px): the offset tightens to -9px (the responsive value in admin.css).
	expect( await marginLeftOf() ).toBe( '-9px' );
} );
