/**
 * Dashboard flow layer (T-012, §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * Characterises the dashboard: the progress block (percentage, task list, dismiss, filter), the
 * Documents / Tools / Tips & Tricks / Other-plugins blocks rendering and acting, and records the
 * current block layout as the DB-17 baseline that the Phase-4 `cmplz_normalize_blocks` change must
 * preserve.
 *
 * Determinism (§8.1.2): one worker, shared fixture DB. The only mutating action a dashboard offers is
 * dismissing a task (TaskElement -> doAction('dismiss_task')), which would persist server-side. The
 * dismiss test STUBS `/complianz/v1/do_action/dismiss_task` so the dismissal is optimistic-only: the
 * task vanishes from the live list (asserted), and a full reload brings it back because the server
 * never recorded it (asserted). The task-filter is sessionStorage-local and reset to 'all'. Nothing
 * here leaves the DB changed.
 *
 * Selector contract (§8.1.1): role / accessible name / text / `data-testid`. Each task element carries
 * `data-testid="cmplz-task-<notice-id>"` (added to Dashboard/TaskElement.js by this task — an
 * attribute-only hook; the dismiss control is the only <button> inside a task, located by role). The
 * DB-17 layout is read from the app's own `cmplz_settings.blocks` (the server-provided block config),
 * which is the exact data the extension-point normalisation operates on. No `cmplz-*`, WP-core or
 * utility class selector is used to locate or assert anything in the rendered DOM.
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted } = require( './helpers/menu' );

// ---------------------------------------------------------------------------------------------------
// DB-17 baseline: the legacy `class` token set per block, exactly as the server ships it today. This
// is the width/border/background layout the Phase-4 cmplz_normalize_blocks() must reproduce (C-4).
// ---------------------------------------------------------------------------------------------------
const DB17_BLOCK_LAYOUT = {
	progress: ' cmplz-column-2',
	documents: 'border-to-border',
	tools: 'border-to-border',
	tips_tricks: ' cmplz-column-2',
	'other-plugins': ' cmplz-column-2 no-border no-background',
};

async function gotoDashboard( page ) {
	await gotoSettings( page, '#dashboard' );
	await waitForAppMounted( page );
	// The progress percentage heading is the dashboard's "loaded" signal.
	await page.locator( APP ).getByRole( 'heading', { name: 'Progress', exact: true } ).waitFor( { state: 'visible', timeout: 30_000 } );
}

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'records the DB-17 block layout (width/variant per block)', async ( { page } ) => {
	await gotoDashboard( page );
	const blocks = await page.evaluate( () =>
		( window.cmplz_settings.blocks || [] ).map( ( b ) => ( { id: b.id, class: b.class } ) )
	);
	const byId = Object.fromEntries( blocks.map( ( b ) => [ b.id, b.class ] ) );

	// Exactly these blocks, in this order (the dashboard grid order), with these legacy class tokens.
	expect( blocks.map( ( b ) => b.id ) ).toEqual( [ 'progress', 'documents', 'tools', 'tips_tricks', 'other-plugins' ] );
	for ( const [ id, cls ] of Object.entries( DB17_BLOCK_LAYOUT ) ) {
		expect( byId[ id ], `DB-17 baseline drift for block "${ id }"` ).toBe( cls );
	}
} );

test( 'every dashboard block renders', async ( { page } ) => {
	await gotoDashboard( page );
	const app = page.locator( APP );
	for ( const title of [ 'Progress', 'Documents', 'Tools', 'Tips & Tricks', 'Other Plugins' ] ) {
		await expect( app.getByRole( 'heading', { name: title, exact: true } ) ).toBeVisible();
	}
	// Progress shows its percentage figure (the DB-11 "progress before configuration" indicator).
	await expect( app.getByRole( 'heading', { name: /%$/ } ).first() ).toBeVisible();
} );

test( 'progress block: a task can be dismissed and is restored on reload', async ( { page } ) => {
	// Stub the persistence so the dismissal never reaches the DB; reload must bring the task back.
	await page.route( /do_action\/dismiss_task/, ( route ) =>
		route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true } ) } )
	);
	await page.route( /admin-ajax\.php/, ( route ) => {
		const body = route.request().postData() || '';
		if ( body.includes( 'dismiss_task' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: JSON.stringify( { request_success: true } ) } );
		}
		return route.continue();
	} );

	await gotoDashboard( page );
	const task = page.getByTestId( 'cmplz-task-hardening' );
	await expect( task ).toBeVisible();

	// The dismiss control is the only <button> inside a task element (its action links are <a>/<span>).
	await task.getByRole( 'button' ).click();
	await expect( page.getByTestId( 'cmplz-task-hardening' ) ).toHaveCount( 0 );

	// Restore: a fresh load re-fetches the (never-dismissed) notices and the task is back.
	await gotoDashboard( page );
	await expect( page.getByTestId( 'cmplz-task-hardening' ) ).toBeVisible( { timeout: 30_000 } );
} );

test( 'progress block: the task filter toggles completed tasks', async ( { page } ) => {
	await gotoDashboard( page );
	const app = page.locator( APP );

	// A completed task is present under "All tasks".
	await expect( page.getByTestId( 'cmplz-task-all-pages-created' ) ).toBeVisible();

	// Switch to "Remaining tasks": completed tasks are filtered out.
	await app.getByRole( 'link', { name: /Remaining tasks/ } ).click();
	await expect( page.getByTestId( 'cmplz-task-all-pages-created' ) ).toHaveCount( 0 );

	// Back to "All tasks": the completed task returns. (Reset to the default view for the next test.)
	await app.getByRole( 'link', { name: /All tasks/ } ).click();
	await expect( page.getByTestId( 'cmplz-task-all-pages-created' ) ).toBeVisible();
} );

test( 'progress block: "Continue Wizard" navigates to the wizard', async ( { page } ) => {
	await gotoDashboard( page );
	await page.locator( APP ).getByRole( 'link', { name: 'Continue Wizard', exact: true } ).click();
	await expect( page ).toHaveURL( /#wizard$/ );
} );

test( 'documents block: the region selector opens and offers options', async ( { page } ) => {
	await gotoDashboard( page );
	const app = page.locator( APP );
	await expect( app.getByRole( 'heading', { name: 'Documents', exact: true } ) ).toBeVisible();

	// The Documents header carries a region combobox (Radix Select). Open it and assert options render.
	const combo = app.getByRole( 'combobox' ).first();
	await expect( combo ).toBeVisible();
	await combo.click();
	await expect( page.getByRole( 'option', { name: 'General', exact: true } ) ).toBeVisible( { timeout: 10_000 } );
	await page.keyboard.press( 'Escape' );
} );

test( 'tools block: lists tools, tips block links out, other-plugins block renders', async ( { page } ) => {
	await gotoDashboard( page );
	const app = page.locator( APP );

	// Tools block lists its tool items by title (these three carry no plus-one count badge, so their
	// title node is a clean text match).
	for ( const title of [ 'Processing Agreements', 'Translations', 'Documentation' ] ) {
		await expect( app.getByText( title ).first() ).toBeVisible();
	}

	// Tips & Tricks: a tip is an external link whose accessible name is its content (via title attr).
	const tip = app.getByRole( 'link', { name: 'Simplified Guide to Google Consent Mode v2', exact: true } );
	await expect( tip ).toBeVisible();
	await expect( tip ).toHaveAttribute( 'href', /complianz\.link/ );

	// Other Plugins block renders (header present).
	await expect( app.getByRole( 'heading', { name: 'Other Plugins', exact: true } ) ).toBeVisible();
} );
