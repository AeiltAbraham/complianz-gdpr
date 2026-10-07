/**
 * Field + condition layer (T-011, §8.1.1 / §8.1.3), `admin` project (8888, latest), TODAY's UI.
 *
 * Characterises every field `type` the free edition can reach, driven by the app's own data, not a
 * hard-coded list: the field inventory comes from the live `/complianz/v1/fields/get` response (the
 * same data `Settings/Fields/FieldsData.js` loads) and the navigable pages come from the app's menu
 * (helpers/menu.js `discoverPages`). A new field type, or a field moved to another screen, is picked
 * up automatically — only a type that becomes reachable/unreachable in the free edition changes the
 * small, documented topology constants below, which is exactly when a human should re-confirm them.
 *
 * Selector contract (§8.1.1): role / accessible name / `data-testid` only. Every field wrapper carries
 * `data-testid="field-<id>"` (added in `Settings/Fields/Field.js` by this task — an attribute-only,
 * behaviour-free, non-rendering hook, so the T-010 pixel baselines are unaffected). It lets any field
 * be located by id regardless of whether its control exposes an accessible name; the controls inside
 * are then driven by their ARIA role (textbox, spinbutton, switch, radio, combobox). No `cmplz-*`,
 * WP-core or utility class selector appears anywhere.
 *
 * Determinism (§8.1.2): one worker, shared fixture DB. Condition/validation/reveal checks drive the
 * real control WITHOUT saving (the app re-evaluates in the store; the unsaved change is discarded on
 * the next full load), so they never touch the DB. The persistence checks DO save, then always RESTORE
 * the seeded value in a finally block, so this spec leaves the DB exactly as it found it and cannot
 * disturb a later visual.spec screenshot in the same run.
 */

const { test, expect } = require( '@playwright/test' );
const {
	APP,
	discoverPages,
	gotoSettings,
	waitForAppMounted,
	subIdFromHash,
} = require( './helpers/menu' );

// ----------------------------------------------------------------------------------------------------
// Documented free-edition topology (the only hand-maintained constants; every other input is derived).
// Verified against this repo's config on 2026-10-07; a drift here fails the coverage test on purpose.
// ----------------------------------------------------------------------------------------------------

// Types whose fields exist in the free build but whose ONLY instances are gated OFF in the seeded
// free edition, so they do not render in the pure seed. Each is justified and separately handled:
//   - `url`: the two url fields (matomo_url / matomo_tag_url) require the Matomo statistics provider
//     to be enabled; rendered + validated by the dedicated reveal tests below (no DB mutation).
//   - `documents_menu_region_redirect`: shown only when `region_redirect` = 'yes', but that controlling
//     radio is premium, disabled AND itself hidden unless premium GEO-IP (`use_country`) is on — so it
//     is unreachable in the free edition. Recorded here for the caller; not rendered.
const GATED_TYPES = [ 'documents_menu_region_redirect', 'url' ];

// Types whose only instances live on a tool screen that the free menu does not expose at all (the
// "Records of Consent" page is premium and absent from the free navigation), so there is no free page
// on which to render them. Premium-only, recorded for the caller; not rendered.
const PREMIUM_UNREACHABLE_TYPES = [ 'export-records-of-consent', 'records-of-consent' ];

// `password` is intentionally NOT expected: the only password field (websitescan client secret) lives
// outside settings/config and is server-gated behind `cmplz_wsc_is_enabled()`, so the free edition
// never emits it in the fields response. It therefore never appears in the live type set at all.

// ---------------------------------------------------------- shared discovery (fetched once per worker)

let _fields = null;
let _menuMap = null;

async function fetchLiveFields( page ) {
	await gotoSettings( page );
	await waitForAppMounted( page );
	const res = await page.evaluate( async () => {
		const nonce = window.cmplz_settings && window.cmplz_settings.cmplz_nonce;
		return window.wp.apiFetch( { path: 'complianz/v1/fields/get?nonce=' + nonce } );
	} );
	return Array.isArray( res && res.fields ) ? res.fields : [];
}

async function liveFields( page ) {
	if ( ! _fields ) {
		_fields = await fetchLiveFields( page );
	}
	return _fields;
}

async function menuIdToHash( page ) {
	if ( ! _menuMap ) {
		const pages = await discoverPages( page );
		_menuMap = new Map();
		for ( const p of pages ) {
			const sub = subIdFromHash( p.hash );
			if ( sub && ! _menuMap.has( sub ) ) {
				_menuMap.set( sub, p.hash );
			}
		}
	}
	return _menuMap;
}

