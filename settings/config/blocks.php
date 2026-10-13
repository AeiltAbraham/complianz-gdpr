<?php
defined('ABSPATH') or die();
/**
 * This file contains the blocks for the dashboard
 * @since 2.0
 */
if (!function_exists('cmplz_blocks')) {
	function cmplz_blocks() {
		if ( ! cmplz_user_can_manage() ) {
			return [];
		}
		$blocks = [
			[
				'id'       => 'progress',
				'header' => [
					'type' => 'react',
					'data' => 'ProgressHeader'
				],
				'content'  => [ 'data' => 'ProgressBlock' ],
				'footer'   => [ 'data' => 'ProgressFooter' ],
				'width'   => 2,
				'variant' => 'default',
			],
			[
				'id'       => 'documents',
				'header' => [
					'type' => 'react',
					'data' => 'DocumentsHeader'
				],
				'content'  => [ 'data' => 'DocumentsBlock' ],
				'footer'   => [ 'data' => 'DocumentsFooter' ],
				'width'   => 1,
				'variant' => 'edge-to-edge',
			],
			[
				'id'       => 'tools',
				'header' => [
					'type' => 'react',
					'data' => 'ToolsHeader'
				],
				'content'  => [ 'type' => 'react', 'data' => 'Tools' ],
				'footer'   => [ 'type' => 'react', 'data' => 'ToolsFooter' ],
				'width'   => 1,
				'variant' => 'edge-to-edge',
			],
			[
				'id'       => 'tips_tricks',
				'header' => [
					'type' => 'text',
					'data' => __( "Tips & Tricks", 'complianz-gdpr' ),
				],
				'content'  => ['data' => 'TipsTricks' ],
				'footer'   => [ 'data' => 'TipsTricksFooter' ],
				'width'   => 2,
				'variant' => 'default',
			],
			[
				'id'       => 'other-plugins',
				'header' => [
					'type' => 'react',
					'data' => 'OtherPluginsHeader'
				],
				'title'    => __( "Other Plugins", 'complianz-gdpr' ),
				'help'     => __( 'A help text', 'complianz-gdpr' ),
				'content'  => [ 'type' => 'react', 'data' => 'OtherPlugins' ],
				'footer'   => [ 'type' => 'html', 'data' => '' ],
				'width'   => 2,
				'variant' => 'borderless',
			],
		];

		return apply_filters( 'cmplz_blocks', $blocks );
	}
}

/**
 * Normalize dashboard blocks to the forward `width`/`variant` schema (ADR-015, DB-17, C-4).
 *
 * Runs consumer-side on the OUTPUT of cmplz_blocks() (see settings/settings.php), so it processes
 * both `cmplz_blocks` filter additions AND a pluggable cmplz_blocks() override — which is why it is
 * defined OUTSIDE the `function_exists('cmplz_blocks')` guard above and is NOT itself pluggable (a
 * premium override must not be able to shadow the normalizer). Backward compatible: third-party and
 * premium blocks that still declare the legacy CSS `class` string keep rendering identically, and the
 * cmplz_blocks() signature + the `cmplz_blocks` filter name are unchanged.
 *
 * For each block it maps the legacy `class` tokens to width/variant per DB-17
 * (`cmplz-column-2` -> width 2; `border-to-border` -> variant edge-to-edge;
 * `no-border`/`no-background` -> variant borderless), lets an explicit `width`/`variant` key WIN over
 * `class`, resolves multiple variant tokens to borderless (precedence borderless > edge-to-edge >
 * default), DROPS unknown tokens, tolerates surrounding whitespace, is idempotent, and emits NO raw
 * `class` string (GridBlock.js reads width/variant). It calls _doing_it_wrong() — which only surfaces
 * under WP_DEBUG — when a block carries a legacy `class` and no explicit width/variant key, nudging
 * extenders off the deprecated string. Blocks are config (not user input); width is cast to an integer
 * and variant to a string.
 *
 * @param array $blocks Blocks as returned by cmplz_blocks().
 * @return array The normalized blocks.
 */
function cmplz_normalize_blocks( $blocks ) {
	if ( ! is_array( $blocks ) ) {
		return array();
	}

	// Legacy CSS class token -> forward key. Unknown tokens are dropped (ADR-015).
	$variant_precedence = array(
		'default'      => 0,
		'edge-to-edge' => 1,
		'borderless'   => 2,
	);

	$normalized = array();
	foreach ( $blocks as $block ) {
		if ( ! is_array( $block ) ) {
			$normalized[] = $block;
			continue;
		}

		$has_explicit_width   = array_key_exists( 'width', $block );
		$has_explicit_variant = array_key_exists( 'variant', $block );
		$class                = isset( $block['class'] ) ? trim( (string) $block['class'] ) : '';

		// Deprecation nudge (WP_DEBUG only): a legacy `class` with no explicit forward key.
		if ( '' !== $class && ! $has_explicit_width && ! $has_explicit_variant ) {
			_doing_it_wrong(
				'cmplz_normalize_blocks',
				esc_html(
					sprintf(
						/* translators: 1: block id, 2: the legacy CSS class string */
						__( 'Dashboard block "%1$s" uses the deprecated "class" key ("%2$s"). Use the "width" and "variant" keys instead (see ADR-015).', 'complianz-gdpr' ),
						isset( $block['id'] ) ? $block['id'] : '',
						$class
					)
				),
				'7.6.0'
			);
		}

		// Derive width/variant from the legacy class tokens (explicit keys win per axis).
		$class_width   = null;
		$class_variant = null;
		if ( '' !== $class ) {
			$tokens = preg_split( '/\s+/', $class, -1, PREG_SPLIT_NO_EMPTY );
			foreach ( (array) $tokens as $token ) {
				switch ( $token ) {
					case 'cmplz-column-2':
						$class_width = 2;
						break;
					case 'border-to-border':
						$candidate = 'edge-to-edge';
						if ( null === $class_variant || $variant_precedence[ $candidate ] > $variant_precedence[ $class_variant ] ) {
							$class_variant = $candidate;
						}
						break;
					case 'no-border':
					case 'no-background':
						$class_variant = 'borderless'; // Highest precedence; always wins.
						break;
					default:
						// Unknown token: dropped (ADR-015).
						break;
				}
			}
		}

		if ( $has_explicit_width ) {
			$width = (int) $block['width'];
		} elseif ( null !== $class_width ) {
			$width = $class_width;
		} else {
			$width = 1;
		}

		if ( $has_explicit_variant ) {
			$variant = (string) $block['variant'];
		} elseif ( null !== $class_variant ) {
			$variant = $class_variant;
		} else {
			$variant = 'default';
		}

		// Emit NO raw `class` string; keep every other key (id, header, content, footer, title, help...).
		unset( $block['class'] );
		$block['width']   = $width;
		$block['variant'] = $variant;
		$normalized[]     = $block;
	}

	return $normalized;
}
