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
	 * Uses 'use_country' which is a known Complianz field ID.
	 */
	public function test_import_settings_updates_options() {
		$import_data = array(
			'settings' => array(
				'use_country' => 'yes',
			),
		);

		$result = $this->share->import_settings( $import_data );

		$this->assertTrue( $result['success'] );
		$this->assertContains( 'settings', $result['imported'] );

		$options = get_option( 'cmplz_options' );
		$this->assertEquals( 'yes', $options['use_country'] );
	}

	/**
	 * Test import_settings strips A/B testing flags.
	 */
	public function test_import_strips_ab_testing() {
		$import_data = array(
			'settings' => array(
				'a_b_testing'         => true,
				'a_b_testing_buttons' => true,
				'use_country'         => 'yes',
			),
		);

		$this->share->import_settings( $import_data );

		$options = get_option( 'cmplz_options' );
		$this->assertArrayNotHasKey( 'a_b_testing', $options );
		$this->assertArrayNotHasKey( 'a_b_testing_buttons', $options );
		$this->assertEquals( 'yes', $options['use_country'] );
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

	/**
	 * Test that unknown settings keys are filtered out during import.
	 */
	public function test_import_rejects_unknown_settings_keys() {
		$import_data = array(
			'settings' => array(
				'use_country'           => 'yes',
				'injected_malicious_key' => 'evil_value',
			),
		);

		$this->share->import_settings( $import_data );

		$options = get_option( 'cmplz_options' );
		$this->assertEquals( 'yes', $options['use_country'] );
		$this->assertArrayNotHasKey( 'injected_malicious_key', $options );
	}

	/**
	 * Test that import sanitizes string values.
	 */
	public function test_import_sanitizes_string_values() {
		$import_data = array(
			'settings' => array(
				'organisation_name' => '<script>alert("xss")</script>Acme Corp',
			),
		);

		$this->share->import_settings( $import_data );

		$options = get_option( 'cmplz_options' );
		$this->assertStringNotContainsString( '<script>', $options['organisation_name'] );
		$this->assertStringContainsString( 'Acme Corp', $options['organisation_name'] );
	}

	/**
	 * Test that REST download endpoint rejects invalid key format.
	 */
	public function test_rest_download_rejects_invalid_key() {
		$request = new WP_REST_Request( 'POST', '/complianz/v1/share/download' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'key' => 'short' ) ) );

		$response = $this->share->rest_api_share_download( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'cmplz_invalid_key', $response->get_error_code() );
	}

	/**
	 * Test that REST download endpoint rejects wrong key.
	 */
	public function test_rest_download_rejects_wrong_key() {
		// Generate a real key first.
		$this->share->generate_share_key();

		// Try downloading with a different valid-format key.
		$wrong_key = str_repeat( 'ab', 32 );
		$request   = new WP_REST_Request( 'POST', '/complianz/v1/share/download' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'key' => $wrong_key ) ) );

		$response = $this->share->rest_api_share_download( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'cmplz_invalid_key', $response->get_error_code() );
	}

	/**
	 * Test that REST download endpoint returns data with valid key.
	 */
	public function test_rest_download_returns_data_with_valid_key() {
		$result = $this->share->generate_share_key();

		$request = new WP_REST_Request( 'POST', '/complianz/v1/share/download' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'key' => $result['key'] ) ) );

		$response = $this->share->rest_api_share_download( $request );

		$this->assertInstanceOf( 'WP_REST_Response', $response );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertArrayHasKey( 'banners', $data );
	}

	/**
	 * Test that a non-admin user cannot generate a key.
	 */
	public function test_non_admin_cannot_generate_key() {
		// Switch to a subscriber user.
		$subscriber_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		$result = $this->share->generate_share_key();

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Unauthorized', $result['message'] );
	}

	/**
	 * Test that a non-admin user cannot import settings.
	 */
	public function test_non_admin_cannot_import_settings() {
		$subscriber_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		$result = $this->share->import_settings( array( 'settings' => array( 'use_country' => 'yes' ) ) );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Unauthorized', $result['message'] );
	}
}