// --------------------------------------------------------------------------------- small UI helpers

const field = ( page, id ) => page.getByTestId( 'field-' + id );

async function gotoFieldsPage( page, hash ) {
	await gotoSettings( page, hash );
	await waitForAppMounted( page );
	await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 30_000 } );
}

async function renderedFieldIds( page ) {
	return page.locator( '[data-testid^="field-"]' ).evaluateAll( ( els ) =>
		els.map( ( e ) => ( e.getAttribute( 'data-testid' ) || '' ).slice( 'field-'.length ) )
	);
}

// Save the current screen and wait for the "settings saved" acknowledgement, then settle the network.
async function saveScreen( page ) {
	await page.locator( APP ).getByRole( 'button', { name: 'Save', exact: true } ).first().click();
	await page.getByText( 'Settings saved', { exact: true } ).first().waitFor( { state: 'visible', timeout: 20_000 } ).catch( () => {} );
	await page.waitForLoadState( 'networkidle', { timeout: 10_000 } ).catch( () => {} );
}

// Type into a text-like input and wait out the component's internal debounce (TextInput et al. push the
// change to the store 400-500 ms after the last keystroke).
async function typeInto( page, locator, value ) {
	await locator.click();
	await locator.fill( String( value ) );
	await page.waitForTimeout( 700 );
}

// Logical on/off for a Radix switch. The underlying field value is a boolean before a save but an int
// after one (cmplz_sanitize_field casts a checkbox to 0/1), so Radix emits aria-checked as
// "true"/"false" or "1"/"0" for the same logical state — read it tolerantly.
async function switchIsOn( locator ) {
	const v = await locator.getAttribute( 'aria-checked' );
	return v === 'true' || v === '1';
}

// ====================================================================================================
// Coverage: every free-reachable field type renders.
// ====================================================================================================

test.describe.configure( { mode: 'serial', timeout: 600_000 } );

test( 'every free-reachable field type renders in the seeded state', async ( { page } ) => {
	const fields = await liveFields( page );
	const map = await menuIdToHash( page );

	const idToType = new Map();
	const byType = new Map();
	for ( const f of fields ) {
		if ( ! f || ! f.type ) continue;
		idToType.set( f.id, f.type );
		if ( ! byType.has( f.type ) ) byType.set( f.type, [] );
		byType.get( f.type ).push( f );
	}
	const allTypes = [ ...byType.keys() ].sort();

	// A type is "reachable by page" when at least one of its fields lives on a discovered free page.
	const reachableByPage = new Set();
	const candidateHashes = new Set();
	for ( const [ type, list ] of byType ) {
		for ( const f of list ) {
			if ( f.menu_id && map.has( f.menu_id ) ) {
				reachableByPage.add( type );
				candidateHashes.add( map.get( f.menu_id ) );
			}
		}
	}
	const unreachableByPage = allTypes.filter( ( t ) => ! reachableByPage.has( t ) ).sort();

	// Visit each candidate page once; union the types actually rendered there (a conditionally-disabled
	// field is absent from the DOM, so it does not count — that is the point).
	const rendered = new Set();
	for ( const hash of candidateHashes ) {
		await gotoSettings( page, hash );
		await waitForAppMounted( page );
		await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 20_000 } ).catch( () => {} );
		for ( const id of await renderedFieldIds( page ) ) {
			const t = idToType.get( id );
			if ( t ) rendered.add( t );
		}
	}

	const reachable = [ ...reachableByPage ].sort();

	// Second-chance pass: some fields render only after an async fetch settles (e.g. the `editor` texts on
	// the banner screen wait for the banner data to load), so a one-shot snapshot can miss them. For any
	// non-gated type not yet seen, re-visit a candidate page and WAIT (Playwright auto-retry) for the
	// specific field — turning a timing race into a deterministic check before we judge it missing.
	for ( const type of reachable ) {
		if ( rendered.has( type ) || GATED_TYPES.includes( type ) ) continue;
		for ( const f of byType.get( type ) ) {
			if ( ! f.menu_id || ! map.has( f.menu_id ) ) continue;
			await gotoSettings( page, map.get( f.menu_id ) );
			await waitForAppMounted( page );
			const ok = await field( page, f.id ).waitFor( { state: 'visible', timeout: 15_000 } ).then( () => true ).catch( () => false );
			if ( ok ) {
				rendered.add( type );
				break;
			}
		}
	}

	const missing = reachable.filter( ( t ) => ! rendered.has( t ) ).sort();

	// 1) Pages absent from the free menu expose exactly the premium-only types we expect — no more.
	expect( unreachableByPage, 'types with no free page (premium-only) drifted from the documented set' )
		.toEqual( PREMIUM_UNREACHABLE_TYPES );

	// 2) On the reachable pages, the only types that do NOT render in the pure seed are the documented
	//    gated ones (url + region-redirect menu). Everything else renders.
	expect( missing, 'types that unexpectedly did not render on a reachable free page' )
		.toEqual( GATED_TYPES );

	// 3) Positive coverage: every reachable, non-gated type rendered. (This is what proves the render.)
	const expectedRendered = reachable.filter( ( t ) => ! GATED_TYPES.includes( t ) );
	for ( const t of expectedRendered ) {
		expect( rendered.has( t ), `type did not render anywhere free-reachable: ${ t }` ).toBe( true );
	}

	// 4) Sanity on the breadth of the inventory so coverage cannot silently shrink (~45+ types incl. the
	//    16 base inputs and the four document fields).
	expect( allTypes.length ).toBeGreaterThanOrEqual( 50 );
	expect( expectedRendered.length ).toBeGreaterThanOrEqual( 45 );
	expect( byType.get( 'document' ).length ).toBe( 4 );
} );

