<?php
/**
 * Tests for cmplz_share class.
 *
 * @package Complianz_Gdpr
 */

class CmplzTestShare extends WP_UnitTestCase {

	/**
	 * Instance of the share class.
	 *
	 * @var cmplz_share
	 */
	private $share;

	public function set_up() {
		parent::set_up();
		// Ensure admin permissions for test user.
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$user = wp_get_current_user();
		$user->add_cap( 'manage_privacy' );

		// Load the share class if not already loaded (may not be auto-loaded in test context).
		if ( ! class_exists( 'cmplz_share' ) ) {
			require_once dirname( __DIR__ ) . '/class-share.php';
		}

		// Use the singleton instance if available, otherwise create one.
		$instance = cmplz_share::this();
		if ( $instance ) {
			$this->share = $instance;
		} else {
			$this->share = new cmplz_share();
		}
	}

	public function tear_down() {
		// Clean up transients and temp files.
		cmplz_delete_transient( cmplz_share::TRANSIENT_KEY );
		if ( $this->share ) {
			$this->share->cleanup();
		}
		parent::tear_down();
	}

	/**
	 * Test that generate_share_key returns a valid key.
	 */
	public function test_generate_key_returns_valid_response() {
		$result = $this->share->generate_share_key();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['success'] );
		$this->assertArrayHasKey( 'key', $result );
		$this->assertArrayHasKey( 'expires', $result );
	}

	/**
	 * Test that the generated key is 64 hex characters.
	 */
	public function test_generated_key_is_64_hex_chars() {
		$result = $this->share->generate_share_key();

		$this->assertEquals( 64, strlen( $result['key'] ) );
		$this->assertTrue( ctype_xdigit( $result['key'] ) );
	}

	/**
	 * Test that the key is stored in transient.
	 */
	public function test_key_stored_in_transient() {
		$result = $this->share->generate_share_key();

		$transient = cmplz_get_transient( cmplz_share::TRANSIENT_KEY );
		$this->assertIsArray( $transient );
		$this->assertEquals( $result['key'], $transient['key'] );
		$this->assertArrayHasKey( 'file_path', $transient );
		$this->assertArrayHasKey( 'expires', $transient );
	}

	/**
	 * Test that temp file is created on key generation.
	 */
	public function test_temp_file_created() {
		$result    = $this->share->generate_share_key();
		$transient = cmplz_get_transient( cmplz_share::TRANSIENT_KEY );

		$this->assertFileExists( $transient['file_path'] );
	}

	/**
	 * Test that temp file contains valid JSON.
	 */
	public function test_temp_file_contains_valid_json() {
		$this->share->generate_share_key();
		$transient = cmplz_get_transient( cmplz_share::TRANSIENT_KEY );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$contents = file_get_contents( $transient['file_path'] );
		$json     = str_replace( '#--COMPLIANZ--#', '', $contents );
		$data     = json_decode( $json, true );

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertArrayHasKey( 'banners', $data );
	}

	/**
	 * Test cleanup removes temp files.
	 */
	public function test_cleanup_removes_temp_files() {
		$this->share->generate_share_key();
		$transient = cmplz_get_transient( cmplz_share::TRANSIENT_KEY );
		$file_path = $transient['file_path'];

		$this->assertFileExists( $file_path );

		$this->share->cleanup();

		$this->assertFileDoesNotExist( $file_path );
	}

	/**
	 * Test that generating a new key removes previous temp files.
	 */
	public function test_new_key_cleans_previous_files() {
		$this->share->generate_share_key();
		$first_transient = cmplz_get_transient( cmplz_share::TRANSIENT_KEY );
		$first_file      = $first_transient['file_path'];

		$this->share->generate_share_key();

		$this->assertFileDoesNotExist( $first_file );
	}

	/**
	 * Test import_settings with valid data updates options.
	 */
	public function test_import_settings_updates_options() {
		$import_data = array(
			'settings' => array(
				'use_country' => true,
				'test_field'  => 'test_value',
			),
		);

		$result = $this->share->import_settings( $import_data );

		$this->assertTrue( $result['success'] );
		$this->assertContains( 'settings', $result['imported'] );

		$options = get_option( 'cmplz_options' );
		$this->assertEquals( 'test_value', $options['test_field'] );
	}

	/**
	 * Test import_settings strips A/B testing flags.
	 */
	public function test_import_strips_ab_testing() {
		$import_data = array(
			'settings' => array(
				'a_b_testing'         => true,
				'a_b_testing_buttons' => true,
				'other_setting'       => 'value',
			),
		);

		$this->share->import_settings( $import_data );

		$options = get_option( 'cmplz_options' );
		$this->assertArrayNotHasKey( 'a_b_testing', $options );
		$this->assertArrayNotHasKey( 'a_b_testing_buttons', $options );
		$this->assertEquals( 'value', $options['other_setting'] );
	}

	/**
	 * Test import with empty data returns error.
	 */
	public function test_import_empty_data_returns_error() {
		$result = $this->share->import_settings( array() );

		$this->assertFalse( $result['success'] );
	}

	/**
	 * Test import_from_remote with empty params returns error.
	 */
	public function test_import_remote_empty_params_returns_error() {
		$result = $this->share->import_from_remote( '', '' );

		$this->assertFalse( $result['success'] );
	}

	/**
	 * Test import_from_remote with invalid key format returns error.
	 */
	public function test_import_remote_invalid_key_format_returns_error() {
		$result = $this->share->import_from_remote( 'https://example.com', 'not-a-hex-key' );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Invalid key format', $result['message'] );
	}
}
