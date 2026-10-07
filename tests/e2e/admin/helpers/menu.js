/**
 * Menu discovery and shared page helpers for the characterization suite (T-009, §8.1.1/§8.1.3).
 *
 * The smoke and axe layers iterate EVERY section and sub-menu item the app itself renders, so a
 * menu item added or removed in PHP is picked up automatically with no spec edit. Complianz
 * delivers its menu to React via `wp_localize_script` as `window.cmplz_settings.menu`
 * (settings/settings.php -> cmplz_menu()); there is no `/complianz/v1/` menu route, so that
 * localized object IS "the app's own menu data". Section titles and premium flags are read from
 * it; the navigable leaf pages (which honour region/field gating and nesting) are read from the
 * menu the app actually renders, by crawling it.
 *
 * Selector contract (§8.1.1): navigation and assertions use role / accessible name / text /
 * `data-testid` only. No class selectors (`cmplz-*`, WP core, utility) appear anywhere. `#complianz`
 * is the PHP-rendered app mount node (settings/settings.php) and a kept scope anchor (ADR-001); it
 * is used ONLY to scope role-based queries and by-href menu reads to the app, never as a style hook.
 * Deep links (hash URLs) are the preserved navigation contract (C-3), so navigating by them is fine.
 */

const { expect } = require( '@playwright/test' );

// The settings admin page. React mounts into #complianz and routes by URL hash within it.
const SETTINGS_PAGE = '/wp-admin/admin.php?page=complianz';

// App mount node + scope anchor (see header comment). Not a styling selector.
const APP = '#complianz';

// Monotonic counter appended as a throwaway query param so every gotoSettings() is a REAL document
// load, even between two hashes of the same page: browsers (and Playwright's page.goto) treat a
// hash-only change as a same-document move and do NOT reload, which would leave the previous page's
// DOM in place and let an assertion measure stale content. A fresh load remounts React, refetches
// that screen's `/complianz/v1/` data, and isolates each page's console/request capture. The app
// routes only by hash and ignores the query string, so this is invisible to it.
let navCounter = 0;

/**
 * Build the settings URL for a hash deep link (`#banner`, `#tools/support`, …).
 *
 * @param {string} hash Hash including or excluding the leading `#`; empty for the default screen.
 * @return {string} The admin URL (with a per-call cache-buster, see navCounter).
 */
function settingsUrl( hash = '' ) {
	const base = `${ SETTINGS_PAGE }&_cmplz_e2e=${ ++navCounter }`;
	if ( ! hash ) {
		return base;
	}
	return `${ base }${ hash.startsWith( '#' ) ? '' : '#' }${ hash }`;
}

/**
 * Full-navigate to a settings deep link (a real document load, so each page is measured fresh).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} hash Hash deep link; empty for the default screen.
 * @return {Promise<void>}
 */
async function gotoSettings( page, hash = '' ) {
	await page.goto( settingsUrl( hash ) );
}

/**
 * Wait until the React app has mounted and rendered something into #complianz.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<void>}
 */
async function waitForAppMounted( page ) {
	await expect( page.locator( `${ APP } > *` ).first() ).toBeVisible( { timeout: 30_000 } );
}

/**
 * Read the app's own menu tree from the data it ships to React (see header comment).
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<Array>} The `cmplz_settings.menu` array, or [] if absent.
 */
async function readMenuTree( page ) {
	return page.evaluate( () => {
		const s = window.cmplz_settings;
		return s && Array.isArray( s.menu ) ? s.menu : [];
	} );
}

/**
 * Whether a menu item renders locked in the free edition: the item itself, or any of its settings
 * groups, is flagged premium (settings/config/menu.php; SettingsGroup.js locks premium groups when
 * `cmplz_settings.is_premium` is false — the free-edition contract, plan.md §1).
 *
 * @param {Object} item A menu item (or section) object.
 * @return {boolean}
 */
function isPremiumItem( item ) {
	if ( item && item.premium === true ) {
		return true;
	}
	return Array.isArray( item && item.groups ) && item.groups.some( ( g ) => g && g.premium === true );
}