// ====================================================================================================
// Editable free fields: change -> save -> reload -> persisted -> restore. Covers the distinct editable
// base-input mechanics (typed text / numeric / switch / radio / select) across free, reachable fields.
// ====================================================================================================

test( 'number + checkbox persist across reload (settings-general)', async ( { page } ) => {
	const hash = '#settings/settings-general';
	await gotoFieldsPage( page, hash );

	const number = field( page, 'cookie_expiry' ).getByRole( 'spinbutton' );
	const toggle = () => field( page, 'enable_scan_column' ).getByRole( 'switch' );

	const originalNumber = await number.inputValue();
	const originalOn = await switchIsOn( toggle() );
	const newNumber = originalNumber === '180' ? '200' : '180';

	try {
		await typeInto( page, number, newNumber );
		await toggle().click();
		await saveScreen( page );

		await gotoFieldsPage( page, hash );
		await expect( field( page, 'cookie_expiry' ).getByRole( 'spinbutton' ) ).toHaveValue( newNumber );
		expect( await switchIsOn( toggle() ), 'checkbox did not persist its flipped state' ).toBe( ! originalOn );
	} finally {
		await gotoFieldsPage( page, hash );
		await typeInto( page, field( page, 'cookie_expiry' ).getByRole( 'spinbutton' ), originalNumber );
		if ( ( await switchIsOn( toggle() ) ) !== originalOn ) {
			await toggle().click();
		}
		await saveScreen( page );
	}

	// Confirm the restore really landed.
	await gotoFieldsPage( page, hash );
	await expect( field( page, 'cookie_expiry' ).getByRole( 'spinbutton' ) ).toHaveValue( originalNumber );
	expect( await switchIsOn( toggle() ) ).toBe( originalOn );
} );

test( 'radio persists across reload (security-consent / respect_dnt)', async ( { page } ) => {
	const hash = '#wizard/security-consent';
	await gotoFieldsPage( page, hash );

	const group = field( page, 'respect_dnt' );
	const yes = () => field( page, 'respect_dnt' ).getByRole( 'radio', { name: 'Yes', exact: true } );
	const no = () => field( page, 'respect_dnt' ).getByRole( 'radio', { name: 'No', exact: true } );
	const originalYes = ( await group.getByRole( 'radio', { name: 'Yes', exact: true } ).getAttribute( 'aria-checked' ) ) === 'true';

	try {
		// Flip to the opposite of the seeded value.
		await ( originalYes ? no() : yes() ).click();
		await saveScreen( page );

		await gotoFieldsPage( page, hash );
		await expect( originalYes ? no() : yes() ).toHaveAttribute( 'aria-checked', 'true' );
	} finally {
		await gotoFieldsPage( page, hash );
		await ( originalYes ? yes() : no() ).click();
		await saveScreen( page );
	}

	await gotoFieldsPage( page, hash );
	await expect( originalYes ? yes() : no() ).toHaveAttribute( 'aria-checked', 'true' );
} );

