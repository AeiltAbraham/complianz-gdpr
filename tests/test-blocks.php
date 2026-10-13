<?php
/**
 * Unit coverage for cmplz_normalize_blocks() — the consumer-side dashboard block
 * normalization introduced for the Dashboard section (ADR-015, DB-17, C-4).
 *
 * Covers the ADR-015 §Consequences matrix: each legacy `class` token maps to the forward
 * width/variant keys; the other-plugins combination; variant conflicts resolve to borderless;
 * explicit keys win over `class`; unknown tokens are dropped; leading/trailing whitespace is
 * tolerated; the function is idempotent; the empty-array (no-capability) case; and
 * _doing_it_wrong() fires under WP_DEBUG for legacy-`class` blocks but not for new-key-only ones.
 *
 * settings/settings.php (which require_once's blocks.php) is only loaded for a logged-in admin,
 * so the test loads the config directly. cmplz_normalize_blocks() is defined OUTSIDE the
 * `function_exists('cmplz_blocks')` guard, so it is always available after this include.
 *
 * @package Complianz_Gdpr
 */

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 1 ) . '/settings/config/blocks.php';

/**
 * Test case for the cmplz_normalize_blocks() dashboard block normalizer (ADR-015).
 */
class CmplzBlocksTest extends WP_UnitTestCase {

	/**
	 * Normalize a single block and return the resulting block array.
	 *
	 * @param array $block A block config array.
	 * @return array The normalized block.
	 */
	private function normalize_one( $block ) {
		$result = cmplz_normalize_blocks( array( $block ) );
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		return $result[0];
	}

	/**
	 * The normalizer is defined outside the pluggable cmplz_blocks() guard.
	 */
	public function test_function_is_defined_outside_the_pluggable_guard() {
		$this->assertTrue( function_exists( 'cmplz_normalize_blocks' ) );
	}

