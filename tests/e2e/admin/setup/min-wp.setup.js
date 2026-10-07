/**
 * Setup project `setup-min-wp` (ADR-011 / §8.1.0), 8889 "tests" instance
 * (WordPress 5.9 / PHP 7.4, the supported floor — DB-15).
 *
 * Activates the plugin and saves the `admin` authentication state used by the admin-min-wp
 * project. Locale users are not needed here: the min-wp project runs only smoke + field +
 * wizard + tour layers as the default en_US admin (RTL/German are latest-only).
 *
 * wp-cli goes through WP_CLI_CMD_MIN (default `npx wp-env run tests-cli wp`) so CI (ADR-012)
 * can substitute its own; there is no hard-coded `npx wp-env run` below.
 */

const { test, expect } = require( '@playwright/test' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const { seed } = require( '../helpers/seed' );

const WP_CLI = process.env.WP_CLI_CMD_MIN || 'npx wp-env run tests-cli wp';
const AUTH_DIR = path.join( __dirname, '..', '..', '.auth' );

// Test-only throwaway credential for the disposable wp-env tests container. NOT a secret
// (public repo): wp-env's built-in `admin` account, never shipped (ADR-011).
const ADMIN_PASS = 'password';

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

async function login( page, user, pass ) {
	await page.goto( '/wp-login.php' );
	await page.fill( '#user_login', user );
	await page.fill( '#user_pass', pass );
	await page.click( '#wp-submit' );
	// A successful login sets the auth cookie in the 302 response, before wp-admin renders.
	// We assert on the cookie rather than the rendered dashboard because on the minimum-WP
	// floor (PHP 7.4) Complianz's admin_init makes real external calls until the stub
	// mu-plugin lands (T-008), so the first authenticated render can exceed the timeout.
	await expect
		.poll(
			async () => {
				const cookies = await page.context().cookies();
				return cookies.some( ( c ) => c.name.startsWith( 'wordpress_logged_in_' ) );
			},
			{ message: `login did not set the auth cookie for ${ user }`, timeout: 60_000 }
		)
		.toBe( true );
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
} );

test( 'authenticate admin (8889, WP 5.9 / PHP 7.4)', async ( { page } ) => {
	await login( page, 'admin', ADMIN_PASS );
	fs.mkdirSync( AUTH_DIR, { recursive: true } );
	await page.context().storageState( { path: path.join( AUTH_DIR, 'min-wp-admin.json' ) } );
} );
