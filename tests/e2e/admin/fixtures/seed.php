<?php
/**
 * Deterministic fixture seed for the Complianz e2e suite (T-008, ADR-011 / §8.1.2).
 *
 * Run through each instance's wp-cli with `wp eval-file` (see tests/e2e/admin/helpers/seed.js),
 * invoked from the setup projects. It writes a stable settings/wizard/cookies/services/banner
 * state using the plugin's own helpers so the stored shape matches what the app writes.
 *
 * Idempotent: every write either overwrites fixed values or upserts a record found by name,
 * and all dates are fixed — so re-running restores the same state. TEST-ONLY; never shipped.
 *
 * @package Complianz\Tests\E2E
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed the whole fixture.
 *
 * @return void
 */
function cmplz_e2e_seed() {
	// Fixed clock for every seeded date so screenshots and "days since" values never drift.
	$seed_time = 1704067200; // 2024-01-01 00:00:00 UTC.

	// eval-file has no current user; the cookie/service/banner classes require the
	// manage_privacy capability, so adopt the wp-env administrator.
	$admin = get_user_by( 'login', 'admin' );
	if ( ! $admin ) {
		$admins = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		$admin  = ! empty( $admins ) ? $admins[0] : null;
	}
	if ( $admin ) {
		wp_set_current_user( $admin->ID );
	}

	// Settings (cmplz_options): a small, fixed, representative set written through the
	// plugin's own writer (no hooks, so nothing tries to sync over the network under CLI).
	$options = array(
		'regions'           => 'eu',
		'organisation_name' => 'Complianz E2E Fixture',
		'email_company'     => 'fixture@cmplz.test',
		'use_cdb_api'       => 'yes',
		'use_cdb_links'     => 'yes',
	);
	foreach ( $options as $option_id => $option_value ) {
		cmplz_update_option_no_hooks( $option_id, $option_value );
	}

	// Wizard progress: mark the one-time wizard complete and pin the activation date.
	update_option( 'cmplz_wizard_completed_once', true );
	update_option( 'cmplz_activation_time', $seed_time );

	cmplz_e2e_seed_cookies_services( $seed_time );
	cmplz_e2e_seed_banner();

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		WP_CLI::log( 'cmplz-e2e: fixture seeded.' );
	}
}

/**
 * Upsert one service and one cookie linked to it, with fixed dates.
 *
 * @param int $seed_time Fixed Unix timestamp used for every stored date.
 *
 * @return void
 */
function cmplz_e2e_seed_cookies_services( $seed_time ) {
	// The plugin's data objects use legacy camelCase property names; they are assigned through
	// a loop (dynamic property names) rather than literal `$obj->camelCase =` accesses, which
	// would otherwise trip the snake_case property-name sniff on every line.

	// Service: loaded by name, so a re-run updates the same row instead of duplicating it.
	$service      = new CMPLZ_SERVICE( 'Google Maps', 'en' );
	$service_data = array(
		'name'                => 'Google Maps',
		'serviceType'         => 'Maps',
		'category'            => 'marketing',
		'sharesData'          => true,
		'secondParty'         => false,
		'sync'                => false,
		'privacyStatementURL' => 'https://policies.google.com/privacy',
		'lastUpdatedDate'     => $seed_time,
	);
	foreach ( $service_data as $property => $value ) {
		$service->{$property} = $value;
	}
	$service->save( false, false );

	// Cookie: linked to the service, with every date fixed so firstAddDate is never stamped.
	$cookie      = new CMPLZ_COOKIE( '_ga', 'en' );
	$cookie_data = array(
		'name'                  => '_ga',
		'retention'             => '2 years',
		'type'                  => 'cookie',
		'serviceID'             => (int) $service->ID,
		'service'               => 'Google Maps',
		'isOwnDomainCookie'     => false,
		'purpose'               => 'Statistics',
		'cookieFunction'        => 'Used to distinguish users.',
		'collectedPersonalData' => 'IP address',
		'sync'                  => false,
		'showOnPolicy'          => true,
		'firstAddDate'          => $seed_time,
		'lastAddDate'           => $seed_time,
		'lastUpdatedDate'       => $seed_time,
	);
	foreach ( $cookie_data as $property => $value ) {
		$cookie->{$property} = $value;
	}
	$cookie->save( false );
}

/**
 * Seed the default cookie banner with fixed values.
 *
 * Updates the default banner in place (created on activation) so its ID stays stable, and
 * resets the internal cache-busting version so re-running the seed is byte-identical.
 *
 * @return void
 */
function cmplz_e2e_seed_banner() {
	// Reuse the default banner when present; otherwise reuse any existing banner (promoting it
	// to default below) and only create one as a last resort. Activation does not always
	// pre-create the default banner on the WordPress 5.9 floor, so this must not assume one.
	$banner_id = 0;
	$default   = cmplz_get_cookiebanners( array( 'default' => true ) );
	if ( ! empty( $default ) ) {
		$banner_id = (int) $default[0]->ID;
	} else {
		$all = cmplz_get_cookiebanners( array( 'status' => 'all' ) );
		if ( ! empty( $all ) ) {
			$banner_id = (int) $all[0]->ID;
		}
	}

	$banner = $banner_id > 0 ? new CMPLZ_COOKIEBANNER( $banner_id ) : new CMPLZ_COOKIEBANNER( false );

	// Mark it the default explicitly: save() promotes it when the stored row is not yet the
	// default, which keeps exactly one default banner and makes re-running the seed idempotent.
	$banner->default        = true;
	$banner->title          = 'Complianz E2E Fixture Banner';
	$banner->position       = 'bottom-right';
	$banner->banner_width   = 526;
	$banner->banner_version = 0;
	$banner->save();
}

cmplz_e2e_seed();
