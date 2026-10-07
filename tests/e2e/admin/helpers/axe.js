/**
 * Shared axe-gating policy for the accessibility layer (T-009, §8.1/§8.2).
 *
 * The axe layer runs on every smoke screen. On the LEGACY UI results are only RECORDED (a JSON
 * artifact per screen); nothing is gated. The gating rule is wired but inert today and switches on
 * per screen from Phase 3: a screen listed in `MIGRATED_SCREENS` must have zero serious/critical
 * violations, except violations covered by the §8.2 exemption table (`EXEMPTIONS`).
 *
 * Both lists are empty today. T-015 fills `EXEMPTIONS` from the S1 retained-widget accessibility
 * audit, and each migrated screen is added to `MIGRATED_SCREENS` as it lands (Phase 3+). This file is
 * the single place those two edits happen; the spec logic does not change.
 *
 * A screen is identified by its page hash (e.g. `#tools/support`) or its section id (e.g. `tools`),
 * so a whole section can be gated at once. Violations are gated only at serious/critical impact
 * (§8.1); moderate/minor are recorded, never gated.
 */

// Screens whose axe gating is ACTIVE. Empty on the legacy UI. Add a page hash or a section id here
// when its redesign lands (Phase 3+). Example once migrated: [ '#tools/support', 'banner' ].
const MIGRATED_SCREENS = [];

// §8.2 exemption table for retained third-party widgets. Empty until the T-015 audit. Each row:
//   { screen: '#hash' | 'section', rule: '<axe-rule-id>', selector: '<widget root>', reason: '…' }
// A row excuses exactly one axe rule on exactly one migrated screen (never a page-wide mute).
const EXEMPTIONS = [];

// The axe impacts that gate a migrated screen (§8.1). Lower impacts are recorded only.
const GATING_IMPACTS = [ 'serious', 'critical' ];

/**
 * Whether a discovered page's axe results are gated (its redesign has landed).
 *
 * @param {{hash:string,section:string}} pageInfo
 * @return {boolean}
 */
function isGated( pageInfo ) {
	return MIGRATED_SCREENS.includes( pageInfo.hash ) || MIGRATED_SCREENS.includes( pageInfo.section );
}

/**
 * The serious/critical axe violations on a page (what the gate would act on).
 *
 * @param {Array} violations axe `results.violations`.
 * @return {Array}
 */
function gatingViolations( violations ) {
	return ( violations || [] ).filter( ( v ) => GATING_IMPACTS.includes( v.impact ) );
}

/**
 * Gating violations for a page MINUS the ones exempted for that screen (§8.2).
 *
 * @param {Array}                         violations axe `results.violations`.
 * @param {{hash:string,section:string}}  pageInfo
 * @return {Array} Violations that should fail the gate.
 */
function unexemptedViolations( violations, pageInfo ) {
	return gatingViolations( violations ).filter( ( v ) => {
		return ! EXEMPTIONS.some(
			( e ) => ( e.screen === pageInfo.hash || e.screen === pageInfo.section ) && e.rule === v.id
		);
	} );
}

module.exports = {
	MIGRATED_SCREENS,
	EXEMPTIONS,
	GATING_IMPACTS,
	isGated,
	gatingViolations,
	unexemptedViolations,
};