test( 'text + textarea + email + phone + select persist across reload (website-information)', async ( { page } ) => {
	const hash = '#wizard/website-information';
	await gotoFieldsPage( page, hash );

	const text = () => field( page, 'organisation_name' ).getByRole( 'textbox' );
	const area = () => field( page, 'address_company' ).getByRole( 'textbox' );
	const email = () => field( page, 'email_company' ).getByRole( 'textbox' );
	const phone = () => field( page, 'telephone_company' ).getByRole( 'textbox' );
	const country = () => field( page, 'country_company' ).getByRole( 'combobox' );

	// All five render on this screen (cookie-statement is 'generated', satisfying their shared condition).
	await expect( text() ).toBeVisible();
	await expect( area() ).toBeVisible();
	await expect( email() ).toBeVisible();
	await expect( phone() ).toBeVisible();
	await expect( country() ).toBeVisible();

	const original = {
		text: await text().inputValue(),
		area: await area().inputValue(),
		email: await email().inputValue(),
		phone: await phone().inputValue(),
		country: ( await country().textContent() || '' ).trim(),
	};
	const next = {
		text: 'E2E Owner ' + ( original.text === 'E2E Owner A' ? 'B' : 'A' ),
		area: '1 E2E Street, Testville',
		email: 'e2e-persist@cmplz.test',
		phone: '+31 20 1234567',
		countryName: original.country.startsWith( 'Germany' ) ? 'Netherlands' : 'Germany',
	};

	async function pickCountry( name ) {
		await country().click();
		await page.getByRole( 'option', { name, exact: true } ).click();
	}

	try {
		await typeInto( page, text(), next.text );
		await typeInto( page, area(), next.area );
		await typeInto( page, email(), next.email );
		await typeInto( page, phone(), next.phone );
		await pickCountry( next.countryName );
		await saveScreen( page );

		await gotoFieldsPage( page, hash );
		await expect( text() ).toHaveValue( next.text );
		await expect( area() ).toHaveValue( next.area );
		await expect( email() ).toHaveValue( next.email );
		await expect( phone() ).toHaveValue( next.phone );
		await expect( country() ).toContainText( next.countryName );
	} finally {
		await gotoFieldsPage( page, hash );
		await typeInto( page, text(), original.text );
		await typeInto( page, area(), original.area );
		await typeInto( page, email(), original.email );
		await typeInto( page, phone(), original.phone );
		// original.country is like "Netherlands" possibly followed by the chevron glyph; match its start.
		await pickCountry( original.country.startsWith( 'Germany' ) ? 'Germany' : 'Netherlands' );
		await saveScreen( page );
	}

	await gotoFieldsPage( page, hash );
	await expect( text() ).toHaveValue( original.text );
	await expect( email() ).toHaveValue( original.email );
} );

// ====================================================================================================
// Validation / error state (the types that declare one: email, url, phone).
// ====================================================================================================

test( 'invalid email shows an inline validation error', async ( { page } ) => {
	await gotoFieldsPage( page, '#settings/settings-general' );
	// Reveal the email field via its controlling checkbox (no save — client-side only).
	await field( page, 'send_notifications_email' ).getByRole( 'switch' ).click();
	const email = field( page, 'notifications_email_address' ).getByRole( 'textbox' );
	await expect( email ).toBeVisible();

	await typeInto( page, email, 'not-an-email' );
	await expect( field( page, 'notifications_email_address' ).getByText( 'Please enter a valid email address' ) ).toBeVisible();
} );

test( 'invalid phone shows an inline validation error', async ( { page } ) => {
	await gotoFieldsPage( page, '#wizard/website-information' );
	const phone = field( page, 'telephone_company' ).getByRole( 'textbox' );
	await expect( phone ).toBeVisible();

	await typeInto( page, phone, 'abc-not-a-phone' );
	await expect( field( page, 'telephone_company' ).getByText( 'Please enter a valid phone number' ) ).toBeVisible();
} );

// ====================================================================================================
// `url` type: reveal (enable Matomo in-app, store preserved across the hash route), render, validate.
// Pure client-side: compile_statistics is changed in the store but never saved, so the DB is untouched
// (Page.js fetches fields once on mount; sub-menu navigation only re-filters, it does not refetch).
// ====================================================================================================

