<?php
/**
 * Complianz e2e external-service stub mu-plugin (T-008, ADR-011).
 *
 * Makes the Playwright characterization suite deterministic by short-circuiting every
 * server-side outbound HTTP request the plugin (or WordPress core) would make, returning
 * fixed fixture responses shaped like what each caller parses. Any outbound request it does
 * not recognise is blocked and recorded in the `cmplz_e2e_unstubbed_requests` option, which
 * the suite asserts is empty — the "no real network" guarantee.
 *
 * It also injects two `admin_notices` callbacks used by the DB-04 page-rules spec: a plain
 * third-party notice (which Complianz screens must hide) and a Complianz-style notice carrying
 * the `really-simple-plugins` class, scoped to Complianz screens, which the page rule keeps
 * visible. The second notice stands in for Complianz's own live notices deterministically, so
 * the spec no longer depends on an incidental review notice that is absent on a fresh database.
 *
 * TEST-ONLY. This file is never shipped: it lives under tests/ and is loaded solely through
 * the `.wp-env.json` `wp-content/mu-plugins` mapping. WP-CLI requests are deliberately left
 * unstubbed (see cmplz_e2e_pre_http_request) so that the setup project's network
 * provisioning — installing the he_IL/de_DE language packs — keeps working.
 *
 * @package Complianz\Tests\E2E
 */

defined( 'ABSPATH' ) || exit;

/**
 * Option name the mu-plugin appends every non-stubbed outbound URL to.
 *
 * Prefixed `cmplz` per the constitution's global-prefix rule; the fixture spec reads it.
 */
const CMPLZ_E2E_UNSTUBBED_OPTION = 'cmplz_e2e_unstubbed_requests';

add_filter( 'pre_http_request', 'cmplz_e2e_pre_http_request', 1, 3 );
add_action( 'init', 'cmplz_e2e_ensure_log_option', 0 );
add_action( 'admin_notices', 'cmplz_e2e_third_party_notice' );
add_action( 'admin_notices', 'cmplz_e2e_complianz_style_notice' );
add_filter( 'pre_transient_cmplz_wizard_locked_by_user', 'cmplz_e2e_wizard_lock_owner' );

/**
 * Ensure the outbound-request log option always exists (as an empty array).
 *
 * Runs on every request so that, after any admin page view, the fixture spec can read the
 * option even when no outbound request was attempted.
 *
 * @return void
 */
function cmplz_e2e_ensure_log_option() {
	if ( false === get_option( CMPLZ_E2E_UNSTUBBED_OPTION, false ) ) {
		add_option( CMPLZ_E2E_UNSTUBBED_OPTION, array(), '', false );
	}
}

/**
 * PHP 7.4-compatible replacement for str_ends_with() (added in PHP 8.0).
 *
 * @param string $haystack The string to search in.
 * @param string $needle   The suffix to look for.
 *
 * @return bool True when $haystack ends with $needle.
 */
function cmplz_e2e_str_ends_with( $haystack, $needle ) {
	$length = strlen( $needle );
	if ( 0 === $length ) {
		return true;
	}
	return substr( $haystack, -$length ) === $needle;
}

/**
 * Whether a host equals a domain or is a subdomain of it.
 *
 * @param string $host   The request host, lower-cased.
 * @param string $domain The registrable domain to match, e.g. 'complianz.io'.
 *
 * @return bool True when $host is $domain or a subdomain of it.
 */
function cmplz_e2e_host_matches( $host, $domain ) {
	return $host === $domain || cmplz_e2e_str_ends_with( $host, '.' . $domain );
}

/**
 * Whether a host is the local site or a loopback address.
 *
 * Loopback and same-site requests are not outbound, so they pass through untouched rather
 * than being stubbed or logged.
 *
 * @param string $host The request host, lower-cased.
 *
 * @return bool True when the host is local to this WordPress install.
 */
function cmplz_e2e_is_local_host( $host ) {
	if ( in_array( $host, array( 'localhost', '127.0.0.1', '::1' ), true ) ) {
		return true;
	}

	$local     = array();
	$home_host = wp_parse_url( home_url(), PHP_URL_HOST );
	$site_host = wp_parse_url( site_url(), PHP_URL_HOST );
	if ( ! empty( $home_host ) ) {
		$local[] = strtolower( $home_host );
	}
	if ( ! empty( $site_host ) ) {
		$local[] = strtolower( $site_host );
	}

	return in_array( $host, $local, true );
}

