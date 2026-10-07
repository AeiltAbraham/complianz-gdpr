/**
 * Setup project `setup-latest` (ADR-011 / §8.1.0), 8888 "development" instance.
 *
 * Provisions the latest-WordPress environment for the admin, admin-rtl and admin-i18n test
 * projects and saves one authentication state per user:
 *   - activates the plugin (mapped as wp-content/plugins/complianz-gdpr);
 *   - installs the he_IL (RTL, DB-13) and de_DE (DB-14) core language packs;
 *   - creates the admin-rtl (locale he_IL) and admin-de (locale de_DE) administrators next
 *     to wp-env's built-in `admin`;
 *   - logs each user in and writes tests/e2e/.auth/<name>.json (git-ignored).
 *
 * wp-cli goes through WP_CLI_CMD_LATEST (default `npx wp-env run cli wp`) so CI (ADR-012)
 * can substitute its own; there is no hard-coded `npx wp-env run` below.
 */

const { test, expect } = require( '@playwright/test' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const { seed } = require( '../helpers/seed' );

const WP_CLI = process.env.WP_CLI_CMD_LATEST || 'npx wp-env run cli wp';
const AUTH_DIR = path.join( __dirname, '..', '..', '.auth' );

// Test-only throwaway credentials for the disposable wp-env containers. NOT secrets: these
// accounts exist only inside local/CI wp-env and are never shipped (ADR-011, public repo).
const ADMIN_PASS = 'password'; // wp-env's built-in `admin` account.
const RTL_PASS = 'cmplz-e2e-rtl';
const DE_PASS = 'cmplz-e2e-de';

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

function ensureUser( login, email, pass, locale ) {
	// Idempotent: create may fail if the user already exists (re-run); update then pins a
	// known password/role and the locale meta the admin UI reads.
	wp( `user create ${ login } ${ email } --role=administrator --user_pass=${ pass }`, { allowFail: true } );
	wp( `user update ${ login } --user_pass=${ pass } --role=administrator` );
	wp( `user meta update ${ login } locale ${ locale }` );
}

async function login( page, user, pass ) {
	// A successful login sets the auth cookie in the 302 response, before wp-admin renders; we
	// assert on the cookie rather than the rendered dashboard because Complianz's admin_init makes
	// real external calls until the stub mu-plugin resolves them, so the first authenticated render
	// can be slow. Retry a few times: a single transient failure (a just-updated password not yet in
	// effect, or a redirect race) must not fail the whole run — the setup gates every test project.
	for ( let attempt = 1; attempt <= 3; attempt++ ) {
		await page.goto( '/wp-login.php' );
		await page.fill( '#user_login', user );
		await page.fill( '#user_pass', pass );
		await page.click( '#wp-submit' );
		await page.waitForLoadState( 'load' ).catch( () => {} );
		try {
			await expect
				.poll(
					async () => {
						const cookies = await page.context().cookies();
						return cookies.some( ( c ) => c.name.startsWith( 'wordpress_logged_in_' ) );
					},
					{ timeout: 20_000 }
				)
				.toBe( true );
			return;
		} catch ( err ) {
			if ( attempt === 3 ) {
				throw new Error( `login did not set the auth cookie for ${ user } after ${ attempt } attempts` );
			}
			await page.waitForTimeout( 1_500 );
		}
	}
}

async function saveState( page, name ) {
	fs.mkdirSync( AUTH_DIR, { recursive: true } );
	await page.context().storageState( { path: path.join( AUTH_DIR, `${ name }.json` ) } );
}

test.describe.configure( { mode: 'serial', timeout: 120_000 } );

test.beforeAll( () => {
	// Pin the built-in admin password to a known value: wp-env's default differs between
	// the development and tests instances, so we do not rely on it.
	wp( `user update admin --user_pass=${ ADMIN_PASS }` );
	wp( 'plugin activate complianz-gdpr', { allowFail: true } );
	// Deterministic fixture (T-008): seed after activation so the plugin's classes/config are
	// loaded. The stub mu-plugin leaves wp-cli unstubbed, so the seed itself makes no network.
	seed( wp );
	wp( 'language core install he_IL de_DE', { allowFail: true } );
	ensureUser( 'admin-rtl', 'admin-rtl@cmplz.test', RTL_PASS, 'he_IL' );
	ensureUser( 'admin-de', 'admin-de@cmplz.test', DE_PASS, 'de_DE' );
} );

test( 'authenticate admin (en_US)', async ( { page } ) => {
	await login( page, 'admin', ADMIN_PASS );
	await saveState( page, 'latest-admin' );
} );

test( 'authenticate admin-rtl (he_IL)', async ( { page } ) => {
	await login( page, 'admin-rtl', RTL_PASS );
	await saveState( page, 'latest-admin-rtl' );
} );

test( 'authenticate admin-de (de_DE)', async ( { page } ) => {
	await login( page, 'admin-de', DE_PASS );
	await saveState( page, 'latest-admin-de' );
} );