/**
 * Collect the ids of every item (recursively through `menu_items`) that matches a predicate.
 *
 * @param {Array}    items     Menu items.
 * @param {Function} predicate (item) => boolean.
 * @param {Set}      acc       Accumulator.
 * @return {Set<string>}
 */
function collectIds( items, predicate, acc = new Set() ) {
	for ( const item of items || [] ) {
		if ( predicate( item ) ) {
			acc.add( item.id );
		}
		if ( Array.isArray( item.menu_items ) ) {
			collectIds( item.menu_items, predicate, acc );
		}
	}
	return acc;
}

/**
 * The sub-item id of a `#section/sub[/…]` hash (everything after the section).
 *
 * @param {string} hash
 * @return {string}
 */
function subIdFromHash( hash ) {
	const parts = hash.replace( /^#/, '' ).split( '/' );
	return parts.length > 1 ? parts.slice( 1 ).join( '/' ) : '';
}

/**
 * The distinct sub-menu links the app currently renders for a section, as `{ href, text }`.
 *
 * Role-based: every rendered link (`getByRole('link')`, scoped to the #complianz app) is read and
 * kept when its hash deep link targets this section (`#<section>/<id>`), the preserved C-3 contract.
 * No class selector is involved. The Settings footer's Previous/Continue controls reuse these hrefs;
 * the menu renders before the footer in the DOM, so de-duping by href (first occurrence wins) keeps
 * the menu item and its real title.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          sectionId
 * @return {Promise<Array<{href:string,text:string}>>}
 */
async function readSectionLinks( page, sectionId ) {
	const prefix = `#${ sectionId }/`;
	const links = await page
		.locator( APP )
		.getByRole( 'link' )
		.evaluateAll(
			( els, p ) =>
				els
					.map( ( e ) => ( { href: e.getAttribute( 'href' ) || '', text: ( e.textContent || '' ).trim() } ) )
					.filter( ( l ) => l.href.startsWith( p ) ),
			prefix
		);
	const seen = new Set();
	const out = [];
	for ( const l of links ) {
		if ( seen.has( l.href ) ) {
			continue;
		}
		seen.add( l.href );
		out.push( l );
	}
	return out;
}

/**
 * Wait for a section screen to be fully loaded (its real menu rendered), not stuck on a placeholder.
 * The sub-menu header is an <h1> carrying the section title once the real Menu renders; the loading
 * MenuPlaceholder renders an EMPTY <h1>, so matching the title text proves the real menu is in.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          sectionTitle
 * @return {Promise<void>}
 */
async function waitForSectionLoaded( page, sectionTitle ) {
	await waitForAppMounted( page );
	await expect(
		page.locator( APP ).getByRole( 'heading', { level: 1, name: sectionTitle, exact: true } )
	).toBeVisible( { timeout: 30_000 } );
}

/**
 * Discover every navigable page as the app itself renders it — region/field gating and menu nesting
 * included — seeded by the section list from the app's own menu data. Returns one entry per distinct
 * page hash. New/removed menu items are reflected automatically.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<Array<{section:string,sectionTitle:string,hash:string,title:string,premium:boolean}>>}
 */
async function discoverPages( page ) {
	await gotoSettings( page );
	await waitForAppMounted( page );
	const tree = await readMenuTree( page );

	const pages = [];
	const seen = new Set();
	const push = ( p ) => {
		if ( ! seen.has( p.hash ) ) {
			seen.add( p.hash );
			pages.push( p );
		}
	};

	for ( const section of tree ) {
		const items = Array.isArray( section.menu_items ) ? section.menu_items : [];
		if ( items.length === 0 ) {
			// Leaf section (Dashboard): the section hash is itself the page.
			push( {
				section: section.id,
				sectionTitle: section.title,
				hash: `#${ section.id }`,
				title: section.title,
				premium: isPremiumItem( section ),
			} );
			continue;
		}

		const expandable = collectIds( items, ( it ) => Array.isArray( it.menu_items ) && it.menu_items.length > 0 );
		const premium = collectIds( items, isPremiumItem );

		// Full-load the section root and every expandable parent; union the rendered links.
		const toLoad = [ `#${ section.id }` ];
		const loaded = new Set();
		while ( toLoad.length ) {
			const hash = toLoad.shift();
			if ( loaded.has( hash ) ) {
				continue;
			}
			loaded.add( hash );
			await gotoSettings( page, hash );
			await waitForSectionLoaded( page, section.title );
			for ( const link of await readSectionLinks( page, section.id ) ) {
				const subId = subIdFromHash( link.href );
				push( {
					section: section.id,
					sectionTitle: section.title,
					hash: link.href,
					title: link.text,
					premium: premium.has( subId ),
				} );
				if ( expandable.has( subId ) ) {
					toLoad.push( link.href );
				}
			}
		}
	}

	return pages;
}

/**
 * Positive "real content rendered" assertion — the way T-009 detects a stuck placeholder (assert the
 * page's real content appears within a timeout, never match placeholder classes). Locale- and
 * instance-agnostic:
 *  - the app-shell header exposes this section as a link (the error/locked PagePlaceholder renders
 *    only a logo, no nav, so this also rules that state out);
 *  - a level-3 heading is visible inside the app. Loaded screens always render >=1 <h3> (Settings'
 *    Notifications panel and group headers; Dashboard block headers), while every loading
 *    placeholder renders none — so a visible <h3> distinguishes loaded content from a stuck one;
 *  - on a sub-screen (hash has a `/`), the section-title <h1> is visible — the real sub-menu, not
 *    the empty MenuPlaceholder <h1>.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{section:string,sectionTitle:string,hash:string}} pageInfo
 * @return {Promise<void>}
 */
async function expectContentLoaded( page, pageInfo ) {
	const app = page.locator( APP );
	await expect( app.getByRole( 'link', { name: pageInfo.sectionTitle, exact: true } ).first() ).toBeVisible( { timeout: 30_000 } );
	if ( pageInfo.hash.includes( '/' ) ) {
		await expect(
			app.getByRole( 'heading', { level: 1, name: pageInfo.sectionTitle, exact: true } )
		).toBeVisible( { timeout: 30_000 } );
	}
	await expect( app.getByRole( 'heading', { level: 3 } ).first() ).toBeVisible( { timeout: 30_000 } );
}

/**
 * Assert no ErrorBoundary fallback is showing. The boundary renders a hard-coded, untranslated
 * "Something went wrong." heading (utils/ErrorBoundary.js), so this is locale-agnostic.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<void>}
 */
async function expectNoErrorBoundary( page ) {
	await expect(
		page.locator( APP ).getByRole( 'heading', { name: 'Something went wrong.' } )
	).toHaveCount( 0 );
}

/**
 * Assert a premium group renders LOCKED with upsell (free-edition contract, plan.md §1). In the free
 * edition `cmplz_settings.is_premium` is false, so SettingsGroup.js renders a locked overlay over
 * each premium group: a lock badge reading __("Upgrade") plus an upsell link to the pricing page.
 * The badge text only appears for a locked/non-editable group — its presence is the proof the group
 * rendered locked and cannot be edited; the upsell link is the CTA.
 *
 * These two strings are English in every project that runs the smoke layer: `admin` (en_US),
 * `admin-rtl` (he_IL — Complianz ships no Hebrew translation, so the UI falls back to English) and
 * `admin-min-wp` (en_US). The only translated project, `admin-i18n` (de_DE), does not run smoke. So
 * matching them by visible text/role is both within the selector contract (§8.1.1, "the visible text
 * or role the legacy UI exposes") and locale-safe here. Navigation never relies on these strings.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<void>}
 */
async function expectLockedWithUpsell( page ) {
	const app = page.locator( APP );
	await expect( app.getByText( 'Upgrade', { exact: true } ).first() ).toBeVisible( { timeout: 30_000 } );
	await expect( app.getByRole( 'link', { name: /premium/i } ).first() ).toBeVisible( { timeout: 30_000 } );
}

module.exports = {
	SETTINGS_PAGE,
	APP,
	settingsUrl,
	gotoSettings,
	waitForAppMounted,
	waitForSectionLoaded,
	readMenuTree,
	readSectionLinks,
	isPremiumItem,
	subIdFromHash,
	discoverPages,
	expectContentLoaded,
	expectNoErrorBoundary,
	expectLockedWithUpsell,
};
