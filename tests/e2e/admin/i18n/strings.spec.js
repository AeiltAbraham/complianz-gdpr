/**
 * German i18n layer (T-013, DB-14, §6.3), `admin-i18n` project only (8888, latest, de_DE user).
 *
 * Proves that Complianz's own PHP-delivered strings render in German for a de_DE administrator — the
 * RTL-parity sibling of the German locale requirement (DB-14). This is NOT a WordPress-core string
 * check: the de_DE CORE language pack translates WordPress itself, but Complianz's menu titles and
 * field labels come from the PLUGIN translation set, installed from wordpress.org by the setup project
 * (`wp language plugin install complianz-gdpr de_DE`, setup/latest.setup.js). If that plugin pack is
 * missing or stale, these strings fall back to English and every assertion below fails — which is
 * exactly the regression this layer is meant to catch, so each check also asserts the English original
 * is ABSENT (translation really happened, not just "some German text exists somewhere").
 *
 * Three independent delivery paths are covered, because each translates through different machinery:
 *   1. MENU TITLES — the top-level section titles come from `cmplz_menu()` (settings/config/menu.php),
 *      serialised into `window.cmplz_settings.menu` by `wp_localize_script` at admin-page render time
 *      (settings/settings.php), and rendered by the shell header as nav links (Header.js). They are
 *      translated server-side in the de_DE admin request.
 *   2. A FIELD LABEL — `organisation_name`'s label "Who is the owner of the website?"
 *      (settings/config/fields/wizard/general.php) is delivered over REST `/complianz/v1/fields/get`,
 *      which api-fetch requests with `_locale=user`, so its response is translated to the user locale.
 *      This exercises the REST translation path that the menu path does not.
 *   3. A CODE-SPLIT CHUNK STRING (C-7, DB-14) — a string the settings app's own JavaScript renders with
 *      `__()`, translated CLIENT-side by `setLocaleData` (Page.js) from the per-chunk translation JSON
 *      that PHP collects in `cmplz_get_chunk_translations()` and injects as
 *      `window.cmplz_settings.json_translations`. Because the app code-splits into content-hashed
 *      chunks, those JSON files are keyed by `md5("settings/build/<chunk>.js")` and must be regenerated
 *      for the shipping build — the release i18n step (`bin/i18n.sh`); the e2e setup re-keys the de_DE
 *      pack to the current build so this assertion tests the real free-edition chunk path, not the
 *      shipped-7.5.5-hash pack. This path is independent of both PHP paths above.
 *
 * Selector contract (§8.1.1): role / accessible name / text / `data-testid` only. Section titles are
 * matched by their visible nav-link text; the field is located by its `data-testid="field-<id>"`
 * (added in T-011). No `cmplz-*`, WP-core or utility class selector appears.
 *
 * Runs ONLY in `admin-i18n` (playwright.config.js testMatch `**​/i18n/**`), so these German strings are
 * never asserted in the en_US / he_IL projects (where the UI is English).
 */

const { test, expect } = require( '@playwright/test' );
const { APP, gotoSettings, waitForAppMounted, waitForSectionLoaded } = require( '../helpers/menu' );

// Top-level section titles from cmplz_menu() (settings/config/menu.php) and their de_DE translations
// (complianz-gdpr-de_DE plugin pack, v7.5.5). "Dashboard" is intentionally excluded: it is identical
// in both languages, so it cannot prove a translation happened. Each entry is a real PHP __() string,
// so a wording change in menu.php or the pack surfaces here deliberately.
const MENU_TITLES = [
	{ en: 'Wizard', de: 'Assistent' },
	{ en: 'Consent Banner', de: 'Einwilligungsbanner' },
	{ en: 'Integrations', de: 'Integrationen' },
	{ en: 'Settings', de: 'Einstellungen' },
	{ en: 'Tools', de: 'Werkzeuge' },
];

// A PHP field label delivered over REST (see header). organisation_name lives on
// #wizard/website-information and renders in the seeded state (its react_conditions are met there).
const FIELD = {
	testid: 'field-organisation_name',
	hash: '#wizard/website-information',
	en: 'Who is the owner of the website?',
	de: 'Wer ist der Eigentümer der Website?',
};

// A string the app's JS renders via __() and that lives in a CODE-SPLIT chunk (not the entry
// bundle), so it proves the chunk-translation path specifically (C-7, DB-14). "Read more" is a
// plain __('Read more','complianz-gdpr') in the dashboard blocks (ToolItem.js, OtherRegions.js),
// rendered as links on the default dashboard, and its de_DE translation ("Mehr lesen") differs
// from the English — so a pass is a real translation, not an accidental match. Its chunk JSON is
// one of several complianz-gdpr-de_DE-<md5("settings/build/<chunk>.js")>.json the setup regenerates.
const CHUNK = { en: 'Read more', de: 'Mehr lesen' };