/**
 * Build a WordPress HTTP API response array carrying a JSON body.
 *
 * Shaped so the standard wp_remote_retrieve_* helpers read it exactly as they would a real
 * response (status code, body, content type).
 *
 * @param array $data   The payload to encode as the response body.
 * @param int   $status The HTTP status code to report. Default 200.
 *
 * @return array A WordPress HTTP API response array.
 */
function cmplz_e2e_json_response( $data, $status = 200 ) {
	return array(
		'headers'  => array( 'content-type' => 'application/json' ),
		'body'     => (string) wp_json_encode( $data ),
		'response' => array(
			'code'    => (int) $status,
			'message' => 'OK',
		),
		'cookies'  => array(),
		'filename' => null,
	);
}

/**
 * Return a deterministic fixture response for a known external host, or null if unknown.
 *
 * Each branch mirrors the shape its caller parses, so the admin UI renders identically on
 * every run:
 * - cookiedatabase.org: service types, cookie purposes and sync feeds read `body.data`.
 * - notifications.complianz.io: dynamic notices read `body.notifications` (admin_init).
 * - *.complianz.io: website-scan, auth, consent and newsletter endpoints — empty object
 *   leaves the scan disabled and no token present, which is the free-edition resting state.
 * - *.wordpress.org: core version/update checks read empty collections (no updates).
 * - the WSC circuit-breaker status object on S3.
 *
 * @param string $host The request host, lower-cased.
 * @param string $url  The full request URL.
 *
 * @return array|null A response array, or null when the host is not recognised.
 */
function cmplz_e2e_stub_for( $host, $url ) {
	if ( cmplz_e2e_host_matches( $host, 'cookiedatabase.org' ) ) {
		return cmplz_e2e_json_response( array( 'data' => array() ) );
	}

	if ( 'notifications.complianz.io' === $host ) {
		return cmplz_e2e_json_response( array( 'notifications' => array() ) );
	}

	if ( cmplz_e2e_host_matches( $host, 'complianz.io' ) ) {
		return cmplz_e2e_json_response( array() );
	}

	if ( cmplz_e2e_host_matches( $host, 'wordpress.org' ) ) {
		if ( false !== strpos( $url, 'version-check' ) ) {
			return cmplz_e2e_json_response(
				array(
					'offers'       => array(),
					'translations' => array(),
				)
			);
		}
		if ( false !== strpos( $url, 'update-check' ) ) {
			return cmplz_e2e_json_response(
				array(
					'plugins'      => array(),
					'themes'       => array(),
					'translations' => array(),
					'no_update'    => array(),
				)
			);
		}
		return cmplz_e2e_json_response( array() );
	}

	if ( 'external-public-general.s3.eu-west-1.amazonaws.com' === $host ) {
		return cmplz_e2e_json_response( array() );
	}

	return null;
}

/**
 * Record an outbound URL the mu-plugin could not stub.
 *
 * The fixture spec asserts this list is empty, so a non-empty list means a real external
 * call would have escaped the stub.
 *
 * @param string $url The outbound URL that was blocked.
 *
 * @return void
 */
function cmplz_e2e_log_unstubbed( $url ) {
	$log = get_option( CMPLZ_E2E_UNSTUBBED_OPTION, array() );
	if ( ! is_array( $log ) ) {
		$log = array();
	}

	$clean = esc_url_raw( $url );
	if ( ! in_array( $clean, $log, true ) ) {
		$log[] = $clean;
		update_option( CMPLZ_E2E_UNSTUBBED_OPTION, $log, false );
	}
}

/**
 * Short-circuit outbound HTTP requests with deterministic fixtures.
 *
 * Known external hosts get a fixture response; loopback/same-site requests pass through;
 * anything else is blocked and logged. WP-CLI is never intercepted so that the setup
 * project's language-pack installation over the network keeps working.
 *
 * @param false|array|WP_Error $preempt Short-circuit value passed down the filter chain.
 * @param array                $args    The request arguments (unused; part of the filter signature).
 * @param string               $url     The request URL.
 *
 * @return false|array|WP_Error The original value to allow the request, or a stub/WP_Error.
 */
