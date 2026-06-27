<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
defined( 'ABSPATH' ) || die( 'you do not have access to this page!' );

/**
 * Headless / cross-domain delivery.
 *
 * Lets this install (e.g. a Complianz appliance on a subdomain) serve the cookie
 * banner, consent handling and consent records to a *different* root domain via a
 * single <script> embed — reusing Complianz's own banner JS/CSS.
 *
 * The customer drops one line on their site:
 *     <script src="https://consent.example.com/cmplz-embed.js" async></script>
 *
 * Flow:
 *   1. /cmplz-embed.js          → tiny loader served by this class.
 *   2. The loader fetch()es     → complianz/v1/embed/  (config + banner markup + asset URLs).
 *      WordPress core already sends CORS headers for the REST API, so the cross-origin
 *      fetch works without extra config.
 *   3. The loader sets window.complianz, injects the banner markup + CSS, and loads
 *      complianz(.min).js — Complianz's own banner then runs on the root domain,
 *      sets a first-party cookie there, and POSTs consent back to complianz/v1/track/.
 *
 * NOTE: this is additive and upstream-mergeable — it does not modify core files.
 */
class CMPLZ_HEADLESS {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'init', array( $this, 'maybe_serve_embed_js' ), 1 );
		add_action( 'cmplz_store_consent', array( $this, 'record_consent_origin' ), 10, 3 );
		add_action( 'admin_menu', array( $this, 'register_admin_page' ), 60 );
	}

	/**
	 * Public endpoint with everything a foreign domain needs to render the banner.
	 */
	public function register_routes() {
		register_rest_route(
			'complianz/v1',
			'embed/',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_embed_payload' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * @return array{config:array,banner_html:string,css:string[],js:string,origin:string}
	 */
	public function rest_embed_payload( $request ) {
		$banner_id    = cmplz_get_default_banner_id();
		$banner       = cmplz_get_cookiebanner( $banner_id );
		$consent_type = COMPLIANZ::$company->get_default_consenttype();
		$minified     = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		$config = $banner->get_front_end_settings();
		// On the embedding (root) domain the cookie should be first-party there, so let
		// the front-end default to the current host rather than this appliance's domain.
		if ( isset( $config['cookie_domain'] ) ) {
			$config['cookie_domain'] = '';
		}

		$payload = array(
			'config'      => $config,
			'banner_html' => $this->get_banner_html( $banner, $consent_type ),
			'css'         => array( cmplz_upload_url( 'css' ) . "banner-{$banner_id}-{$consent_type}.css" ),
			'js'          => CMPLZ_URL . "cookiebanner/js/complianz{$minified}.js",
			'origin'      => get_rest_url( null, 'complianz/v1/' ),
		);

		if ( ob_get_length() ) {
			ob_clean();
		}
		return $payload;
	}

	/**
	 * Reproduce the on-site banner markup for the default banner + consent type.
	 * Mirrors COMPLIANZ::$banner_loader->cookiebanner_html().
	 */
	private function get_banner_html( $banner, $consent_type ) {
		$path        = trailingslashit( CMPLZ_PATH ) . 'cookiebanner/templates/';
		$banner_tpl  = cmplz_get_template( 'cookiebanner.php', array( 'consent_type' => $consent_type ), $path );
		$manage_tpl  = cmplz_get_template( 'manage-consent.php', false, $path );
		$settings    = $banner->get_html_settings();

		foreach ( $settings as $field => $value ) {
			if ( isset( $value['text'] ) ) {
				$value = $value['text'];
			}
			if ( is_array( $value ) ) {
				continue;
			}
			if ( 'logo' !== $field ) {
				$value = nl2br( $value );
			}
			$banner_tpl = str_replace( '{' . $field . '}', $value, $banner_tpl );
			$manage_tpl = str_replace( '{' . $field . '}', $value, $manage_tpl );
		}
		$manage_tpl = str_replace( '{consent_type}', $consent_type, $manage_tpl );

		return '<div id="cmplz-cookiebanner-container">' . apply_filters( 'cmplz_banner_html', $banner_tpl ) . '</div>'
			. '<div id="cmplz-manage-consent" data-nosnippet="true">' . apply_filters( 'cmplz_manage_consent_html', $manage_tpl ) . '</div>';
	}

	/**
	 * Serve the loader at /cmplz-embed.js (no rewrite rules / flush needed).
	 */
	public function maybe_serve_embed_js() {
		$uri = strtok( $_SERVER['REQUEST_URI'] ?? '', '?' );
		if ( '/cmplz-embed.js' !== substr( $uri, -15 ) ) {
			return;
		}
		nocache_headers();
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Access-Control-Allow-Origin: *' );
		header( 'Cache-Control: public, max-age=3600' );
		echo $this->get_loader_js( get_rest_url( null, 'complianz/v1/embed/' ) ); // phpcs:ignore
		exit;
	}

	/**
	 * The loader script. Kept dependency-free and tiny.
	 */
	private function get_loader_js( $endpoint ) {
		$endpoint = esc_url_raw( $endpoint );
		return <<<JS
/* Complianz embed loader */
(function () {
	if (window.__cmplzEmbedLoaded) { return; }
	window.__cmplzEmbedLoaded = true;
	function start() {
		fetch("$endpoint").then(function (r) { return r.json(); }).then(function (d) {
			window.complianz = d.config;
			(d.css || []).forEach(function (href) {
				var l = document.createElement("link");
				l.rel = "stylesheet"; l.href = href;
				document.head.appendChild(l);
			});
			var wrap = document.createElement("div");
			wrap.innerHTML = d.banner_html;
			while (wrap.firstChild) { document.body.appendChild(wrap.firstChild); }
			var s = document.createElement("script");
			s.src = d.js; s.defer = true;
			document.body.appendChild(s);
		}).catch(function (e) {
			if (window.console) { console.error("Complianz embed failed:", e); }
		});
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}
})();
JS;
	}

	/**
	 * Record which domains are sending consent (lightweight, domain-aware records).
	 * A full per-domain consent ledger can extend proof-of-consent next.
	 */
	public function record_consent_origin( $categories, $services, $consenttype ) {
		$origin = get_http_origin();
		if ( ! $origin ) {
			return;
		}
		$host = wp_parse_url( $origin, PHP_URL_HOST );
		if ( ! $host ) {
			return;
		}
		$origins = get_option( 'cmplz_consent_origins', array() );
		if ( ! is_array( $origins ) ) {
			$origins = array();
		}
		$origins[ $host ] = time();
		update_option( 'cmplz_consent_origins', $origins, false );
	}

	/**
	 * Admin page with the copy-paste embed snippet.
	 */
	public function register_admin_page() {
		if ( ! function_exists( 'cmplz_user_can_manage' ) || ! cmplz_user_can_manage() ) {
			return;
		}
		add_submenu_page(
			'complianz',
			__( 'Embed', 'complianz-gdpr' ),
			__( 'Embed', 'complianz-gdpr' ),
			'manage_privacy',
			'complianz-embed',
			array( $this, 'render_admin_page' )
		);
	}

	public function render_admin_page() {
		$src     = home_url( '/cmplz-embed.js' );
		$snippet = '<script src="' . esc_url( $src ) . '" async></script>';
		$origins = get_option( 'cmplz_consent_origins', array() );
		echo '<div class="wrap">';
		echo '<h1>' . esc_html__( 'Embed Complianz on another site', 'complianz-gdpr' ) . '</h1>';
		echo '<p>' . esc_html__( 'Add this one line to any website, just before the closing </body> tag. The cookie banner, consent and records all run from here.', 'complianz-gdpr' ) . '</p>';
		echo '<textarea readonly rows="2" style="width:100%;max-width:680px;font-family:monospace;padding:12px;border-radius:8px" onclick="this.select()">' . esc_textarea( $snippet ) . '</textarea>';
		if ( is_array( $origins ) && $origins ) {
			echo '<h2>' . esc_html__( 'Sites sending consent', 'complianz-gdpr' ) . '</h2><ul>';
			foreach ( $origins as $host => $time ) {
				echo '<li><code>' . esc_html( $host ) . '</code> — ' . esc_html( human_time_diff( (int) $time ) ) . ' ago</li>';
			}
			echo '</ul>';
		}
		echo '</div>';
	}
}

new CMPLZ_HEADLESS();
