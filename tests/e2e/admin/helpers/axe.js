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

// §8.2 exemption table for retained third-party widgets (filled by the T-015 audit; see
// docs/specs/001-settings-ui-redesign/a11y-exemptions.md). Each row:
//   { screen: '#hash' | 'section', rule: '<axe-rule-id>', selector: '<widget root>', reason: '…' }
// A row excuses exactly one axe rule on exactly one widget-root selector on one migrated
// screen — NEVER page-wide and NEVER a whole-widget mute of all rules. A finding is dropped
// only when its offending DOM node is INSIDE `selector` (checked with element.closest in the
// live DOM), so a node in our own markup is never silenced even if it shares a rule id.
// Every row is a widget-internal, fixable-in-Phase-4 finding; remove the row when its fix
// lands. Our-own-code findings are deliberately absent (they are must-fix, not exemptions).
const EXEMPTIONS = [
	{
		screen: '#banner/colors/colors-general',
		rule: 'color-contrast',
		selector: '.chrome-picker',
		reason: 'react-color inline-styles the HEX/RGB field labels at 2.95:1; widget-internal DOM, overridable only via the ChromePicker styles prop (Phase 4).',
	},
	{
		screen: '#tools/data-requests/datarequest-entries',
		rule: 'button-name',
		selector: '.rdrMonthAndYearWrapper',
		reason: 'react-date-range prev/next month icon buttons render <button><i></i></button> with no name; fixable via the library ariaLabels prop (Phase 4).',
	},
	{
		screen: '#tools/data-requests/datarequest-entries',
		rule: 'select-name',
		selector: '.rdrMonthAndYearPickers',
		reason: 'react-date-range month/year selects render without a label; fixable via the library ariaLabels prop (Phase 4).',
	},
	{
		screen: '#tools/data-requests/datarequest-entries',
		rule: 'color-contrast',
		selector: '.rdrDateDisplayWrapper',
		reason: 'react-date-range start/end date inputs at ~1.3:1; fixable in the vendored date-range.scss (Phase 4).',
	},
	{
		screen: '#tools/data-requests/datarequest-entries',
		rule: 'color-contrast',
		selector: '.rdrDefinedRangesWrapper',
		reason: 'react-date-range preset-range labels at ~1.29:1; fixable in the vendored date-range.scss (Phase 4).',
	},
	{
		screen: 'dashboard',
		rule: 'color-contrast',
		selector: '.shepherd-footer',
		reason: 'Shepherd footer buttons at 2.25:1 from the .cmplz-shepherd theme on the widget\'s internal button DOM; fixable by re-theming (Phase 4).',
	},
];

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
 * Whether an axe violation node lives inside a widget-root selector, verified against the live
 * DOM. axe node targets are valid CSS selectors for the offending element; we re-select it and
 * ask `element.closest(selector)` so a descendant of the widget root (not just the root itself)
 * counts. Returns false (so the node stays a failure) for cross-frame targets or any lookup
 * error — the safe direction, never over-exempting.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{target:Array}}                  node     An axe violation node.
 * @param {string}                          selector The exemption's widget-root selector.
 * @return {Promise<boolean>}
 */
async function nodeWithinSelector( page, node, selector ) {
	const target = node && node.target;
	// Same-frame targets are a single-element array; cross-frame has >1 and is not supported here.
	const sel = Array.isArray( target ) ? ( target.length === 1 ? target[ 0 ] : null ) : target;
	if ( typeof sel !== 'string' ) {
		return false;
	}
	return page.evaluate(
		( { sel: s, selector: root } ) => {
			try {
				const el = document.querySelector( s );
				return !! ( el && el.closest( root ) );
			} catch ( e ) {
				return false;
			}
		},
		{ sel, selector }
	);
}

/**
 * Gating violations for a page MINUS the exempted nodes (§8.2), scoped per (rule, selector).
 *
 * For each serious/critical violation, a node is dropped only when a table row matches this
 * screen (hash OR section) AND the rule AND the node is inside the row's widget-root selector
 * (checked in the live DOM). A violation with any surviving node still fails — so a finding in
 * our own markup is never silenced by a widget exemption that shares its rule id. No page-wide
 * `exclude` is ever used.
 *
 * @param {Array}                         violations axe `results.violations`.
 * @param {{hash:string,section:string}}  pageInfo
 * @param {import('@playwright/test').Page} page
 * @return {Promise<Array>} Violations (with only their non-exempt nodes) that should fail the gate.
 */
async function unexemptedViolations( violations, pageInfo, page ) {
	const failing = [];
	for ( const v of gatingViolations( violations ) ) {
		const rows = EXEMPTIONS.filter(
			( e ) => ( e.screen === pageInfo.hash || e.screen === pageInfo.section ) && e.rule === v.id
		);
		if ( rows.length === 0 ) {
			failing.push( v );
			continue;
		}
		const selectors = rows.map( ( r ) => r.selector );
		const survivingNodes = [];
		for ( const node of v.nodes || [] ) {
			let covered = false;
			for ( const selector of selectors ) {
				if ( await nodeWithinSelector( page, node, selector ) ) {
					covered = true;
					break;
				}
			}
			if ( ! covered ) {
				survivingNodes.push( node );
			}
		}
		if ( survivingNodes.length ) {
			failing.push( { ...v, nodes: survivingNodes } );
		}
	}
	return failing;
}

module.exports = {
	MIGRATED_SCREENS,
	EXEMPTIONS,
	GATING_IMPACTS,
	isGated,
	gatingViolations,
	nodeWithinSelector,
	unexemptedViolations,
};
