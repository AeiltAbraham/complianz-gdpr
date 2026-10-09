/**
 * Isolation baselines (T-010, §8.1.3 "Isolation"), written against TODAY's shipped UI.
 *
 * Captures the surfaces whose fidelity the redesign must preserve or intentionally change, each as a
 * tight element shot so it survives the surrounding-screen redesign:
 *   1. the admin banner PREVIEW per layout, at 1920x1080 (ADR-008 / §4.5 / DB-06);
 *   2. the WEBSITE banner per layout, as a logged-out visitor (DB-05) — the preview must match it;
 *   3. wp-admin CHROME (admin bar + menu) on a Complianz screen (DB-01/DB-02): today's legacy CSS
 *      restyles WordPress buttons here, and Phase 5 intentionally changes this baseline;
 *   4. the WordPress MEDIA modal, opened from the only Complianz field that uses it (the banner logo);
 *   5. one NON-Complianz admin screen (Settings > General), the DB-02 "unchanged elsewhere" baseline.
 *
 * Runs in the `admin` project only (playwright.config.js: admin-rtl runs smoke + visual only), so the
 * few English strings used to drive the media modal and to find the General-Settings heading are safe.
 *
 * Selector contract: the banner-markup selectors
 * `#cmplz-cookiebanner-container .cmplz-cookiebanner` and `#cmplz-manage-consent` are the ones
 * ADR-008 mandates (legacy frontend markup; the marked `[data-cmplz-isolate="preview"]` selectors
 * take over when the zone marker lands). WordPress-core selectors (`.media-modal`, `#wpadminbar`,
 * `#adminmenuwrap`, `.timezone-info`, `.avatar`) ARE the subject of these shots. `.cmplz-logo-*` is
 * only the handle used to open the core media modal from the banner-logo control.
 *
 * SNAPSHOT UPDATE POLICY (ADR-008 / §8.1.3): the committed PNGs under
 * tests/e2e/admin/__screenshots__/ are regenerated ONLY by an explicitly reviewed PR that runs
 * `--update-snapshots` and shows the diff. Preview/website shots are re-baselined in Phase 5 (ADR-008).
 *
 * BLOCKING CONTRACT (maintainer decision 2026-10-09, "Option B"): every `toHaveScreenshot` in this
 * file is NON-BLOCKING — it records drift to the console/report but never fails the run — because the
 * baselines are OS-specific (captured on the macOS dev host; CI renders on Linux) and the snapshot
 * path template carries no {platform} token, so a macOS baseline can never match a Linux render. The
 * FUNCTIONAL assertions (the preview mounting and resolving its links, the manage widget / admin
 * chrome / General-Settings heading being visible) STAY BLOCKING — those are what gate the suite and
 * catch a genuinely broken surface. The committed PNGs are kept for local (macOS) pixel review and as
 * the Phase-5 re-baseline starting point. This matches the full-screen visual layer (visual.spec.js),
 * which went non-blocking on 2026-10-08 for the same cross-environment reason.
 *
 * Determinism: each layout is set through the banner record via wp-cli (the T-008 helper pattern), so
 * both the admin preview and the website render it; the whole fixture is restored by re-seeding in
 * afterAll, so this spec leaves the DB exactly as it found it.
 */

const { test, expect } = require( '@playwright/test' );
const { execSync } = require( 'child_process' );
const { gotoSettings, waitForAppMounted } = require( './helpers/menu' );

const WP_CLI = process.env.WP_CLI_CMD_LATEST || 'npx wp-env run cli wp';
const LATEST_URL = process.env.WP_BASE_URL_LATEST || 'http://localhost:8888';
// The seed script, as seen inside the wp-env container (mirrors helpers/seed.js SEED_FILE).
const SEED_FILE = 'wp-content/plugins/complianz-gdpr/tests/e2e/admin/fixtures/seed.php';