	/**
	 * `cmplz-column-2` maps to width 2.
	 */
	public function test_cmplz_column_2_maps_to_width_2() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'progress',
				'class' => ' cmplz-column-2',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'default', $block['variant'] );
	}

	/**
	 * `border-to-border` maps to the edge-to-edge variant.
	 */
	public function test_border_to_border_maps_to_edge_to_edge() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'documents',
				'class' => 'border-to-border',
			)
		);
		$this->assertSame( 'edge-to-edge', $block['variant'] );
		$this->assertSame( 1, $block['width'] );
	}

	/**
	 * `no-border` maps to the borderless variant.
	 */
	public function test_no_border_maps_to_borderless() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'no-border',
			)
		);
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * `no-background` maps to the borderless variant.
	 */
	public function test_no_background_maps_to_borderless() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'no-background',
			)
		);
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * The other-plugins combination maps to width 2 + borderless.
	 */
	public function test_other_plugins_combination_maps_to_width_2_borderless() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'other-plugins',
				'class' => ' cmplz-column-2 no-border no-background',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * Multiple variant tokens resolve to borderless (borderless > edge-to-edge > default).
	 */
	public function test_variant_conflict_resolves_to_borderless() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'border-to-border no-background',
			)
		);
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * The variant precedence is ORDER-INDEPENDENT: borderless must not be downgraded to edge-to-edge
	 * when the no-background token precedes border-to-border (exercises the border-to-border precedence
	 * guard — the reversed order of test_variant_conflict_resolves_to_borderless).
	 */
	public function test_variant_conflict_is_order_independent() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'no-background border-to-border',
			)
		);
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * Explicit keys win PER AXIS: an explicit `width` with a legacy `class` still derives `variant` from
	 * the class, and — because an explicit key is present — fires NO deprecation notice.
	 */
	public function test_explicit_width_with_legacy_class_derives_variant_without_notice() {
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'width' => 2,
				'class' => 'border-to-border',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'edge-to-edge', $block['variant'] );
	}

	/**
	 * An explicit `width` key wins over the legacy class (and suppresses the deprecation notice).
	 */
	public function test_explicit_width_wins_over_class() {
		$block = $this->normalize_one(
			array(
				'id'      => 'x',
				'width'   => 1,
				'variant' => 'default',
				'class'   => ' cmplz-column-2',
			)
		);
		$this->assertSame( 1, $block['width'] );
		$this->assertSame( 'default', $block['variant'] );
	}

	/**
	 * An explicit `variant` key wins over the legacy class.
	 */
	public function test_explicit_variant_wins_over_class() {
		$block = $this->normalize_one(
			array(
				'id'      => 'x',
				'width'   => 1,
				'variant' => 'default',
				'class'   => 'border-to-border',
			)
		);
		$this->assertSame( 'default', $block['variant'] );
	}

	/**
	 * Unknown class tokens are dropped.
	 */
	public function test_unknown_tokens_dropped() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'cmplz-column-2 totally-unknown-token another-bogus',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'default', $block['variant'] );
	}

	/**
	 * Leading, trailing and interior whitespace in the class string is tolerated.
	 */
	public function test_leading_and_trailing_whitespace_tolerated() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => '  cmplz-column-2   no-background  ',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * The normalized output emits no raw `class` string.
	 */
	public function test_output_emits_no_class_key() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$block = $this->normalize_one(
			array(
				'id'    => 'x',
				'class' => 'border-to-border',
			)
		);
		$this->assertArrayNotHasKey( 'class', $block );
	}

	/**
	 * The block id and all non-class keys survive normalization.
	 */
	public function test_preserves_id_and_other_keys() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		$input = array(
			'id'      => 'documents',
			'header'  => array(
				'type' => 'react',
				'data' => 'DocumentsHeader',
			),
			'content' => array( 'data' => 'DocumentsBlock' ),
			'footer'  => array( 'data' => 'DocumentsFooter' ),
			'class'   => 'border-to-border',
		);
		$block = $this->normalize_one( $input );
		$this->assertSame( 'documents', $block['id'] );
		$this->assertSame( $input['header'], $block['header'] );
		$this->assertSame( $input['content'], $block['content'] );
		$this->assertSame( $input['footer'], $block['footer'] );
	}

	/**
	 * A block with no class and no keys defaults to width 1 / variant default and does not warn.
	 */
	public function test_block_without_class_defaults_and_does_not_warn() {
		$block = $this->normalize_one(
			array(
				'id'      => 'x',
				'content' => array( 'data' => 'Foo' ),
			)
		);
		$this->assertSame( 1, $block['width'] );
		$this->assertSame( 'default', $block['variant'] );
	}

	/**
	 * A new-key-only block does not trigger the legacy-class deprecation notice.
	 */
	public function test_new_key_only_block_does_not_warn() {
		$block = $this->normalize_one(
			array(
				'id'      => 'x',
				'width'   => 2,
				'variant' => 'borderless',
			)
		);
		$this->assertSame( 2, $block['width'] );
		$this->assertSame( 'borderless', $block['variant'] );
	}

	/**
	 * A legacy-class block (no explicit key) fires _doing_it_wrong().
	 */
	public function test_doing_it_wrong_fires_for_legacy_class_block() {
		$this->setExpectedIncorrectUsage( 'cmplz_normalize_blocks' );
		cmplz_normalize_blocks(
			array(
				array(
					'id'    => 'x',
					'class' => 'cmplz-column-2',
				),
			)
		);
	}

	/**
	 * Running the normalizer on already-normalized blocks changes nothing.
	 */
	public function test_idempotent() {
		$normalized = cmplz_normalize_blocks(
			array(
				array(
					'id'      => 'x',
					'width'   => 2,
					'variant' => 'borderless',
				),
			)
		);
		$twice      = cmplz_normalize_blocks( $normalized );
		$this->assertSame( $normalized, $twice );
		$this->assertSame( 2, $twice[0]['width'] );
		$this->assertSame( 'borderless', $twice[0]['variant'] );
		$this->assertArrayNotHasKey( 'class', $twice[0] );
	}

	/**
	 * The empty-array (no-capability) case passes through unchanged.
	 */
	public function test_empty_array_passes_through() {
		$this->assertSame( array(), cmplz_normalize_blocks( array() ) );
	}

	/**
	 * The five core blocks (already carrying width/variant) pass through unchanged, with no notice.
	 */
	public function test_all_five_core_blocks_normalize_as_expected() {
		$blocks = array(
			array(
				'id'      => 'progress',
				'width'   => 2,
				'variant' => 'default',
			),
			array(
				'id'      => 'documents',
				'width'   => 1,
				'variant' => 'edge-to-edge',
			),
			array(
				'id'      => 'tools',
				'width'   => 1,
				'variant' => 'edge-to-edge',
			),
			array(
				'id'      => 'tips_tricks',
				'width'   => 2,
				'variant' => 'default',
			),
			array(
				'id'      => 'other-plugins',
				'width'   => 2,
				'variant' => 'borderless',
			),
		);
		$result = cmplz_normalize_blocks( $blocks );
		$this->assertSame( $blocks, $result );
	}
}
