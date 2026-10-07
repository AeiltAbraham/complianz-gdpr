/**
 * Smoke layer (T-009, §8.1.3 "Smoke — every page"), written against TODAY's shipped UI.
 *
 * Iterates EVERY section and sub-menu screen the app itself renders — discovered at runtime from the
 * app's own menu data (window.cmplz_settings.menu; see helpers/menu.js), so a menu item added or
 * removed in PHP is covered automatically with no spec edit. Each screen is loaded on its own fresh
 * document (deep-link hash, the preserved C-3 navigation contract) and asserted to:
 *   - render its real content (positive assertion — never a placeholder-class check);
 *   - emit no console errors;
 *   - make no failed `/complianz/v1/` request (status >= 400);
 *   - show no ErrorBoundary fallback;
 *   - not get stuck on a loading placeholder (same positive content assertion).
 * Premium groups (locked in the free edition) are additionally asserted rendered-and-locked with
 * upsell text (plan.md §1).
 *
 * Runs in `admin` (en_US) and later, unchanged, in `admin-rtl` (he_IL) and `admin-min-wp` (WP 5.9 /
 * React 17) — so nothing here hard-codes an English menu title or a WordPress version. Selector
 * contract (§8.1.1): role / accessible name / text only; the sole raw selector is the `#complianz`
 * scope anchor inside helpers/menu.js. No `cmplz-*`, WP-core or utility class selectors appear.
 *
 * Per-page results are attached as a JSON artifact (git-ignored test-results/), and every failure is
 * reported together at the end with its screen and message, so the whole app's state is visible in
 * one run rather than aborting at the first bad screen.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( '@playwright/test' );
const {
	discoverPages,
	gotoSettings,
	expectContentLoaded,
	expectNoErrorBoundary,
	expectLockedWithUpsell,
} = require( './helpers/menu' );

// App JS errors are NOT silently tolerated: today's UI emits none on any screen (verified while
// writing this task), so this allowlist is empty. The ONLY additions permitted are errors that
// originate in WordPress core (not this plugin), each a narrow regex with a one-line reason — never
// a blanket mute of a plugin error, which must be reported and fixed instead.
const ALLOWED_CONSOLE_ERRORS = [];

// Browser-emitted network notices (a failed/aborted resource) are NOT plugin JS errors. They are
// excluded from the console-error bucket because (a) genuine `/complianz/v1/` failures are asserted
// separately by the dedicated request check below, and (b) rapid full-reload navigation can abort an
// in-flight request, which the browser logs as a net::ERR_ABORTED "error" — a test artifact, not an
// app fault. This is a structural exclusion of browser network notices, not an app-error allowlist.
const BROWSER_NETWORK_NOTICE = /Failed to load resource|net::ERR_/;

function isAllowedConsoleError( text ) {
	return BROWSER_NETWORK_NOTICE.test( text ) || ALLOWED_CONSOLE_ERRORS.some( ( re ) => re.test( text ) );
}

// Big suite: one test visiting ~40 fresh page loads. Give it room; keep the one worker (shared DB).
test.describe.configure( { mode: 'serial', timeout: 600_000 } );

test( 'every section and sub-menu screen renders cleanly (smoke)', async ( { page }, testInfo ) => {
	const pages = await discoverPages( page );
	expect( pages.length, 'menu discovery found no screens' ).toBeGreaterThan( 0 );

	const results = [];
	// Aggregated failures, reported together at the end (screen + reason).
	const renderFailures = [];
	const consoleFailures = [];
	const requestFailures = [];
	const boundaryFailures = [];
	const premiumFailures = [];

	for ( const info of pages ) {
		await test.step( `${ info.section } ${ info.hash }`, async () => {
			const consoleErrors = [];
			const failedRequests = [];
			const onConsole = ( msg ) => {
				if ( msg.type() !== 'error' ) {
					return;
				}
				const text = msg.text();
				if ( ! isAllowedConsoleError( text ) ) {
					consoleErrors.push( text );
				}
			};
			// Uncaught exceptions are the strongest "JS error" signal and do not always surface as a
			// console message; capture them explicitly and bucket them with console errors.
			const onPageError = ( err ) => {
				consoleErrors.push( `pageerror: ${ err.message || err }` );
			};
			const onResponse = ( resp ) => {
				if ( resp.url().includes( '/complianz/v1/' ) && resp.status() >= 400 ) {
					failedRequests.push( `${ resp.status() } ${ resp.request().method() } ${ resp.url() }` );
				}
			};
			page.on( 'console', onConsole );
			page.on( 'pageerror', onPageError );
			page.on( 'response', onResponse );

			const record = { hash: info.hash, section: info.section, title: info.title, premium: info.premium };
			try {
				await gotoSettings( page, info.hash );

				// Content renders (and is not a stuck placeholder).
				try {
					await expectContentLoaded( page, info );
					record.rendered = true;
				} catch ( err ) {
					record.rendered = false;
					const reason = String( err.message || err ).split( '\n' )[ 0 ];
					renderFailures.push( `${ info.hash }: ${ reason }` );
				}

				// No ErrorBoundary fallback.
				try {
					await expectNoErrorBoundary( page );
					record.errorBoundary = false;
				} catch ( err ) {
					record.errorBoundary = true;
					boundaryFailures.push( info.hash );
				}

				// Premium groups render locked with upsell (free edition).
				if ( info.premium ) {
					try {
						await expectLockedWithUpsell( page );
						record.lockedWithUpsell = true;
					} catch ( err ) {
						record.lockedWithUpsell = false;
						const reason = String( err.message || err ).split( '\n' )[ 0 ];
						premiumFailures.push( `${ info.hash }: ${ reason }` );
					}
				}

				// Let any late `/complianz/v1/` responses for this screen arrive before we judge it.
				await page.waitForLoadState( 'networkidle', { timeout: 10_000 } ).catch( () => {} );
			} finally {
				page.off( 'console', onConsole );
				page.off( 'pageerror', onPageError );
				page.off( 'response', onResponse );
			}

			record.consoleErrors = consoleErrors;
			record.failedRequests = failedRequests;
			if ( consoleErrors.length ) {
				consoleFailures.push( `${ info.hash }: ${ consoleErrors.join( ' | ' ) }` );
			}
			if ( failedRequests.length ) {
				requestFailures.push( `${ info.hash }: ${ failedRequests.join( ' | ' ) }` );
			}
			results.push( record );
		} );
	}

	// Land the per-screen record on disk under the git-ignored test-results/ (outputPath), and attach
	// it for the CI HTML report. (A passing test under the `list` reporter does not flush a body-only
	// attachment to disk, so the explicit write is what guarantees the artifact exists locally.)
	const body = JSON.stringify( { project: testInfo.project.name, count: results.length, results }, null, 2 );
	const out = testInfo.outputPath( 'smoke-results.json' );
	fs.mkdirSync( path.dirname( out ), { recursive: true } );
	fs.writeFileSync( out, body );
	await testInfo.attach( 'smoke-results.json', { body, contentType: 'application/json' } );

	// Report everything at once (each array lists the offending screens).
	expect( renderFailures, 'screens that did not render their content (stuck placeholder / blank)' ).toEqual( [] );
	expect( boundaryFailures, 'screens showing the ErrorBoundary fallback' ).toEqual( [] );
	expect( consoleFailures, 'screens with console / uncaught JS errors' ).toEqual( [] );
	expect( requestFailures, 'screens with a failed /complianz/v1/ request' ).toEqual( [] );
	expect( premiumFailures, 'premium screens not rendered locked with upsell' ).toEqual( [] );
} );