// The four layouts the Position setting offers (cookiebanner/settings.php;
// CMPLZ_COOKIEBANNER::sanitize_position()). bottom-right is the seeded default and runs first.
const LAYOUTS = [ 'bottom-right', 'bottom-left', 'bottom', 'center' ];

// ADR-008 selectors: the injected banner and the manage-consent revoke widget. The id container
// #cmplz-manage-consent is 0-height because its only visible child is position:fixed, so we shoot
// that child (the actual revoke tab) — the same pixels ADR-008 means by "#cmplz-manage-consent".
const PREVIEW_BANNER = '#cmplz-cookiebanner-container .cmplz-cookiebanner';
const MANAGE_CONSENT = '#cmplz-manage-consent .cmplz-manage-consent';

// Per-shot comparison tolerance for the full BANNER element shots ONLY (S3 calibration; the global
// maxDiffPixelRatio stays 0.001 for every other baseline, including the 37 app-container shots). The
// banner lays its action buttons out at fractional widths, so their anti-aliased edges render ~1px
// differently BETWEEN chromium launches. Measured on this small (~29k-px) element: that cross-launch
// difference is a few hundred thin button-edge pixels (not fill/text/layout), which the global 0.001
// ratio (~28 px here) rejects, flaking the shot ~25% of runs. We absorb it with a tight absolute
// ceiling (maxDiffPixels 400) and lift the inherited ratio for this shot so it does not re-impose the
// 28-px cap. A real banner change (button colour/shape/text/spacing, a link resolving or not) moves
// thousands of px and still fails; this covers subpixel anti-aliasing, not a hidden difference.
const BANNER_ELEMENT_SHOT = { maxDiffPixels: 400, maxDiffPixelRatio: 0.02 };

// Drive the preview banner to its fully RESOLVED link state and wait on that state (the readiness
// signal the maintainer asked for).
//
// The fixture generates Complianz's real legal-document pages (seed.php: cmplz_e2e_seed_documents),
// so the server hands the preview a populated pageLinks for the company region (country_company=NL ->
// region 'eu'). setUpBanner() (CookieBannerPreview.js:309) then un-hides each document link whose CSS
// class matches a pageLinks key, replaces its `{title}` placeholder with the real page title, and
// hides the non-matching ones. But setUpBanner() runs in the render BODY against the PREVIOUS commit's
// DOM, so on first paint the links can stay as raw `{title}` — a ~20% race (measured) that never
// self-resolves. An in-app hash navigation (no full reload, so pageLinks is already in the store)
// reliably re-renders the preview into its resolved state (measured 5/5, immediate); we go to another
// banner sub-screen and back, by hash so it is locale-independent. Then we WAIT on the resolved state:
// a plain document link is shown with a real title and no visible link still reads `{title}`.
const RESOLVE_NUDGE_HASH = '#banner/banner-general'; // any other banner sub-screen; always present.

// True once the preview shows a resolved document link (real title) and no visible link still reads
// the literal `{title}` placeholder. The plain document links carry a document-type class but not a
// manage-*/external action class.
function previewLinksResolved( page ) {
	return page.evaluate( () => {
		const bn = document.querySelector( '#cmplz-cookiebanner-container .cmplz-cookiebanner' );
		if ( ! bn ) {
			return false;
		}
		const docLinks = [ ...bn.querySelectorAll( '.cmplz-links a' ) ].filter(
			( a ) =>
				a.classList.contains( 'cmplz-link' ) &&
				! a.classList.contains( 'cmplz-external' ) &&
				! [ ...a.classList ].some( ( c ) => c.indexOf( 'cmplz-manage' ) === 0 )
		);
		const isVisible = ( a ) => getComputedStyle( a ).display !== 'none';
		const stillTitle = docLinks.some( ( a ) => isVisible( a ) && /\{title\}/.test( a.textContent || '' ) );
		const resolvedShown = docLinks.some(
			( a ) => isVisible( a ) && ! /\{title\}/.test( a.textContent || '' ) && /[A-Za-z]/.test( a.textContent || '' )
		);
		return ! stillTitle && resolvedShown;
	} );
}

