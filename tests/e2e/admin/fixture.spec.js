/**
 * Fixture + determinism spec (T-008, ADR-011 / §8.1.2), `admin` project (8888, latest).
 *
 * Proves the two guarantees the whole characterization suite relies on:
 *   1. the seeded Complianz app loads (dashboard + wizard render, React mounts);
 *   2. no real outbound HTTP happens while using the app — the stub mu-plugin
 *      (tests/e2e/mu-plugins/cmplz-e2e-stubs.php) short-circuits every external host and
 *      records anything it could not stub in the `cmplz_e2e_unstubbed_requests` option,
 *      which must be empty after a dashboard + wizard visit.
 *
 * The seed itself runs once per instance from the setup projects (setup-latest here, via
 * tests/e2e/admin/helpers/seed.js); this spec only clears and reads the outbound-request
 * log around its own navigation, so it measures exactly the requests this run triggered.
 *
 * wp-cli goes through WP_CLI_CMD_LATEST (default `npx wp-env run cli wp`) so CI (ADR-012)
 * can substitute its own; there is no hard-coded `npx wp-env run` below.
 */

const { test, expect } = require( '@playwright/test' );
const { execSync } = require( 'child_process' );

const WP_CLI = process.env.WP_CLI_CMD_LATEST || 'npx wp-env run cli wp';

// The option the stub mu-plugin appends every non-stubbed outbound URL to (prefixed per the
// constitution's `cmplz` rule). The spec asserts it is empty after exercising the app.
const UNSTUBBED_OPTION = 'cmplz_e2e_unstubbed_requests';

function wp( args, { allowFail = false } = {} ) {
	const cmd = `${ WP_CLI } ${ args }`;
	try {
		return execSync( cmd, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] } ).trim();
	} catch ( err ) {
		if ( allowFail ) {
			return `${ err.stdout || '' }${ err.stderr || '' }`;
		}
		throw new Error( `wp-cli failed: ${ cmd }\n${ err.stdout || '' }\n${ err.stderr || '' }` );
	}
}

// Wait until the React settings app has mounted into its container and rendered something
// (not a blank container, not an error-boundary-only shell at the top level).
async function expectAppMounted( page ) {
	await expect( page.locator( '#complianz > *' ).first() ).toBeVisible( { timeout: 30_000 } );
}

test.describe.configure( { mode: 'serial', timeout: 120_000 } );

test( 'seeded app loads and no real outbound HTTP during a dashboard + wizard visit', async ( { page } ) => {
	// Clear the outbound-request log so we measure only this run. The mu-plugin recreates it
	// (empty) on the next request; without the mu-plugin this option never exists, so the
	// final read below fails — which is the point before the stub lands.
	wp( `option delete ${ UNSTUBBED_OPTION }`, { allowFail: true } );

	// Dashboard: the default Complianz screen. Loading it fires admin_init (dynamic
	// notifications fetch) and core's update checks — all server-side external calls.
	await page.goto( '/wp-admin/admin.php?page=complianz' );
	await expectAppMounted( page );

	// Wizard: the React app routes by hash within the same admin page.
	await page.goto( '/wp-admin/admin.php?page=complianz#wizard' );
	await expect( page ).toHaveURL( /#wizard$/ );
	await expectAppMounted( page );

	// The stub must have intercepted every outbound request; nothing should be logged.
	const logged = JSON.parse( wp( `option get ${ UNSTUBBED_OPTION } --format=json` ) );
	expect( Array.isArray( logged ) ).toBe( true );
	expect( logged ).toEqual( [] );
} );