test.describe.configure( { mode: 'serial', timeout: 300_000 } );

test( 'menu section titles render in German (wp_localize_script path)', async ( { page } ) => {
	// On the default dashboard screen only the top-level nav is rendered (Dashboard has no sub-menu),
	// so each section title appears exactly once, as a header nav link — no sub-menu/group duplicates.
	await gotoSettings( page );
	await waitForAppMounted( page );
	const app = page.locator( APP );

	for ( const { en, de } of MENU_TITLES ) {
		// The German title is a visible nav link...
		await expect(
			app.getByRole( 'link', { name: de, exact: true } ).first(),
			`section "${ en }" did not render as its German title "${ de }" (plugin de_DE pack missing?)`
		).toBeVisible( { timeout: 30_000 } );
		// ...and the English original is NOT present as a nav link (so this is real translation).
		await expect(
			app.getByRole( 'link', { name: en, exact: true } ),
			`section still renders the English title "${ en }" — de_DE translation did not apply`
		).toHaveCount( 0 );
	}
} );

test( 'a field label renders in German (REST /fields/get, _locale=user path)', async ( { page } ) => {
	await gotoSettings( page, FIELD.hash );
	await waitForSectionLoaded( page, 'Assistent' ); // Wizard section, in German.

	const wrapper = page.getByTestId( FIELD.testid );
	await expect( wrapper ).toBeVisible( { timeout: 30_000 } );
	// The REST-delivered label is translated...
	await expect(
		wrapper.getByText( FIELD.de, { exact: false } ),
		`field ${ FIELD.testid } did not show its German label "${ FIELD.de }" — REST response not in de_DE`
	).toBeVisible( { timeout: 30_000 } );
	// ...and the English original is gone from the field (real translation, not a fallback).
	await expect(
		wrapper.getByText( FIELD.en, { exact: false } ),
		`field ${ FIELD.testid } still shows the English label "${ FIELD.en }"`
	).toHaveCount( 0 );
} );

test( 'a code-split chunk JSON carries the German translation (json_translations, C-7/DB-14)', async ( { page } ) => {
	// PHP (cmplz_get_chunk_translations) scans settings/build, resolves each chunk's translation JSON
	// from WP_LANG_DIR/plugins by md5 of its path, and injects the set as cmplz_settings.json_translations.
	// Assert one of those entries carries the German CHUNK string. If the JSON were missing or keyed to a
	// stale build hash (the whole C-7 risk), nothing here would translate it and the UI would fall back to
	// English — so this is the direct "the generated .json chunk files carry the translated strings" check.
	await gotoSettings( page );
	await waitForAppMounted( page );
	const found = await page.evaluate( ( en ) => {
		const list = window.cmplz_settings && window.cmplz_settings.json_translations;
		if ( ! Array.isArray( list ) ) {
			return { error: 'cmplz_settings.json_translations is not an array' };
		}
		for ( const raw of list ) {
			let data;
			try {
				data = JSON.parse( raw );
			} catch ( e ) {
				continue;
			}
			const ld = data.locale_data && ( data.locale_data[ 'complianz-gdpr' ] || data.locale_data.messages );
			const entry = ld && ld[ en ];
			if ( entry && entry[ 0 ] ) {
				return { translation: entry[ 0 ], count: list.length };
			}
		}
		return { translation: null, count: list.length };
	}, CHUNK.en );
	expect(
		found.translation,
		`no chunk-translation JSON carried a German string for "${ CHUNK.en }" (${ JSON.stringify( found ) }) — regenerate the chunk JSON for the current build (bin/i18n.sh / the e2e setup)`
	).toBe( CHUNK.de );
} );

test( 'a JS-rendered code-split chunk string renders in German (setLocaleData path)', async ( { page } ) => {
	// End-to-end: the dashboard "Read more" links are rendered by the app's JS (__()), translated
	// client-side from the chunk JSON. Seeing "Mehr lesen" — and no English "Read more" link — proves the
	// chunk path works all the way to the DOM, distinct from the wp_localize_script and REST paths above.
	await gotoSettings( page );
	await waitForAppMounted( page );
	const app = page.locator( APP );

	await expect(
		app.getByRole( 'link', { name: CHUNK.de, exact: true } ).first(),
		`the dashboard did not render its JS "${ CHUNK.en }" link in German ("${ CHUNK.de }") — chunk translations not applied (regenerate for the current build)`
	).toBeVisible( { timeout: 30_000 } );
	await expect(
		app.getByRole( 'link', { name: CHUNK.en, exact: true } ),
		`a JS "${ CHUNK.en }" link still renders in English — setLocaleData did not translate the code-split chunk string`
	).toHaveCount( 0 );
} );
