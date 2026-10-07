/**
 * Playwright config for the Complianz settings-app characterization e2e suite (SC-06).
 *
 * Design: ADR-011 (wp-env + Playwright, two WordPress instances) and §8.1.0 of the input
 * technical spec. A Playwright project cannot switch WordPress instance or site locale, so
 * the environments come from wp-env (`.wp-env.json`) and are selected per project:
 *
 *   - 8888 "development": latest WordPress            -> admin, admin-rtl, admin-i18n
 *   - 8889 "tests":       WordPress 5.9 / PHP 7.4     -> admin-min-wp   (DB-15 floor)
 *
 * RTL (DB-13) and German (DB-14) come from the logged-in user's WordPress locale, created
 * by the setup projects, not from a browser option. The setup projects replace a config
 * `globalSetup` so each environment is seeded by the project that depends on it.
 *
 * Environment indirection (ADR-012 / §8.1.4): every wp-cli and web-server invocation reads
 * an env var that defaults to the wp-env form, so CI can substitute its own server without
 * editing this file or the specs. No spec hard-codes `npx wp-env run`.
 *
 *   WP_BASE_URL_LATEST   default http://localhost:8888
 *   WP_BASE_URL_MIN      default http://localhost:8889
 *   E2E_WEBSERVER_CMD    default `npx wp-env start`      (see webServer below)
 *   WP_CLI_CMD_LATEST    default `npx wp-env run cli wp`         (read by the setup files)
 *   WP_CLI_CMD_MIN       default `npx wp-env run tests-cli wp`   (read by the setup files)
 *
 * This file is CommonJS so it can be introspected without a test run, e.g.:
 *   node -e "const c=require('./tests/e2e/playwright.config.js'); \
 *     for (const p of c.projects) console.log(p.name, '<-', JSON.stringify(p.dependencies||[]))"
 */

const path = require( 'path' );
const { defineConfig } = require( '@playwright/test' );

const LATEST_URL = process.env.WP_BASE_URL_LATEST || 'http://localhost:8888';
const MIN_WP_URL = process.env.WP_BASE_URL_MIN || 'http://localhost:8889';
const WEBSERVER_CMD = process.env.E2E_WEBSERVER_CMD || 'npx wp-env start';

// Per-user authentication state, written by the setup projects. Git-ignored (.gitignore).
const AUTH_DIR = path.join( __dirname, '.auth' );
const authFile = ( name ) => path.join( AUTH_DIR, `${ name }.json` );

module.exports = defineConfig( {
	testDir: './admin',

	// All visual baselines live under tests/e2e/admin/__screenshots__/, split per spec
	// file and per project (admin vs admin-rtl differ). Captured/calibrated by T-010/T-013.
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{projectName}/{arg}{ext}',

	// Determinism: one worker (the suite shares a single wp-env DB, §8.1.2); retries only
	// in CI so a retry-only pass is flagged flaky (§8.1.4).
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	forbidOnly: !! process.env.CI,

	// Artifacts resolve relative to this config's directory (tests/e2e), matching the CI
	// artifact paths in §8.1.4. Both folders are git-ignored.
	reporter: process.env.CI
		? [ [ 'list' ], [ 'html', { outputFolder: path.join( __dirname, 'playwright-report' ), open: 'never' } ] ]
		: 'list',
	outputDir: path.join( __dirname, 'test-results' ),

	expect: {
		toHaveScreenshot: {
			// S3 starting threshold (ADR-011); calibrated and commented by T-010.
			maxDiffPixelRatio: 0.001,
			// Freeze CSS animations/transitions and the text caret for stable pixels, plus
			// our own injected stylesheet that also neutralises JS-driven motion (toasts,
			// confetti, scan progress) that `animations: 'disabled'` cannot reach (§8.1.2).
			animations: 'disabled',
			caret: 'hide',
			stylePath: path.join( __dirname, 'admin', 'disable-animations.css' ),
		},
	},

	use: {
		browserName: 'chromium',
		viewport: { width: 1440, height: 900 },
		// prefers-reduced-motion for the whole run (the injected style above covers the rest).
		reducedMotion: 'reduce',
		trace: process.env.CI ? 'retain-on-failure' : 'off',
		screenshot: 'off',
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},

	// Single web server: `npx wp-env start` brings up BOTH instances (8888 and 8889) and
	// only resolves once both are healthy, so health-checking 8888 gates both. The server
	// lifecycle is managed outside Playwright (the proof and CI run `wp-env start` first),
	// hence reuseExistingServer: the command is only a fallback when nothing is up yet.
	webServer: {
		command: WEBSERVER_CMD,
		url: LATEST_URL,
		reuseExistingServer: true,
		timeout: 600_000,
	},

	projects: [
		// --- Setup projects (ADR-011): seed + create users + save storageState. No deps. ---
		{
			name: 'setup-latest',
			testMatch: /admin[\\/]setup[\\/]latest\.setup\.js$/,
			use: { baseURL: LATEST_URL },
		},
		{
			name: 'setup-min-wp',
			testMatch: /admin[\\/]setup[\\/]min-wp\.setup\.js$/,
			use: { baseURL: MIN_WP_URL },
		},

		// --- Test projects. Each depends on the setup project for its instance. ---

		// Full admin suite, latest WordPress, default en_US `admin` user.
		{
			name: 'admin',
			dependencies: [ 'setup-latest' ],
			testIgnore: [ '**/setup/**', '**/i18n/**' ],
			use: { baseURL: LATEST_URL, storageState: authFile( 'latest-admin' ) },
		},

		// RTL (DB-13): he_IL user, smoke + visual only (§8.1.0 / §8.1.3).
		{
			name: 'admin-rtl',
			dependencies: [ 'setup-latest' ],
			testMatch: [ '**/smoke.spec.js', '**/visual.spec.js' ],
			use: { baseURL: LATEST_URL, storageState: authFile( 'latest-admin-rtl' ) },
		},

		// Minimum-WordPress floor (DB-15): 8889, WP 5.9 / PHP 7.4, React 17 paths.
		// smoke + fields + wizard finish + tour (§8.1.0). Patterns may match no files yet;
		// T-013 finalises them as the specs land.
		{
			name: 'admin-min-wp',
			dependencies: [ 'setup-min-wp' ],
			testMatch: [ '**/smoke.spec.js', '**/fields.spec.js', '**/wizard.spec.js', '**/tour.spec.js' ],
			use: { baseURL: MIN_WP_URL, storageState: authFile( 'min-wp-admin' ) },
		},

		// German (DB-14): de_DE `admin-de` user, the i18n specs only (§6.3).
		{
			name: 'admin-i18n',
			dependencies: [ 'setup-latest' ],
			testMatch: [ '**/i18n/**/*.spec.js' ],
			use: { baseURL: LATEST_URL, storageState: authFile( 'latest-admin-de' ) },
		},
	],
} );