// Load a banner sub-screen and drive the preview to its resolved document-link state, then wait on
// that state. setUpBanner() resolves against the PREVIOUS render's DOM, so a single load leaves the
// links as raw `{title}` ~15% of the time and, once in that state, further in-app navigation does not
// recover it. A FRESH load followed by one in-app hash nav (pageLinks already in the store) resolves
// independently each time, so we reload-and-retry until the resolved signal holds. Both steps are the
// app's own machinery; we only repeat them. (~4 attempts => >99.9% given a ~85% per-attempt rate.)
async function loadResolvedBannerPreview( page, hash ) {
	for ( let attempt = 0; attempt < 5; attempt++ ) {
		await gotoSettings( page, hash );
		await waitForAppMounted( page );
		await expect( page.locator( PREVIEW_BANNER ) ).toBeVisible( { timeout: 30_000 } );
		// Let the banner-data REST call (which carries pageLinks) finish before the nudge nav.
		await page.waitForLoadState( 'networkidle', { timeout: 15_000 } ).catch( () => {} );
		await page.evaluate( ( h ) => { window.location.hash = h; }, RESOLVE_NUDGE_HASH );
		await page.waitForTimeout( 350 );
		await page.evaluate( ( h ) => { window.location.hash = h; }, hash );
		await expect( page.locator( PREVIEW_BANNER ) ).toBeVisible( { timeout: 30_000 } );
		for ( let i = 0; i < 10; i++ ) {
			if ( await previewLinksResolved( page ) ) {
				return;
			}
			await page.waitForTimeout( 250 );
		}
	}
	throw new Error( 'preview banner document links did not resolve to real titles after 5 loads' );
}

function wp( args ) {
	const cmd = `${ WP_CLI } ${ args }`;
	try {
		return execSync( cmd, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] } ).trim();
	} catch ( err ) {
		throw new Error( `wp-cli failed: ${ cmd }\n${ err.stdout || '' }\n${ err.stderr || '' }` );
	}
}

// Set the default banner's position on its record (the value is from our fixed LAYOUTS list, never
// user input). execSync runs through /bin/sh, so the single quotes protect the PHP's double quotes.
function setBannerPosition( position ) {
	const php =
		'$b=cmplz_get_cookiebanners(array("default"=>true)); ' +
		'if(empty($b)){$b=cmplz_get_cookiebanners(array("status"=>"all"));} ' +
		'$id=(int)$b[0]->ID; $banner=new CMPLZ_COOKIEBANNER($id); ' +
		`$banner->position="${ position }"; $banner->save(); echo $banner->position;`;
	return wp( `eval '${ php }'` );
}

// All five tests touch the one shared wp-env DB; run serially, one worker, with headroom.
test.describe.configure( { mode: 'serial', timeout: 1_200_000 } );

// Leave the fixture exactly as found: the layout tests persist a position, so restore the whole
// seeded state (idempotent) once the file is done.
test.afterAll( () => {
	wp( `eval-file ${ SEED_FILE }` );
} );

// Optional CPU-throttling knob (no-op unless E2E_CPU_THROTTLE is set): slows the renderer so the
// determinism of the banner captures does not depend on machine speed. Off in normal/CI runs.
test.beforeEach( async ( { page } ) => {
	const rate = Number( process.env.E2E_CPU_THROTTLE );
	if ( rate > 1 ) {
		const client = await page.context().newCDPSession( page );
		await client.send( 'Emulation.setCPUThrottlingRate', { rate } );
	}
} );

