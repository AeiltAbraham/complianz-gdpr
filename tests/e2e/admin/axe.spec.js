/**
 * Accessibility (axe) layer (T-009, §8.1.3 "Accessibility"), written against TODAY's shipped UI.
 *
 * Runs @axe-core/playwright on every screen the smoke layer iterates (same runtime menu discovery,
 * helpers/menu.js). On the LEGACY UI the results are RECORDED only — a JSON artifact per screen plus
 * a summary — and nothing is gated, because the current UI is not expected to be clean. The gating
 * rule is wired but inert: a screen in `MIGRATED_SCREENS` (helpers/axe.js, empty today) must have
 * zero serious/critical violations except those in the §8.2 exemption table. From Phase 3 on, T-015
 * fills the exemptions and each redesigned screen is added to `MIGRATED_SCREENS`; this spec does not
 * change.
 *
 * Scope: axe analyses the Complianz app subtree (`#complianz`, the PHP mount node / kept scope
 * anchor), not WordPress-core admin chrome — we characterise the app, not WP core. Overlays that
 * mount outside it (dialogs in the portal host) are covered by the dialog-specific specs in later
 * tasks, not this smoke-wide layer.
 *
 * Selector contract (§8.1.1): discovery/navigation use role / name / text; axe is scoped by the
 * `#complianz` anchor only. No class selectors appear.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( '@playwright/test' );
const { AxeBuilder } = require( '@axe-core/playwright' );
const { discoverPages, gotoSettings, expectContentLoaded, APP } = require( './helpers/menu' );
const { isGated, gatingViolations, unexemptedViolations } = require( './helpers/axe' );

function slug( hash ) {
	return hash.replace( /^#/, '' ).replace( /[^a-z0-9]+/gi, '_' );
}

// Write a JSON artifact that lands on disk under the git-ignored test-results/ (outputPath), AND
// attach it so the CI HTML report embeds it too. (A body-attachment alone is not written to disk for
// a passing test under the `list` reporter, so the on-disk copy is what guarantees the record.)
async function writeArtifact( testInfo, relPath, data ) {
	const out = testInfo.outputPath( relPath );
	fs.mkdirSync( path.dirname( out ), { recursive: true } );
	const body = JSON.stringify( data, null, 2 );
	fs.writeFileSync( out, body );
	await testInfo.attach( relPath.replace( /[\\/]/g, '-' ), { body, contentType: 'application/json' } );
}

// Big suite: ~40 screens, each analysed by axe. Keep the one worker (shared DB).
test.describe.configure( { mode: 'serial', timeout: 600_000 } );

test( 'axe accessibility over every screen (recorded; gated only on migrated screens)', async ( { page }, testInfo ) => {
	const pages = await discoverPages( page );
	expect( pages.length, 'menu discovery found no screens' ).toBeGreaterThan( 0 );

	const summary = [];
	// Only populated for screens whose gating is active (MIGRATED_SCREENS); empty on the legacy UI.
	const gatedFailures = [];

	for ( const info of pages ) {
		await test.step( `axe ${ info.section } ${ info.hash }`, async () => {
			await gotoSettings( page, info.hash );
			// Make sure the screen's real content is in before analysing (not a loading placeholder).
			await expectContentLoaded( page, info ).catch( () => {} );

			const axeResults = await new AxeBuilder( { page } ).include( APP ).analyze();

			// Record the full per-screen result as an artifact (git-ignored test-results/).
			await writeArtifact( testInfo, path.join( 'axe', `${ slug( info.hash ) }.json` ), axeResults );

			const serious = gatingViolations( axeResults.violations );
			const gated = isGated( info );
			summary.push( {
				hash: info.hash,
				section: info.section,
				gated,
				total: axeResults.violations.length,
				seriousCritical: serious.length,
				ruleIds: serious.map( ( v ) => `${ v.id }(${ v.impact }x${ v.nodes.length })` ),
			} );

			if ( gated ) {
				// Scoped per (rule, selector) against the live DOM, so widget exemptions never
				// silence our own markup (helpers/axe.js consumes the §8.2 table).
				const failing = await unexemptedViolations( axeResults.violations, info, page );
				if ( failing.length ) {
					gatedFailures.push( `${ info.hash }: ${ failing.map( ( v ) => v.id ).join( ', ' ) }` );
				}
			}
		} );
	}

	await writeArtifact( testInfo, 'axe-summary.json', {
		project: testInfo.project.name,
		count: summary.length,
		summary,
	} );

	// Legacy UI: recorded only, so this is empty. It only bites once screens enter MIGRATED_SCREENS.
	expect( gatedFailures, 'migrated screens with un-exempted serious/critical axe violations' ).toEqual( [] );
} );