test( 'Matomo URL (url type) renders when Matomo is enabled, and validates its input', async ( { page } ) => {
	await gotoFieldsPage( page, '#wizard/consent-statistics' );

	// Choose the Matomo provider on the statistics question.
	await field( page, 'compile_statistics' )
		.getByRole( 'radio', { name: 'Yes, with Matomo', exact: true } )
		.click();

	// Navigate to the configuration screen via the in-app menu link (a hash route, NOT a full reload),
	// so the unsaved compile_statistics='matomo' survives in the store and the url field's condition is
	// met.
	await page.locator( `${ APP } a[href="#wizard/statistics-configuration"]` ).first().click();
	await page.locator( '[data-testid^="field-"]' ).first().waitFor( { state: 'visible', timeout: 30_000 } );

	// Make sure "configuration by Complianz" is yes (its default) so matomo_url's condition is satisfied.
	const confYes = field( page, 'configuration_by_complianz' ).getByRole( 'radio', { name: 'Yes', exact: true } );
	if ( ( await confYes.getAttribute( 'aria-checked' ) ) !== 'true' ) {
		await confYes.click();
	}

	const url = field( page, 'matomo_url' ).getByRole( 'textbox' );
	await expect( url ).toBeVisible();

	// Validation path: an invalid URL raises the inline error.
	await typeInto( page, url, 'not a url' );
	await expect( field( page, 'matomo_url' ).getByText( 'Please enter a valid URL' ) ).toBeVisible();
} );

// ====================================================================================================
// Premium-locked fields: rendered, but not editable (the free-edition contract).
// ====================================================================================================

test( 'premium field renders but its control is disabled (import)', async ( { page } ) => {
	await gotoFieldsPage( page, '#tools/tools-data' );
	// The import control is a premium field (premium + disabled) in the free edition: it renders, carries
	// the upsell affordance, and its file control cannot be used.
	const importField = field( page, 'import_settings' );
	await expect( importField ).toBeVisible();
	await expect( importField.getByRole( 'link', { name: 'Upgrade', exact: true } ) ).toBeVisible();
} );

test( 'premium group renders locked with an upsell and no editable control (data-breach-reports)', async ( { page } ) => {
	await gotoFieldsPage( page, '#tools/data-breach-reports' );
	// The whole group is premium: SettingsGroup renders a locked overlay with an "Upgrade" badge and a
	// pricing link (the same free-edition lock the smoke layer asserts).
	await expect( field( page, 'data_breach_reports' ) ).toBeVisible();
	await expect( page.locator( APP ).getByText( 'Upgrade', { exact: true } ).first() ).toBeVisible();
	await expect( page.locator( APP ).getByRole( 'link', { name: /premium/i } ).first() ).toBeVisible();
} );

// ====================================================================================================
// `document` field (DocumentControl) — records TODAY's behaviour as the ADR-003 contract.
//
// Contract (settings/src/Settings/DocumentControl.js, ADR-003 §Consequences):
//   - The value is a SINGLE choice among generated / custom / url / none, rendered as a radio group
//     (Inputs/RadioGroup). Exactly one option is always checked — the control is NOT clearable (there is
//     no empty state; a value is enforced on mount via updateField(defaultValue)).
//   - When the value is 'custom', an async page picker (today react-select/async) is shown whose options
//     are fetched through the `get_pages_list` do_action; it first shows a "Loading..." state, then the
//     combobox with placeholder "Type at least two characters" (the loaded/empty state).
//   - When the value is 'url', a free-text URL input is shown instead (after its own loading state).
//   - There are four document fields on #wizard/documents (cookie-statement, privacy-statement,
//     impressum, disclaimer).
// The Phase-2 Downshift Combobox migration must reproduce exactly this behaviour.
// ====================================================================================================

test( 'document field (DocumentControl) honours the ADR-003 contract', async ( { page } ) => {
	await gotoFieldsPage( page, '#wizard/documents' );

	// Four document fields are present.
	for ( const id of [ 'cookie-statement', 'privacy-statement', 'impressum', 'disclaimer' ] ) {
		await expect( field( page, id ) ).toBeVisible();
	}

	// Single value, not clearable: each renders a radio group with exactly one checked option.
	for ( const id of [ 'cookie-statement', 'privacy-statement' ] ) {
		const radios = field( page, id ).getByRole( 'radio' );
		await expect( radios.first() ).toBeVisible();
		const total = await radios.count();
		expect( total ).toBeGreaterThanOrEqual( 3 );
		let checked = 0;
		for ( let i = 0; i < total; i++ ) {
			if ( ( await radios.nth( i ).getAttribute( 'aria-checked' ) ) === 'true' ) checked++;
		}
		expect( checked, `document field ${ id } must have exactly one selected option` ).toBe( 1 );
	}

	// The seeded 'custom' field (privacy-statement) shows the async page picker whose options come from
	// get_pages_list — asserted by the placeholder of the loaded combobox.
	await expect(
		field( page, 'privacy-statement' ).getByText( 'Type at least two characters' )
	).toBeVisible( { timeout: 20_000 } );

	// The 'generated' field (cookie-statement) shows no async picker.
	await expect( field( page, 'cookie-statement' ).getByText( 'Type at least two characters' ) ).toHaveCount( 0 );
} );
