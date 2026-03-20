<?php
/**
 * Tests for the dark mode theme preference feature.
 */

// Load settings.php for the cmplz_save_theme_preference function.
if ( ! function_exists( 'cmplz_save_theme_preference' ) ) {
	require_once dirname( __DIR__ ) . '/settings/settings.php';
}

class DarkModeTest extends WP_UnitTestCase {

	/**
	 * Test default preference is "system" when no usermeta exists.
	 */
	public function test_default_preference_is_system() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$pref    = get_user_meta( $user_id, 'cmplz_theme_preference', true );
		$this->assertEmpty( $pref, 'Default should be empty (treated as system by PHP)' );
	}

	/**
	 * Test saving "dark" preference stores correctly.
	 */
	public function test_save_dark_preference() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		update_user_meta( $user_id, 'cmplz_theme_preference', 'dark' );
		$pref = get_user_meta( $user_id, 'cmplz_theme_preference', true );
		$this->assertEquals( 'dark', $pref );
	}

	/**
	 * Test saving "light" preference stores correctly.
	 */
	public function test_save_light_preference() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		update_user_meta( $user_id, 'cmplz_theme_preference', 'light' );
		$pref = get_user_meta( $user_id, 'cmplz_theme_preference', true );
		$this->assertEquals( 'light', $pref );
	}

	/**
	 * Test saving "system" preference stores correctly.
	 */
	public function test_save_system_preference() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		update_user_meta( $user_id, 'cmplz_theme_preference', 'system' );
		$pref = get_user_meta( $user_id, 'cmplz_theme_preference', true );
		$this->assertEquals( 'system', $pref );
	}

	/**
	 * Test that the save_theme_preference filter validates input.
	 */
	public function test_save_theme_preference_filter_validates() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'theme_preference', 'dark' );
		$request->set_param( 'action', 'save_theme_preference' );

		$data = cmplz_save_theme_preference( array(), 'save_theme_preference', $request );
		$this->assertEquals( 'dark', $data['theme_preference'] );
		$this->assertEquals( 'dark', get_user_meta( $user_id, 'cmplz_theme_preference', true ) );
	}

	/**
	 * Test that invalid preference values default to "system".
	 */
	public function test_invalid_preference_defaults_to_system() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'theme_preference', '<script>alert(1)</script>' );
		$request->set_param( 'action', 'save_theme_preference' );

		$data = cmplz_save_theme_preference( array(), 'save_theme_preference', $request );
		$this->assertEquals( 'system', $data['theme_preference'] );
	}

	/**
	 * Test that non-admin users can save their own theme preference.
	 */
	public function test_subscriber_can_save_own_preference() {
		$user_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'theme_preference', 'dark' );
		$request->set_param( 'action', 'save_theme_preference' );

		$data = cmplz_save_theme_preference( array(), 'save_theme_preference', $request );
		$this->assertEquals( 'dark', $data['theme_preference'] );
		$this->assertEquals( 'dark', get_user_meta( $user_id, 'cmplz_theme_preference', true ) );
	}

	/**
	 * Test that the filter ignores non-matching actions.
	 */
	public function test_filter_ignores_other_actions() {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'action', 'something_else' );

		$data = cmplz_save_theme_preference( array( 'existing' => true ), 'something_else', $request );
		$this->assertTrue( $data['existing'] );
		$this->assertArrayNotHasKey( 'theme_preference', $data );
	}
}