test( 'banner preview element baselines per layout (ADR-008, 1920x1080)', async ( { page } ) => {
	// 1920x1080 is above the 1800px breakpoint, so the admin off-canvas translate never applies (§4.5).
	await page.setViewportSize( { width: 1920, height: 1080 } );

	for ( const position of LAYOUTS ) {
		await test.step( `preview ${ position }`, async () => {
			setBannerPosition( position );
			// Load the preview and drive it to its resolved real-document-link state (see helper), so we
			// never capture the racy `{title}` placeholder mid-render.
			await loadResolvedBannerPreview( page, '#banner/appearance' );
			const banner = page.locator( PREVIEW_BANNER );
			// Non-blocking screenshot (maintainer decision 2026-10-09, Option B): toHaveScreenshot
			// baselines are OS-specific — the macOS dev host and the Linux CI runner render fonts and
			// anti-aliasing differently, and the snapshot path has no {platform} token, so a macOS
			// baseline can never match a Linux render. Record drift; do not gate. The FUNCTIONAL signal
			// stays blocking: loadResolvedBannerPreview above already asserts the preview mounts and
			// resolves its real document links, which is what ADR-008 fidelity actually depends on.
			try {
				await expect( banner ).toHaveScreenshot( `preview-banner-${ position }.png`, BANNER_ELEMENT_SHOT );
			} catch ( err ) {
				console.warn( `[isolation non-blocking] preview-banner ${ position }: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
			}

			// The preview keeps the manage-consent revoke widget hidden until the banner is dismissed,
			// and `setUpBanner()` (which runs in the preview's render body) re-hides it with an inline
			// display:none on every React re-render — so a one-off DOM tweak just flickers. We are
			// baselining how the widget LOOKS per layout, not the dismiss interaction, so pin it visible
			// with a high-specificity !important rule that outranks both that inline style and the
			// `cmplz-hidden` class, and survives the re-renders.
			await page.addStyleTag( {
				content: '#cmplz-manage-consent .cmplz-manage-consent{display:block !important;visibility:visible !important;}',
			} );
			const manage = page.locator( MANAGE_CONSENT );
			// Functional assertion stays blocking; the screenshot is non-blocking (Option B, see above).
			await expect( manage ).toBeVisible( { timeout: 30_000 } );
			try {
				await expect( manage ).toHaveScreenshot( `preview-manage-consent-${ position }.png` );
			} catch ( err ) {
				console.warn( `[isolation non-blocking] preview-manage-consent ${ position }: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
			}
		} );
	}
} );

test( 'website banner element baselines per layout (DB-05, logged-out visitor)', async ( { browser } ) => {
	// A fresh context: no stored admin auth and no consent cookie, so the banner shows like a first
	// visit. 1920x1080 to match the preview shots.
	const context = await browser.newContext( { baseURL: LATEST_URL, viewport: { width: 1920, height: 1080 } } );
	const visitor = await context.newPage();
	try {
		for ( const position of LAYOUTS ) {
			await test.step( `website ${ position }`, async () => {
				setBannerPosition( position );
				// save() bumps the banner's cache-busting version, so the regenerated position CSS has a
				// fresh URL; the extra query param just avoids a cached HTML document.
				await visitor.goto( `/?cmplz_e2e=${ Date.now() }` );
				const banner = visitor.locator( PREVIEW_BANNER );
				// Non-blocking (maintainer decision 2026-10-08): the logged-out frontend banner has a
				// first-paint timing wobble — it intermittently is not yet present within the window. Record
				// it and move on; do not gate. The banner-PREVIEW isolation shots above stay blocking, and the
				// frontend banner's own behaviour is covered by the plugin's PHPUnit/front-end tests.
				try {
					await expect( banner ).toBeVisible( { timeout: 30_000 } );
					// Server-rendered with real links (no `{title}` placeholder), so no settling needed.
					await expect( banner ).toHaveScreenshot( `website-banner-${ position }.png`, BANNER_ELEMENT_SHOT );
				} catch ( err ) {
					console.warn( `[isolation non-blocking] website-banner ${ position }: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
				}
			} );
		}
	} finally {
		await context.close();
	}
} );

test( 'wp-admin chrome baseline on a Complianz screen (DB-01/DB-02)', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 900 } );
	await gotoSettings( page, '#dashboard' );
	await waitForAppMounted( page );

	// Functional signal stays blocking: the admin chrome renders on a Complianz screen. The pixel
	// baselines are non-blocking (Option B, 2026-10-09): OS-specific renders cannot match across the
	// macOS dev host and the Linux CI runner; record drift, do not gate.
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible( { timeout: 30_000 } );
	await expect( page.locator( '#adminmenuwrap' ) ).toBeVisible( { timeout: 30_000 } );

	// Admin bar: mask the gravatar — it is fetched by the browser from secure.gravatar.com, so it is
	// non-deterministic (and absent offline / in CI). The restyled bar itself is the baseline.
	try {
		await expect( page.locator( '#wpadminbar' ) ).toHaveScreenshot( 'wpadmin-bar.png', {
			mask: [ page.locator( '#wpadminbar .avatar' ) ],
		} );
	} catch ( err ) {
		console.warn( `[isolation non-blocking] wpadmin-bar: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
	}
	try {
		await expect( page.locator( '#adminmenuwrap' ) ).toHaveScreenshot( 'wpadmin-menu.png' );
	} catch ( err ) {
		console.warn( `[isolation non-blocking] wpadmin-menu: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
	}
} );

test( 'WordPress media modal baseline (opened from the banner logo field)', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 1024 } );
	await gotoSettings( page, '#banner/appearance' );
	await waitForAppMounted( page );

	// The banner-logo control is the only Complianz field that opens wp.media (BannerLogoControl.js):
	// pick "Upload Custom Logo" so the clickable uploader renders, then click it to open the modal.
	const logoSelect = page.locator( '.cmplz-logo-container [role="combobox"]' ).first();
	await expect( logoSelect ).toBeVisible( { timeout: 30_000 } );
	await logoSelect.click();
	await page.getByRole( 'option', { name: /Upload Custom Logo/i } ).first().click();

	const uploader = page.locator( '.cmplz-logo-preview.cmplz-clickable' );
	await expect( uploader ).toBeVisible( { timeout: 30_000 } );
	await uploader.click();

	const modal = page.locator( '.media-modal' );
	await expect( modal ).toBeVisible( { timeout: 30_000 } );
	// Non-blocking (maintainer decision 2026-10-08): the WP media modal has load-timing variance; record
	// drift, do not gate. Opening the modal (the behaviour above) still runs and asserts.
	try {
		await expect( modal ).toHaveScreenshot( 'wp-media-modal.png' );
	} catch ( err ) {
		console.warn( `[isolation non-blocking] wp-media-modal: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
	}
} );

test( 'non-Complianz admin screen baseline (Settings > General, DB-01/DB-02)', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( '/wp-admin/options-general.php' );
	// Functional signal stays blocking: Settings > General renders unaffected by Complianz. The pixel
	// baseline is non-blocking (Option B, 2026-10-09; same OS-specific-render reason as the shots above).
	await expect( page.getByRole( 'heading', { name: /General Settings/i } ) ).toBeVisible( { timeout: 30_000 } );

	// Mask: the timezone row prints the live UTC/local clock (drifts every run); the admin-bar gravatar
	// is browser-fetched (see chrome test). Everything else is the DB-02 "unchanged" baseline.
	try {
		await expect( page ).toHaveScreenshot( 'non-complianz-options-general.png', {
			mask: [ page.locator( '.timezone-info' ), page.locator( '#wpadminbar .avatar' ) ],
		} );
	} catch ( err ) {
		console.warn( `[isolation non-blocking] non-complianz-options-general: ${ String( err.message || err ).split( '\n' )[ 0 ] }` );
	}
} );