function cmplz_e2e_pre_http_request( $preempt, $args, $url ) {
	unset( $args );

	// Leave WP-CLI provisioning (language packs, plugin installs) to reach the real network.
	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		return $preempt;
	}

	$host = wp_parse_url( $url, PHP_URL_HOST );
	if ( empty( $host ) ) {
		return $preempt;
	}
	$host = strtolower( $host );

	if ( cmplz_e2e_is_local_host( $host ) ) {
		return $preempt;
	}

	$stub = cmplz_e2e_stub_for( $host, $url );
	if ( null !== $stub ) {
		return $stub;
	}

	cmplz_e2e_log_unstubbed( $url );
	return new WP_Error( 'cmplz_e2e_unstubbed', 'Blocked unstubbed external request: ' . $url );
}

/**
 * Inject a plain third-party admin notice on every admin screen.
 *
 * Stands in for a notice another plugin would print. It is intentionally outside Complianz's
 * `really-simple-plugins` container so the DB-04 page-rules spec can assert Complianz's own
 * screens hide it while keeping their own notices.
 *
 * @return void
 */
function cmplz_e2e_third_party_notice() {
	printf(
		'<div class="notice notice-info" id="cmplz-e2e-thirdparty-notice"><p>%s</p></div>',
		esc_html( 'Example third-party plugin notice (Complianz e2e fixture).' )
	);
}

/**
 * Whether the current admin screen is a Complianz settings screen.
 *
 * The Complianz app is a single top-level admin page (settings/settings.php: add_menu_page with
 * the `complianz` slug, hash-routed client-side), so its screen id contains `complianz`. Core
 * screens such as the Dashboard (`dashboard`) and Settings > General (`options-general`) do not,
 * which is how the Complianz-style notice below is kept off the non-Complianz isolation baselines.
 *
 * @return bool True on a Complianz admin screen.
 */
function cmplz_e2e_is_complianz_admin_screen() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}
	$screen = get_current_screen();
	return $screen instanceof WP_Screen && false !== strpos( (string) $screen->id, 'complianz' );
}

/**
 * Inject a Complianz-style admin notice on Complianz screens only.
 *
 * Carries the `really-simple-plugins` class, so the legacy page rule
 * (`.notice:not(.really-simple-plugins){display:none}` in assets/css/admin/base.scss) keeps it
 * visible while hiding the plain third-party notice above. The DB-04 page-rules spec asserts on it
 * instead of Complianz's incidental live review notice, which is absent on a freshly reset database.
 * It is scoped to Complianz screens so it never renders on the non-Complianz isolation baselines.
 *
 * @return void
 */
function cmplz_e2e_complianz_style_notice() {
	if ( ! cmplz_e2e_is_complianz_admin_screen() ) {
		return;
	}
	printf(
		'<div class="notice notice-info really-simple-plugins" id="cmplz-e2e-rsp-notice"><p>%s</p></div>',
		esc_html( 'Example Complianz-style notice (Complianz e2e fixture).' )
	);
}

/**
 * Report the wizard lock as owned by the current user, so the wizard never shows the
 * "temporarily locked" placeholder in e2e.
 *
 * Fetching the wizard's data calls lock_wizard() (settings/wizard.php), which stores a 2-minute
 * `cmplz_wizard_locked_by_user` transient with the viewing user's id. The Playwright projects run
 * sequentially against one shared database, each as a different admin user, so the first project
 * (e.g. the en_US `admin`, user 1) leaves the lock set and the next project's user (he_IL
 * `admin-rtl`) then loads the wizard inside the 2-minute window and gets the lock placeholder
 * instead of the wizard — a cross-project test-isolation artifact, never a real product state.
 *
 * Short-circuiting the transient read with the *current* user's id makes wizard_is_locked() false
 * for everyone (`$lock_user_id !== $user_id` can never hold), so the wizard always renders. This is
 * a read-only override of the transient; lock_wizard() still writes the real transient, harmlessly.
 * app-states.spec.js still exercises the genuine lock placeholder by stubbing the
 * `/complianz/v1/fields/get` response in the browser, which this server-side filter does not touch.
 *
 * @return int The current user's id (short-circuits get_transient()).
 */
function cmplz_e2e_wizard_lock_owner() {
	return get_current_user_id();
}
